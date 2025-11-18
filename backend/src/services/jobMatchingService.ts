import { User, IUser } from '../models/User'
import { Job, IJob } from '../models/Job'
import { Application } from '../models/Application'
import { validateResumeAgainstJob } from '../utils/resumeValidator'
import mongoose from 'mongoose'

export interface MatchingStudent {
  student: IUser
  matchScore: number
  reasons: string[]
}

export interface JobMatchingResult {
  totalStudents: number
  matchingStudents: MatchingStudent[]
  notifiedCount: number
  skippedCount: number
}

/**
 * Service for matching jobs to students and sending notifications
 */
export class JobMatchingService {
  /**
   * Find all students that match a job's criteria
   */
  static async findMatchingStudents(
    job: IJob,
    minMatchScore: number = 60
  ): Promise<MatchingStudent[]> {
    // Only match active jobs
    if (job.status !== 'active') {
      return []
    }

    // Get all candidate users
    const students = await User.find({ role: 'candidate' }).lean()

    const matchingStudents: MatchingStudent[] = []

    for (const student of students) {
      // Skip if student has dismissed this job
      if (student.dismissedJobs) {
        const hasDismissed = student.dismissedJobs.some(
          (dismissed) => dismissed.jobId.toString() === (job._id as mongoose.Types.ObjectId).toString()
        )
        if (hasDismissed) {
          continue
        }
      }

      // Check if student has already applied
      const existingApplication = await Application.findOne({
        jobId: job._id,
        candidateId: student._id,
      })

      if (existingApplication) {
        continue // Skip if already applied
      }

      // Validate student against job criteria
      const validation = validateResumeAgainstJob(student as unknown as IUser, job)

      if (validation.score >= minMatchScore) {
        matchingStudents.push({
          student: student as unknown as IUser,
          matchScore: validation.score,
          reasons: validation.reasons,
        })
      }
    }

    // Sort by match score (highest first)
    matchingStudents.sort((a, b) => b.matchScore - a.matchScore)

    return matchingStudents
  }

  /**
   * Find matching students and return result with counts
   */
  static async findMatchingStudentsWithDetails(
    job: IJob,
    minMatchScore: number = 60
  ): Promise<JobMatchingResult> {
    const totalStudents = await User.countDocuments({ role: 'candidate' })
    const matchingStudents = await this.findMatchingStudents(job, minMatchScore)

    return {
      totalStudents,
      matchingStudents,
      notifiedCount: 0, // Will be set after notifications are sent
      skippedCount: totalStudents - matchingStudents.length,
    }
  }

  /**
   * Check if a student matches a job (quick check)
   */
  static async doesStudentMatchJob(
    studentId: string,
    jobId: string,
    minMatchScore: number = 60
  ): Promise<{ matches: boolean; score: number; reasons: string[] }> {
    const student = await User.findById(studentId)
    const job = await Job.findById(jobId)

    if (!student || !job) {
      return { matches: false, score: 0, reasons: ['Student or job not found'] }
    }

    // Check if dismissed
    if (student.dismissedJobs) {
      const hasDismissed = student.dismissedJobs.some(
        (dismissed) => dismissed.jobId.toString() === jobId
      )
      if (hasDismissed) {
        return { matches: false, score: 0, reasons: ['Job was dismissed by student'] }
      }
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      jobId,
      candidateId: studentId,
    })

    if (existingApplication) {
      return { matches: false, score: 0, reasons: ['Already applied to this job'] }
    }

    const validation = validateResumeAgainstJob(student, job)

    return {
      matches: validation.score >= minMatchScore,
      score: validation.score,
      reasons: validation.reasons,
    }
  }
}

