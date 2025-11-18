'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useJob } from '@/hooks/useJobs'
import { useApplyToJob, useMyApplications } from '@/hooks/useApplications'
import { useCurrentUser } from '@/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/common/Button'
import { FileUpload } from '@/components/common/FileUpload'
import { showToast } from '@/utils/toast'

interface ApplyFormData {
  resume: string
  coverLetter: string
}

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: jobData } = useJob(id || '')
  const { data: userData } = useCurrentUser()
  const { data: applicationsData } = useMyApplications()
  const applyMutation = useApplyToJob()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyFormData>()

  const job = jobData?.data
  const user = userData?.data

  // Check if user has already applied
  const hasApplied = useMemo(() => {
    if (!user || !applicationsData?.data?.applications) return false
    return applicationsData.data.applications.some((app) => app.jobId === id)
  }, [user, applicationsData, id])

  const onSubmit = async (data: ApplyFormData) => {
    if (!id) return

    try {
      let resumeValue = resumeText

      if (resumeFile) {
        resumeValue = resumeFile.name
        showToast('Note: Resume file uploaded. In production, this would be stored in cloud storage.', 'info')
      }

      await applyMutation.mutateAsync({
        jobId: id,
        data: {
          resume: resumeValue || data.resume,
          coverLetter: data.coverLetter,
        },
      })
      showToast('Application submitted successfully!', 'success')
      navigate('/dashboard')
    } catch (error) {
      showToast('Failed to submit application', 'error')
    }
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Format experience range
  const experienceRangeText = job.experienceRange
    ? `${job.experienceRange.minYears} Yrs ${job.experienceRange.minMonths} Mon - ${job.experienceRange.maxYears} Yrs ${job.experienceRange.maxMonths} Mon`
    : null

  // Get company initials for logo
  const companyInitials = job.company
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Company Logo */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {companyInitials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {job.title.toUpperCase().replace(/\s+/g, '_')}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-gray-700">{job.company}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </div>
            {hasApplied && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Congratulations on applying.</p>
                  <p className="text-xs text-gray-600">Stay tuned for updates on the next steps.</p>
                </div>
                <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm">
                  Applied
                </button>
              </div>
            )}
          </div>

          {/* Job Summary */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="capitalize">{job.type}</span>
              {experienceRangeText && <span>• {experienceRangeText}</span>}
            </div>
            {(job.salaryText || job.salary) && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">
                  {job.salaryText || (job.salary ? `₹${(job.salary.min / 100000).toFixed(1)}${job.salary.min !== job.salary.max ? ` - ₹${(job.salary.max / 100000).toFixed(1)}` : ''} LPA` : '')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{job.location}</span>
              {job.workMode && <span>• {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}</span>}
            </div>
          </div>
        </div>

        {/* Job Descriptions Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 card-enter hover-lift transition-smooth">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Job descriptions</h2>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Title:</h3>
              <p className="text-gray-700">{job.title}</p>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Company:</h3>
              <p className="text-gray-700">{job.company}</p>
            </div>

            {/* About Company */}
            {job.aboutCompany && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About {job.company}:</h3>
                <p className="text-gray-700">{job.aboutCompany}</p>
              </div>
            )}

            {/* Experience Level */}
            {job.experienceLevel && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Experience Level:</h3>
                <p className="text-gray-700">{job.experienceLevel}</p>
              </div>
            )}

            {/* Compensation */}
            {(job.salaryText || job.salary) && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Compensation:</h3>
                <p className="text-gray-700">
                  {job.salaryText || (job.salary ? `₹${(job.salary.min / 100000).toFixed(1)}${job.salary.min !== job.salary.max ? ` - ₹${(job.salary.max / 100000).toFixed(1)}` : ''} LPA` : 'Competitive salary package')}
                </p>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Responsibilities:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Qualifications */}
            {job.keyQualifications && job.keyQualifications.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Key Qualifications:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {job.keyQualifications.map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Team Environment */}
            {job.teamEnvironment && job.teamEnvironment.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Team Environment:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {job.teamEnvironment.map((env, index) => (
                    <li key={index}>{env}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Company Culture */}
            {job.companyCulture && job.companyCulture.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Company Culture:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {job.companyCulture.map((culture, index) => (
                    <li key={index}>{culture}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Additional Requirements:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* General Description */}
            {job.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Application Form - Only for candidates */}
        {user && user.role === 'candidate' && !hasApplied && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 card-enter animate-delay-200 hover-lift transition-smooth">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Apply for this job</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FileUpload
                onFileSelect={(file) => {
                  setResumeFile(file)
                  if (file) {
                    setResumeText(file.name)
                  }
                }}
                accept=".pdf,.doc,.docx"
                label="Resume Upload"
              />
              
              <div>
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
                  Or paste resume text / URL
                </label>
                <textarea
                  {...register('resume')}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste your resume or provide a URL"
                />
              </div>

              <div>
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter *
                </label>
                <textarea
                  {...register('coverLetter', { required: 'Cover letter is required' })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your cover letter explaining why you're a great fit for this position..."
                />
                {errors.coverLetter && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.coverLetter.message}
                  </p>
                )}
              </div>

              {applyMutation.isError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800 flex items-center">
                    <span className="mr-2">❌</span>
                    {applyMutation.error instanceof Error
                      ? applyMutation.error.message
                      : 'Failed to submit application'}
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={applyMutation.isPending}
                  size="lg"
                  className="flex-1"
                >
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/jobs')}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Action Buttons for Recruiters and Placement Team */}
        {user && (user.role === 'recruiter' || user.role === 'placement' || user.role === 'admin') && (
          <div className="mt-6 space-y-3">
            <Link to={`/jobs/${job.id}/applications`}>
              <Button variant="primary" size="lg" className="w-full">
                View Applications
              </Button>
            </Link>
            {(user.role === 'recruiter' && job.postedBy === user.id) || user.role === 'placement' || user.role === 'admin' ? (
              <Link to={`/jobs/${job.id}/edit`}>
                <Button variant="secondary" size="lg" className="w-full">
                  Edit Job
                </Button>
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
