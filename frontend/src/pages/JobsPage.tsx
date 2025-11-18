'use client'

import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMyApplications, useDismissJob, useApplyToJob } from '@/hooks/useApplications'
import { useJobs } from '@/hooks/useJobs'
import { useCurrentUser } from '@/hooks/useAuth'
import { Application, DismissedJob } from '@/types'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { showToast } from '@/utils/toast'

const titleCase = (value?: string) => {
  if (!value) return ''
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const formatExperienceRange = (range?: { minYears: number; minMonths: number; maxYears: number; maxMonths: number }) => {
  if (!range) return 'Fresher'
  const minYears = range.minYears ?? 0
  const minMonths = range.minMonths ?? 0
  const maxYears = range.maxYears ?? 0
  const maxMonths = range.maxMonths ?? 0

  if (minYears === 0 && minMonths === 0 && maxYears === 0 && maxMonths === 0) {
    return 'Fresher'
  }

  return `${minYears} Yrs ${minMonths} Mon - ${maxYears} Yrs ${maxMonths} Mon`
}

const formatSalary = (job: Application['job'] | any) => {
  if (job?.salaryText) return job.salaryText
  if (job?.salary?.min && job?.salary?.max) {
    const min = Math.round(job.salary.min / 100000)
    const max = Math.round(job.salary.max / 100000)
    if (min && max) {
      return min === max ? `${min} LPA` : `${min} - ${max} LPA`
    }
  }
  return 'Salary not specified'
}

const formatWorkMode = (workMode?: string) => {
  if (!workMode) return 'Office'
  return titleCase(workMode)
}

const formatExpiration = (date?: string) => {
  if (!date) return 'TBD'
  const formatted = new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return formatted
}

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F0FF] text-[#6A5AE0]">
    {children}
  </span>
)

const BriefcaseIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 6V5a3 3 0 013-3h4a3 3 0 013 3v1h1a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h1zm2-1v1h6V5a1 1 0 00-1-1h-4a1 1 0 00-1 1z" />
    <path d="M2 11h20v2H2z" />
  </svg>
)

const SparklesIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.45 4.47L18 7l-3.5 2.53L15 14l-3-2.18L9 14l.5-4.47L6 7l4.55-.53z" />
    <path d="M5 15l.9 2.76L9 18l-2.25 1.32L7.5 22 5 20.4 2.5 22l.75-2.68L1 18l3.1-.24z" />
    <path d="M19 13l.67 2.04L22 15l-1.8 1.16L20.5 18l-1.5-1.08L17.5 18l.3-1.84L16 15l2.33-.11z" />
  </svg>
)

const RupeeIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h12v2H6zM6 8h12v2H14.2l-2.72 3.2A6 6 0 0117 18H6v-2h5.4a4 4 0 00-3.76-4H6z" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a7 7 0 00-7 7c0 4.25 4.75 9.69 6.38 11.38a1 1 0 001.24 0C14.25 18.69 19 13.25 19 9a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 112.5-2.5 2.5 2.5 0 01-2.5 2.5z" />
  </svg>
)

const BuildingIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 3h9l7 6v12h-6v-6H8v6H4z" />
    <path d="M9 7h2v2H9zM9 11h2v2H9zM13 11h2v2h-2z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 11h4v2h-6V7h2z" />
  </svg>
)

const ExternalIcon = () => (
  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 3h7v7h-2V6.41l-8.3 8.3-1.4-1.42 8.3-8.3H14z" />
    <path d="M5 5h6V3H3v8h2z" />
    <path d="M5 11l1.41 1.41L5 13.83V19h5.17l1.42-1.41L13 19l-2 2H3v-8z" />
  </svg>
)

const ArrowIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)

