// Shared types between frontend and backend
export interface User {
  id: string
  email: string
  name: string
  role: 'candidate' | 'recruiter' | 'admin' | 'placement'
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
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  workMode?: 'office' | 'remote' | 'hybrid'
  hasBondAgreement?: boolean
  bondDetails?: string
  status: 'active' | 'closed' | 'draft'
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
  responsibilities?: string[]
  keyQualifications?: string[]
  teamEnvironment?: string[]
  companyCulture?: string[]
  requirements: string[]
  postedBy: string
  createdAt: string
  updatedAt: string
}

export interface DismissedJob {
  id: string
  job: Job
  reason?: string
  dismissedAt: string
}

export interface Application {
  id: string
  jobId: string
  candidateId: string
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'
  resume?: string
  coverLetter?: string
  rounds?: Array<{
    roundNumber: number
    roundName: string
    status: 'pending' | 'scheduled' | 'completed' | 'passed' | 'failed'
    scheduledDate?: string
    completedDate?: string
    feedback?: string
    score?: number
  }>
  currentRound?: number
  totalRounds?: number
  job?: {
    id: string
    title: string
    company: string
    location: string
  }
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
}

