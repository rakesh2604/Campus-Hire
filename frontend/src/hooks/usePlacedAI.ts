import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse } from '@/types'

export interface PlacedAIPlanItem {
  _id: string
  type: 'challenge' | 'contest' | 'assessment'
  referenceId: string
  title: string
  targetCount: number
  completedCount: number
  status: 'pending' | 'in_progress' | 'done'
}

export interface PlacedAIPlan {
  _id: string
  startDate: string
  endDate: string
  items: PlacedAIPlanItem[]
}

export interface PlacedAIUserGoalInput {
  targetRole: string
  targetCompanies: string[]
  targetTimelineWeeks: number
  intensity: 'light' | 'normal' | 'intense'
}

export const usePlacedAIPlan = () => {
  return useQuery<ApiResponse<PlacedAIPlan | null>>({
    queryKey: ['placedai', 'plan'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PlacedAIPlan | null>>('/placedai/plan/current')
      return response.data
    },
  })
}

export const usePlacedAIGoalMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (goal: PlacedAIUserGoalInput) => {
      await apiClient.post('/placedai/goal', goal)
      await apiClient.post('/placedai/plan/generate')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placedai', 'plan'] })
    },
  })
}

export const useUpdatePlacedAIItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { itemId: string; completedCount?: number; status?: 'pending' | 'in_progress' | 'done' }) => {
      await apiClient.patch(`/placedai/plan/item/${params.itemId}`, params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placedai', 'plan'] })
    },
  })
}


