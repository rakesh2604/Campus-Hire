'use client'

import React from 'react'
import { useParams } from 'react-router-dom'
import { useJobApplications, useUpdateApplicationStatus } from '@/hooks/useApplications'
import { useJob } from '@/hooks/useJobs'
import { useCurrentUser } from '@/hooks/useAuth'
import { Button } from '@/components/common/Button'
import { showToast } from '@/utils/toast'
import { Application } from '@/types'

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    accepted: 'bg-emerald-100 text-emerald-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export const JobApplicationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const jobId = id || ''
  
  // Only fetch if we have a valid jobId
  const { data: jobData, isLoading: jobLoading, isError: jobError } = useJob(jobId)
  const { data: applicationsData, isLoading: applicationsLoading, isError: applicationsError } = useJobApplications(jobId)
  const { data: userData, isLoading: userLoading } = useCurrentUser()
  const updateStatus = useUpdateApplicationStatus()
  
  // Early return if no jobId to prevent unnecessary renders
  if (!jobId || jobId.trim() === '') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Job ID</h2>
          <p className="text-gray-600">Please select a valid job</p>
        </div>
      </div>
    )
  }

  const job = jobData?.data
  const applications = applicationsData?.data?.applications || []
  const user = userData?.data
  const isLoading = jobLoading || applicationsLoading || userLoading

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: applicationId, status: newStatus })
      showToast('Application status updated successfully', 'success')
    } catch (error) {
      showToast('Failed to update application status', 'error')
    }
  }

  // Show loading while checking user
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  // Allow recruiters, placement team, and admin to view applications
  if (!user || (user.role !== 'recruiter' && user.role !== 'placement' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view job applications</p>
        </div>
      </div>
    )
  }

  // Show error if job not found
  if (jobError || (jobData && !jobData.success)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Button variant="primary" onClick={() => window.location.href = '/jobs'}>
            Back to Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Applications for {job?.title || 'Job'}
            </h1>
            <p className="text-lg text-gray-600">
              {job?.company || 'Company'} • {job?.location || 'Location'}
            </p>
          </div>

          {/* Error State */}
          {applicationsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">Failed to load applications. Please try again.</p>
            </div>
          )}

          {/* Applications List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-gray-600">Applications for this job will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xl">
                            {app.candidate?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {app.candidate?.name || 'Unknown Candidate'}
                          </h3>
                          <p className="text-gray-600 mb-2">{app.candidate?.email}</p>
                          <div className="flex items-center space-x-3 mb-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {app.coverLetter && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-2">Cover Letter:</p>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                                {app.coverLetter}
                              </p>
                            </div>
                          )}
                          {app.resume && (
                            <div className="mt-2">
                              <a
                                href={app.resume}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                View Resume →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:w-48">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                        disabled={updateStatus.isPending}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

