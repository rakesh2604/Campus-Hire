import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../../shared/types'

export const errorHandler = (
  err: Error | any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error with stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    })
  } else {
    // In production, log to error tracking service
    console.error('Error:', err.message)
    // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const response: ApiResponse<never> = {
      success: false,
      error: err.message || 'Validation failed',
    }
    res.status(400).json(response)
    return
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Duplicate entry. This record already exists.',
    }
    res.status(409).json(response)
    return
  }

  // Handle MongoDB cast errors
  if (err.name === 'CastError') {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Invalid ID format',
    }
    res.status(400).json(response)
    return
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Invalid or expired token',
    }
    res.status(401).json(response)
    return
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500
  const response: ApiResponse<never> = {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error',
  }

  res.status(statusCode).json(response)
}

export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  console.warn(`⚠️  Route not found: ${req.method} ${req.originalUrl}`)
  
  const response: ApiResponse<never> = {
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  }

  res.status(404).json(response)
}

