import {Body, Controller, Post, Req, Headers} from '@nestjs/common'
import type {RawBodyRequest} from '@nestjs/common'
import {GithubService} from '../../domain/services/github.service'
import type {GithubWebhook} from '../../domain/interfaces/github-webhook.interface'
import type {GithubWebhookPayload} from '../../domain/interfaces/github-webhook-payload.interface'

@Controller('github')
export class GithubController {
  constructor(private readonly service: GithubService) {}

  @Post('/webhook')
  handleWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: GithubWebhookPayload,
  ): GithubWebhook {
    return this.service.handleWebhook(signature, req.rawBody, payload)
  }
}
