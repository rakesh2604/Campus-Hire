'use client'

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useAuth'
import {
  useSaveJobToTracker,
  useJobTracker,
  useGenerateCoverLetter,
  useSummarizeJobDescription,
  useGenerateLinkedInPost,
  useOptimizeLinkedIn,
  useFindWhoHiring,
} from '@/hooks/useCareerCopilot'
import { useJobs } from '@/hooks/useJobs'
import { showToast } from '@/utils/toast'
import { Link } from 'react-router-dom'

export const CareerCopilotPage: React.FC = () => {
  const { data: userData, isLoading } = useCurrentUser()
  const user = userData?.data
  const navigate = useNavigate()

  // Redirect non-candidates to dashboard
  useEffect(() => {
    if (!isLoading && user && user.role !== 'candidate') {
      showToast('This feature is only available for candidates', 'error')
      navigate('/dashboard')
    }
  }, [user, isLoading, navigate])

  // States for different features
  const [coverLetterData, setCoverLetterData] = useState({
    jobDescription: '',
    jobTitle: '',
    companyName: '',
    resume: '',
  })
  const [coverLetterResult, setCoverLetterResult] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [summaryResult, setSummaryResult] = useState('')
  const [linkedInPostData, setLinkedInPostData] = useState({
    topic: '',
    tone: 'professional',
    hashtags: true,
  })
  const [linkedInPostResult, setLinkedInPostResult] = useState('')
  const [whoHiringFilters, setWhoHiringFilters] = useState({
    location: '',
    role: '',
  })

  // Hooks
  const saveJobMutation = useSaveJobToTracker()
  const { data: trackerData } = useJobTracker()
  const coverLetterMutation = useGenerateCoverLetter()
  const summarizeMutation = useSummarizeJobDescription()
  const linkedInPostMutation = useGenerateLinkedInPost()
  const { data: linkedInOptimization } = useOptimizeLinkedIn()
  const { data: whoHiringData } = useFindWhoHiring(whoHiringFilters)
  const { data: jobsData } = useJobs({ limit: 20 })

  const savedJobs = trackerData?.data?.jobs || []
  const companies = whoHiringData?.data?.companies || []
  const jobs = jobsData?.data?.jobs || []

  // Show loading or redirect if not a candidate
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || user.role !== 'candidate') {
    return null // Will redirect via useEffect
  }

  const handleSaveJob = async (jobId: string) => {
    try {
      await saveJobMutation.mutateAsync({ jobId })
      showToast('Job saved to tracker!', 'success')
    } catch (error) {
      showToast('Failed to save job', 'error')
    }
  }

  const handleGenerateCoverLetter = async () => {
    if (!coverLetterData.jobDescription || !coverLetterData.jobTitle || !coverLetterData.companyName) {
      showToast('Please fill all required fields', 'error')
      return
    }

    try {
      const result = await coverLetterMutation.mutateAsync(coverLetterData)
      setCoverLetterResult(result.data?.coverLetter || '')
      showToast('Cover letter generated!', 'success')
    } catch (error) {
      showToast('Failed to generate cover letter', 'error')
    }
  }

  const handleSummarizeJob = async () => {
    if (!jobDescription.trim()) {
      showToast('Please enter a job description', 'error')
      return
    }

    try {
      const result = await summarizeMutation.mutateAsync({ jobDescription })
      setSummaryResult(result.data?.summary || '')
      showToast('Job description summarized!', 'success')
    } catch (error) {
      showToast('Failed to summarize job description', 'error')
    }
  }

  const handleGenerateLinkedInPost = async () => {
    if (!linkedInPostData.topic.trim()) {
      showToast('Please enter a topic', 'error')
      return
    }

    try {
      const result = await linkedInPostMutation.mutateAsync(linkedInPostData)
      setLinkedInPostResult(result.data?.post || '')
      showToast('LinkedIn post generated!', 'success')
    } catch (error) {
      showToast('Failed to generate LinkedIn post', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              👋
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Hello!</h1>
          </div>
          <p className="text-lg text-gray-600">iAmYourCareerCopilot</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Save Job to Tracker */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">SaveJobtoTracker</h2>
              </div>
              {jobs.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {jobs.slice(0, 5).map((job) => {
                    const isSaved = savedJobs.some((saved) => saved.jobId === job.id)
                    return (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{job.title}</p>
                          <p className="text-sm text-gray-600">{job.company}</p>
                        </div>
                        <button
                          onClick={() => handleSaveJob(job.id)}
                          disabled={isSaved || saveJobMutation.isPending}
                          className={`px-3 py-1 text-sm rounded ${
                            isSaved
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isSaved ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-600">No jobs available</p>
              )}
            </div>

            {/* View Job Tracker */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">ViewJobTracker</h2>
              </div>
              {savedJobs.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedJobs.map((saved) => (
                    <Link
                      key={saved.id}
                      to={`/jobs/${saved.jobId}`}
                      className="block p-3 bg-gray-50 rounded hover:bg-gray-100"
                    >
                      <p className="font-medium text-gray-900">{saved.job.title}</p>
                      <p className="text-sm text-gray-600">{saved.job.company}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                        saved.status === 'saved' ? 'bg-blue-100 text-blue-800' :
                        saved.status === 'applied' ? 'bg-green-100 text-green-800' :
                        saved.status === 'interviewing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {saved.status}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No saved jobs yet</p>
              )}
            </div>

            {/* AI Cover Letter Generator (Premium) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">AICoverLetterGenerator</h2>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex items-center gap-1">
                  <span>⭐</span> Premium
                </span>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Job Title *"
                  value={coverLetterData.jobTitle}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, jobTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Company Name *"
                  value={coverLetterData.companyName}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Job Description *"
                  value={coverLetterData.jobDescription}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, jobDescription: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Your Resume/Experience (Optional)"
                  value={coverLetterData.resume}
                  onChange={(e) => setCoverLetterData({ ...coverLetterData, resume: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={coverLetterMutation.isPending}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {coverLetterMutation.isPending ? 'Generating...' : 'Generate Cover Letter'}
                </button>
                {coverLetterResult && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Generated Cover Letter:</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{coverLetterResult}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(coverLetterResult)
                        showToast('Copied to clipboard!', 'success')
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Summarize Job Description (Premium) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">SummarizeJobDescription</h2>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex items-center gap-1">
                  <span>⭐</span> Premium
                </span>
              </div>
              <div className="space-y-4">
                <textarea
                  placeholder="Paste job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={handleSummarizeJob}
                  disabled={summarizeMutation.isPending}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {summarizeMutation.isPending ? 'Summarizing...' : 'Summarize'}
                </button>
                {summaryResult && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Summary:</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{summaryResult}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(summaryResult)
                        showToast('Copied to clipboard!', 'success')
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* AI LinkedIn Post Generator (Premium) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">AILinkedInPostGenerator</h2>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded flex items-center gap-1">
                  <span>⭐</span> Premium
                </span>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Post Topic *"
                  value={linkedInPostData.topic}
                  onChange={(e) => setLinkedInPostData({ ...linkedInPostData, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={linkedInPostData.tone}
                  onChange={(e) => setLinkedInPostData({ ...linkedInPostData, tone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="informative">Informative</option>
                </select>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={linkedInPostData.hashtags}
                    onChange={(e) => setLinkedInPostData({ ...linkedInPostData, hashtags: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Include hashtags</span>
                </label>
                <button
                  onClick={handleGenerateLinkedInPost}
                  disabled={linkedInPostMutation.isPending}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {linkedInPostMutation.isPending ? 'Generating...' : 'Generate Post'}
                </button>
                {linkedInPostResult && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Generated Post:</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{linkedInPostResult}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(linkedInPostResult)
                        showToast('Copied to clipboard!', 'success')
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* LinkedIn Optimization */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">LinkedInOptimization</h2>
              </div>
              {linkedInOptimization?.data?.optimization ? (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {linkedInOptimization.data.optimization}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">Click to analyze your LinkedIn profile...</p>
              )}
            </div>

            {/* Find Out Who's Hiring */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">findOutWhoHiring</h2>
              </div>
              <div className="space-y-4 mb-4">
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={whoHiringFilters.location}
                  onChange={(e) => setWhoHiringFilters({ ...whoHiringFilters, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Job Role (optional)"
                  value={whoHiringFilters.role}
                  onChange={(e) => setWhoHiringFilters({ ...whoHiringFilters, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              {companies.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {companies.map((company, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <p className="font-semibold text-gray-900">{company.company}</p>
                      <p className="text-sm text-gray-600">{company.totalJobs} active jobs</p>
                      <div className="mt-2 space-y-1">
                        {company.jobs.slice(0, 3).map((job) => (
                          <Link
                            key={job.id}
                            to={`/jobs/${job.id}`}
                            className="block text-xs text-blue-600 hover:underline"
                          >
                            {job.title} - {job.location}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No companies found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

