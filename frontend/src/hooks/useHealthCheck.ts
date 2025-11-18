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
      const response = await apiClient.get<ApiResponse<HealthResponse>>('/health')
      return response.data
    },
  })
}

