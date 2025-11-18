import { Response, Request } from 'express'
import { validationResult, body } from 'express-validator'
import { Job } from '../models/Job'
import { User } from '../models/User'
import { ApiResponse, RequestWithUser } from '../types'
import { JobService } from '../services/jobService'
import { AppError, createErrorResponse, NotFoundError } from '../utils/errors'
import { JobNotificationService } from '../services/jobNotificationService'
import mongoose from 'mongoose'

export const createJob = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const response: ApiResponse<never> = {
        success: false,
        error: errors.array()[0].msg,
      }
      res.status(400).json(response)
      return
    }

    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    // Create job using service
    const job = await JobService.createJob(req.body, req.user.userId)

    // Automatically notify matching students (async, don't block response)
    if (job.status === 'active') {
      JobNotificationService.notifyMatchingStudents(job, 60)
        .then((result) => {
          console.log(
            `📧 Automated notifications sent for job "${job.title}": ${result.notified}/${result.totalMatching} students notified`
          )
        })
        .catch((error) => {
          console.error('Failed to send automated job notifications:', error)
          // Don't throw - notifications are not critical for job creation
        })
    }

    const response: ApiResponse<{
      id: string
      title: string
      description: string
      company: string
      location: string
      type: string
      workMode?: string
      salary?: {
        min: number
        max: number
        currency: string
      }
      salaryText?: string
      experienceLevel?: string
      experienceRange?: {
        minYears: number
        minMonths: number
        maxYears: number
        maxMonths: number
      }
      hasBondAgreement?: boolean
      bondDetails?: string
      aboutCompany?: string
      responsibilities?: string[]
      keyQualifications?: string[]
      teamEnvironment?: string[]
      companyCulture?: string[]
      requirements: string[]
      status: string
      createdAt: string
      updatedAt: string
    }> = {
      success: true,
      data: {
        id: (job._id as mongoose.Types.ObjectId).toString(),
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location,
        type: job.type,
        workMode: job.workMode,
        salary: job.salary,
        salaryText: job.salaryText,
        experienceLevel: job.experienceLevel,
        experienceRange: job.experienceRange,
        hasBondAgreement: job.hasBondAgreement,
        bondDetails: job.bondDetails,
        aboutCompany: job.aboutCompany,
        responsibilities: job.responsibilities,
        keyQualifications: job.keyQualifications,
        teamEnvironment: job.teamEnvironment,
        companyCulture: job.companyCulture,
        requirements: job.requirements,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      },
      message: 'Job posted successfully',
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Create job error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to create job',
    }
    res.status(500).json(response)
  }
}

