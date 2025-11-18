import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse } from '@/types'

interface HealthResponse {
  status: string
}

export const useHealthCheck = () => {
  return useQuery<ApiResponse<HealthResponse>>({
    queryKey: ['health'],
    queryFn: async () => {
      // Health endpoint is at /api/health, not /api/v1/health
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
      const response = await fetch(`${baseURL}/api/health`)
      const data = await response.json()
      return data
    },
  })
}

