'use client'

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useJob, useUpdateJob, useDeleteJob, CreateJobData } from '@/hooks/useJobs'
import { useCurrentUser } from '@/hooks/useAuth'
import { Button } from '@/components/common/Button'
import { showToast } from '@/utils/toast'

interface JobFormData {
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'internship'
  workMode?: 'office' | 'remote' | 'hybrid'
  salaryMin?: number
  salaryMax?: number
  salaryCurrency: string
  salaryText?: string
  experienceLevel?: string
  minYears?: number
  minMonths?: number
  maxYears?: number
  maxMonths?: number
  aboutCompany?: string
  responsibilities?: string
  keyQualifications?: string
  teamEnvironment?: string
  companyCulture?: string
  requirements: string
}

export const EditJobPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: jobData } = useJob(id || '')
  const updateJob = useUpdateJob()
  const deleteJob = useDeleteJob()
  const { data: userData } = useCurrentUser()

  const job = jobData?.data
  const user = userData?.data

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    defaultValues: {
      title: job?.title || '',
      description: job?.description || '',
      company: job?.company || '',
      location: job?.location || '',
      type: job?.type || 'full-time',
      workMode: job?.workMode || 'office',
      salaryMin: job?.salary?.min ? job.salary.min / 100000 : undefined, // Convert from actual amount to LPA
      salaryMax: job?.salary?.max ? job.salary.max / 100000 : undefined,
      salaryCurrency: job?.salary?.currency || 'INR',
      salaryText: job?.salaryText || '',
      experienceLevel: job?.experienceLevel || '',
      minYears: job?.experienceRange?.minYears || 0,
      minMonths: job?.experienceRange?.minMonths || 0,
      maxYears: job?.experienceRange?.maxYears || 0,
      maxMonths: job?.experienceRange?.maxMonths || 0,
      aboutCompany: job?.aboutCompany || '',
      responsibilities: job?.responsibilities?.join('\n') || '',
      keyQualifications: job?.keyQualifications?.join('\n') || '',
      teamEnvironment: job?.teamEnvironment?.join('\n') || '',
      companyCulture: job?.companyCulture?.join('\n') || '',
      requirements: job?.requirements?.join('\n') || '',
    },
  })

  const onSubmit = async (data: JobFormData) => {
    if (!id) return

    try {
      const jobData: Partial<CreateJobData> = {
        title: data.title,
        description: data.description,
        company: data.company,
        location: data.location,
        type: data.type,
        workMode: data.workMode,
        aboutCompany: data.aboutCompany,
        experienceLevel: data.experienceLevel,
        requirements: data.requirements
          ? data.requirements.split('\n').filter((req) => req.trim())
          : [],
        responsibilities: data.responsibilities
          ? data.responsibilities.split('\n').filter((r) => r.trim())
          : [],
        keyQualifications: data.keyQualifications
          ? data.keyQualifications.split('\n').filter((q) => q.trim())
          : [],
        teamEnvironment: data.teamEnvironment
          ? data.teamEnvironment.split('\n').filter((t) => t.trim())
          : [],
        companyCulture: data.companyCulture
          ? data.companyCulture.split('\n').filter((c) => c.trim())
          : [],
      }

      // Handle salary - support both salaryText and salary range
      if (data.salaryText && data.salaryText.trim()) {
        jobData.salaryText = data.salaryText.trim()
        if (data.salaryMin !== undefined && data.salaryMax !== undefined && !isNaN(data.salaryMin) && !isNaN(data.salaryMax)) {
          jobData.salary = {
            min: data.salaryMin * 100000, // Convert LPA to actual amount
            max: data.salaryMax * 100000,
            currency: 'INR',
          }
        }
      } else if (data.salaryMin !== undefined && data.salaryMax !== undefined && !isNaN(data.salaryMin) && !isNaN(data.salaryMax)) {
        if (data.salaryMin === data.salaryMax) {
          jobData.salaryText = `${data.salaryMin} LPA`
        } else {
          jobData.salaryText = `${data.salaryMin} - ${data.salaryMax} LPA`
        }
        jobData.salary = {
          min: data.salaryMin * 100000,
          max: data.salaryMax * 100000,
          currency: 'INR',
        }
      }

      // Handle experience range
      if (
        (data.minYears !== undefined && !isNaN(data.minYears)) ||
        (data.minMonths !== undefined && !isNaN(data.minMonths)) ||
        (data.maxYears !== undefined && !isNaN(data.maxYears)) ||
        (data.maxMonths !== undefined && !isNaN(data.maxMonths))
      ) {
        jobData.experienceRange = {
          minYears: data.minYears ?? 0,
          minMonths: data.minMonths ?? 0,
          maxYears: data.maxYears ?? 0,
          maxMonths: data.maxMonths ?? 0,
        }
      }

      const result = await updateJob.mutateAsync({ id, data: jobData })
      if (result.success) {
        showToast('Job updated successfully', 'success')
        navigate('/dashboard')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update job'
      showToast(errorMessage, 'error')
    }
  }

  const handleDelete = async () => {
    if (!id) return

    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return
    }

    try {
      await deleteJob.mutateAsync(id)
      showToast('Job deleted successfully', 'success')
      navigate('/dashboard')
    } catch (error) {
      showToast('Failed to delete job', 'error')
    }
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Allow admin, placement team, or job owner to edit job
  if (
    user?.role !== 'admin' &&
    user?.role !== 'placement' &&
    user?.id !== job.postedBy
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to edit this job</p>
          <Button variant="primary" onClick={() => navigate('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-3xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Edit Job</h1>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteJob.isPending}
                size="sm"
              >
                {deleteJob.isPending ? 'Deleting...' : 'Delete Job'}
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  {...register('company', { required: 'Company is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.company && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.company.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  {...register('location', { required: 'Location is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.location && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type *
                  </label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="workMode" className="block text-sm font-medium text-gray-700 mb-2">
                    Work Mode
                  </label>
                  <select
                    {...register('workMode')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="office">Office</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

            {/* Experience & Salary */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience & Compensation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <input
                    {...register('experienceLevel')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Entry-level (0-2 years of experience)"
                  />
                </div>

                <div>
                  <label htmlFor="salaryText" className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Text (Optional - if left empty, will auto-generate from Min/Max)
                  </label>
                  <input
                    {...register('salaryText')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., 6.7 LPA or Competitive salary package"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty to auto-generate from salary range below</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label htmlFor="minYears" className="block text-sm font-medium text-gray-700 mb-2">
                    Min Years
                  </label>
                  <input
                    {...register('minYears', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="minMonths" className="block text-sm font-medium text-gray-700 mb-2">
                    Min Months
                  </label>
                  <input
                    {...register('minMonths', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="11"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="maxYears" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Years
                  </label>
                  <input
                    {...register('maxYears', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="maxMonths" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Months
                  </label>
                  <input
                    {...register('maxMonths', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="11"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Min (₹ LPA)
                  </label>
                  <input
                    {...register('salaryMin', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., 6.7"
                  />
                </div>
                <div>
                  <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Max (₹ LPA)
                  </label>
                  <input
                    {...register('salaryMax', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., 10.5"
                  />
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Information</h2>
              
              <div>
                <label htmlFor="aboutCompany" className="block text-sm font-medium text-gray-700 mb-2">
                  About Company
                </label>
                <textarea
                  {...register('aboutCompany')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Describe the company, its mission, and values..."
                />
              </div>
            </div>

            {/* Job Details */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>

              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Overall job description..."
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-2">
                  Responsibilities (one per line)
                </label>
                <textarea
                  {...register('responsibilities')}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter responsibilities, one per line..."
                />
              </div>

              <div className="mb-4">
                <label htmlFor="keyQualifications" className="block text-sm font-medium text-gray-700 mb-2">
                  Key Qualifications (one per line)
                </label>
                <textarea
                  {...register('keyQualifications')}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter qualifications, one per line..."
                />
              </div>

              <div className="mb-4">
                <label htmlFor="teamEnvironment" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Environment (one per line)
                </label>
                <textarea
                  {...register('teamEnvironment')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Describe the team environment..."
                />
              </div>

              <div className="mb-4">
                <label htmlFor="companyCulture" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Culture (one per line)
                </label>
                <textarea
                  {...register('companyCulture')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Describe the company culture..."
                />
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Requirements (one per line)
                </label>
                <textarea
                  {...register('requirements')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter additional requirements, one per line..."
                />
              </div>
            </div>

              {updateJob.isError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800 flex items-center">
                    <span className="mr-2">❌</span>
                    {updateJob.error instanceof Error
                      ? updateJob.error.message
                      : 'Failed to update job'}
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={updateJob.isPending}
                  size="lg"
                  className="flex-1"
                >
                  {updateJob.isPending ? 'Updating...' : 'Update Job'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                  size="lg"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