export const getJobs = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const { page = '1', limit = '10', type, location, search, status: statusFilter } = req.query

    const resolveViewMode = () => {
      const forcedView = (req.query.view as string) || ''
      const role = req.user?.role

      if (forcedView === 'candidate') return 'candidate'
      if (forcedView === 'placement' && (role === 'placement' || role === 'admin')) return 'placement'
      if (forcedView === 'recruiter' && role === 'recruiter') return 'recruiter'

      if (role === 'placement' || role === 'admin') return 'placement'
      if (role === 'recruiter') return 'recruiter'

      return 'candidate'
    }

    const viewMode = resolveViewMode()
    const query: Record<string, unknown> = {}

    if (type) {
      query.type = type
    }
    if (location) {
      query.location = { $regex: location as string, $options: 'i' }
    }
    if (search) {
      query.$or = [
        { title: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
        { company: { $regex: search as string, $options: 'i' } },
      ]
    }
    if (viewMode === 'candidate') {
      query.status = 'active'
    } else if (statusFilter) {
      query.status = statusFilter
    }
    if (viewMode === 'recruiter' && req.user) {
      query.postedBy = req.user.userId
    }

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    // For candidates, filter out dismissed jobs
    let dismissedJobIds: string[] = []
    if (viewMode === 'candidate' && req.user) {
      try {
        const user = await User.findById(req.user.userId).select('dismissedJobs').lean()
        if (user?.dismissedJobs && Array.isArray(user.dismissedJobs)) {
          // Handle new format (array of objects with jobId)
          dismissedJobIds = user.dismissedJobs
            .map((item: any, index: number) => {
              try {
                // If it's an object with jobId property (new format)
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                  // Check if it has jobId property
                  if (item.jobId !== undefined && item.jobId !== null) {
                    let id: string | null = null
                    
                    // Handle ObjectId instances (when not using .lean() or when populated)
                    if (item.jobId.toString && typeof item.jobId.toString === 'function') {
                      id = item.jobId.toString()
                    }
                    // Handle plain ObjectId objects from .lean() (they might have _id or be serialized)
                    else if (item.jobId._id) {
                      id = item.jobId._id.toString()
                    }
                    // Handle already stringified ObjectId
                    else if (typeof item.jobId === 'string') {
                      id = item.jobId
                    }
                    // Handle ObjectId-like objects with $oid or other serialized formats
                    else if (item.jobId.$oid) {
                      id = item.jobId.$oid
                    }
                    
                    // Validate it's a valid ObjectId hex string (24 chars)
                    if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
                      return id
                    }
                  }
                  // Handle legacy format where item itself might be an ObjectId reference
                  else if (item._id) {
                    const id = item._id.toString()
                    if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
                      return id
                    }
                  }
                }
                // Skip invalid items silently in production, log in development
                if (process.env.NODE_ENV === 'development') {
                  console.warn(`Invalid dismissed job item at index ${index}:`, typeof item, item)
                }
                return null
              } catch (error) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn(`Error processing dismissed job item at index ${index}:`, error)
                }
                return null
              }
            })
            .filter((id: string | null): id is string => id !== null && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) // Only valid ObjectId hex strings
          
        }
      } catch (error) {
        console.warn('Error fetching dismissed jobs:', error)
        // Continue without filtering dismissed jobs if there's an error
      }
    }

    let jobsQuery = Job.find(query)
    
    if (dismissedJobIds.length > 0) {
      // Convert string IDs to ObjectIds for the query
      const dismissedObjectIds = dismissedJobIds
        .map((id: string) => {
          try {
            return new mongoose.Types.ObjectId(id)
          } catch (e) {
            console.warn(`Invalid dismissed job ID: ${id}`, e)
            return null
          }
        })
        .filter((id: any) => id !== null)
      
      if (dismissedObjectIds.length > 0) {
        jobsQuery = jobsQuery.where('_id').nin(dismissedObjectIds)
      }
    }

    const jobs = await jobsQuery
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(limitNum, 100)) // Cap at 100 to prevent performance issues

    // Count total excluding dismissed jobs
    let countQuery = Job.countDocuments(query)
    if (dismissedJobIds.length > 0) {
      // Convert string IDs to ObjectIds for the query
      const dismissedObjectIds = dismissedJobIds
        .map((id: string) => {
          try {
            return new mongoose.Types.ObjectId(id)
          } catch (e) {
            return null
          }
        })
        .filter((id: any) => id !== null)
      
      if (dismissedObjectIds.length > 0) {
        countQuery = countQuery.where('_id').nin(dismissedObjectIds)
      }
    }
    const total = await countQuery

    const response: ApiResponse<{
      jobs: Array<{
        id: string
        title: string
        description: string
        company: string
        location: string
        type: string
        workMode?: string
        salaryText?: string
        experienceLevel?: string
        experienceRange?: {
          minYears: number
          minMonths: number
          maxYears: number
          maxMonths: number
        }
        hasBondAgreement?: boolean
        bondDetails?: string
        salary?: {
          min: number
          max: number
          currency: string
        }
        requirements: string[]
        status: string
        postedBy: {
          id: string
          name: string
          email: string
        }
        createdAt: string
        updatedAt: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }> = {
      success: true,
      data: {
        jobs: jobs.map((job) => {
          const postedBy = job.postedBy as unknown as { _id?: { toString: () => string }; name?: string; email?: string } | null
          return {
            id: (job._id as mongoose.Types.ObjectId).toString(),
            title: job.title,
            description: job.description,
            company: job.company,
            location: job.location,
            type: job.type,
            workMode: job.workMode,
            salary: job.salary,
            salaryText: job.salaryText,
            experienceLevel: job.experienceLevel,
            experienceRange: job.experienceRange,
            hasBondAgreement: job.hasBondAgreement,
            bondDetails: job.bondDetails,
            requirements: job.requirements,
            status: job.status,
            postedBy: postedBy ? {
              id: postedBy._id?.toString() || job.postedBy?.toString() || 'unknown',
              name: postedBy.name || 'Unknown',
              email: postedBy.email || 'unknown@example.com',
            } : {
              id: 'unknown',
              name: 'Unknown',
              email: 'unknown@example.com',
            },
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString(),
          }
        }),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    }

    res.json(response)
  } catch (error: any) {
    console.error('Get jobs error:', error)
    console.error('Error stack:', error.stack)
    const response: ApiResponse<never> = {
      success: false,
      error: error.message || 'Failed to fetch jobs',
    }
    res.status(500).json(response)
  }
}

