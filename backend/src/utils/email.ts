import sgMail from '@sendgrid/mail'

let sendGridInitialized = false

/**
 * Initialize SendGrid with API key (only if valid)
 */
const initializeSendGrid = (): boolean => {
  if (sendGridInitialized) {
    return true
  }

  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    return false
  }

  // Validate API key format (SendGrid keys start with "SG.")
  if (!apiKey.startsWith('SG.')) {
    console.warn('SendGrid API key format is invalid (should start with "SG."). Email functionality will be disabled.')
    return false
  }

  try {
    sgMail.setApiKey(apiKey)
    sendGridInitialized = true
    return true
  } catch (error) {
    console.warn('Failed to initialize SendGrid:', error)
    return false
  }
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Initialize SendGrid lazily
  if (!initializeSendGrid()) {
    console.warn('SendGrid not configured. Email not sent:', {
      to: options.to,
      subject: options.subject,
    })
    return
  }

  try {
    await sgMail.send({
      from: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@campushire.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    })
    console.log(`Email sent successfully to ${options.to}`)
  } catch (error: any) {
    console.error('SendGrid error:', error?.message || error)
    // Don't throw in production to prevent breaking the application
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Failed to send email: ${error?.message || 'Unknown error'}`)
    }
  }
}

