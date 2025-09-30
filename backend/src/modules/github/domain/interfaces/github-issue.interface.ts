export interface GithubIssue {
  id: number
  number: number
  title: string
  body: string | null
  author: string
  state: 'open' | 'closed'
}