export const getJobById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    const job = await JobService.getJobById(id)
    if (!job) {
      throw new NotFoundError('Job')
    }

    const response: ApiResponse<{
      id: string
      title: string
      description: string
      company: string
      location: string
      type: string
      workMode?: string
      salary?: {
        min: number
        max: number
        currency: string
      }
      salaryText?: string
      experienceLevel?: string
      experienceRange?: {
        minYears: number
        minMonths: number
        maxYears: number
        maxMonths: number
      }
      hasBondAgreement?: boolean
      bondDetails?: string
      aboutCompany?: string
      responsibilities?: string[]
      keyQualifications?: string[]
      teamEnvironment?: string[]
      companyCulture?: string[]
      requirements: string[]
      postedBy: {
        id: string
        name: string
        email: string
      }
      status: string
      createdAt: string
      updatedAt: string
    }> = {
      success: true,
      data: {
        id: (job._id as mongoose.Types.ObjectId).toString(),
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location,
        type: job.type,
        workMode: job.workMode,
        salary: job.salary,
        salaryText: job.salaryText,
        experienceLevel: job.experienceLevel,
        experienceRange: job.experienceRange,
        hasBondAgreement: job.hasBondAgreement,
        bondDetails: job.bondDetails,
        aboutCompany: job.aboutCompany,
        responsibilities: job.responsibilities,
        keyQualifications: job.keyQualifications,
        teamEnvironment: job.teamEnvironment,
        companyCulture: job.companyCulture,
        requirements: job.requirements,
        postedBy: {
          id: (job.postedBy as unknown as { _id: { toString: () => string } })._id.toString(),
          name: (job.postedBy as unknown as { name: string }).name,
          email: (job.postedBy as unknown as { email: string }).email,
        },
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
      },
    }

    res.json(response)
  } catch (error: any) {
    const errorResponse = createErrorResponse(error)
    res.status(error instanceof AppError ? error.statusCode : 500).json(errorResponse)
  }
}

export const updateJob = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const response: ApiResponse<never> = {
        success: false,
        error: errors.array()[0].msg,
      }
      res.status(400).json(response)
      return
    }

    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const { id } = req.params

    // Update job using service
    const { job, statusChangedToActive } = await JobService.updateJob(
      id,
      req.body,
      req.user.userId,
      req.user.role
    )

    if (!job) {
      throw new NotFoundError('Job')
    }

    // If job status changed to active, notify matching students
    if (statusChangedToActive) {
      JobNotificationService.notifyMatchingStudents(job, 60)
        .then((result) => {
          console.log(
            `📧 Automated notifications sent for job "${job.title}" (status changed to active): ${result.notified}/${result.totalMatching} students notified`
          )
        })
        .catch((error) => {
          console.error('Failed to send automated job notifications:', error)
        })
    }

    const response: ApiResponse<{
      id: string
      title: string
      description: string
      company: string
      location: string
      type: string
      status: string
    }> = {
      success: true,
      data: {
        id: (job._id as mongoose.Types.ObjectId).toString(),
        title: job.title,
        description: job.description,
        company: job.company,
        location: job.location,
        type: job.type,
        status: job.status,
      },
      message: 'Job updated successfully',
    }

    res.json(response)
  } catch (error: any) {
    const errorResponse = createErrorResponse(error)
    res.status(error instanceof AppError ? error.statusCode : 500).json(errorResponse)
  }
}

export const deleteJob = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const { id } = req.params
    const job = await Job.findById(id)

    if (!job) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job not found',
      }
      res.status(404).json(response)
      return
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Not authorized to delete this job',
      }
      res.status(403).json(response)
      return
    }

    await Job.findByIdAndDelete(id)

    const response: ApiResponse<never> = {
      success: true,
      message: 'Job deleted successfully',
    }

    res.json(response)
  } catch (error) {
    console.error('Delete job error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to delete job',
    }
    res.status(500).json(response)
  }
}

export const validateJob = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type')
    .isIn(['full-time', 'part-time', 'contract', 'internship'])
    .withMessage('Invalid job type'),
]

