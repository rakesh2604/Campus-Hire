'use client'

import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMyApplications } from '@/hooks/useApplications'
import { useJobs } from '@/hooks/useJobs'
import { useCurrentUser } from '@/hooks/useAuth'
import { Application } from '@/types'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'

export const JobsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: userData } = useCurrentUser()
  const user = userData?.data
  const [activeTab, setActiveTab] = React.useState<'matched' | 'applied' | 'ongoing' | 'closed'>('matched')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10

  // For placement team, admin, and recruiters, show all jobs without application filtering
  const isPlacementOrAdmin = user?.role === 'placement' || user?.role === 'admin' || user?.role === 'recruiter'

  // Fetch applications (only for candidates)
  const { data: applicationsData, isLoading: applicationsLoading, error: applicationsError } = useMyApplications({
    enabled: !isPlacementOrAdmin, // Only fetch for candidates
  })
  
  // Fetch all jobs for matched tab (we'll paginate after filtering)
  const { data: jobsData, isLoading: jobsLoading } = useJobs({
    page: 1,
    limit: 100, // Fetch more jobs to filter for matched tab
  })

  // Get all applications with job details (only for candidates)
  const applications: Application[] = useMemo(() => {
    if (isPlacementOrAdmin || !applicationsData?.data?.applications) return []
    return applicationsData.data.applications
  }, [applicationsData, isPlacementOrAdmin])

  // Get applied job IDs (only for candidates)
  const appliedJobIds = useMemo(() => {
    if (isPlacementOrAdmin) return new Set()
    return new Set(applications.map((app) => app.jobId))
  }, [applications, isPlacementOrAdmin])

  // Filter applications by status (only for candidates)
  const filteredApplications = useMemo(() => {
    if (isPlacementOrAdmin) return []
    switch (activeTab) {
      case 'applied':
        return applications
      case 'ongoing':
        return applications.filter((app) => 
          app.status === 'reviewed' || app.status === 'shortlisted'
        )
      case 'closed':
        return applications.filter((app) => 
          app.status === 'rejected' || app.status === 'accepted'
        )
      default:
        return []
    }
  }, [applications, activeTab, isPlacementOrAdmin])

  // Get matched jobs (jobs user hasn't applied to, or all jobs for placement/admin)
  const matchedJobs = useMemo(() => {
    if (!jobsData?.data?.jobs) return []
    if (isPlacementOrAdmin) {
      // For placement team, show all jobs
      return jobsData.data.jobs
    }
    return jobsData.data.jobs.filter((job) => !appliedJobIds.has(job.id))
  }, [jobsData, appliedJobIds, isPlacementOrAdmin])

  // Calculate counts for each tab
  const tabCounts = useMemo(() => {
    if (isPlacementOrAdmin) {
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
      applied: applications.length,
      ongoing: applications.filter((app) => 
        app.status === 'reviewed' || app.status === 'shortlisted'
      ).length,
      closed: applications.filter((app) => 
        app.status === 'rejected' || app.status === 'accepted'
      ).length,
    }
  }, [applications, matchedJobs, isPlacementOrAdmin])

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

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

  const isLoading = (!isPlacementOrAdmin && applicationsLoading) || (activeTab === 'matched' && jobsLoading)
  const hasError = !isPlacementOrAdmin && applicationsError

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
            {applicationsError instanceof Error ? applicationsError.message : 'An error occurred while loading applications.'}
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
  const tabs = isPlacementOrAdmin
    ? [
        { id: 'matched' as const, label: 'All Jobs', count: tabCounts.matched },
      ]
    : [
        { id: 'matched' as const, label: 'Matched', count: tabCounts.matched },
        { id: 'applied' as const, label: 'Applied', count: tabCounts.applied },
        { id: 'ongoing' as const, label: 'Ongoing', count: tabCounts.ongoing },
        { id: 'closed' as const, label: 'Closed', count: tabCounts.closed },
      ]

  const hasData = currentPageData.length > 0

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="text-sm text-gray-600">
            <Link to="/dashboard" className="hover:text-gray-900">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">
              {isPlacementOrAdmin ? 'Job Listings' : 'Applications'}
            </span>
          </nav>
        </div>

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isPlacementOrAdmin ? 'Job Listings' : 'Jobs'}
        </h1>

        {/* Tabs and Navigation */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          {/* Tabs */}
          <div className="flex space-x-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setCurrentPage(1)
                }}
                className={`pb-3 px-1 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Previous/Next Buttons */}
          {hasData && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className={`px-4 py-2 rounded transition-colors ${
                  currentPage >= totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Job Cards */}
        {!isLoading && hasData && (
          <div className="space-y-4">
            {currentPageData.map((item: Application | any, index: number) => {
              const isApplication = 'status' in item
              const job = isApplication ? (item as Application).job : item
              const application = isApplication ? (item as Application) : null

              if (!job) return null

              return (
                <Link
                  key={isApplication ? (item as Application).id : item.id}
                  to={isApplication ? `/jobs/${(item as Application).jobId}` : `/jobs/${item.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-6 hover-lift card-enter transition-smooth"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {job.title || 'Job Title'}
                        </h3>
                        {/* Only show application status for candidates */}
                        {!isPlacementOrAdmin && application && (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                              application.status
                            )}`}
                          >
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{job.company || 'Company Name'}</p>
                      <p className="text-sm text-gray-500 mb-4">{job.location || 'Location'}</p>
                      {/* Only show application dates for candidates */}
                      {!isPlacementOrAdmin && application && (
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Applied: {formatDate(application.createdAt)}</span>
                          {application.updatedAt !== application.createdAt && (
                            <span>Updated: {formatDate(application.updatedAt)}</span>
                          )}
                        </div>
                      )}
                      {/* Show different message based on role */}
                      {!application && (
                        <div className="text-sm text-gray-500">
                          {isPlacementOrAdmin
                            ? 'Click to view job details and manage applications'
                            : 'Click to view details and apply'}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
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
              {isPlacementOrAdmin
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
              {isPlacementOrAdmin
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
