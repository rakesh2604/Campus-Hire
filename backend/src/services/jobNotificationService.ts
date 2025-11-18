import { IJob } from '../models/Job'
import { JobMatchingService, MatchingStudent } from './jobMatchingService'
import { NotificationService } from './notificationService'

export interface NotificationResult {
  totalMatching: number
  notified: number
  failed: number
  errors: Array<{ studentEmail: string; error: string }>
}

/**
 * Service for handling job-related notifications
 * Handles the complete flow: find matches → send notifications
 */
export class JobNotificationService {
  /**
   * Notify all matching students about a new job
   * This is the main entry point for automated job notifications
   */
  static async notifyMatchingStudents(
    job: IJob,
    minMatchScore: number = 60
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      totalMatching: 0,
      notified: 0,
      failed: 0,
      errors: [],
    }

    // Only notify for active jobs
    if (job.status !== 'active') {
      console.log(`Skipping notifications for job ${job._id} - status is ${job.status}`)
      return result
    }

    try {
      // Find all matching students
      const matchingStudents = await JobMatchingService.findMatchingStudents(job, minMatchScore)
      result.totalMatching = matchingStudents.length

      if (matchingStudents.length === 0) {
        console.log(`No matching students found for job: ${job.title} at ${job.company}`)
        return result
      }

      console.log(`Found ${matchingStudents.length} matching students for job: ${job.title}`)

      // Send notifications to all matching students (in parallel, but with error handling)
      const notificationPromises = matchingStudents.map(async (match: MatchingStudent) => {
        try {
          await NotificationService.sendJobMatchingNotification(match.student, job)
          result.notified++
          console.log(
            `✅ Notified ${match.student.email} (match score: ${match.matchScore}%) for job: ${job.title}`
          )
        } catch (error: any) {
          result.failed++
          result.errors.push({
            studentEmail: match.student.email || 'unknown',
            error: error?.message || 'Unknown error',
          })
          console.error(
            `❌ Failed to notify ${match.student.email} for job ${job.title}:`,
            error?.message || error
          )
        }
      })

      // Wait for all notifications to complete (with error handling)
      await Promise.allSettled(notificationPromises)

      console.log(
        `📧 Job notification summary for "${job.title}": ${result.notified}/${result.totalMatching} students notified successfully`
      )

      return result
    } catch (error: any) {
      console.error('Error in notifyMatchingStudents:', error)
      throw error
    }
  }

  /**
   * Notify a specific student about a job (manual trigger)
   */
  static async notifyStudent(job: IJob, studentId: string): Promise<void> {
    const { User } = await import('../models/User')
    const student = await User.findById(studentId)

    if (!student) {
      throw new Error('Student not found')
    }

    await NotificationService.sendJobMatchingNotification(student, job)
  }

  /**
   * Batch notify multiple students about a job
   */
  static async notifyStudents(job: IJob, studentIds: string[]): Promise<NotificationResult> {
    const result: NotificationResult = {
      totalMatching: studentIds.length,
      notified: 0,
      failed: 0,
      errors: [],
    }

    const { User } = await import('../models/User')
    const students = await User.find({ _id: { $in: studentIds } })

    for (const student of students) {
      try {
        await NotificationService.sendJobMatchingNotification(student, job)
        result.notified++
      } catch (error: any) {
        result.failed++
        result.errors.push({
          studentEmail: student.email || 'unknown',
          error: error?.message || 'Unknown error',
        })
      }
    }

    return result
  }
}