export const JobsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: userData } = useCurrentUser()
  const user = userData?.data
  const [activeTab, setActiveTab] = React.useState<'matched' | 'applied' | 'ongoing' | 'closed'>('matched')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const [openDropdownJobId, setOpenDropdownJobId] = React.useState<string | null>(null)

  // Role helpers
  const isPlacementOrAdminOnly = user?.role === 'placement' || user?.role === 'admin'
  const isRecruiter = user?.role === 'recruiter'
  const isNonCandidateRole = isPlacementOrAdminOnly || isRecruiter

  // Mutations
  const dismissJobMutation = useDismissJob()
  const applyToJobMutation = useApplyToJob()

  // Fetch applications (only for candidates)
  const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError, refetch: refetchApplications } = useMyApplications({
    enabled: !isNonCandidateRole, // Only fetch for candidates
  })
  
  // Fetch all jobs for matched tab (we'll paginate after filtering)
  const jobView = isNonCandidateRole ? (isRecruiter ? 'recruiter' : 'placement') : 'candidate'

  const { data: jobsData, isLoading: jobsLoading, error: jobsError, refetch: refetchJobs } = useJobs({
    page: 1,
    limit: 100, // Fetch more jobs to filter for matched tab
    view: jobView,
  })

  // Get all applications with job details (only for candidates)
  const applications: Application[] = useMemo(() => {
    if (isNonCandidateRole || !applicationsData?.data?.applications) return []
    return applicationsData.data.applications
  }, [applicationsData, isNonCandidateRole])

  const dismissedJobs = useMemo(() => {
    if (isNonCandidateRole || !applicationsData?.data?.dismissedJobs) return []
    return applicationsData.data.dismissedJobs
  }, [applicationsData, isNonCandidateRole])

  // Filter applications by status (only for candidates)
  const filteredApplications = useMemo(() => {
    if (isNonCandidateRole) return []
    switch (activeTab) {
      case 'applied':
        return applications.filter((app) => app.status === 'pending')
      case 'ongoing':
        return applications.filter(
          (app) => app.status === 'reviewed' || app.status === 'shortlisted'
        )
      case 'closed':
        return [
          ...applications.filter(
            (app) => app.status === 'rejected' || app.status === 'accepted'
          ),
          ...dismissedJobs.map((job) => ({ ...job, __type: 'dismissed' as const })),
        ]
      default:
        return []
    }
  }, [applications, dismissedJobs, activeTab, isNonCandidateRole])

  // Get matched jobs - for candidates, show all matching jobs (applied or not)
  // If applied, we'll show the application status in real-time
  const matchedJobs = useMemo(() => {
    if (!jobsData?.data?.jobs) return []
    if (isNonCandidateRole) {
      // For placement team, show all jobs
      return jobsData.data.jobs
    }
    // For candidates, show all matched jobs (whether applied or not)
    // This allows students to see their application status in real-time
    return jobsData.data.jobs
  }, [jobsData, isNonCandidateRole])

  // Create a map of jobId to application for quick lookup
  const jobToApplicationMap = useMemo(() => {
    if (isNonCandidateRole) return new Map<string, Application>()
    const map = new Map<string, Application>()
    applications.forEach((app) => {
      map.set(app.jobId, app)
    })
    return map
  }, [applications, isNonCandidateRole])

  // Calculate counts for each tab
  const tabCounts = useMemo(() => {
    if (isNonCandidateRole) {
      // For placement team, only show "matched" (all jobs)
      return {
        matched: matchedJobs.length,
        applied: 0,
        ongoing: 0,
        closed: 0,
      }
    }
    return {
      matched: matchedJobs.length,
      applied: applications.filter((app) => app.status === 'pending').length,
      ongoing: applications.filter(
        (app) => app.status === 'reviewed' || app.status === 'shortlisted'
      ).length,
      closed:
        applications.filter(
          (app) => app.status === 'rejected' || app.status === 'accepted'
        ).length + dismissedJobs.length,
    }
  }, [applications, dismissedJobs, matchedJobs, isNonCandidateRole])

  // Get current page data
  const currentPageData = useMemo(() => {
    const data = activeTab === 'matched' ? matchedJobs : filteredApplications
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }, [activeTab, matchedJobs, filteredApplications, currentPage])

  const totalPages = useMemo(() => {
    const total = activeTab === 'matched' ? matchedJobs.length : filteredApplications.length
    return Math.ceil(total / itemsPerPage)
  }, [activeTab, matchedJobs.length, filteredApplications.length])

  React.useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1)
      return
    }
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleOkGotIt = () => {
    navigate('/dashboard')
  }

  const handleApplyClick = (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    e.stopPropagation()
    // Navigate to job detail page where they can apply
    navigate(`/jobs/${jobId}`)
  }

  const notInterestedReasons = [
    'Salary too low',
    'Location not suitable',
    'Not a good fit for my skills',
    'Company culture mismatch',
    'Work mode not preferred',
    'Bond agreement concerns',
    'Other reason',
  ]

  const handleNotInterestedClick = (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    e.stopPropagation()
    // Toggle dropdown
    setOpenDropdownJobId(openDropdownJobId === jobId ? null : jobId)
  }

  const handleReasonSelect = async (jobId: string, reason: string) => {
    // Close dropdown first
    setOpenDropdownJobId(null)
    
    // If "Other reason" is selected, prompt for custom reason
    let finalReason: string | undefined = reason
    if (reason === 'Other reason') {
      const customReason = window.prompt('Please specify your reason (optional):', '')
      if (customReason === null) {
        // User cancelled, don't proceed
        return
      }
      finalReason = customReason.trim() || undefined
    }

    try {
      await dismissJobMutation.mutateAsync({ jobId, reason: finalReason })
      showToast('Job marked as not interested', 'success')
      // Refetch jobs to update the list
      refetchJobs()
      refetchApplications()
      if (activeTab !== 'closed') {
        setActiveTab('closed')
        setCurrentPage(1)
      }
    } catch (error) {
      showToast('Failed to mark job as not interested', 'error')
    }
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.not-interested-dropdown')) {
        setOpenDropdownJobId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'reviewed':
      return 'Resume Accepted'
    case 'shortlisted':
      return 'Interview Scheduled'
    case 'accepted':
      return 'Offer Received'
    case 'rejected':
      return 'Not Selected'
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

const getStatusPillStyles = (status: string) => {
  switch (status) {
    case 'pending':
      return 'border border-[#FFE3A3] bg-[#FFF7E0] text-[#9C6200]'
    case 'reviewed':
      return 'border border-[#DAD7FF] bg-[#F3F2FF] text-[#4C3DB5]'
    case 'shortlisted':
      return 'border border-[#CFE8FF] bg-[#E8F4FF] text-[#0F62A4]'
    case 'accepted':
      return 'border border-[#BBF1D0] bg-[#E9F9F1] text-[#117C42]'
    case 'rejected':
      return 'border border-[#FFC6C5] bg-[#FFF0F0] text-[#B42318]'
    default:
      return 'border border-gray-200 bg-gray-50 text-gray-600'
  }
}

const getJobStatusLabel = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Active'
    case 'closed':
      return 'Closed'
    case 'draft':
      return 'Draft'
    default:
      return 'Active'
  }
}

