import { Request, Response } from 'express'
import { ApiResponse } from '../types'
import { getConnectionHealth, isDatabaseReady } from '../config/database'
import mongoose from 'mongoose'

// Health check route handler
export const getHealth = (_req: Request, res: Response): void => {
  const dbHealth = getConnectionHealth()
  const dbConnected = isDatabaseReady()
  
  // Get detailed connection info
  const connectionInfo = {
    readyState: mongoose.connection.readyState,
    readyStateText: dbHealth.state,
    host: dbHealth.host || 'N/A',
    port: typeof dbHealth.port === 'number' ? dbHealth.port : undefined,
    database: dbHealth.database || 'N/A',
    hasMongoDBUri: !!process.env.MONGODB_URI,
    mongoDBUriPreview: process.env.MONGODB_URI 
      ? `${process.env.MONGODB_URI.substring(0, 30)}...` 
      : 'Not set',
  }
  
  const response: ApiResponse<{ 
    status: string
    database: {
      connected: boolean
      state: string
      host?: string
      port?: number
      database?: string
      readyState: number
      hasMongoDBUri: boolean
      mongoDBUriPreview: string
    }
    timestamp: string
  }> = {
    success: true,
    data: { 
      status: 'ok',
      database: {
        connected: dbConnected,
        state: dbHealth.state,
        host: connectionInfo.host,
        port: connectionInfo.port,
        database: connectionInfo.database,
        readyState: connectionInfo.readyState,
        hasMongoDBUri: connectionInfo.hasMongoDBUri,
        mongoDBUriPreview: connectionInfo.mongoDBUriPreview,
      },
      timestamp: new Date().toISOString(),
    },
    message: dbConnected 
      ? 'CampusHire API is running and database is connected' 
      : `CampusHire API is running but database is not connected (State: ${dbHealth.state}, ReadyState: ${connectionInfo.readyState})`,
  }
  res.json(response)
}

