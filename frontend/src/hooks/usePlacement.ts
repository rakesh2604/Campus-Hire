import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { ApiResponse } from '@/types'

interface EligibleStudent {
  id: string
  name: string
  email: string
  graduationYear?: string
  currentLocation?: string
  workExperience?: number
  profilePicture?: string
  resume?: string
  linkedin?: string
  github?: string
  batch: string
  activeApplications: number
  activePlacements: number
  selectedCount: number
  applications: Array<{
    id: string
    jobId: string
    job: {
      id: string
      title: string
      company: string
    }
    status: string
    currentRound: number
    totalRounds: number
    roundsCompleted: number
    rounds: Array<{
      roundNumber: number
      roundName: string
      status: string
      scheduledDate?: string
      completedDate?: string
      feedback?: string
      score?: number
    }>
  }>
}

interface PlacementData {
  batch: string
  stats: {
    totalStudents: number
    placed: number
    inProgress: number
    rejected: number
    onHold: number
    totalApplications: number
    pendingApplications: number
    shortlistedApplications: number
  }
  placements: Array<{
    id: string
    student: {
      id: string
      name: string
      email: string
      graduationYear?: string
    }
    job: {
      id: string
      title: string
      company: string
      location: string
    }
    status: string
    currentRound: number
    totalRounds: number
    rounds: Array<{
      roundNumber: number
      roundName: string
      status: string
      scheduledDate?: string
      completedDate?: string
      score?: number
    }>
    placementDate?: string
    offerDetails?: {
      ctc?: number
      joiningDate?: string
      location?: string
    }
    createdAt: string
  }>
  applications: Array<{
    id: string
    student: {
      id: string
      name: string
      email: string
    }
    job: {
      id: string
      title: string
      company: string
    }
    status: string
    currentRound: number
    totalRounds: number
    roundsCompleted: number
    createdAt: string
  }>
}

interface DashboardStats {
  totalStudents: number
  totalJobs: number
  totalApplications: number
  activePlacements: number
  selectedPlacements: number
  batchStats: Array<{
    batch: string
    students: number
    selected: number
    placementRate: string
  }>
}

interface Batch {
  batch: string
  students: number
  placements: number
  selected: number
  placementRate: string
}

interface UpdateRoundData {
  roundNumber: number
  status: 'pending' | 'scheduled' | 'completed' | 'passed' | 'failed'
  feedback?: string
  score?: number
  scheduledDate?: string
}

// Get placement dashboard stats
export const usePlacementDashboardStats = () => {
  return useQuery<ApiResponse<DashboardStats>>({
    queryKey: ['placement', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DashboardStats>>(
        '/placement/dashboard/stats'
      )
      return response.data
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  })
}

// Get all batches
export const useAllBatches = () => {
  return useQuery<ApiResponse<{ batches: Batch[] }>>({
    queryKey: ['placement', 'batches'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ batches: Batch[] }>>(
        '/placement/batches'
      )
      return response.data
    },
  })
}

// Get eligible students
export const useEligibleStudents = (params?: {
  batch?: string
  search?: string
  status?: 'placed' | 'active' | 'unplaced'
}) => {
  return useQuery<ApiResponse<{ students: EligibleStudent[]; total: number }>>({
    queryKey: ['placement', 'students', params],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ students: EligibleStudent[]; total: number }>>(
        '/placement/students',
        { params }
      )
      return response.data
    },
    refetchInterval: 30000, // Real-time updates
  })
}

// Get placement data by batch
export const usePlacementDataByBatch = (batch: string) => {
  return useQuery<ApiResponse<PlacementData>>({
    queryKey: ['placement', 'batch-data', batch],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<PlacementData>>(
        '/placement/batch-data',
        { params: { batch } }
      )
      return response.data
    },
    enabled: !!batch,
    refetchInterval: 30000, // Real-time updates
  })
}

// Update round status
export const useUpdateRoundStatus = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<{
      application: {
        id: string
        currentRound: number
        totalRounds: number
        status: string
        rounds: Array<{
          roundNumber: number
          roundName: string
          status: string
        }>
      }
    }>,
    Error,
    { applicationId: string; data: UpdateRoundData }
  >({
    mutationFn: async ({ applicationId, data }) => {
      const response = await apiClient.put<
        ApiResponse<{
          application: {
            id: string
            currentRound: number
            totalRounds: number
            status: string
            rounds: Array<{
              roundNumber: number
              roundName: string
              status: string
            }>
          }
        }>
      >(`/placement/applications/${applicationId}/rounds`, data)
      return response.data
    },
    onSuccess: () => {
      // Invalidate all placement-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['placement'] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['myApplications'] })
    },
  })
}

interface RegisterStudentData {
  name: string
  email: string
  password?: string
  graduationYear?: string
  currentLocation?: string
  workExperience?: number
  linkedin?: string
  github?: string
}

interface GenerateDummyStudentsData {
  count?: number
  batch?: string
}

interface CSVStudentData {
  name: string
  email: string
  password?: string
  graduationYear?: string
  currentLocation?: string
  workExperience?: number
  linkedin?: string
  github?: string
}

interface ImportCSVData {
  students: CSVStudentData[]
}

// Register student manually
export const useRegisterStudent = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<{
      student: {
        id: string
        name: string
        email: string
        graduationYear?: string
      }
    }>,
    Error,
    RegisterStudentData
  >({
    mutationFn: async (data) => {
      const response = await apiClient.post<
        ApiResponse<{
          student: {
            id: string
            name: string
            email: string
            graduationYear?: string
          }
        }>
      >('/placement/students/register', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', 'students'] })
      queryClient.invalidateQueries({ queryKey: ['placement', 'batches'] })
      queryClient.invalidateQueries({ queryKey: ['placement', 'dashboard'] })
    },
  })
}

// Generate dummy students
export const useGenerateDummyStudents = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<{
      students: Array<{
        id: string
        name: string
        email: string
        graduationYear?: string
      }>
      count: number
    }>,
    Error,
    GenerateDummyStudentsData
  >({
    mutationFn: async (data) => {
      const response = await apiClient.post<
        ApiResponse<{
          students: Array<{
            id: string
            name: string
            email: string
            graduationYear?: string
          }>
          count: number
        }>
      >('/placement/students/generate-dummy', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', 'students'] })
      queryClient.invalidateQueries({ queryKey: ['placement', 'batches'] })
      queryClient.invalidateQueries({ queryKey: ['placement', 'dashboard'] })
    },
  })
}

// Import students from CSV
export const useImportStudentsFromCSV = () => {
  const queryClient = useQueryClient()

  return useMutation<
    ApiResponse<{
      students: Array<{
        id: string
        name: string
        email: string
        graduationYear?: string
      }>
      count: number
      errors: string[]
    }>,
    Error,
    ImportCSVData
  >({
    mutationFn: async (data) => {
      const response = await apiClient.post<
        ApiResponse<{
          students: Array<{
            id: string
            name: string
            email: string
            graduationYear?: string
          }>
          count: number
          errors: string[]
        }>
      >('/placement/students/import-csv', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placement', 'students'] })
      queryClient.invalidateQueries({ queryKey: ['placement', 'batches'] })
      queryClient.invalidateQueries({ queryKey: ['placement', 'dashboard'] })
    },
  })
}

