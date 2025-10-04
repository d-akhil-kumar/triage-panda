import {Module} from '@nestjs/common'
import {HttpModule} from '@nestjs/axios'
import {GithubAuthService} from './domain/services/github-auth.service'
import {GithubController} from './application/controllers/github.controller'
import {GithubService} from './domain/services/github.service'
import {AgentModule} from '../agent/agent.module'
import {GithubAgentService} from './domain/services/github-agent.service'

@Module({
  imports: [
    HttpModule.register({
      timeout: 10_000,
      maxRedirects: 5,
    }),
    AgentModule,
  ],
  controllers: [GithubController],
  providers: [GithubAuthService, GithubService, GithubAgentService],
  exports: [],
})
export class GithubModule {}
