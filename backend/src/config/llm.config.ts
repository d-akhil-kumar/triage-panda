import {registerAs} from '@nestjs/config'

export default registerAs('llm', () => ({
  geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE',
}))
