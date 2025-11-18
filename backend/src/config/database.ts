import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Database connection configuration and management
 * SDE 2 Level: Production-ready connection handling with retry logic,
 * health monitoring, and graceful shutdown
 */

export interface DatabaseConfig {
  uri: string
  options: mongoose.ConnectOptions
  retryAttempts: number
  retryDelay: number
}

// Connection state tracking
let connectionState: 'disconnected' | 'connecting' | 'connected' | 'disconnecting' = 'disconnected'
let retryCount = 0
let connectionHealthCheckInterval: NodeJS.Timeout | null = null

/**
 * Get optimized connection options based on environment
 */
export const getConnectionOptions = (): mongoose.ConnectOptions => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isDevelopment = process.env.NODE_ENV === 'development'

  const baseOptions: mongoose.ConnectOptions = {
    // Connection pool settings - optimized for production
    maxPoolSize: isProduction ? 50 : 10,
    minPoolSize: isProduction ? 10 : 5,
    
    // Timeout settings
    serverSelectionTimeoutMS: isProduction ? 5000 : 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    
    // Buffer settings - disable buffering for immediate error feedback
    bufferCommands: false,
    
    // Heartbeat settings for connection monitoring
    heartbeatFrequencyMS: 10000,
    
    // Compression (MongoDB 3.4+)
    compressors: ['zlib'] as any,
    
    // Read preference
    readPreference: 'primary',
    
    // Write concern
    w: 'majority',
    journal: true,
  }

  // Development-specific optimizations
  if (isDevelopment) {
    return {
      ...baseOptions,
      // More lenient timeouts in development
      serverSelectionTimeoutMS: 10000,
    }
  }

  return baseOptions
}

/**
 * Validate MongoDB URI format
 */
export const validateMongoURI = (uri: string): { valid: boolean; error?: string } => {
  if (!uri) {
    return { valid: false, error: 'MongoDB URI is required' }
  }

  // Check for placeholder values
  if (uri.includes('username:password')) {
    return { valid: false, error: 'MongoDB URI contains placeholder username:password' }
  }

  // Check for invalid cluster pattern (not a real cluster)
  if (uri.includes('cluster.mongodb.net') && !uri.match(/cluster\d+\./)) {
    return { valid: false, error: 'MongoDB URI appears to be a placeholder (cluster.mongodb.net)' }
  }

  // Basic URI format validation
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    return { valid: false, error: 'Invalid MongoDB URI format' }
  }

  return { valid: true }
}

/**
 * Get connection health status
 */
export const getConnectionHealth = () => {
  const readyState = mongoose.connection.readyState
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }

  return {
    state: states[readyState as keyof typeof states] || 'unknown',
    readyState,
    isConnected: readyState === 1,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    database: mongoose.connection.db?.databaseName,
    // Connection pool stats
    poolSize: (mongoose.connection as any).poolSize || 'N/A',
  }
}

/**
 * Start connection health monitoring
 */
const startHealthMonitoring = () => {
  if (connectionHealthCheckInterval) {
    clearInterval(connectionHealthCheckInterval)
  }

  connectionHealthCheckInterval = setInterval(() => {
    const health = getConnectionHealth()
    
    if (!health.isConnected && connectionState === 'connected') {
      console.warn('⚠️  Connection health check: Database appears disconnected')
      connectionState = 'disconnected'
    }
  }, 30000) // Check every 30 seconds
}

/**
 * Stop connection health monitoring
 */
const stopHealthMonitoring = () => {
  if (connectionHealthCheckInterval) {
    clearInterval(connectionHealthCheckInterval)
    connectionHealthCheckInterval = null
  }
}

/**
 * Connect to MongoDB with retry logic and exponential backoff
 */
