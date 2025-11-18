import express from 'express'
import cors from 'cors'
import { env } from './config/env'
import healthRoutes from './routes/healthRoutes'
import authRoutes from './routes/authRoutes'
import jobRoutes from './routes/jobRoutes'
import applicationRoutes from './routes/applicationRoutes'
import vedaRoutes from './routes/vedaRoutes'
import placedAIRoutes from './routes/placedAIRoutes'
import placementRoutes from './routes/placementRoutes'
import careerCopilotRoutes from './routes/careerCopilotRoutes'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { connectDB, getConnectionHealth, isDatabaseReady } from './config/database'
import { apiLimiter, authLimiter, applicationLimiter } from './middleware/rateLimiter'
import { sanitizeInput } from './middleware/sanitizer'
import { requestId } from './middleware/requestId'

const app = express()
const PORT = env.PORT

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}))

// Request ID tracking (must be early in middleware chain)
app.use(requestId)

// Increase body size limit to 50MB for file uploads (base64 images/resumes)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Input sanitization
app.use(sanitizeInput)

// Rate limiting
app.use('/api/', apiLimiter)

// Request logging middleware (development only)
if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// Health check (no versioning, no rate limit)
app.use('/api/health', healthRoutes)

// API v1 routes with versioning
const v1Router = express.Router()

// Auth routes with strict rate limiting
v1Router.use('/auth', authLimiter, authRoutes)

// Application routes with application-specific rate limiting
v1Router.use('/applications', applicationLimiter, applicationRoutes)

// Other routes with general rate limiting
v1Router.use('/jobs', jobRoutes)
v1Router.use('/veda', vedaRoutes)
v1Router.use('/placedai', placedAIRoutes)
v1Router.use('/placement', placementRoutes)
v1Router.use('/career-copilot', careerCopilotRoutes)

// Mount v1 router
app.use('/api/v1', v1Router)

// Legacy routes (redirect to v1 for backward compatibility)
app.use('/api/auth', authRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/veda', vedaRoutes)
app.use('/api/placedai', placedAIRoutes)
app.use('/api/placement', placementRoutes)
app.use('/api/career-copilot', careerCopilotRoutes)

// Error handling middleware (must be last)
app.use(notFoundHandler)
app.use(errorHandler)

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database with retry logic
    await connectDB(3, 5000) // 3 retries, 5 second initial delay
    
    // Wait for connection to be ready (optional, for critical startup)
    const dbReady = await isDatabaseReady()
    if (dbReady) {
      const health = getConnectionHealth()
      console.log('📊 Database Health:', JSON.stringify(health, null, 2))
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n═══════════════════════════════════════════════════════')
      console.log('🚀 CAMPUS HIRE BACKEND SERVER')
      console.log('═══════════════════════════════════════════════════════')
      console.log(`✅ Server is running on port ${PORT}`)
      console.log(`📍 Local API: http://localhost:${PORT}/api/v1`)
      console.log(`📍 Network API: http://0.0.0.0:${PORT}/api/v1`)
      console.log(`🌍 Environment: ${env.NODE_ENV}`)
      console.log(`🔒 Rate limiting: Active`)
      console.log(`🆔 Request ID tracking: Active`)
      console.log(`💾 Caching: Active (in-memory)`)
      console.log(`🔄 Transactions: Available`)
      console.log('═══════════════════════════════════════════════════════\n')
    })
  } catch (error: any) {
    console.error('\n═══════════════════════════════════════════════════════')
    console.error('❌ FAILED TO START SERVER')
    console.error('═══════════════════════════════════════════════════════')
    console.error(`Error: ${error?.message || error}`)
    
    if (error?.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    
    console.error('\n💡 Troubleshooting steps:')
    console.error('   1. Check your backend/.env file has all required variables')
    console.error('   2. Verify MongoDB connection string is correct')
    console.error('   3. Ensure port 3000 is not already in use')
    console.error('   4. Check that all dependencies are installed (npm install)')
    console.error('   5. Verify TypeScript compilation (npm run build)')
    console.error('═══════════════════════════════════════════════════════\n')
    
    process.exit(1)
  }
}

startServer()
