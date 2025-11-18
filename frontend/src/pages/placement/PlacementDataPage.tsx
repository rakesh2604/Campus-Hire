'use client'

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlacementDataByBatch, useAllBatches, useUpdateRoundStatus } from '@/hooks/usePlacement'
import { useCurrentUser } from '@/hooks/useAuth'
import { showToast } from '@/utils/toast'

export const PlacementDataPage: React.FC = () => {
  const { data: userData } = useCurrentUser()
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  const [selectedTab, setSelectedTab] = useState<'placements' | 'applications'>('placements')
  const [editingRound, setEditingRound] = useState<{
    applicationId: string
    roundNumber: number
  } | null>(null)

  const { data: batchesData } = useAllBatches()
  const { data: placementData, isLoading } = usePlacementDataByBatch(selectedBatch)
  const updateRoundMutation = useUpdateRoundStatus()

  const user = userData?.data
  const batches = batchesData?.data?.batches || []
  const stats = placementData?.data?.stats
  const placements = placementData?.data?.placements || []
  const applications = placementData?.data?.applications || []

  const handleUpdateRound = async (
    applicationId: string,
    roundNumber: number,
    status: 'pending' | 'scheduled' | 'completed' | 'passed' | 'failed'
  ) => {
    try {
      await updateRoundMutation.mutateAsync({
        applicationId,
        data: {
          roundNumber,
          status,
        },
      })
      showToast('Round status updated successfully', 'success')
      setEditingRound(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update round status'
      showToast(errorMessage, 'error')
    }
  }

  if (user?.role !== 'placement' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Placement Data</h1>
              <p className="mt-2 text-gray-600">Track placements and rounds by batch</p>
            </div>
            <Link
              to="/placement/dashboard"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Batch Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a batch...</option>
            {batches.map((batch) => (
              <option key={batch.batch} value={batch.batch}>
                {batch.batch} ({batch.students} students, {batch.selected} placed)
              </option>
            ))}
          </select>
        </div>

        {!selectedBatch ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">Please select a batch to view placement data.</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-600">Loading placement data...</div>
          </div>
        ) : (
          <>
            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Placed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.placed}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">On Hold</p>
                  <p className="text-2xl font-bold text-gray-600 mt-1">{stats.onHold}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalApplications}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600">Shortlisted</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{stats.shortlistedApplications}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setSelectedTab('placements')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      selectedTab === 'placements'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Placements ({placements.length})
                  </button>
                  <button
                    onClick={() => setSelectedTab('applications')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 ${
                      selectedTab === 'applications'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Applications ({applications.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Placements Tab */}
            {selectedTab === 'placements' && (
              <div className="space-y-4">
                {placements.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-600">No placements found for this batch.</p>
                  </div>
                ) : (
                  placements.map((placement) => (
                    <div key={placement.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{placement.student.name}</h3>
                          <p className="text-sm text-gray-600">{placement.student.email}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          placement.status === 'selected' ? 'bg-green-100 text-green-800' :
                          placement.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          placement.status === 'on-hold' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {placement.status}
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {placement.job.title} at {placement.job.company}
                        </p>
                        <p className="text-xs text-gray-500">{placement.job.location}</p>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Round Progress: {placement.currentRound}/{placement.totalRounds}
                        </p>
                        <div className="space-y-2">
                          {placement.rounds.map((round) => (
                            <div key={round.roundNumber} className="flex items-center justify-between bg-gray-50 rounded p-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{round.roundName}</p>
                                {round.scheduledDate && (
                                  <p className="text-xs text-gray-500">
                                    Scheduled: {new Date(round.scheduledDate).toLocaleDateString()}
                                  </p>
                                )}
                                {round.completedDate && (
                                  <p className="text-xs text-gray-500">
                                    Completed: {new Date(round.completedDate).toLocaleDateString()}
                                  </p>
                                )}
                                {round.score !== undefined && (
                                  <p className="text-xs text-gray-500">Score: {round.score}/100</p>
                                )}
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                round.status === 'passed' ? 'bg-green-100 text-green-800' :
                                round.status === 'failed' ? 'bg-red-100 text-red-800' :
                                round.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                round.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {round.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {placement.offerDetails && (
                        <div className="bg-green-50 rounded p-3 mb-4">
                          <p className="text-sm font-medium text-green-900 mb-1">Offer Details</p>
                          {placement.offerDetails.ctc && (
                            <p className="text-xs text-green-700">CTC: ₹{placement.offerDetails.ctc.toLocaleString()}</p>
                          )}
                          {placement.offerDetails.joiningDate && (
                            <p className="text-xs text-green-700">
                              Joining: {new Date(placement.offerDetails.joiningDate).toLocaleDateString()}
                            </p>
                          )}
                          {placement.offerDetails.location && (
                            <p className="text-xs text-green-700">Location: {placement.offerDetails.location}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Applications Tab */}
            {selectedTab === 'applications' && (
              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-600">No applications found for this batch.</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{app.student.name}</h3>
                          <p className="text-sm text-gray-600">{app.student.email}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          app.status === 'shortlisted' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {app.job.title} at {app.job.company}
                        </p>
                        <p className="text-xs text-gray-500">
                          Round Progress: {app.currentRound}/{app.totalRounds} ({app.roundsCompleted} completed)
                        </p>
                      </div>
                      {editingRound?.applicationId === app.id ? (
                        <div className="bg-gray-50 rounded p-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Update Round {editingRound.roundNumber} Status
                          </p>
                          <div className="flex gap-2">
                            {['pending', 'scheduled', 'completed', 'passed', 'failed'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleUpdateRound(app.id, editingRound.roundNumber, status as 'pending' | 'scheduled' | 'completed' | 'passed' | 'failed')}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Mark as {status}
                              </button>
                            ))}
                            <button
                              onClick={() => setEditingRound(null)}
                              className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingRound({ applicationId: app.id, roundNumber: app.currentRound })}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Update Round Status
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

