import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// AI Provider Type
export type AIProvider = 'openai' | 'claude' | 'gemini'

// Get the configured AI provider
export const getAIProvider = (): AIProvider => {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'gemini'
  if (provider === 'claude') return 'claude'
  if (provider === 'openai') return 'openai'
  return 'gemini' // Default to Gemini (free tier)
}

// Initialize OpenAI client
let openaiClient: OpenAI | null = null

const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your backend/.env file. Get your API key from https://platform.openai.com/api-keys')
    }
    
    openaiClient = new OpenAI({
      apiKey: apiKey,
    })
  }
  return openaiClient
}

// Initialize Claude client
let claudeClient: Anthropic | null = null

const getClaudeClient = (): Anthropic => {
  if (!claudeClient) {
    const apiKey = process.env.CLAUDE_API_KEY
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_claude_api_key_here') {
      throw new Error('Claude API key is not configured. Please set CLAUDE_API_KEY in your backend/.env file.')
    }
    
    claudeClient = new Anthropic({
      apiKey: apiKey,
    })
  }
  return claudeClient
}

// Chat with OpenAI
export const chatWithOpenAI = async (messages: AIMessage[]): Promise<string> => {
  try {
    const client = getOpenAIClient()
    
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // Use gpt-4o-mini for cost-effective, or gpt-4o for better quality
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: 4096,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || 'Sorry, I could not process that request.'
  } catch (error: any) {
    console.error('OpenAI API error:', error)
    
    const errorResponse = error?.error || error?.response?.data || error
    const errorMessage = errorResponse?.message || error?.message || 'Failed to get response from OpenAI'
    
    // Handle specific errors
    if (errorMessage.toLowerCase().includes('insufficient_quota') || errorMessage.toLowerCase().includes('billing')) {
      throw new Error('OpenAI account has insufficient credits. Please add credits at https://platform.openai.com/account/billing')
    }
    
    if (error?.status === 401 || error?.statusCode === 401) {
      throw new Error('OpenAI API key is invalid or expired. Please check your API key at https://platform.openai.com/api-keys')
    } else if (error?.status === 429 || error?.statusCode === 429) {
      throw new Error('OpenAI rate limit exceeded. Please try again later.')
    }
    
    throw new Error(errorMessage)
  }
}

// Chat with Claude
export const chatWithClaude = async (messages: AIMessage[]): Promise<string> => {
  try {
    const client = getClaudeClient()
    
    if (!client.messages || typeof client.messages.create !== 'function') {
      throw new Error('Claude client messages API is not available.')
    }

    const response = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    return response.content[0].type === 'text'
      ? response.content[0].text
      : 'Sorry, I could not process that request.'
  } catch (error: any) {
    console.error('Claude API error:', error)
    
    const errorResponse = error?.error || error?.response?.data || error
    const errorMessage = errorResponse?.message || error?.message || 'Failed to get response from Claude'
    
    if (errorMessage.toLowerCase().includes('credit balance') || errorMessage.toLowerCase().includes('too low')) {
      throw new Error('Your Anthropic account has insufficient credits. Please add credits at https://console.anthropic.com/settings/plans')
    }
    
    if (error?.status === 401 || error?.statusCode === 401) {
      throw new Error('Claude API key is invalid or expired. Please check your API key at https://console.anthropic.com/')
    } else if (error?.status === 429 || error?.statusCode === 429) {
      throw new Error('Claude rate limit exceeded. Please try again later.')
    }
    
    throw new Error(errorMessage)
  }
}

// Initialize Gemini client
let geminiClient: GoogleGenerativeAI | null = null

const getGeminiClient = (): GoogleGenerativeAI => {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your backend/.env file. Get your free API key from https://makersuite.google.com/app/apikey')
    }
    
    try {
      geminiClient = new GoogleGenerativeAI(apiKey)
    } catch (error: any) {
      throw new Error(`Failed to initialize Gemini client: ${error.message}`)
    }
  }
  return geminiClient
}

// Chat with Gemini (Free Tier Available!)
export const chatWithGemini = async (messages: AIMessage[]): Promise<string> => {
  const client = getGeminiClient()
  
  // Convert messages to Gemini format
  // Combine system message with user messages
  let systemPrompt = ''
  const chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt += `${msg.content}\n\n`
    } else if (msg.role === 'user' || msg.role === 'assistant') {
      chatHistory.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })
    }
  }
  
  // Build the full prompt with system message
  const lastMessage = chatHistory[chatHistory.length - 1]
  const fullPrompt = systemPrompt ? `${systemPrompt}${lastMessage.parts[0].text}` : lastMessage.parts[0].text
  
  // Try models in order: configured model -> gemini-pro -> gemini-1.5-flash -> gemini-1.5-pro
  const configuredModel = process.env.GEMINI_MODEL?.trim() || ''
  const modelsToTry = configuredModel 
    ? [configuredModel, 'gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']
    : ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro']
  
  let lastError: any = null
  let triedModels: string[] = []
  
  for (const modelName of modelsToTry) {
    try {
      const model = client.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(fullPrompt)
      const response = await result.response
      const text = response.text()
      
      // If we used a fallback model, log it
      if (modelName !== configuredModel && configuredModel) {
        console.log(`✅ Model "${modelName}" is working (configured "${configuredModel}" was not available)`)
      }
      
      return text || 'Sorry, I could not process that request.'
    } catch (error: any) {
      lastError = error
      triedModels.push(modelName)
      const errorMessage = error?.message || ''
      
      // Check if it's an authentication/API key error
      if (error?.status === 401 || errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('unauthorized')) {
        throw new Error('Gemini API key is invalid or expired. Please check your API key at https://makersuite.google.com/app/apikey and make sure it\'s correctly set in backend/.env file')
      }
      
      // Check for quota/rate limit errors
      if (error?.status === 429 || errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
        throw new Error('Gemini rate limit exceeded. Please try again later.')
      }
      
      // If it's a model not found error, try next model
      if (errorMessage.includes('is not found') || errorMessage.includes('404 Not Found') || errorMessage.includes('not supported') || error?.status === 404) {
        console.log(`⚠️  Model "${modelName}" not available, trying next...`)
        continue // Try next model
      }
      
      // For other errors (like 403, 500, etc.), check if it's a general API issue
      if (error?.status === 403) {
        throw new Error('Gemini API access forbidden. Please check your API key permissions at https://makersuite.google.com/app/apikey')
      }
      
      // For other errors, throw immediately
      throw error
    }
  }
  
  // If all models failed, provide detailed error message
  console.error('Gemini API error - all models failed:', lastError)
  const errorMessage = lastError?.message || 'Failed to get response from Gemini'
  const errorStatus = lastError?.status || lastError?.statusCode
  
  // Provide helpful error message based on what we tried
  if (triedModels.length > 0) {
    throw new Error(`Gemini API error: Tried models [${triedModels.join(', ')}] but none are available. Status: ${errorStatus || 'Unknown'}. Please verify your API key at https://makersuite.google.com/app/apikey is valid and has proper permissions. Error: ${errorMessage}`)
  }
  
  throw new Error(`Gemini API error: ${errorMessage}`)
}

// Main chat function - uses configured provider
export const chatWithAI = async (messages: AIMessage[]): Promise<string> => {
  const provider = getAIProvider()
  
  if (provider === 'claude') {
    return chatWithClaude(messages)
  } else if (provider === 'openai') {
    return chatWithOpenAI(messages)
  } else {
    return chatWithGemini(messages) // Default to Gemini (free tier)
  }
}