export const connectDB = async (
  maxRetries: number = 3,
  retryDelay: number = 5000
): Promise<void> => {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn('⚠️  Warning: MONGODB_URI is not defined in environment variables')
    console.warn('⚠️  Database connection will be skipped. Please set MONGODB_URI in your .env file')
    return
  }

  // Validate URI
  const validation = validateMongoURI(uri)
  if (!validation.valid) {
    console.error(`❌ ERROR: ${validation.error}`)
    console.error('❌ Please update your backend/.env file with a real MongoDB connection string')
    console.error('📝 Get your connection string from MongoDB Atlas:')
    console.error('   1. Go to your cluster → Click "Connect"')
    console.error('   2. Choose "Connect your application"')
    console.error('   3. Copy the connection string and replace <username> and <password>')
    console.error('   4. Add /campushire before the ? to specify database name')
    console.warn('⚠️  Server will continue without database connection')
    return
  }

  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected')
    return
  }

  // If already connecting, wait
  if (connectionState === 'connecting') {
    console.log('⏳ Connection already in progress, waiting...')
    return
  }

  connectionState = 'connecting'
  const options = getConnectionOptions()

  const attemptConnection = async (attempt: number): Promise<void> => {
    try {
      console.log(`⏳ Connecting to MongoDB... (Attempt ${attempt}/${maxRetries})`)
      
      await mongoose.connect(uri, options)
      
      connectionState = 'connected'
      retryCount = 0
      
      console.log('✅ MongoDB connected successfully')
      console.log(`📊 Database: ${mongoose.connection.db?.databaseName || 'connected'}`)
      console.log(`📍 Host: ${mongoose.connection.host}:${mongoose.connection.port || 'N/A'}`)
      
      // Start health monitoring
      startHealthMonitoring()
      
      // Set up connection event handlers
      setupConnectionEventHandlers()
      
    } catch (error: any) {
      retryCount++
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1) // Exponential backoff
        console.warn(`⚠️  Connection attempt ${attempt} failed. Retrying in ${delay}ms...`)
        console.error(`   Error: ${error.message}`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return attemptConnection(attempt + 1)
      } else {
        connectionState = 'disconnected'
        throw error
      }
    }
  }

  try {
    await attemptConnection(1)
  } catch (error: any) {
    connectionState = 'disconnected'
    console.error('❌ MongoDB connection failed after all retry attempts')
    console.error(`   Error: ${error.message}`)
    console.error(`   Error code: ${error.code || 'N/A'}`)
    
    // Provide helpful error messages
    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 Possible issues:')
      console.error('   - Incorrect cluster hostname in connection string')
      console.error('   - Connection string may still contain placeholder values')
      console.error('   - Network connectivity issues')
      console.error('   - DNS resolution problems')
      console.error(`   - Current MONGODB_URI: ${uri.substring(0, 20)}... (first 20 chars)`)
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Possible issues:')
      console.error('   - Incorrect username or password')
      console.error('   - Special characters in password need URL-encoding')
      console.error('   - User does not have proper permissions')
      console.error('   - Database user may have been deleted')
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('💡 Possible issues:')
      console.error('   - IP address not whitelisted in MongoDB Atlas')
      console.error('   - Go to Security → Network Access and add your IP (or 0.0.0.0/0 for development)')
      console.error('   - Firewall blocking connection')
      console.error('   - MongoDB cluster may be paused')
    } else if (error.message.includes('MongoServerError')) {
      console.error('💡 Possible issues:')
      console.error('   - Server-side error from MongoDB')
      console.error('   - Check MongoDB Atlas dashboard for cluster status')
    }
    
    console.warn('⚠️  Server will continue without database connection')
    console.warn('⚠️  API endpoints requiring database will return 503 Service Unavailable')
  }
}

/**
 * Setup connection event handlers
 */
const setupConnectionEventHandlers = () => {
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message)
    connectionState = 'disconnected'
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected')
    connectionState = 'disconnected'
    stopHealthMonitoring()
  })

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected')
    connectionState = 'connected'
    startHealthMonitoring()
  })

  mongoose.connection.on('connecting', () => {
    console.log('⏳ MongoDB connecting...')
    connectionState = 'connecting'
  })

  // Monitor connection pool
  mongoose.connection.on('fullsetup', () => {
    console.log('📊 MongoDB connection pool ready')
  })
}

/**
 * Gracefully disconnect from MongoDB
 */
export const disconnectDB = async (): Promise<void> => {
  if (connectionState === 'disconnected' || connectionState === 'disconnecting') {
    return
  }

  connectionState = 'disconnecting'
  stopHealthMonitoring()

  try {
    await mongoose.connection.close()
    console.log('✅ MongoDB disconnected gracefully')
    connectionState = 'disconnected'
  } catch (error: any) {
    console.error('❌ Error disconnecting from MongoDB:', error.message)
    connectionState = 'disconnected'
  }
}

/**
 * Check if database is ready for operations
 */
export const isDatabaseReady = (): boolean => {
  const readyState = mongoose.connection.readyState
  const isReady = readyState === 1
  
  // Log state for debugging (only in development)
  if (process.env.NODE_ENV === 'development' && !isReady) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }
    console.warn(`⚠️  Database state: ${states[readyState as keyof typeof states]} (${readyState})`)
  }
  
  return isReady
}

/**
 * Wait for database connection (useful for startup)
 */
export const waitForConnection = async (timeout: number = 30000): Promise<boolean> => {
  const startTime = Date.now()
  
  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startTime > timeout) {
      return false
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return true
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing database connection...')
  await disconnectDB()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, closing database connection...')
  await disconnectDB()
  process.exit(0)
})

