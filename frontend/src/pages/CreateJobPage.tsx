'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useCreateJob } from '@/hooks/useJobs'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common/Button'

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

export const CreateJobPage: React.FC = () => {
  const navigate = useNavigate()
  const createJob = useCreateJob()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobFormData>({
    defaultValues: {
      salaryCurrency: 'INR',
      type: 'full-time',
      workMode: 'office',
    },
  })

  const onSubmit = async (data: JobFormData) => {
    try {
      const jobData: Partial<{
        title: string
        description: string
        company: string
        location: string
        type: string
        workMode?: string
        aboutCompany?: string
        experienceLevel?: string
        salaryText?: string
        salary?: { min: number; max: number; currency: string }
        experienceRange?: { minYears: number; minMonths: number; maxYears: number; maxMonths: number }
        requirements?: string[]
        responsibilities?: string[]
        keyQualifications?: string[]
        teamEnvironment?: string[]
        companyCulture?: string[]
      }> = {
        title: data.title,
        description: data.description,
        company: data.company,
        location: data.location,
        type: data.type,
        workMode: data.workMode,
        aboutCompany: data.aboutCompany,
        experienceLevel: data.experienceLevel,
        salaryText: data.salaryText,
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
        // If salaryText is provided, use it directly
        jobData.salaryText = data.salaryText.trim()
        // Optionally also store as salary range if min/max provided
        if (data.salaryMin !== undefined && data.salaryMax !== undefined && !isNaN(data.salaryMin) && !isNaN(data.salaryMax)) {
          jobData.salary = {
            min: data.salaryMin * 100000, // Convert LPA to actual amount
            max: data.salaryMax * 100000,
            currency: 'INR',
          }
        }
      } else if (data.salaryMin !== undefined && data.salaryMax !== undefined && !isNaN(data.salaryMin) && !isNaN(data.salaryMax)) {
        // If only salary range is provided, generate salaryText
        if (data.salaryMin === data.salaryMax) {
          jobData.salaryText = `${data.salaryMin} LPA`
        } else {
          jobData.salaryText = `${data.salaryMin} - ${data.salaryMax} LPA`
        }
        // Store in LPA format (multiply by 100000 for actual amount)
        jobData.salary = {
          min: data.salaryMin * 100000, // Convert LPA to actual amount
          max: data.salaryMax * 100000,
          currency: 'INR',
        }
      }

      // Add experience range if provided
      if (
        (data.minYears !== undefined && !isNaN(data.minYears)) ||
        (data.minMonths !== undefined && !isNaN(data.minMonths)) ||
        (data.maxYears !== undefined && !isNaN(data.maxYears)) ||
        (data.maxMonths !== undefined && !isNaN(data.maxMonths))
      ) {
        jobData.experienceRange = {
          minYears: data.minYears || 0,
          minMonths: data.minMonths || 0,
          maxYears: data.maxYears || 0,
          maxMonths: data.maxMonths || 0,
        }
      }

      const result = await createJob.mutateAsync(jobData)
      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Job creation failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Post a New Job 🚀</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title *
                  </label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Associate Software Engineer"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <input
                    {...register('company', { required: 'Company is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., WebMD"
                  />
                  {errors.company && (
                    <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    {...register('location', { required: 'Location is required' })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Mumbai, Maharashtra"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="workMode" className="block text-sm font-medium text-gray-700 mb-2">
                    Work Mode
                  </label>
                  <select
                    {...register('workMode')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="office">Office</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type *
                  </label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Overall job description..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-2">
                  Responsibilities (one per line)
                </label>
                <textarea
                  {...register('responsibilities')}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter additional requirements, one per line..."
                />
              </div>
            </div>

            {createJob.isError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-800 flex items-center">
                  <span className="mr-2">❌</span>
                  {createJob.error instanceof Error
                    ? createJob.error.message
                    : 'Failed to create job'}
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <Button
                type="submit"
                variant="primary"
                disabled={createJob.isPending}
                size="lg"
                className="flex-1"
              >
                {createJob.isPending ? 'Posting...' : 'Post Job'}
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
  )
}
