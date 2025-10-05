import {IsInt, IsString} from 'class-validator'

export class IssueDto {
  @IsInt()
  number: number

  @IsString()
  title: string

  @IsString()
  body: string
}
