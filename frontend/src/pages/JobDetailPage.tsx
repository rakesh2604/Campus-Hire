import React, { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useJob } from '@/hooks/useJobs'
import { useApplyToJob, useMyApplications } from '@/hooks/useApplications'
import { useCurrentUser } from '@/hooks/useAuth'
import { Button } from '@/components/common/Button'
import { FileUpload } from '@/components/common/FileUpload'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { showToast } from '@/utils/toast'

interface ApplyFormData {
  resume: string
  coverLetter: string
}

const SummaryIcon: React.FC<{ d: string }> = ({ d }) => (
  <svg
    className="h-5 w-5 text-[#6E59F6]"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
)

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: jobData, isLoading: jobLoading, isError: jobError, error: jobErrorData } = useJob(id || '')
  const { data: userData, isLoading: userLoading } = useCurrentUser()
  const { data: applicationsData, isLoading: applicationsLoading } = useMyApplications()
  const applyMutation = useApplyToJob()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [showFullBondDetails, setShowFullBondDetails] = useState(false)
  const applySectionRef = useRef<HTMLDivElement | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors: _errors },
  } = useForm<ApplyFormData>()

  const job = jobData?.data
  const user = userData?.data

  // All hooks must be called before any early returns
  const hasApplied = useMemo(() => {
    if (!user || !applicationsData?.data?.applications) return false
    return applicationsData.data.applications.some((app) => app.jobId === id)
  }, [user, applicationsData, id])

  const showEligibilityBanner = user?.role === 'candidate' && !hasApplied

  const experienceRangeText = useMemo(() => {
    if (!job?.experienceRange) return 'Fresher'
    return `${job.experienceRange.minYears} Yrs ${job.experienceRange.minMonths} Mon - ${job.experienceRange.maxYears} Yrs ${job.experienceRange.maxMonths} Mon`
  }, [job?.experienceRange])

  const formatSalary = useMemo(() => {
    if (job?.salaryText) return job.salaryText
    if (job?.salary?.min && job?.salary?.max) {
      const min = (job.salary.min / 100000).toFixed(1)
      const max = (job.salary.max / 100000).toFixed(1)
      return job.salary.min === job.salary.max ? `${min} LPA` : `${min} - ${max} LPA`
    }
    return 'Salary not specified'
  }, [job?.salaryText, job?.salary])

  const summaryItems = useMemo(
    () =>
      job
        ? [
            {
              id: 'type',
              text: job.type.replace('-', ' '),
              icon: 'M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-1 4v9m-6 0h6',
            },
            {
              id: 'experience',
              text: experienceRangeText,
              icon: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z',
            },
            {
              id: 'salary',
              text: formatSalary,
              icon: 'M8 4h9M8 8h9M14 8v12m0 0h4m-4 0H9',
            },
            {
              id: 'location',
              text: `${job.location}${job.workMode ? ` • ${job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}` : ''}`,
              icon: 'M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zm0-9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
            },
          ].filter((item) => Boolean(item.text))
        : [],
    [job, experienceRangeText, formatSalary]
  )

  const descriptionSections = useMemo(
    () => [
      {
        title: 'Responsibilities',
        items: job?.responsibilities,
      },
      {
        title: 'Qualifications',
        items: job?.keyQualifications,
      },
      {
        title: 'Team Environment',
        items: job?.teamEnvironment,
      },
      {
        title: 'Company Culture',
        items: job?.companyCulture,
      },
      {
        title: 'Additional Requirements',
        items: job?.requirements,
      },
    ],
    [job]
  )

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

  const handlePrimaryCtaClick = () => {
    if (hasApplied) return
    applySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Show loading state - AFTER all hooks are called
  if (jobLoading || userLoading || applicationsLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading job details..." />
      </div>
    )
  }

  // Show error state - AFTER all hooks are called
  if (jobError || !job) {
    return (
      <div className="min-h-screen bg-[#f7f8fc] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load job</h2>
          <p className="text-gray-600 mb-4">
            {jobErrorData instanceof Error 
              ? jobErrorData.message 
              : jobData?.error || 'Job not found or an error occurred while loading job details.'}
          </p>
          <Button onClick={() => navigate('/jobs')} variant="primary">
            Back to Jobs
          </Button>
        </div>
      </div>
    )
  }

  const companyInitials = job.company
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const bondDetailsText = job.bondDetails || 'Detailed bond information will be shared during the interview rounds.'
  const shouldTruncateBond = bondDetailsText.length > 150

  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-[32px] bg-white shadow-[0px_30px_60px_rgba(15,23,42,0.08)]">
          <div className="border-b border-gray-100 px-6 py-8 sm:px-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#6E59F6] to-[#9278FF] text-xl font-semibold text-white">
                  {companyInitials}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">Featured Role</p>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title.toUpperCase().replace(/\s+/g, '_')}</h1>
                  <div className="mt-1 flex items-center gap-2 text-gray-700">
                    <span className="text-base font-medium">{job.company}</span>
                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  {job.hasBondAgreement && (
                    <p className="mt-2 inline-flex items-center rounded-md bg-[#FFF4D4] px-3 py-1 text-xs font-semibold text-[#B5720C]">
                      *This job includes bond agreement.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3 text-right">
                {showEligibilityBanner ? (
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#7055F2]">
                    <span className="text-2xl leading-none text-[#8F7CFF]">»»</span>
                    <span>🎉 Hurray! You're eligible to apply.</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    {hasApplied ? 'You have already applied to this job.' : 'Review the job details before applying.'}
                  </p>
                )}
                <Button type="button" variant="primary" onClick={handlePrimaryCtaClick} disabled={hasApplied} className="px-6">
                  {hasApplied ? 'Applied' : 'Apply'}
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-gray-600">
              {summaryItems.map((item, index) => (
                <React.Fragment key={item.id}>
                  <span className="flex items-center gap-2 text-gray-800">
                    <SummaryIcon d={item.icon} />
                    <span className="font-medium">{item.text}</span>
                  </span>
                  {index < summaryItems.length - 1 && <span className="text-gray-300">•</span>}
                </React.Fragment>
              ))}
            </div>

            {(job.hasBondAgreement || job.bondDetails) && (
              <div className="mt-6 rounded-2xl border border-[#FFE7B7] bg-[#FFFCF4] px-5 py-4 text-sm text-gray-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#B5720C]">Bond Details</p>
                <p className="mt-2 leading-relaxed">
                  {showFullBondDetails || !shouldTruncateBond ? bondDetailsText : `${bondDetailsText.slice(0, 150)}...`}
                  {shouldTruncateBond && (
                    <button
                      type="button"
                      onClick={() => setShowFullBondDetails((prev) => !prev)}
                      className="ml-2 font-semibold text-[#946200]"
                    >
                      {showFullBondDetails ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-8 sm:px-10">
            <div className="rounded-3xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900">Job descriptions</h2>
              {job.description && (
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{job.description}</p>
              )}

              <div className="mt-6 space-y-6">
                {job.aboutCompany && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">About {job.company}</p>
                    <p className="mt-2 text-sm text-gray-700">{job.aboutCompany}</p>
                  </div>
                )}
                {job.experienceLevel && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Experience Level</p>
                    <p className="mt-2 text-sm text-gray-700">{job.experienceLevel}</p>
                  </div>
                )}
                {(job.salaryText || job.salary) && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Compensation</p>
                    <p className="mt-2 text-sm text-gray-700">{formatSalary}</p>
                  </div>
                )}
                {descriptionSections.map(
                  (section) =>
                    section.items &&
                    section.items.length > 0 && (
                      <div key={section.title}>
                        <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                          {section.items.map((item, idx) => (
                            <li key={`${section.title}-${idx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )
                )}
              </div>
            </div>
          </div>
        </div>

        {user && user.role === 'candidate' && !hasApplied && (
          <div ref={applySectionRef} className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste your resume or provide a URL"
                />
              </div>

              <div>
                <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter (optional)
                </label>
                <textarea
                  {...register('coverLetter')}
                  rows={8}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Share additional context or leave this blank if not applicable."
                />
              </div>

              {applyMutation.isError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800 flex items-center">
                    <span className="mr-2">❌</span>
                    {applyMutation.error instanceof Error ? applyMutation.error.message : 'Failed to submit application'}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Button type="submit" variant="primary" disabled={applyMutation.isPending} size="lg" className="flex-1">
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate('/jobs')} size="lg" className="flex-1 min-w-[160px]">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

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
