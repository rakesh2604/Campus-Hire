import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse, Job } from '@/types'

interface CreateJobData {
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  salary?: {
    min: number
    max: number
    currency: string
  }
  requirements?: string[]
}

interface JobsResponse {
  jobs: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export const useJobs = (params?: {
  page?: number
  limit?: number
  type?: string
  location?: string
  search?: string
}) => {
  return useQuery<ApiResponse<JobsResponse>>({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<JobsResponse>>('/jobs', {
        params,
      })
      return response.data
    },
  })
}

export const useJob = (id: string) => {
  return useQuery<ApiResponse<Job>>({
    queryKey: ['job', id],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`)
      return response.data
    },
    enabled: !!id && id.trim() !== '',
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateJob = () => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<Job>, Error, CreateJobData>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<Job>>('/jobs', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export const useUpdateJob = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<Job>,
    Error,
    { id: string; data: Partial<CreateJobData> }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<ApiResponse<Job>>(
        `/jobs/${id}`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', variables.id] })
    },
  })
}

export const useDeleteJob = () => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<never>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<ApiResponse<never>>(
        `/jobs/${id}`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

