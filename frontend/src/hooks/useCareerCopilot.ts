import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse } from '@/types'

interface SavedJob {
  id: string
  jobId: string
  job: {
    id: string
    title: string
    company: string
    location: string
  }
  status: string
  notes?: string
  appliedDate?: string
  createdAt: string
}

interface GenerateCoverLetterData {
  jobDescription: string
  jobTitle: string
  companyName: string
  resume?: string
}

interface SummarizeJobData {
  jobDescription: string
}

interface GenerateLinkedInPostData {
  topic: string
  tone?: string
  hashtags?: boolean
}

interface HiringCompany {
  company: string
  jobs: Array<{
    id: string
    title: string
    location: string
    type: string
  }>
  totalJobs: number
}

// Save job to tracker
export const useSaveJobToTracker = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<{
      id: string
      jobId: string
      status: string
      createdAt: string
    }>,
    Error,
    { jobId: string }
  >({
    mutationFn: async ({ jobId }) => {
      const response = await apiClient.post<
        ApiResponse<{
          id: string
          jobId: string
          status: string
          createdAt: string
        }>
      >('/career-copilot/tracker/save', { jobId })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobTracker'] })
    },
  })
}

// Get job tracker
export const useJobTracker = () => {
  return useQuery<ApiResponse<{ jobs: SavedJob[] }>>({
    queryKey: ['jobTracker'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ jobs: SavedJob[] }>>(
        '/career-copilot/tracker'
      )
      return response.data
    },
  })
}

// Generate Cover Letter
export const useGenerateCoverLetter = () => {
  return useMutation<
    ApiResponse<{ coverLetter: string }>,
    Error,
    GenerateCoverLetterData
  >({
    mutationFn: async (data) => {
      const response = await apiClient.post<
        ApiResponse<{ coverLetter: string }>
      >('/career-copilot/cover-letter', data)
      return response.data
    },
  })
}

// Summarize Job Description
export const useSummarizeJobDescription = () => {
  return useMutation<
    ApiResponse<{ summary: string }>,
    Error,
    SummarizeJobData
  >({
    mutationFn: async (data) => {
      const response = await apiClient.post<
        ApiResponse<{ summary: string }>
      >('/career-copilot/summarize-job', data)
      return response.data
    },
  })
}

// Generate LinkedIn Post
export const useGenerateLinkedInPost = () => {
  return useMutation<
    ApiResponse<{ post: string }>,
    Error,
    GenerateLinkedInPostData
  >({
    mutationFn: async (data) => {
      const response = await apiClient.post<
        ApiResponse<{ post: string }>
      >('/career-copilot/linkedin-post', data)
      return response.data
    },
  })
}

// LinkedIn Optimization
export const useOptimizeLinkedIn = () => {
  return useQuery<ApiResponse<{ optimization: string }>>({
    queryKey: ['linkedinOptimization'],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<{ optimization: string }>
      >('/career-copilot/linkedin-optimize')
      return response.data
    },
  })
}

// Find Who's Hiring
export const useFindWhoHiring = (params?: {
  location?: string
  role?: string
  industry?: string
}) => {
  return useQuery<
    ApiResponse<{ companies: HiringCompany[]; totalJobs: number }>
  >({
    queryKey: ['whoHiring', params],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiResponse<{ companies: HiringCompany[]; totalJobs: number }>
      >('/career-copilot/who-hiring', { params })
      return response.data
    },
  })
}

