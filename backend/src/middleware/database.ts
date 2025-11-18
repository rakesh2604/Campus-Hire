import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../types'
import { isDatabaseReady } from '../config/database'

/**
 * Middleware to check if database is connected before processing requests
 * Returns 503 Service Unavailable if database is not ready
 */
export const requireDatabase = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!isDatabaseReady()) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Database connection not available. Please try again later.',
    }
    res.status(503).json(response)
    return
  }
  next()
}

