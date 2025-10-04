import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common'
import {GithubTool} from '../tools/github.tool'
import {Runnable} from '@langchain/core/runnables'
import {BaseLanguageModelInput} from '@langchain/core/language_models/base'
import {AIMessage, BaseMessage, HumanMessage} from '@langchain/core/messages'
import {ChatGoogleGenerativeAI} from '@langchain/google-genai'
import {ConfigService} from '@nestjs/config'
import {AgentState, ToolNode} from '@langchain/langgraph/prebuilt'
import {MessagesAnnotation, StateGraph} from '@langchain/langgraph'

@Injectable()
export class GithubAgentService {
  private static logger = new Logger(GithubAgentService.name)
  private static readonly LLM_MODEL_NAME = 'gemini-2.5-flash'
  private static readonly DEFAULT_TEMPERATURE = 0.2
  private static readonly MAX_MESSAGE_COUNT = 10
  private static readonly MAX_RECURSION_LIMIT = 10

  private model: Runnable<BaseLanguageModelInput, AIMessage>
  private agent: typeof StateGraph.prototype.compile extends () => infer R
    ? R
    : never

  constructor(
    private readonly githubTool: GithubTool,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    try {
      GithubAgentService.logger.log('GithubAgentService initializing...')
      this.initializeAgent()
      GithubAgentService.logger.log(
        'GithubAgentService initialized successfully.',
      )
    } catch (error) {
      GithubAgentService.logger.error(
        'Error initializing GithubAgentService',
        error.stack,
      )
      process.exit(1)
    }
  }

  private initializeAgent(): void {
    const tools = this.githubTool.getTools()

    const LLM_API_KEY = this.configService.get<string>('llm.geminiApiKey')!

    this.model = new ChatGoogleGenerativeAI({
      model: GithubAgentService.LLM_MODEL_NAME,
      temperature: GithubAgentService.DEFAULT_TEMPERATURE,
      apiKey: LLM_API_KEY,
    }).bindTools(tools)

    const toolNode = new ToolNode(tools)

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode('agent', this.callModel)
      .addEdge('__start__', 'agent')
      .addNode('tools', toolNode)
      .addEdge('tools', 'agent')
      .addConditionalEdges('agent', this.shouldContinue)

    this.agent = workflow.compile()
  }

  private callModel = async (
    state: typeof MessagesAnnotation.State,
  ): Promise<Partial<AgentState>> => {
    const response = await this.model.invoke(state.messages)

    return {messages: [response]}
  }

  private shouldContinue = ({
    messages,
  }: typeof MessagesAnnotation.State): 'tools' | '__end__' => {
    {
      const lastMessage = messages[messages.length - 1] as AIMessage

      if (messages.length > GithubAgentService.MAX_MESSAGE_COUNT) {
        return '__end__'
      }

      if (lastMessage.tool_calls?.length) {
        return 'tools'
      }

      return '__end__'
    }
  }

  public async run(prompt: string, history: BaseMessage[] = []): Promise<void> {
    const messages: BaseMessage[] = [...history, new HumanMessage(prompt)]

    const finalState: typeof MessagesAnnotation.State = await this.agent.invoke(
      {messages},
      {recursionLimit: GithubAgentService.MAX_RECURSION_LIMIT},
    )

    const lastMessage = finalState.messages[finalState.messages.length - 1]
    this.validateAgentResponse(lastMessage)

    const data = {
      response: lastMessage.content as string,
      fullHistory: finalState.messages,
    }

    console.log('Agent run completed with data:', data)
  }

  private validateAgentResponse(message: unknown): void {
    if (
      !message ||
      typeof (message as {content: unknown}).content !== 'string'
    ) {
      GithubAgentService.logger.error('Invalid agent response', message)
      throw new InternalServerErrorException(
        'Agent failed to produce a valid response',
      )
    }
  }
}
