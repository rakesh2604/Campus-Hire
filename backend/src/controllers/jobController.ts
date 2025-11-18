import { Request, Response } from 'express'
import { body, validationResult, query } from 'express-validator'
import { Job } from '../models/Job'
import { ApiResponse } from '../../shared/types'
import { RequestWithUser } from '../types'

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

    const jobData = {
      ...req.body,
      postedBy: req.user.userId,
    }

    const job = new Job(jobData)
    await job.save()

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
        id: job._id.toString(),
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
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { page = '1', limit = '10', type, location, search } = req.query

    const query: Record<string, unknown> = { status: 'active' }

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

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    const total = await Job.countDocuments(query)

    const response: ApiResponse<{
      jobs: Array<{
        id: string
        title: string
        description: string
        company: string
        location: string
        type: string
        salary?: {
          min: number
          max: number
          currency: string
        }
        requirements: string[]
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
        jobs: jobs.map((job) => ({
          id: job._id.toString(),
          title: job.title,
          description: job.description,
          company: job.company,
          location: job.location,
          type: job.type,
          salary: job.salary,
          requirements: job.requirements,
          postedBy: {
            id: (job.postedBy as unknown as { _id: { toString: () => string } })._id.toString(),
            name: (job.postedBy as unknown as { name: string }).name,
            email: (job.postedBy as unknown as { email: string }).email,
          },
          createdAt: job.createdAt.toISOString(),
          updatedAt: job.updatedAt.toISOString(),
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get jobs error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch jobs',
    }
    res.status(500).json(response)
  }
}

export const getJobById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params

    const job = await Job.findById(id).populate('postedBy', 'name email')
    if (!job) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job not found',
      }
      res.status(404).json(response)
      return
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
        id: job._id.toString(),
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
  } catch (error) {
    console.error('Get job by ID error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch job',
    }
    res.status(500).json(response)
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
    const job = await Job.findById(id)

    if (!job) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job not found',
      }
      res.status(404).json(response)
      return
    }

    // Allow admin, placement team, or job owner to update job
    if (
      job.postedBy.toString() !== req.user.userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'placement'
    ) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Not authorized to update this job',
      }
      res.status(403).json(response)
      return
    }

    Object.assign(job, req.body)
    await job.save()

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
        id: job._id.toString(),
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
  } catch (error) {
    console.error('Update job error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to update job',
    }
    res.status(500).json(response)
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

