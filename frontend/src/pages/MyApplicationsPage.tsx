'use client'

import React from 'react'
import { useMyApplications } from '@/hooks/useApplications'
import { Link } from 'react-router-dom'
import { Application } from '@/types'
import { Button } from '@/components/common/Button'

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

export const MyApplicationsPage: React.FC = () => {
  const { data, isLoading } = useMyApplications()
  const applications = data?.data?.applications || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Applications 📋</h1>
            <p className="text-lg text-gray-600">Track all your job applications in one place</p>
          </div>

          {/* Applications List */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-gray-600 mb-6">Start applying to jobs to see them here</p>
              <Link to="/jobs">
                <Button variant="primary" size="lg">
                  Browse Jobs →
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app: Application & { job?: { id: string; title: string; company: string; location: string } }) => (
                <Link
                  key={app.id}
                  to={`/jobs/${app.jobId}`}
                  className="block bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xl">💼</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {app.job?.title || `Application #${app.id.slice(0, 8)}`}
                          </h3>
                          {app.job && (
                            <>
                              <p className="text-lg text-gray-700 mb-2">{app.job.company}</p>
                              <p className="text-sm text-gray-600 mb-3">
                                {app.job.location}
                              </p>
                            </>
                          )}
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(app.status)}`}>
                              {app.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="text-blue-600 font-medium">View Job →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