const getJobStatusPillStyles = (status?: string) => {
  switch (status) {
    case 'active':
      return 'border border-[#C8F5D3] bg-[#EDFDF2] text-[#0E8F4B]'
    case 'closed':
      return 'border border-[#FFD7D7] bg-[#FFF1F0] text-[#B42318]'
    case 'draft':
      return 'border border-[#E0E7FF] bg-[#F3F6FF] text-[#3B4CCA]'
    default:
      return 'border border-gray-200 bg-gray-50 text-gray-700'
  }
}

  // Only show loading if we're actually waiting for data
  // Don't show loading if queries are disabled (e.g., no auth token)
  const isLoading = 
    (activeTab === 'matched' && jobsLoading) || 
    (!isNonCandidateRole && applicationsLoading && user) // Only show app loading if user is logged in
  const hasError = (!isNonCandidateRole && applicationsError) || jobsError

  if (hasError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load data</h2>
          <p className="text-gray-600 mb-4">
            {applicationsError instanceof Error 
              ? applicationsError.message 
              : jobsError instanceof Error
              ? jobsError.message
              : 'An error occurred while loading data. Please check your connection and try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonLoader variant="text" lines={1} className="mb-6 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLoader key={i} variant="card" className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show different tabs based on user role
  const tabs = isNonCandidateRole
    ? [
        { id: 'matched' as const, label: isRecruiter ? 'My Jobs' : 'All Jobs', count: tabCounts.matched },
      ]
    : [
        { id: 'matched' as const, label: 'Matched', count: tabCounts.matched },
        { id: 'applied' as const, label: 'Applied', count: tabCounts.applied },
        { id: 'ongoing' as const, label: 'Ongoing', count: tabCounts.ongoing },
        { id: 'closed' as const, label: 'Closed', count: tabCounts.closed },
      ]

  const hasData = currentPageData.length > 0

  const formatTimelineDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getCompanyInitial = (company?: string) => {
    if (!company) return 'J'
    return company.trim().charAt(0).toUpperCase() || 'J'
  }

  const primaryCtaLabel = isNonCandidateRole ? (isRecruiter ? 'Manage Job' : 'View Job') : 'Apply'

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-gray-600">
            <Link to="/dashboard" className="hover:text-gray-900">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">
              {isNonCandidateRole ? 'Job Listings' : 'Applications'}
            </span>
          </nav>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Page Title */}
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Applications</p>
            <h1 className="text-3xl font-semibold text-gray-900">
              {isNonCandidateRole ? 'Job Listings' : 'Jobs'}
            </h1>
          </div>

        {/* Tabs and Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              disabled={!hasData || currentPage === 1}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                !hasData || currentPage === 1
                  ? 'border-gray-100 text-gray-300'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!hasData || currentPage >= totalPages}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                !hasData || currentPage >= totalPages
                  ? 'border-gray-100 text-gray-300'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              Next
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs and Navigation */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          {/* Tabs */}
          <div className="flex space-x-8 border-b border-gray-200 text-sm font-semibold">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setCurrentPage(1)
                }}
                className={`relative pb-3 transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#6E59F6]'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#6E59F6]" />
                )}
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-500">
            {hasData ? `Showing ${currentPageData.length} of ${activeTab === 'matched' ? matchedJobs.length : filteredApplications.length} jobs` : 'No jobs to display'}
          </div>
        </div>

        {/* Job Cards */}
        {!isLoading && hasData && (
          <div className="space-y-4 relative">
            {currentPageData.map((item: Application | any, index: number) => {
              const isDismissed = activeTab === 'closed' && (item as any)?.__type === 'dismissed'
              // For matched tab, item is a Job object
              // For other tabs, item is an Application object unless it's a dismissed entry
              const isApplication = !isDismissed && activeTab !== 'matched' && 'status' in item
              const dismissedInfo = isDismissed ? (item as DismissedJob & { __type: 'dismissed' }) : null
              const job = isApplication
                ? (item as Application).job
                : dismissedInfo
                ? dismissedInfo.job
                : item
              const application = isApplication
                ? (item as Application)
                : (activeTab === 'matched' && !isNonCandidateRole
                    ? jobToApplicationMap.get(item.id)
                    : null)

              if (!job) return null
              
              // Get the job ID - prioritize job.id from populated object, then application.jobId
              let jobIdForNavigation: string = ''
              
              if (isApplication) {
                const app = item as Application
                // Prioritize job.id from populated job object (most reliable)
                if (job && (job as any)?.id) {
                  jobIdForNavigation = String((job as any).id).trim()
                } else if (job && (job as any)?._id) {
                  jobIdForNavigation = String((job as any)._id).trim()
                } else if (app.jobId) {
                  // Fallback to application.jobId
                  jobIdForNavigation = String(app.jobId).trim()
                }
              } else if (dismissedInfo) {
                jobIdForNavigation = String(dismissedInfo.job.id || '').trim()
              } else {
                // For matched tab, job is the item itself
                jobIdForNavigation = String(job.id || (job as any)?._id?.toString() || '').trim()
              }
              
              // Validate ObjectId format (24 hex characters)
              const isValidObjectId = jobIdForNavigation && /^[0-9a-fA-F]{24}$/.test(jobIdForNavigation)
              
              if (!jobIdForNavigation || !isValidObjectId) {
                console.warn('Invalid or missing job ID for navigation:', {
                  jobIdForNavigation,
                  isApplication,
                  applicationJobId: isApplication ? (item as Application).jobId : null,
                  jobId: job.id || (job as any)?._id,
                  jobObject: job,
                  item,
                })
                return null
              }

              const jobHighlights = [
                {
                  key: 'type',
                  icon: <BriefcaseIcon />,
                  label: titleCase(job.type) || 'Full-Time',
                },
                {
                  key: 'experience',
                  icon: <SparklesIcon />,
                  label: formatExperienceRange(job.experienceRange),
                },
                {
                  key: 'salary',
                  icon: <RupeeIcon />,
                  label: formatSalary(job),
                },
                {
                  key: 'location',
                  icon: <MapPinIcon />,
                  label: job.location || 'Location not specified',
                },
                {
                  key: 'mode',
                  icon: <BuildingIcon />,
                  label: formatWorkMode(job.workMode),
                },
              ]

              const expiresAt = formatExpiration(job.updatedAt || job.createdAt)

              const statusLabelText = !isNonCandidateRole
                ? application
                  ? getStatusLabel(application.status)
                  : dismissedInfo
                  ? 'Not Interested'
                  : null
                : null

              const statusBadgeClass = application
                ? getStatusBadgeColor(application.status)
                : 'bg-rose-100 text-rose-800'

              const statusPillClass = application
                ? getStatusPillStyles(application.status)
                : 'border border-[#FFC6C5] bg-[#FFF0F0] text-[#B42318]'

              return (
                <div
                  key={isApplication ? (item as Application).id : job.id}
                  className={`block rounded-3xl border border-[#E4E7EC] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg relative ${openDropdownJobId === job.id ? 'z-20' : 'z-auto'}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div className="flex flex-1 items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F0FF] text-lg font-semibold text-[#6E59F6]">
                          {getCompanyInitial(job.company)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {job.title || 'Job Title'}
                            </h3>
                            {!isNonCandidateRole && statusLabelText && (
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass}`}
                              >
                                {statusLabelText}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{job.company || 'Company Name'}</span>
                            <ExternalIcon />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 text-right">
                        {!isNonCandidateRole && statusLabelText && (
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass}`}
                          >
                            {statusLabelText}
                          </span>
                        )}
                        {isNonCandidateRole && (
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getJobStatusPillStyles(
                              job.status
                            )}`}
                          >
                            {getJobStatusLabel(job.status)}
                          </span>
                        )}
                        <div className="text-right">
                          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Expires at
                          </span>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-amber-500">
                              <ClockIcon />
                            </span>
                            <span className="font-medium text-gray-900">{expiresAt}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {jobHighlights.map((highlight, highlightIndex) => (
                        <React.Fragment key={highlight.key}>
                          <span className="flex items-center gap-2 text-gray-700">
                            <IconWrapper>{highlight.icon}</IconWrapper>
                            {highlight.label}
                          </span>
                          {highlightIndex < jobHighlights.length - 1 && (
                            <span className="text-gray-300">•</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {!isNonCandidateRole && application && (
                      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        <div className="flex flex-wrap gap-6">
                          <span className="font-medium text-gray-700">
                            Applied: {formatTimelineDate(application.createdAt)}
                          </span>
                          {application.updatedAt !== application.createdAt && (
                            <span>Updated: {formatTimelineDate(application.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {dismissedInfo && (
                      <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <div className="flex flex-col gap-2">
                          <span className="font-medium">
                            You marked this job as not interested on {formatTimelineDate(dismissedInfo.dismissedAt)}
                          </span>
                          {dismissedInfo.reason && dismissedInfo.reason.trim().length > 0 && (
                            <span className="text-rose-600">
                              Reason: {dismissedInfo.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={(e) => {
                            const safeJobId = String(job.id || (job as any)?._id?.toString() || jobIdForNavigation || '').trim()
                            if (safeJobId && /^[0-9a-fA-F]{24}$/.test(safeJobId)) {
                              handleApplyClick(e, safeJobId)
                            } else {
                              console.warn('Invalid job ID for apply click:', { jobId: job.id, jobIdForNavigation, job })
                            }
                          }}
                          className="inline-flex min-w-[110px] items-center justify-center rounded-xl bg-[#6E59F6] px-6 py-2 text-sm font-semibold text-white shadow-inner shadow-[#5d4ad5]/30 hover:bg-[#5d4ad5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={applyToJobMutation.isPending || (application !== null && !isNonCandidateRole)}
                        >
                          {applyToJobMutation.isPending 
                            ? 'Loading...' 
                            : application && !isNonCandidateRole 
                              ? 'Applied' 
                              : primaryCtaLabel}
                        </button>
                        {activeTab === 'matched' && !isNonCandidateRole && (
                          <div className="relative not-interested-dropdown" style={{ zIndex: openDropdownJobId === job.id ? 1000 : 'auto' }}>
                            <button
                              onClick={(e) => {
                                const safeJobId = String(job.id || (job as any)?._id?.toString() || jobIdForNavigation || '').trim()
                                if (safeJobId && /^[0-9a-fA-F]{24}$/.test(safeJobId)) {
                                  handleNotInterestedClick(e, safeJobId)
                                } else {
                                  console.warn('Invalid job ID for dismiss click:', { jobId: job.id, jobIdForNavigation, job })
                                }
                              }}
                              className="inline-flex min-w-[130px] items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                              disabled={dismissJobMutation.isPending}
                            >
                              {dismissJobMutation.isPending ? 'Loading...' : 'Not Interested'}
                              <svg
                                className={`ml-2 h-4 w-4 transition-transform ${openDropdownJobId === job.id ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {openDropdownJobId === job.id && (
                              <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden" style={{ zIndex: 1001 }}>
                                <div className="py-2">
                                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                                    Select a reason
                                  </div>
                                  {notInterestedReasons.map((reason, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        const safeJobId = String(job.id || (job as any)?._id?.toString() || jobIdForNavigation || '').trim()
                                        if (safeJobId && /^[0-9a-fA-F]{24}$/.test(safeJobId)) {
                                          handleReasonSelect(safeJobId, reason)
                                        } else {
                                          console.warn('Invalid job ID for reason select:', { jobId: job.id, jobIdForNavigation, job })
                                        }
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      {reason}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <Link
                        to={`/jobs/${jobIdForNavigation}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1F0FF] text-[#6E59F6] hover:bg-[#E8E4FF] transition-colors"
                        title="View job details"
                        onClick={(e) => {
                          // Ensure navigation works even if parent has click handlers
                          e.stopPropagation()
                          
                          if (!jobIdForNavigation || !/^[0-9a-fA-F]{24}$/.test(jobIdForNavigation)) {
                            e.preventDefault()
                            showToast('Invalid job ID. Please refresh the page.', 'error')
                            return
                          }
                        }}
                      >
                        <ArrowIcon />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasData && (
          <div className="flex flex-col items-center justify-center py-20">
            {/* Illustration - Stacked Job Cards */}
            <div className="relative mb-8">
              <div className="w-32 h-40 relative">
                {/* Bottom card */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-32 bg-blue-500 rounded-lg shadow-lg opacity-60"></div>
                {/* Middle card */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-32 bg-blue-600 rounded-lg shadow-lg opacity-80"></div>
                {/* Top card with notification */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-32 bg-blue-700 rounded-lg shadow-xl relative">
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  <div className="p-3 text-white text-xs">
                    <div className="h-2 bg-white/30 rounded mb-2"></div>
                    <div className="h-2 bg-white/30 rounded mb-2 w-3/4"></div>
                    <div className="h-2 bg-white/30 rounded mb-3"></div>
                    <div className="h-6 bg-white/40 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message */}
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {isNonCandidateRole
                ? 'No jobs found'
                : activeTab === 'matched'
                ? 'No matched jobs yet'
                : activeTab === 'applied'
                ? 'No applications yet'
                : activeTab === 'ongoing'
                ? 'No ongoing applications'
                : 'No closed applications'}
            </h2>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              {isNonCandidateRole
                ? 'There are no active job listings at the moment.'
                : activeTab === 'matched'
                ? 'Complete your profile and technical rounds to see matched jobs here.'
                : activeTab === 'applied'
                ? 'To apply, elevate your Level by successfully completing technical round first.'
                : activeTab === 'ongoing'
                ? 'Applications that are being reviewed will appear here.'
                : 'Applications that have been accepted or rejected will appear here.'}
            </p>

            {/* CTA Button */}
            <button
              onClick={handleOkGotIt}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Ok, Got it!
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {hasData && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Page {currentPage} of {totalPages} ({activeTab === 'matched' ? matchedJobs.length : filteredApplications.length} total)
          </div>
        )}
      </div>
    </div>
  )
}

export default JobsPage