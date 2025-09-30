import {GithubAddLabelsResponse} from './github-add-labels-response.interface'

export interface GithubAddLabels {
  success: boolean
  appliedLabels?: GithubAddLabelsResponse[]
}
