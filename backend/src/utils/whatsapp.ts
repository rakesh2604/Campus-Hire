// Lazy load twilio to avoid import errors if package is not installed
let twilioClient: any = null
let twilioInitialized = false

const initializeTwilio = async () => {
  if (twilioInitialized) return // Already initialized
  
  twilioInitialized = true
  
  try {
    // Dynamic import to avoid errors if twilio is not installed
    const twilioModule = await import('twilio')
    const twilio = twilioModule.default || twilioModule
    
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM) {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    } else {
      twilioClient = false // Mark as checked but not configured
    }
  } catch (error) {
    console.warn('Twilio package not installed. WhatsApp notifications will be disabled.')
    twilioClient = false // Mark as unavailable
  }
}

export interface WhatsAppOptions {
  to: string // Phone number in E.164 format (e.g., +919876543210)
  message: string
}

export const sendWhatsApp = async (options: WhatsAppOptions): Promise<void> => {
  // Initialize Twilio on first use
  if (!twilioInitialized) {
    await initializeTwilio()
  }
  
  if (!twilioClient || !process.env.TWILIO_WHATSAPP_FROM) {
    console.warn('Twilio WhatsApp not configured. WhatsApp not sent:', options)
    return
  }

  try {
    // Ensure phone number is in E.164 format
    let phoneNumber = options.to
    if (!phoneNumber.startsWith('+')) {
      // If it doesn't start with +, assume it's an Indian number and add +91
      if (phoneNumber.startsWith('91')) {
        phoneNumber = '+' + phoneNumber
      } else if (phoneNumber.length === 10) {
        phoneNumber = '+91' + phoneNumber
      } else {
        phoneNumber = '+' + phoneNumber
      }
    }

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${phoneNumber}`,
      body: options.message,
    })

    console.log(`WhatsApp message sent successfully to ${phoneNumber}`)
  } catch (error) {
    console.error('Twilio WhatsApp error:', error)
    throw new Error('Failed to send WhatsApp message')
  }
}

