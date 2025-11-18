// Re-export shared types
export * from '../../../shared/types/index'

// Backend-specific types
export interface JwtPayload {
  userId: string
  email: string
  role: string
}

export interface RequestWithUser extends Express.Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

