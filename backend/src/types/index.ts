// Re-export shared types
export type { ApiResponse, User, Job, Application, DismissedJob } from '../../../shared/types/index'

// Backend-specific types
export interface JwtPayload {
  userId: string
  email: string
  role: string
}

import { Request } from 'express'

export interface RequestWithUser extends Request {
  user?: {
    userId: string
    email: string
    role: string
  }
}

