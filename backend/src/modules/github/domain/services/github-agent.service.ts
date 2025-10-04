import {Injectable, Logger} from '@nestjs/common'
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import {AgentService} from 'src/modules/agent/domain/services/agent.service'
import {DynamicStructuredTool} from '@langchain/core/tools'

@Injectable()
export class GithubAgentService {
  private static logger = new Logger(GithubAgentService.name)

  constructor(private readonly agentService: AgentService) {}

  public async startTriage(
    owner: string,
    repo: string,
    issueNumber: number,
    tools: DynamicStructuredTool[],
  ): Promise<void> {
    GithubAgentService.logger.log(
      `Starting triage for ${owner}/${repo} #${issueNumber}`,
    )

    const systemPrompt = `
          You are an expert GitHub issue triaging agent. Your goal is to fully triage the issue provided.
            1. First, call the 'get_github_issue' tool to fetch the issue content.
            2. Analyze the issue's title and body to determine appropriate labels and a helpful summary comment.
            3. Call the 'add_github_labels' and 'post_github_comment' tools to apply your analysis.
            4. Once all tools have been successfully called, respond with a final confirmation message summarizing your actions.
          `

    const userPrompt = `Please triage issue #${issueNumber} in the repository ${owner}/${repo}.`

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]

    try {
      const result = await this.agentService.invoke(tools, messages)
      GithubAgentService.logger.log(
        `Triage complete for issue #${issueNumber}. Final response: "${result.response}"`,
      )
    } catch (error) {
      GithubAgentService.logger.error(
        `Triage failed for issue #${issueNumber}`,
        error,
      )
    }
  }
}
