/**
 * Standardized error handling utilities
 */

export enum ErrorCode {
  // Authentication errors (1000-1099)
  AUTH_REQUIRED = 'AUTH_1001',
  AUTH_INVALID_TOKEN = 'AUTH_1002',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_1003',
  AUTH_INVALID_CREDENTIALS = 'AUTH_1004',

  // Validation errors (2000-2099)
  VALIDATION_ERROR = 'VAL_2001',
  VALIDATION_INVALID_ID = 'VAL_2002',
  VALIDATION_MISSING_FIELD = 'VAL_2003',

  // Resource errors (3000-3099)
  RESOURCE_NOT_FOUND = 'RES_3001',
  RESOURCE_ALREADY_EXISTS = 'RES_3002',
  RESOURCE_CONFLICT = 'RES_3003',

  // Business logic errors (4000-4099)
  BUSINESS_RULE_VIOLATION = 'BIZ_4001',
  APPLICATION_ALREADY_EXISTS = 'BIZ_4002',
  JOB_NOT_ELIGIBLE = 'BIZ_4003',

  // Server errors (5000-5099)
  INTERNAL_SERVER_ERROR = 'SRV_5001',
  DATABASE_ERROR = 'SRV_5002',
  EXTERNAL_SERVICE_ERROR = 'SRV_5003',
}

export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(ErrorCode.VALIDATION_ERROR, message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(ErrorCode.AUTH_REQUIRED, message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.RESOURCE_CONFLICT, message, 409)
  }
}

/**
 * Create standardized API error response
 */
export function createErrorResponse(error: unknown): {
  success: false
  error: string
  code?: string
} {
  if (error instanceof AppError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
    }
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: error.message,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
    }
  }

  return {
    success: false,
    error: 'An unexpected error occurred',
    code: ErrorCode.INTERNAL_SERVER_ERROR,
  }
}

