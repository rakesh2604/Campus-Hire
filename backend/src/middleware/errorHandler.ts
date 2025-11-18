import { Request, Response, NextFunction } from 'express'
import { ApiResponse } from '../types'
import { AppError, createErrorResponse, ErrorCode } from '../utils/errors'
import { getRequestId } from './requestId'

export const errorHandler = (
  err: Error | any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = getRequestId(req)
  
  // Log error with stack trace in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', {
      requestId,
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      path: req.path,
      method: req.method,
    })
  } else {
    // In production, log to error tracking service
    console.error('Error:', {
      requestId,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    })
    // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
  }

  // Handle AppError instances (our custom errors)
  if (err instanceof AppError) {
    const response = createErrorResponse(err)
    if (requestId) {
      (response as any).requestId = requestId
    }
    res.status(err.statusCode).json(response)
    return
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const response: ApiResponse<never> = {
      success: false,
      error: err.message || 'Validation failed',
      code: ErrorCode.VALIDATION_ERROR,
    }
    res.status(400).json(response)
    return
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Duplicate entry. This record already exists.',
      code: ErrorCode.RESOURCE_ALREADY_EXISTS,
    }
    res.status(409).json(response)
    return
  }

  // Handle MongoDB cast errors
  if (err.name === 'CastError') {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Invalid ID format',
      code: ErrorCode.VALIDATION_INVALID_ID,
    }
    res.status(400).json(response)
    return
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Invalid or expired token',
      code: ErrorCode.AUTH_INVALID_TOKEN,
    }
    res.status(401).json(response)
    return
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500
  const response = createErrorResponse(err)
  if (requestId) {
    (response as any).requestId = requestId
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

