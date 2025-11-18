import { IUser } from '../models/User'
import { IJob } from '../models/Job'
import { sendEmail } from '../utils/email'
import { sendWhatsApp } from '../utils/whatsapp'
import { sendShortlistedNotifications, sendJobMatchingNotification as sendJobMatchingNotificationUtil } from '../utils/notifications'

/**
 * Service layer for notification-related business logic
 */
export class NotificationService {
  /**
   * Send shortlisted notification
   * Wrapper around the existing notification utility
   */
  static async sendShortlistedNotification(
    student: IUser,
    job: IJob,
    applicationId: string
  ): Promise<void> {
    await sendShortlistedNotifications({
      student,
      job,
      applicationId,
    })
  }

  /**
   * Send custom email notification
   */
  static async sendEmailNotification(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    await sendEmail({
      to,
      subject,
      html,
    })
  }

  /**
   * Send custom WhatsApp notification
   */
  static async sendWhatsAppNotification(
    to: string,
    message: string
  ): Promise<void> {
    await sendWhatsApp({
      to,
      message,
    })
  }

  /**
   * Send application status update notification
   */
  static async sendApplicationStatusNotification(
    student: IUser,
    job: IJob,
    status: 'reviewed' | 'shortlisted' | 'rejected' | 'accepted'
  ): Promise<void> {
    const statusMessages: Record<string, { subject: string; message: string }> = {
      reviewed: {
        subject: `Application Reviewed: ${job.title} at ${job.company}`,
        message: `Your application for ${job.title} at ${job.company} has been reviewed.`,
      },
      shortlisted: {
        subject: `Congratulations! You're Shortlisted for ${job.title}`,
        message: `You have been shortlisted for ${job.title} at ${job.company}!`,
      },
      rejected: {
        subject: `Application Update: ${job.title} at ${job.company}`,
        message: `Thank you for your interest. Unfortunately, we cannot proceed with your application for ${job.title} at ${job.company}.`,
      },
      accepted: {
        subject: `Congratulations! Offer for ${job.title} at ${job.company}`,
        message: `Congratulations! You have been accepted for ${job.title} at ${job.company}!`,
      },
    }

    const { subject, message } = statusMessages[status] || statusMessages.reviewed

    // Send email
    await this.sendEmailNotification(
      student.email,
      subject,
      `
        <h1>${subject}</h1>
        <p>Dear ${student.name},</p>
        <p>${message}</p>
        <p>Job: ${job.title}</p>
        <p>Company: ${job.company}</p>
        <p>Location: ${job.location}</p>
        <p>Best regards,<br/>The CampusHire Team</p>
      `
    )

    // Send WhatsApp if phone number available
    if (student.phone) {
      await this.sendWhatsAppNotification(
        student.phone,
        `${subject}\n\n${message}\n\nJob: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}`
      )
    }
  }

  /**
   * Send job matching notification (when a new job matches student profile)
   */
  static async sendJobMatchingNotification(
    student: IUser,
    job: IJob
  ): Promise<void> {
    await sendJobMatchingNotificationUtil({
      student,
      job,
    })
  }
}

