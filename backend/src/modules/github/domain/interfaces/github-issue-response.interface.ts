export interface GithubIssueResponse {
  id: number
  number: number
  title: string
  body: string | null
  user: {
    login: string
  }
  state: 'open' | 'closed'
}
