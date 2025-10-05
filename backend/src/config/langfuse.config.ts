import {registerAs} from '@nestjs/config'

export default registerAs('langfuse', () => ({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
  secretKey: process.env.LANGFUSE_SECRET_KEY || '',
  host: process.env.LANGFUSE_HOST || '',
}))
