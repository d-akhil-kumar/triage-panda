import {Injectable} from '@nestjs/common'
import {GithubService} from '../services/github.service'
import {tool, DynamicStructuredTool} from '@langchain/core/tools'
import {z} from 'zod'

@Injectable()
export class GithubTool {
  constructor(private readonly service: GithubService) {}

  public getTools(): DynamicStructuredTool[] {
    const getIssueByNumberTool = tool(
      async (input: {owner: string; repo: string; issueNumber: number}) => {
        try {
          const issue = await this.service.findIssueByNumber(
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
          const result = await this.service.postComment(
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
          await this.service.addLabels(
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
}
