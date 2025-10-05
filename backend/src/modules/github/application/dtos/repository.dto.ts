import {IsObject, IsString} from 'class-validator'
import {OwnerDto} from './owner.dto'

export class RepositoryDto {
  @IsString()
  name: string

  @IsObject()
  owner: OwnerDto
}
