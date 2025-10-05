import {IsString} from 'class-validator'

export class OwnerDto {
  @IsString()
  login: string
}
