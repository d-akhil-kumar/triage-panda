import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {ChatGoogleGenerativeAI} from '@langchain/google-genai'
import {AIMessage, BaseMessage} from '@langchain/core/messages'
import {DynamicStructuredTool} from '@langchain/core/tools'
import {StateGraph, MessagesAnnotation, END, START} from '@langchain/langgraph'
import {AgentState, ToolNode} from '@langchain/langgraph/prebuilt'
import {Runnable} from '@langchain/core/runnables'
import {AgentResult} from '../interfaces/agent-result.interface'
import {CallbackHandler} from 'langfuse-langchain'

@Injectable()
export class AgentService {
  private static readonly logger = new Logger(AgentService.name)
  private static readonly LLM_MODEL_NAME = 'gemini-2.5-flash'
  private static readonly DEFAULT_TEMPERATURE = 0.2
  private static readonly MAX_MESSAGE_COUNT = 10
  private static readonly MAX_RECURSION_LIMIT = 10
  private langfuseHandler: CallbackHandler

  constructor(private readonly configService: ConfigService) {
    this.langfuseHandler = new CallbackHandler({
      secretKey: this.configService.get<string>('langfuse.secretKey')!,
      publicKey: this.configService.get<string>('langfuse.publicKey')!,
      baseUrl: this.configService.get<string>('langfuse.host')!,
    })
  }

  public async invoke(
    tools: DynamicStructuredTool[],
    messages: BaseMessage[],
  ): Promise<AgentResult> {
    const model = this.createModel(tools)
    const graph = this.buildGraph(tools, model)

    const finalState: typeof MessagesAnnotation.State = await graph.invoke(
      {messages},
      {
        recursionLimit: AgentService.MAX_RECURSION_LIMIT,
        callbacks: [this.langfuseHandler],
      },
    )

    const lastMessage = finalState.messages[finalState.messages.length - 1]
    this.validateAgentResponse(lastMessage)

    return {
      response: lastMessage.content as string,
      fullHistory: finalState.messages,
    }
  }

  private createModel(tools: DynamicStructuredTool[]): Runnable {
    const LLM_API_KEY = this.configService.get<string>('llm.geminiApiKey')!

    return new ChatGoogleGenerativeAI({
      model: AgentService.LLM_MODEL_NAME,
      temperature: AgentService.DEFAULT_TEMPERATURE,
      apiKey: LLM_API_KEY,
    }).bindTools(tools)
  }

  private buildGraph(
    tools: DynamicStructuredTool[],
    model: Runnable,
  ): typeof StateGraph.prototype.compile extends () => infer R ? R : never {
    const toolNode = new ToolNode(tools)

    const callModel = async (
      state: typeof MessagesAnnotation.State,
    ): Promise<Partial<AgentState>> => {
      const response = (await model.invoke(state.messages)) as AIMessage
      return {messages: [response]}
    }

    const shouldContinue = (
      state: typeof MessagesAnnotation.State,
    ): 'tools' | '__end__' => {
      const {messages} = state
      const lastMessage = messages[messages.length - 1] as AIMessage
      if (messages.length > AgentService.MAX_MESSAGE_COUNT) {
        return END
      }
      if (lastMessage.tool_calls?.length) {
        return 'tools'
      }
      return END
    }

    return new StateGraph(MessagesAnnotation)
      .addNode('agent', callModel)
      .addNode('tools', toolNode)
      .addEdge(START, 'agent')
      .addEdge('tools', 'agent')
      .addConditionalEdges('agent', shouldContinue)
      .compile()
  }

  private validateAgentResponse(message: unknown): void {
    if (
      !message ||
      typeof (message as {content: unknown}).content !== 'string'
    ) {
      AgentService.logger.error('Invalid agent response', message)
      throw new InternalServerErrorException(
        'Agent failed to produce a valid response',
      )
    }
  }
}
