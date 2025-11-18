import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse, Job } from '@/types'

export interface CreateJobData {
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  workMode?: 'office' | 'remote' | 'hybrid'
  hasBondAgreement?: boolean
  bondDetails?: string
  salary?: {
    min: number
    max: number
    currency: string
  }
  salaryText?: string
  experienceLevel?: string
  experienceRange?: {
    minYears: number
    minMonths: number
    maxYears: number
    maxMonths: number
  }
  aboutCompany?: string
  requirements?: string[]
  responsibilities?: string[]
  keyQualifications?: string[]
  teamEnvironment?: string[]
  companyCulture?: string[]
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
  view?: 'candidate' | 'recruiter' | 'placement'
  status?: string
}) => {
  return useQuery<ApiResponse<JobsResponse>>({
    queryKey: ['jobs', params],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiResponse<JobsResponse>>('/jobs', {
          params,
          timeout: 10000, // 10 second timeout
        })
        
        // Validate response structure
        if (!response.data) {
          throw new Error('Invalid response format: missing data')
        }
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch jobs')
        }
        
        return response.data
      } catch (error: any) {
        // Error logged for debugging
        throw error
      }
    },
    refetchOnWindowFocus: true, // Refetch when window regains focus
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2, // Retry up to 2 times on failure
    retryDelay: 1000, // Wait 1 second between retries
  })
}

export const useJob = (id: string) => {
  return useQuery<ApiResponse<Job>>({
    queryKey: ['job', id],
    queryFn: async () => {
      try {
        if (!id || id.trim() === '') {
          throw new Error('Job ID is required')
        }
        
        const response = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`, {
          timeout: 10000, // 10 second timeout
        })
        
        // Validate response structure
        if (!response.data) {
          throw new Error('Invalid response format: missing data')
        }
        
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch job')
        }
        
        return response.data
      } catch (error: any) {
        throw error
      }
    },
    enabled: !!id && id.trim() !== '',
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch on mount to ensure fresh data
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2, // Retry up to 2 times on failure
    retryDelay: 1000, // Wait 1 second between retries
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

