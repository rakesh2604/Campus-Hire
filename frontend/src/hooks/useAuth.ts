import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse, User } from '@/types'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  name: string
  role?: 'candidate' | 'recruiter' | 'placement' | 'admin'
}

interface AuthResponse {
  user: User
  token: string
}

export const useRegister = () => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<AuthResponse>, Error, RegisterData>({
    mutationFn: async (data) => {
      try {
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
          '/auth/register',
          data
        )
        return response.data
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { data?: { error?: string } } }
          const errorMessage = axiosError.response?.data?.error || 'Registration failed'
          throw new Error(errorMessage)
        }
        throw error
      }
    },
    onSuccess: (data) => {
      if (data.data?.token) {
        localStorage.setItem('authToken', data.data.token)
        queryClient.setQueryData(['currentUser'], { success: true, data: data.data.user })
      }
    },
  })
}

export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<AuthResponse>, Error, LoginData>({
    mutationFn: async (data) => {
      try {
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
          '/auth/login',
          data
        )
        return response.data
      } catch (error: unknown) {
        if (error && typeof error === 'object') {
          // Handle network errors
          if ('code' in error && error.code === 'ERR_NETWORK') {
            throw new Error('Cannot connect to server. Please make sure the backend is running on port 3000.')
          }
          // Handle axios response errors
          if ('response' in error) {
            const axiosError = error as { response?: { data?: { error?: string; message?: string } } }
            const errorMessage = axiosError.response?.data?.error || axiosError.response?.data?.message || 'Login failed'
            throw new Error(errorMessage)
          }
          // Handle Error objects
          if (error instanceof Error) {
            throw error
          }
        }
        throw new Error('An unexpected error occurred')
      }
    },
    onSuccess: (data) => {
      if (data.data?.token) {
        localStorage.setItem('authToken', data.data.token)
        queryClient.setQueryData(['currentUser'], { success: true, data: data.data.user })
      }
    },
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()

  return () => {
    localStorage.removeItem('authToken')
    queryClient.clear()
    window.location.href = '/login'
  }
}

export const useCurrentUser = () => {
  // Check token synchronously to avoid hydration issues
  const [hasToken, setHasToken] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('authToken')
    }
    return false
  })

  React.useEffect(() => {
    // Update token state when it changes
    const checkToken = () => {
      setHasToken(!!localStorage.getItem('authToken'))
    }
    checkToken()
    // Listen for storage changes (e.g., login/logout in another tab)
    window.addEventListener('storage', checkToken)
    return () => window.removeEventListener('storage', checkToken)
  }, [])
  
  return useQuery<ApiResponse<User>>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me')
      return response.data
    },
    enabled: hasToken,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - user data doesn't change often
  })
}

