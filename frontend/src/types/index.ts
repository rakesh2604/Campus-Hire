import type { User, Job, Application, ApiResponse, DismissedJob } from '../../../shared/types/index'

// Re-export shared types
export type { User, Job, Application, ApiResponse, DismissedJob }

// Frontend-specific types
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

export interface FormFieldError {
  message: string
  type: string
}

