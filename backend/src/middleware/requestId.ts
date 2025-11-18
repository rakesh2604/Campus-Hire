import { Request, Response, NextFunction } from 'express'
import { randomBytes } from 'crypto'

/**
 * Request ID middleware
 * Adds a unique request ID to each request for tracing
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  // Generate a unique request ID (16 bytes hex = 32 characters)
  const id = randomBytes(16).toString('hex')
  
  // Add to request object
  ;(req as any).requestId = id
  
  // Add to response headers
  res.setHeader('X-Request-ID', id)
  
  next()
}

/**
 * Get request ID from request object
 */
export const getRequestId = (req: Request): string | undefined => {
  return (req as any).requestId
}

