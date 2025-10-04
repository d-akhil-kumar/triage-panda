import {BaseMessage} from '@langchain/core/messages'

export interface AgentResult {
  response: string
  fullHistory: BaseMessage[]
}
