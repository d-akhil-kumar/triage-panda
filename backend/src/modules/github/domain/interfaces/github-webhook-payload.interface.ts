export interface GithubWebhookPayload {
  action: string
  issue: {
    number: number
    title: string
    body: string
  }
  repository: {
    name: string
    owner: {
      login: string
    }
  }
  installation: {id: number}
}
