import { Application, IApplication } from '../models/Application'
import { Job, IJob } from '../models/Job'
import { User } from '../models/User'
import mongoose from 'mongoose'
import { validateResumeAgainstJob, ValidationResult } from '../utils/resumeValidator'
import { sendShortlistedNotifications } from '../utils/notifications'
import { NotFoundError, ConflictError, AuthorizationError } from '../utils/errors'
import { withTransaction } from '../utils/transactions'
import { cache, cacheKeys } from '../utils/cache'

export interface ApplicationResponse {
  id: string
  jobId: string
  candidateId: string
  status: string
  resume?: string
  coverLetter?: string
  rounds?: Array<{
    roundNumber: number
    roundName: string
    status: string
    scheduledDate?: string
    completedDate?: string
    feedback?: string
    score?: number
  }>
  currentRound?: number
  totalRounds?: number
  job?: {
    id: string
    title: string
    company: string
    location: string
  }
  createdAt: string
  updatedAt: string
}

export interface ApplicationListResponse {
  applications: ApplicationResponse[]
  dismissedJobs?: any[]
}

/**
 * Service layer for application-related business logic
 */
export class ApplicationService {
  /**
   * Apply to a job (with transaction)
   */
  static async applyToJob(
    jobId: string,
    candidateId: string,
    resume?: string,
    coverLetter?: string
  ): Promise<IApplication> {
    return withTransaction(async (session) => {
      // Check if job exists
      const job = await Job.findById(jobId).session(session)
      if (!job) {
        throw new NotFoundError('Job')
      }

      // Check if job is active
      if (job.status !== 'active') {
        throw new ConflictError('Cannot apply to inactive job')
      }

      // Check if already applied
      const existingApplication = await Application.findOne({
        jobId,
        candidateId,
      }).session(session)

      if (existingApplication) {
        throw new ConflictError('You have already applied to this job')
      }

      // Create application
      const application = new Application({
        jobId: new mongoose.Types.ObjectId(jobId),
        candidateId: new mongoose.Types.ObjectId(candidateId),
        resume,
        coverLetter,
        status: 'pending',
      })

      await application.save({ session })

      // Invalidate cache
      cache.delete(cacheKeys.applications(candidateId))
      cache.delete(cacheKeys.jobApplications(jobId))

      return application
    })
  }

  /**
   * Get user's applications
   */
  static async getMyApplications(candidateId: string): Promise<ApplicationListResponse> {
    const applications = await Application.find({
      candidateId: new mongoose.Types.ObjectId(candidateId),
    })
      .populate('jobId')
      .sort({ createdAt: -1 })

    const user = await User.findById(candidateId).populate('dismissedJobs.jobId')

    const dismissedJobs = (user?.dismissedJobs || [])
      .filter((entry) => entry.jobId)
      .map((entry) => {
        const job = entry.jobId as unknown as IJob
        return {
          id: (entry as any)._id?.toString() || '',
          job: {
            id: (job._id as any).toString(),
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
            postedBy: job.postedBy.toString(),
            createdAt: job.createdAt.toISOString(),
            updatedAt: job.updatedAt.toISOString(),
            status: job.status,
          },
          reason: entry.reason,
          dismissedAt: entry.dismissedAt?.toISOString() || new Date().toISOString(),
        }
      })

    return {
      applications: applications.map((app) => ({
        id: (app._id as mongoose.Types.ObjectId).toString(),
        candidateId: app.candidateId.toString(),
        jobId: app.jobId.toString(),
        job: {
          id: (app.jobId as unknown as { _id: { toString: () => string } })._id.toString(),
          title: (app.jobId as unknown as { title: string }).title,
          company: (app.jobId as unknown as { company: string }).company,
          location: (app.jobId as unknown as { location: string }).location,
        },
        status: app.status,
        resume: app.resume,
        coverLetter: app.coverLetter,
        rounds: app.rounds?.map((round) => ({
          roundNumber: round.roundNumber,
          roundName: round.roundName,
          status: round.status,
          scheduledDate: round.scheduledDate?.toISOString(),
          completedDate: round.completedDate?.toISOString(),
          feedback: round.feedback,
          score: round.score,
        })),
        currentRound: app.currentRound,
        totalRounds: app.totalRounds,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
      })),
      dismissedJobs,
    }
  }

