import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse, Application, DismissedJob } from '@/types'

interface ApplyToJobData {
  resume?: string
  coverLetter?: string
}

interface ApplicationWithCandidate extends Application {
  candidate?: {
    id: string
    name: string
    email: string
  }
}

interface ApplicationResponse {
  applications: ApplicationWithCandidate[]
  dismissedJobs?: DismissedJob[]
}

export const useApplyToJob = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<Application>,
    Error,
    { jobId: string; data: ApplyToJobData }
  >({
    mutationFn: async ({ jobId, data }) => {
      const response = await apiClient.post<ApiResponse<Application>>(
        `/applications/jobs/${jobId}/apply`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApplications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job'] })
    },
  })
}

export const useMyApplications = (options?: { enabled?: boolean }) => {
  return useQuery<ApiResponse<ApplicationResponse>>({
    queryKey: ['myApplications'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ApplicationResponse>>(
        '/applications/my-applications'
      )
      return response.data
    },
    enabled: options?.enabled !== false, // Default to true if not specified
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Consider data stale after 10 seconds
  })
}

export const useJobApplications = (jobId: string) => {
  return useQuery<ApiResponse<ApplicationResponse>>({
    queryKey: ['jobApplications', jobId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ApplicationResponse>>(
        `/applications/jobs/${jobId}/applications`
      )
      return response.data
    },
    enabled: !!jobId && jobId.trim() !== '',
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<Application>,
    Error,
    { id: string; status: string }
  >({
    mutationFn: async ({ id, status }) => {
      const response = await apiClient.put<ApiResponse<Application>>(
        `/applications/${id}/status`,
        { status }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] })
      queryClient.invalidateQueries({ queryKey: ['myApplications'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export const useDismissJob = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<{ message: string }>,
    Error,
    { jobId: string; reason?: string }
  >({
    mutationFn: async ({ jobId, reason }) => {
      const response = await apiClient.post<ApiResponse<{ message: string }>>(
        `/applications/jobs/${jobId}/dismiss`,
        { reason }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['myApplications'] })
    },
  })
}

