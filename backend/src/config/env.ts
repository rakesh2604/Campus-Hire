import dotenv from 'dotenv'

dotenv.config()

interface EnvConfig {
  // Server
  PORT: number
  NODE_ENV: 'development' | 'production' | 'test'
  FRONTEND_URL: string

  // Database
  MONGODB_URI: string

  // JWT
  JWT_SECRET: string
  JWT_EXPIRES_IN: string

  // Email (SendGrid)
  SENDGRID_API_KEY?: string
  SENDGRID_FROM_EMAIL?: string

  // WhatsApp (Twilio)
  TWILIO_ACCOUNT_SID?: string
  TWILIO_AUTH_TOKEN?: string
  TWILIO_WHATSAPP_FROM?: string

  // AI Services
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  GOOGLE_AI_API_KEY?: string
}

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FRONTEND_URL',
]

const optionalEnvVars = [
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_FROM',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_AI_API_KEY',
]

/**
 * Validate and load environment variables
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = []

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:')
    console.error('═══════════════════════════════════════════════════════')
    missing.forEach((varName) => {
      console.error(`   • ${varName}`)
    })
    console.error('═══════════════════════════════════════════════════════')
    console.error('\n📝 Please add these to your backend/.env file:')
    console.error('   Example: MONGODB_URI=mongodb://localhost:27017/campushire')
    console.error('   Example: JWT_SECRET=your_secret_key_here')
    console.error('   Example: FRONTEND_URL=http://localhost:5173\n')
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your backend/.env file.'
    )
  }

  // Warn about missing optional variables
  const missingOptional: string[] = []
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      missingOptional.push(varName)
    }
  }

  if (missingOptional.length > 0) {
    console.warn(
      `⚠️  Optional environment variables not set: ${missingOptional.join(', ')}\n` +
      'Some features may not work correctly.'
    )
  }

  return {
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    FRONTEND_URL: process.env.FRONTEND_URL!,
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM: process.env.TWILIO_WHATSAPP_FROM,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
  }
}

export const env = validateEnv()

