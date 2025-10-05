import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {GithubIssue} from '../interfaces/github-issue.interface'
import {GithubPostComment} from '../interfaces/github-post-comment.interface'
import {GithubAddLabels} from '../interfaces/github-add-labels.interface'
import * as crypto from 'crypto'
import {ConfigService} from '@nestjs/config'
import {GithubWebhook} from '../interfaces/github-webhook.interface'
import {GithubWebhookPayload} from '../interfaces/github-webhook-payload.interface'
import {HttpService} from '@nestjs/axios'
import {firstValueFrom} from 'rxjs'
import {GithubAuthService} from '../services/github-auth.service'
import {AxiosResponse} from 'axios'
import {GithubIssueResponse} from '../interfaces/github-issue-response.interface'
import {GITHUB_API_URL} from '../constants/github.constants'
import {GithubPostCommentResponse} from '../interfaces/github-post-comment-response.interface'
import {GithubAddLabelsResponse} from '../interfaces/github-add-labels-response.interface'
import {GithubAgentService} from './github-agent.service'
import {DynamicStructuredTool, tool} from '@langchain/core/tools'
import {z} from 'zod'

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly authService: GithubAuthService,
    private readonly agentService: GithubAgentService,
  ) {}

  public handleWebhook(
    signature: string,
    rawBody: Buffer | undefined,
    payload: GithubWebhookPayload,
  ): GithubWebhook {
    this.verifySignature(signature, rawBody)

    const event = payload.action

    if (event !== 'opened') {
      this.logger.log(`Ignoring action: ${event}`)
      return {status: 'ignored', reason: `Action was ${event}, not 'opened'`}
    }

    const owner = payload.repository.owner.login
    const repo = payload.repository.name
    const issueNumber = payload.issue.number

    this.logger.log(
      `Webhook processed for issue #${issueNumber} in ${owner}/${repo}`,
    )

    void this.agentService.startTriage(
      owner,
      repo,
      issueNumber,
      this.getTools(),
    )
    return {status: 'processing'}
  }

  private getTools(): DynamicStructuredTool[] {
    const getIssueByNumberTool = tool(
      async (input: {owner: string; repo: string; issueNumber: number}) => {
        try {
          const issue = await this.findIssueByNumber(
            input.owner,
            input.repo,
            input.issueNumber,
          )
          return JSON.stringify(issue)
        } catch (error: unknown) {
          return `Error fetching issue: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        }
      },
      {
        name: 'get_github_issue_by_number',
        description:
          'Fetches details for a single GitHub issue, including its title and body. Use this as the first step to get the context of the issue.',
        schema: z.object({
          owner: z.string().describe('The owner username of the repository.'),
          repo: z.string().describe('The name of the repository.'),
          issueNumber: z.number().describe('The number of the issue to fetch.'),
        }),
      },
    )

    const postCommentTool = tool(
      async (input: {
        owner: string
        repo: string
        issueNumber: number
        body: string
      }) => {
        try {
          const result = await this.postComment(
            input.owner,
            input.repo,
            input.issueNumber,
            input.body,
          )
          return `Successfully posted comment. URL: ${result.commentUrl}`
        } catch (error: unknown) {
          return `Error posting comment: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        }
      },
      {
        name: 'post_github_comment',
        description:
          'Posts a comment on a GitHub issue. Use this to provide a summary of the triage analysis after understanding the issue.',
        schema: z.object({
          owner: z.string().describe('The owner username of the repository.'),
          repo: z.string().describe('The name of the repository.'),
          issueNumber: z
            .number()
            .describe('The number of the issue to comment on.'),
          body: z.string().describe('The content of the comment to post.'),
        }),
      },
    )

    const addLabelsTool = tool(
      async (input: {
        owner: string
        repo: string
        issueNumber: number
        labels: string[]
      }) => {
        try {
          await this.addLabels(
            input.owner,
            input.repo,
            input.issueNumber,
            input.labels,
          )
          return `Successfully applied labels: [${input.labels.join(', ')}]`
        } catch (error: unknown) {
          return `Error adding labels: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        }
      },
      {
        name: 'add_github_labels',
        description:
          'Adds one or more labels to a GitHub issue to categorize it. This should be one of the final steps.',
        schema: z.object({
          owner: z.string().describe('The owner of the repository.'),
          repo: z.string().describe('The name of the repository.'),
          issueNumber: z.number().describe('The number of the issue to label.'),
          labels: z
            .array(z.string())
            //TODO: provide the possible list of labels
            .describe('An array of label names to apply.'),
        }),
      },
    )

    return [getIssueByNumberTool, postCommentTool, addLabelsTool]
  }

  private async findIssueByNumber(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<GithubIssue> {
    const token = await this.getGithubAuthToken()
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/issues/${issueNumber}`

    try {
      const response = await firstValueFrom<AxiosResponse<GithubIssueResponse>>(
        this.httpService.get<GithubIssueResponse>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
      )

      const rawIssue = response.data
      return {
        id: rawIssue.id,
        number: rawIssue.number,
        title: rawIssue.title,
        body: rawIssue.body,
        author: rawIssue.user.login,
        state: rawIssue.state,
      }
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.error(`Issue #${issueNumber} not found in ${owner}/${repo}`)
        throw new NotFoundException(
          `Issue #${issueNumber} not found in ${owner}/${repo}`,
        )
      }
      this.logger.error(`Failed to fetch issue #${issueNumber}`, error.stack)
      throw new InternalServerErrorException(
        'Could not fetch issue from GitHub.',
      )
    }
  }

  private async postComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<GithubPostComment> {
    const token = await this.getGithubAuthToken()
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/issues/${issueNumber}/comments`

    try {
      const response = await firstValueFrom<
        AxiosResponse<GithubPostCommentResponse>
      >(
        this.httpService.post<GithubPostCommentResponse>(
          url,
          {body},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        ),
      )

      const commentUrl: string = response.data.html_url || ''

      this.logger.log(
        `Successfully posted comment to issue #${issueNumber} in ${owner}/${repo}`,
      )
      return {success: true, commentUrl}
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.error(`Issue #${issueNumber} not found in ${owner}/${repo}`)
        throw new NotFoundException(
          `Issue #${issueNumber} not found in ${owner}/${repo}`,
        )
      }

      this.logger.error(
        `Failed to post comment to issue #${issueNumber}`,
        error.stack,
      )
      throw new InternalServerErrorException(
        'Could not post comment to GitHub.',
      )
    }
  }

  private async addLabels(
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[],
  ): Promise<GithubAddLabels> {
    const token = await this.getGithubAuthToken()
    const url = `${GITHUB_API_URL}/repos/${owner}/${repo}/issues/${issueNumber}/labels`

    try {
      const response = await firstValueFrom<
        AxiosResponse<GithubAddLabelsResponse[]>
      >(
        this.httpService.post<GithubAddLabelsResponse[]>(
          url,
          {labels},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        ),
      )

      this.logger.log(
        `Successfully applied labels to issue #${issueNumber} in ${owner}/${repo}`,
      )
      return {success: true, appliedLabels: response.data}
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.error(`Issue #${issueNumber} not found in ${owner}/${repo}`)
        throw new NotFoundException(
          `Issue #${issueNumber} not found in ${owner}/${repo}`,
        )
      }
      this.logger.error(
        `Failed to apply labels to issue #${issueNumber}`,
        error.stack,
      )
      throw new InternalServerErrorException(
        'Could not apply labels to GitHub issue.',
      )
    }
  }

  private async getGithubAuthToken(): Promise<string> {
    return await this.authService.getInstallationToken()
  }

  private verifySignature(
    signature: string,
    payload: Buffer | undefined,
  ): void {
    if (!payload) {
      throw new BadRequestException('Missing payload')
    }

    if (!signature) {
      throw new BadRequestException('Missing signature')
    }

    const secret = this.configService.get<string>('github.webhookSecret')!

    const hmac = crypto.createHmac('sha256', secret)
    const digest = `sha256=${hmac.update(payload).digest('hex')}`

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      throw new BadRequestException('Invalid signature')
    }
  }
}