  /**
   * Get applications for a specific job
   */
  static async getJobApplications(jobId: string, userId: string, userRole: string): Promise<Array<{
    id: string
    candidateId: string
    candidate: {
      id: string
      name: string
      email: string
    }
    status: string
    resume?: string
    coverLetter?: string
    createdAt: string
    updatedAt: string
  }>> {
    const job = await Job.findById(jobId)
    if (!job) {
      throw new NotFoundError('Job')
    }

    // Check permissions
    const isAuthorized =
      userRole === 'admin' ||
      userRole === 'placement' ||
      (userRole === 'recruiter' && job.postedBy.toString() === userId)

    if (!isAuthorized) {
      throw new AuthorizationError('You are not authorized to view applications for this job')
    }

    const applications = await Application.find({
      jobId: new mongoose.Types.ObjectId(jobId),
    })
      .populate('candidateId', 'name email profilePicture currentLocation workExperience')
      .sort({ createdAt: -1 })

    return applications.map((app) => ({
      id: (app._id as mongoose.Types.ObjectId).toString(),
      candidateId: app.candidateId.toString(),
      candidate: {
        id: (app.candidateId as unknown as { _id: { toString: () => string } })._id.toString(),
        name: (app.candidateId as unknown as { name: string }).name,
        email: (app.candidateId as unknown as { email: string }).email,
      },
      status: app.status,
      resume: app.resume,
      coverLetter: app.coverLetter,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }))
  }

  /**
   * Update application status
   */
  static async updateApplicationStatus(
    applicationId: string,
    status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted',
    userId: string,
    userRole: string
  ): Promise<{ application: IApplication; validation?: ValidationResult }> {
    const application = await Application.findById(applicationId).populate('jobId')
    if (!application) {
      throw new NotFoundError('Application')
    }

    const job = application.jobId as unknown as IJob & { postedBy: { toString: () => string } }

    // Check permissions
    const isAuthorized =
      userRole === 'admin' ||
      userRole === 'placement' ||
      (userRole === 'recruiter' && job.postedBy.toString() === userId)

    if (!isAuthorized) {
      throw new AuthorizationError('You are not authorized to update this application')
    }

    // Validate resume for reviewed/shortlisted status
    let validation: ValidationResult | undefined
    if (status === 'reviewed' || status === 'shortlisted') {
      const candidate = await User.findById(application.candidateId)
      if (!candidate) {
        throw new NotFoundError('Candidate')
      }

      validation = validateResumeAgainstJob(candidate, job)

      // For shortlisted, require minimum 60% match
      if (status === 'shortlisted' && !validation.isValid) {
        const error = new ConflictError(
          `Cannot shortlist: Resume does not meet job criteria (Score: ${validation.score}%). ${validation.reasons.join('; ')}`
        )
        ;(error as any).validation = validation
        throw error
      }
    }

    const previousStatus = application.status
    application.status = status
    await application.save()

    // Invalidate cache
    cache.delete(cacheKeys.application((application._id as mongoose.Types.ObjectId).toString()))
    cache.delete(cacheKeys.applications(application.candidateId.toString()))
    cache.delete(cacheKeys.jobApplications((job._id as mongoose.Types.ObjectId).toString()))

    // Send notifications when status changes to 'shortlisted'
    if (status === 'shortlisted' && previousStatus !== 'shortlisted') {
      const candidate = await User.findById(application.candidateId)
      if (candidate) {
        const fullJob = await Job.findById(job._id as mongoose.Types.ObjectId)
        if (fullJob) {
          sendShortlistedNotifications({
            student: candidate,
            job: fullJob,
            applicationId: (application._id as mongoose.Types.ObjectId).toString(),
          }).catch((error) => {
            console.error('Failed to send shortlisted notifications:', error)
          })
        }
      }
    }

    return { application, validation }
  }

  /**
   * Dismiss a job (mark as not interested)
   */
  static async dismissJob(jobId: string, userId: string, reason?: string): Promise<void> {
    const job = await Job.findById(jobId)
    if (!job) {
      throw new NotFoundError('Job')
    }

    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('User')
    }

    if (!user.dismissedJobs) {
      user.dismissedJobs = []
    }

    // Update existing or add new dismissed job entry
    const existingDismissedJobIndex = user.dismissedJobs.findIndex(
      (item) => item.jobId.toString() === (job._id as mongoose.Types.ObjectId).toString()
    )

    if (existingDismissedJobIndex > -1) {
      user.dismissedJobs[existingDismissedJobIndex].reason = reason
      user.dismissedJobs[existingDismissedJobIndex].dismissedAt = new Date()
    } else {
      user.dismissedJobs.push({
        jobId: job._id as mongoose.Types.ObjectId,
        reason,
        dismissedAt: new Date(),
      })
    }

    await user.save()
  }
}

