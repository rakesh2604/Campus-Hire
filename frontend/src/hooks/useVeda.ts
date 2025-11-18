import { useMutation } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse } from '@/types'

interface ChatMessage {
  message: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  feature?: 'resume-review' | 'hr-questions' | 'company-prep' | 'role-suggestions' | 'ui-generate'
}

interface ChatResponse {
  message: string
  response: string
}

interface ResumeReviewResponse {
  review: string
}

interface HRQuestionsResponse {
  questions: string
}

interface CompanyPrepResponse {
  preparation: string
}

interface RoleSuggestionsResponse {
  suggestions: string
}

interface UIGenerateResponse {
  ui: string
}

export const useVedaChat = () => {
  return useMutation<ApiResponse<ChatResponse>, Error, ChatMessage>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<ChatResponse>>(
        '/veda/chat',
        data
      )
      return response.data
    },
  })
}

export const useResumeReview = () => {
  return useMutation<ApiResponse<ResumeReviewResponse>, Error, { resumeContent: string }>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<ResumeReviewResponse>>(
        '/veda/resume-review',
        data
      )
      return response.data
    },
  })
}

export const useHRQuestions = () => {
  return useMutation<ApiResponse<HRQuestionsResponse>, Error, { jobRole?: string; experienceLevel?: string; company?: string }>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<HRQuestionsResponse>>(
        '/veda/hr-questions',
        data
      )
      return response.data
    },
  })
}

export const useCompanyPrep = () => {
  return useMutation<ApiResponse<CompanyPrepResponse>, Error, { companyName: string; jobRole?: string }>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<CompanyPrepResponse>>(
        '/veda/company-prep',
        data
      )
      return response.data
    },
  })
}

export const useRoleSuggestions = () => {
  return useMutation<ApiResponse<RoleSuggestionsResponse>, Error, { jobRole: string }>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<RoleSuggestionsResponse>>(
        '/veda/role-suggestions',
        data
      )
      return response.data
    },
  })
}

export const useUIGenerate = () => {
  return useMutation<ApiResponse<UIGenerateResponse>, Error, { description: string; componentType?: string; techStack?: string }>({
    mutationFn: async (data) => {
      const response = await apiClient.post<ApiResponse<UIGenerateResponse>>(
        '/veda/ui-generate',
        data
      )
      return response.data
    },
  })
}
