import { Request, Response, NextFunction } from 'express'

/**
 * Basic input sanitization middleware
 * Removes potentially dangerous characters and trims whitespace
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === 'string') {
      // Remove null bytes and trim
      return obj.replace(/\0/g, '').trim()
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }

    if (typeof obj === 'object') {
      const sanitized: any = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // Sanitize key (remove dangerous characters)
          const cleanKey = key.replace(/[<>]/g, '')
          sanitized[cleanKey] = sanitize(obj[key])
        }
      }
      return sanitized
    }

    return obj
  }

  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body)
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query) as any
  }

  // Sanitize params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params) as any
  }

  next()
}

