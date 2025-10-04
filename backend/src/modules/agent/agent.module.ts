import {Module} from '@nestjs/common'
import {AgentService} from './domain/services/agent.service'

@Module({
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
