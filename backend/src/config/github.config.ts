import {registerAs} from '@nestjs/config'

export default registerAs('github', () => ({
  appId: process.env.GITHUB_APP_ID || '',
  installationId: process.env.GITHUB_INSTALLATION_ID || '',
  privateKey: process.env.GITHUB_PRIVATE_KEY || '',
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
}))
