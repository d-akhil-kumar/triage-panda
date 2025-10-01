import {NestFactory} from '@nestjs/core'
import {AppModule} from './app.module'
import {NestExpressApplication} from '@nestjs/platform-express'
import helmet from 'helmet'
import {Logger, ValidationPipe} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'

const logger = new Logger('main.ts:bootstrap')

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
    rawBody: true,
  })

  const configService = app.get(ConfigService)
  const port = configService.get<number>('app.port') || 3000
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development'
  const corsOrigin =
    configService.get<string>('app.corsOrigin') || 'http://localhost:3001'

  app.setGlobalPrefix('api')
  app.use(helmet())

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  )

  await app.listen(port)
  logger.log(`Application Port: ${port}`)
  logger.log(`Base Url: http://localhost:${port}/api`)
  logger.log(`Environment: ${nodeEnv}`)
  logger.log(`CORS Origin: ${corsOrigin}`)
}
void bootstrap()
