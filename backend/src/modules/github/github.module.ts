import {Module} from '@nestjs/common'
import {HttpModule} from '@nestjs/axios'
import {GithubAuthService} from './domain/services/github-auth.service'
import {GithubController} from './application/controllers/github.controller'
import {GithubTool} from './domain/tools/github.tool'
import {GithubService} from './domain/services/github.service'
import {GithubAgentService} from './domain/services/github-agent.service'

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 5,
    }),
  ],
  controllers: [GithubController],
  providers: [GithubAuthService, GithubTool, GithubService, GithubAgentService],
  exports: [],
})
export class GithubModule {}
