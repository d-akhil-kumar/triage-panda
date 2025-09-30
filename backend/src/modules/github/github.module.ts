import {Module} from '@nestjs/common'
import {HttpModule} from '@nestjs/axios'
import {GithubAuthService} from './domain/services/github-auth.service'
import {GithubController} from './application/controllers/github.controller'

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 5,
    }),
  ],
  controllers: [GithubController],
  providers: [GithubAuthService],
  exports: [],
})
export class GithubModule {}
