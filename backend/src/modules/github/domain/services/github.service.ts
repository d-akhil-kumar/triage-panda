import {Injectable} from '@nestjs/common'
import {GithubTool} from '../tools/github.tool'
import {GithubIssue} from '../interfaces/github-issue.interface'
import {GithubPostComment} from '../interfaces/github-post-comment.interface'
import {GithubAddLabels} from '../interfaces/github-add-labels.interface'

@Injectable()
export class GithubService {
  constructor(private readonly tool: GithubTool) {}

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
}
