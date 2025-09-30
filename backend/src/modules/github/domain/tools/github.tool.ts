import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import {HttpService} from '@nestjs/axios'
import {firstValueFrom} from 'rxjs'
import {GithubAuthService} from '../services/github-auth.service'
import {GithubIssue} from '../interfaces/github-issue.interface'
import {AxiosResponse} from 'axios'
import {GithubIssueResponse} from '../interfaces/github-issue-response.interface'
import {GITHUB_API_URL} from '../constants/github.constants'
import {GithubPostCommentResponse} from '../interfaces/github-post-comment-response.interface'
import {GithubPostComment} from '../interfaces/github-post-comment.interface'

@Injectable()
export class GithubTool {
  private readonly logger = new Logger(GithubTool.name)

  constructor(
    private readonly httpService: HttpService,
    private readonly authService: GithubAuthService,
  ) {}

  async findIssueByNumber(
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

  async postComment(
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

  private async getGithubAuthToken(): Promise<string> {
    return await this.authService.getInstallationToken()
  }
}
