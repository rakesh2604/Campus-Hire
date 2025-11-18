import { Response, NextFunction } from 'express'
import { verifyToken } from '../utils/auth'
import { RequestWithUser } from '../types'

export const authenticateToken = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' })
    return
  }

  try {
    const decoded = verifyToken(token)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
    next()
  } catch (error) {
    res.status(403).json({ success: false, error: 'Invalid or expired token' })
  }
}

export const optionalAuthenticateToken = (
  req: RequestWithUser,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    next()
    return
  }

  try {
    const decoded = verifyToken(token)
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    // Ignore invalid token for optional auth, but do not set user
    console.warn('Optional auth token invalid:', error)
  }

  next()
}

/**
 * Role hierarchy: admin > placement > recruiter > candidate
 */
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  placement: 3,
  recruiter: 2,
  candidate: 1,
}

/**
 * Check if user has required role or higher
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: RequestWithUser, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }

    const userRoleLevel = ROLE_HIERARCHY[req.user!.role] || 0
    const hasPermission = allowedRoles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] || 0
      return userRoleLevel >= requiredLevel || req.user!.role === role
    })

    if (!hasPermission) {
      res.status(403).json({ 
        success: false, 
        error: `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}` 
      })
      return
    }

    next()
  }
}

/**
 * Check if user owns a resource (for resource-level authorization)
 */
export const requireOwnership = (getResourceOwnerId: (req: RequestWithUser) => string | Promise<string>) => {
  return async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' })
      return
    }

    // Admin and placement can access any resource
    if (req.user.role === 'admin' || req.user.role === 'placement') {
      next()
      return
    }

    try {
      const ownerId = await getResourceOwnerId(req)
      if (ownerId !== req.user.userId) {
        res.status(403).json({ success: false, error: 'You do not have permission to access this resource' })
        return
      }
      next()
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to verify resource ownership' })
    }
  }
}

