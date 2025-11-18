import { useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse, User } from '@/types'

interface UpdateProfileData {
  name?: string
  email?: string
  password?: string
  workExperience?: number
  graduationYear?: string
  currentLocation?: string
  description?: string
  portfolioLink?: string
  availableToJoin?: string
  preferredLocations?: string[]
  companyType?: string[]
  linkedin?: string
  github?: string
  currentCTC?: number
  desiredCTCMin?: number
  desiredCTCMax?: number
  profilePicture?: string
  resume?: string
  workExperiences?: Array<{
    title: string
    company: string
    location?: string
    duration?: string
    description: string
    startDate?: string
    endDate?: string
  }>
  projects?: Array<{
    name: string
    description: string
    link?: string
    technologies?: string[]
  }>
  educations?: Array<{
    degree: string
    institution: string
    location?: string
    startDate?: string
    endDate?: string
    fieldOfStudy?: string
  }>
  certificates?: Array<{
    name: string
    issuer: string
    date: string
    link?: string
  }>
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<User>, Error, UpdateProfileData>({
    mutationFn: async (data) => {
      const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data)
      return response.data
    },
    onSuccess: (data) => {
      if (data.data) {
        queryClient.setQueryData(['currentUser'], { success: true, data: data.data })
        // Update profile picture in localStorage if provided
        if (data.data.profilePicture) {
          localStorage.setItem('profilePicture', data.data.profilePicture)
          window.dispatchEvent(new Event('profilePictureUpdated'))
        }
      }
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    },
  })
}

