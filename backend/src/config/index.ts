import {ConfigModule} from '@nestjs/config'
import {join} from 'path'
import appConfig from './app.config'

const getEnvPath = (): string => {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const envFileName = `.env.${nodeEnv}`
  return join(process.cwd(), 'src', 'config', envFileName)
}

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: getEnvPath(),
  load: [appConfig],
  validationOptions: {
    allowUnknown: true,
    abortEarly: true,
  },
})
