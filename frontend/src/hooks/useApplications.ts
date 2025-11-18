import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse, Application } from '@/types'

interface ApplyToJobData {
  resume?: string
  coverLetter?: string
}

interface ApplicationResponse {
  applications: Application[]
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
    },
  })
}

