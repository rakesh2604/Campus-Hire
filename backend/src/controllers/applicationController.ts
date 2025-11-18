import { Response } from 'express'
import { validationResult, body } from 'express-validator'
import { ApplicationService } from '../services/applicationService'
import { AppError, createErrorResponse, AuthenticationError, ValidationError, ErrorCode } from '../utils/errors'
import { RequestWithUser, ApiResponse } from '../types'

export const applyToJob = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg)
    }

    if (!req.user) {
      throw new AuthenticationError()
    }

    if (req.user.role !== 'candidate') {
      throw new AppError(
        ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
        'Only candidates can apply to jobs',
        403
      )
    }

    const { jobId } = req.params
    const { resume, coverLetter } = req.body

    const application = await ApplicationService.applyToJob(
      jobId,
      req.user.userId,
      resume,
      coverLetter
    )

    const response: ApiResponse<{
      id: string
      jobId: string
      status: string
      createdAt: string
    }> = {
      success: true,
      data: {
        id: (application as any)._id.toString(),
        jobId: application.jobId.toString(),
        status: application.status,
        createdAt: application.createdAt.toISOString(),
      },
      message: 'Application submitted successfully',
    }

    res.status(201).json(response)
  } catch (error: any) {
    const errorResponse = createErrorResponse(error)
    res.status(error instanceof AppError ? error.statusCode : 500).json(errorResponse)
  }
}

export const getMyApplications = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError()
    }

    const result = await ApplicationService.getMyApplications(req.user.userId)

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
    }

    res.json(response)
  } catch (error: any) {
    const errorResponse = createErrorResponse(error)
    res.status(error instanceof AppError ? error.statusCode : 500).json(errorResponse)
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

    const applications = await ApplicationService.getJobApplications(
      jobId,
      req.user.userId,
      req.user.role
    )

    const response: ApiResponse<{
      applications: typeof applications
    }> = {
      success: true,
      data: {
        applications,
      },
    }

    res.json(response)
  } catch (error: any) {
    const errorResponse = createErrorResponse(error)
    res.status(error instanceof AppError ? error.statusCode : 500).json(errorResponse)
  }
}

export const updateApplicationStatus = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg)
    }

    if (!req.user) {
      throw new AuthenticationError()
    }

    const { id } = req.params
    const { status } = req.body

    const { application, validation } = await ApplicationService.updateApplicationStatus(
      id,
      status,
      req.user.userId,
      req.user.role
    )

    const response: ApiResponse<{
      id: string
      status: string
      validation?: typeof validation
    }> = {
      success: true,
      data: {
        id: (application as any)._id.toString(),
        status: application.status,
        ...(validation && { validation }),
      },
      message: 'Application status updated successfully',
    }

    res.json(response)
  } catch (error: any) {
    const errorResponse = createErrorResponse(error)
    if (error instanceof AppError && errorResponse.code === 'RESOURCE_CONFLICT' && (error as any).validation) {
      // Include validation data in error response for shortlist failures
      const response: ApiResponse<{ validation: any }> = {
        success: false,
        error: error.message,
        data: { validation: (error as any).validation },
      }
      res.status(error.statusCode).json(response)
    } else {
      res.status(error instanceof AppError ? error.statusCode : 500).json(errorResponse)
    }
  }
}

export const validateApplication = [
  body('status')
    .isIn(['pending', 'reviewed', 'shortlisted', 'rejected', 'accepted'])
    .withMessage('Invalid application status'),
]

export const dismissJob = async (
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

    if (req.user.role !== 'candidate') {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Only candidates can dismiss jobs',
      }
      res.status(403).json(response)
      return
    }

    const { jobId } = req.params
    const { reason } = req.body as { reason?: string }

    await ApplicationService.dismissJob(jobId, req.user.userId, reason)

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Job marked as not interested',
      },
    }

    res.json(response)
  } catch (error: any) {
    const errorResponse = createErrorResponse(error)
    res.status(error instanceof AppError ? error.statusCode : 500).json(errorResponse)
  }
}

export const validateApply = [
  body('resume').optional().isString(),
  body('coverLetter').optional().isString(),
]

