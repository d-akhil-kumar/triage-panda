import {ConfigModule} from '@nestjs/config'
import {join} from 'path'
import appConfig from './app.config'
import githubConfig from './github.config'
import llmConfig from './llm.config'
import langfuseConfig from './langfuse.config'

const getEnvPath = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const envFileName = `.env.${nodeEnv}`
  return join(process.cwd(), 'src', 'config', envFileName)
}

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: getEnvPath(),
  load: [appConfig, githubConfig, llmConfig, langfuseConfig],
  validationOptions: {
    allowUnknown: true,
    abortEarly: true,
  },
})
