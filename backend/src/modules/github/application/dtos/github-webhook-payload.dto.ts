import {IsString, IsObject} from 'class-validator'
import {RepositoryDto} from './repository.dto'
import {IssueDto} from './issue.dto'

export class GithubWebhookPayloadDto {
  @IsString()
  action: string

  @IsObject()
  issue: IssueDto

  @IsObject()
  repository: RepositoryDto

  @IsObject()
  installation: {id: number}
}
