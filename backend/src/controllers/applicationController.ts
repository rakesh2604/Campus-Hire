import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { Application } from '../models/Application'
import { Job } from '../models/Job'
import { ApiResponse } from '../../shared/types'
import { RequestWithUser } from '../types'

export const applyToJob = async (
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

    if (req.user.role !== 'candidate') {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Only candidates can apply to jobs',
      }
      res.status(403).json(response)
      return
    }

    const { jobId } = req.params
    const { resume, coverLetter } = req.body

    // Check if job exists
    const job = await Job.findById(jobId)
    if (!job) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job not found',
      }
      res.status(404).json(response)
      return
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      candidateId: req.user.userId,
    })

    if (existingApplication) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'You have already applied to this job',
      }
      res.status(400).json(response)
      return
    }

    // Create application
    const application = new Application({
      jobId,
      candidateId: req.user.userId,
      resume,
      coverLetter,
    })

    await application.save()

    const response: ApiResponse<{
      id: string
      jobId: string
      status: string
      createdAt: string
    }> = {
      success: true,
      data: {
        id: application._id.toString(),
        jobId: application.jobId.toString(),
        status: application.status,
        createdAt: application.createdAt.toISOString(),
      },
      message: 'Application submitted successfully',
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Apply to job error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to submit application',
    }
    res.status(500).json(response)
  }
}

export const getMyApplications = async (
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

    const applications = await Application.find({
      candidateId: req.user.userId,
    })
      .populate('jobId')
      .sort({ createdAt: -1 })

    const response: ApiResponse<{
      applications: Array<{
        id: string
        jobId: string
        job: {
          id: string
          title: string
          company: string
          location: string
        }
        status: string
        createdAt: string
        updatedAt: string
      }>
    }> = {
      success: true,
      data: {
        applications: applications.map((app) => ({
          id: app._id.toString(),
          jobId: app.jobId.toString(),
          job: {
            id: (app.jobId as unknown as { _id: { toString: () => string } })._id.toString(),
            title: (app.jobId as unknown as { title: string }).title,
            company: (app.jobId as unknown as { company: string }).company,
            location: (app.jobId as unknown as { location: string }).location,
          },
          status: app.status,
          createdAt: app.createdAt.toISOString(),
          updatedAt: app.updatedAt.toISOString(),
        })),
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get applications error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch applications',
    }
    res.status(500).json(response)
  }
}

export const getJobApplications = async (
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

    const { jobId } = req.params

    // Check if job exists and user owns it
    const job = await Job.findById(jobId)
    if (!job) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job not found',
      }
      res.status(404).json(response)
      return
    }

    // Allow admin, placement team, or job owner to view applications
    if (
      job.postedBy.toString() !== req.user.userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'placement'
    ) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Not authorized to view applications for this job',
      }
      res.status(403).json(response)
      return
    }

    const applications = await Application.find({ jobId })
      .populate('candidateId', 'name email')
      .sort({ createdAt: -1 })

    const response: ApiResponse<{
      applications: Array<{
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
      }>
    }> = {
      success: true,
      data: {
        applications: applications.map((app) => ({
          id: app._id.toString(),
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
        })),
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get job applications error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch applications',
    }
    res.status(500).json(response)
  }
}

export const updateApplicationStatus = async (
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
    const { status } = req.body

    const application = await Application.findById(id).populate('jobId')
    if (!application) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Application not found',
      }
      res.status(404).json(response)
      return
    }

    const job = application.jobId as unknown as { postedBy: { toString: () => string } }
    // Allow admin, placement team, or job owner to update application status
    if (
      job.postedBy.toString() !== req.user.userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'placement'
    ) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Not authorized to update this application',
      }
      res.status(403).json(response)
      return
    }

    application.status = status
    await application.save()

    const response: ApiResponse<{
      id: string
      status: string
    }> = {
      success: true,
      data: {
        id: application._id.toString(),
        status: application.status,
      },
      message: 'Application status updated successfully',
    }

    res.json(response)
  } catch (error) {
    console.error('Update application status error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to update application status',
    }
    res.status(500).json(response)
  }
}

export const validateApplication = [
  body('status')
    .isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'])
    .withMessage('Invalid application status'),
]

export const validateApply = [
  body('resume').optional().isString(),
  body('coverLetter').optional().isString(),
]

