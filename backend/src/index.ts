import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
// Increase body size limit to 50MB for file uploads (base64 images/resumes)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// Routes
app.use('/api/health', healthRoutes)
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
    
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`)
      console.log(`📍 API endpoint: http://localhost:${PORT}/api`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
