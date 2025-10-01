import {BadRequestException, Injectable, Logger} from '@nestjs/common'
import {GithubTool} from '../tools/github.tool'
import {GithubIssue} from '../interfaces/github-issue.interface'
import {GithubPostComment} from '../interfaces/github-post-comment.interface'
import {GithubAddLabels} from '../interfaces/github-add-labels.interface'
import * as crypto from 'crypto'
import {ConfigService} from '@nestjs/config'
import {GithubWebhook} from '../interfaces/github-webhook.interface'
import {GithubWebhookPayload} from '../interfaces/github-webhook-payload.interface'

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name)

  constructor(
    private readonly tool: GithubTool,
    private readonly configService: ConfigService,
  ) {}

  handleWebhook(
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
    return {status: 'processing'}
  }

  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<GithubIssue> {
    return this.tool.findIssueByNumber(owner, repo, issueNumber)
  }

  async postComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<GithubPostComment> {
    return this.tool.postComment(owner, repo, issueNumber, body)
  }

  async addLabels(
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[],
  ): Promise<GithubAddLabels> {
    return this.tool.addLabels(owner, repo, issueNumber, labels)
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

    const secret =
      this.configService.get<string>('GITHUB_WEBHOOK_SECRET') ||
      '1234a55e-6bc7-123d-778d-4a8e66e4993e'

    const hmac = crypto.createHmac('sha256', secret)
    const digest = `sha256=${hmac.update(payload).digest('hex')}`

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      throw new BadRequestException('Invalid signature')
    }
  }
}
