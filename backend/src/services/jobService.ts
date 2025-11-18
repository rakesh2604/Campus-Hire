import { IJob } from '../models/Job'
import { Job } from '../models/Job'
import { User } from '../models/User'
import mongoose from 'mongoose'
// ApiResponse not needed here, removing
import { cache, cacheKeys } from '../utils/cache'

export interface JobQueryParams {
  page?: number
  limit?: number
  type?: string
  location?: string
  search?: string
  view?: 'candidate' | 'recruiter' | 'placement'
  status?: string
  userId?: string
  userRole?: string
}

export interface JobListResponse {
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
}

/**
 * Service layer for job-related business logic
 */
export class JobService {
  /**
   * Get jobs with filtering, pagination, and role-based access (with caching)
   */
  static async getJobs(params: JobQueryParams): Promise<JobListResponse> {
    // Create cache key from params
    const cacheKey = cacheKeys.jobs(JSON.stringify(params))
    
    // Check cache first (only for non-user-specific queries)
    if (!params.userId) {
      const cached = cache.get<JobListResponse>(cacheKey)
      if (cached) {
        return cached
      }
    }
    const {
      page = 1,
      limit = 10,
      type,
      location,
      search,
      view,
      status,
      userId,
    } = params

    const pageNum = Math.max(1, parseInt(String(page), 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10)))
    const skip = (pageNum - 1) * limitNum

    // Build query
    const query: any = {}

    // Status filter
    if (status) {
      query.status = status
    } else if (view === 'candidate' || !view) {
      // For candidates, only show active jobs by default
      query.status = 'active'
    }

    // Type filter
    if (type) {
      query.type = type
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' }
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ]
    }

    // Role-based filtering
    if (view === 'recruiter' && userId) {
      query.postedBy = new mongoose.Types.ObjectId(userId)
    }

    // For candidates, filter out dismissed jobs
    let dismissedJobIds: string[] = []
    if (view === 'candidate' && userId) {
      try {
        const user = await User.findById(userId).select('dismissedJobs').lean()
        if (user?.dismissedJobs && Array.isArray(user.dismissedJobs)) {
          dismissedJobIds = user.dismissedJobs
            .map((item: any) => {
              try {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                  if (item.jobId !== undefined && item.jobId !== null) {
                    if (
                      item.jobId.toString &&
                      typeof item.jobId.toString === 'function' &&
                      item.jobId.constructor.name === 'ObjectId'
                    ) {
                      const id = item.jobId.toString()
                      if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
                        return id
                      }
                    }
                    if (typeof item.jobId === 'string' && /^[0-9a-fA-F]{24}$/.test(item.jobId)) {
                      return item.jobId
                    }
                  }
                }
                return null
              } catch (error) {
                return null
              }
            })
            .filter((id: string | null): id is string => id !== null && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id))
        }
      } catch (error) {
        console.warn('Error fetching dismissed jobs:', error)
      }
    }

    let jobsQuery = Job.find(query)

    if (dismissedJobIds.length > 0) {
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
        jobsQuery = jobsQuery.where('_id').nin(dismissedObjectIds)
      }
    }

    const jobs = await jobsQuery
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Count total
    let countQuery = Job.countDocuments(query)
    if (dismissedJobIds.length > 0) {
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

    const result = {
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
          postedBy: postedBy
            ? {
                id: postedBy._id?.toString() || job.postedBy?.toString() || 'unknown',
                name: postedBy.name || 'Unknown',
                email: postedBy.email || 'unknown@example.com',
              }
            : {
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
    }

    // Cache result (only for non-user-specific queries)
    if (!params.userId) {
      cache.set(cacheKey, result, 2 * 60 * 1000) // Cache for 2 minutes
    }

    return result
  }

  /**
   * Get a single job by ID (with caching)
   */
  static async getJobById(id: string): Promise<IJob | null> {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return null
    }

    // Check cache first
    const cacheKey = cacheKeys.job(id)
    const cached = cache.get<IJob>(cacheKey)
    if (cached) {
      return cached
    }

    const job = await Job.findById(id).populate('postedBy', 'name email')
    
    if (job) {
      // Cache for 5 minutes
      cache.set(cacheKey, job, 5 * 60 * 1000)
    }

    return job
  }

  /**
   * Create a new job
   */
  static async createJob(jobData: Partial<IJob>, postedBy: string): Promise<IJob> {
    const job = new Job({
      ...jobData,
      postedBy: new mongoose.Types.ObjectId(postedBy),
      status: jobData.status || 'active',
    })

    await job.save()

    // Invalidate cache
    cache.clear() // Clear jobs list cache

    return job
  }

  /**
   * Update a job
   */
  static async updateJob(id: string, jobData: Partial<IJob>, userId: string, userRole: string): Promise<{ job: IJob | null; statusChangedToActive: boolean }> {
    const job = await Job.findById(id)

    if (!job) {
      return { job: null, statusChangedToActive: false }
    }

    // Check permissions
    const isAuthorized =
      userRole === 'admin' ||
      userRole === 'placement' ||
      (userRole === 'recruiter' && job.postedBy.toString() === userId)

    if (!isAuthorized) {
      throw new Error('Unauthorized to update this job')
    }

    // Track if status is changing to active
    const wasInactive = job.status !== 'active'
    const willBeActive = jobData.status === 'active' || (jobData.status === undefined && job.status === 'active')
    const statusChangedToActive = wasInactive && willBeActive

    Object.assign(job, jobData)
    await job.save()

    // Invalidate cache
    cache.delete(cacheKeys.job(id))
    cache.clear() // Clear jobs list cache as it may have changed

    return { job, statusChangedToActive }
  }

  /**
   * Delete a job
   */
  static async deleteJob(id: string, userId: string, userRole: string): Promise<boolean> {
    const job = await Job.findById(id)

    if (!job) {
      return false
    }

    // Check permissions
    const isAuthorized =
      userRole === 'admin' ||
      userRole === 'placement' ||
      (userRole === 'recruiter' && job.postedBy.toString() === userId)

    if (!isAuthorized) {
      throw new Error('Unauthorized to delete this job')
    }

    await job.deleteOne()

    // Invalidate cache
    cache.delete(cacheKeys.job(id))
    cache.clear() // Clear jobs list cache

    return true
  }
}

