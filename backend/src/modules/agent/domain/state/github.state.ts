import {BaseMessage} from '@langchain/core/messages'
import {Annotation} from '@langchain/langgraph'

export const GithubStateAnnotation = Annotation.Root({
  issueNumber: Annotation<number>(),
  owner: Annotation<string>(),
  repo: Annotation<string>(),
  id: Annotation<number | null>(),
  number: Annotation<number | null>(),
  title: Annotation<string | null>(),
  body: Annotation<string | null>(),
  author: Annotation<string | null>(),
  state: Annotation<'open' | 'closed' | null>(),
  messages: Annotation<BaseMessage[]>({
    default: () => [],
    reducer: (a, b) => a.concat(b),
  }),
})
