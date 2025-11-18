import { sendEmail } from './email'
import { sendWhatsApp } from './whatsapp'
import { IJob } from '../models/Job'
import { IUser } from '../models/User'

export interface ShortlistedNotificationData {
  student: IUser
  job: IJob
  applicationId: string
}

export interface JobMatchingNotificationData {
  student: IUser
  job: IJob
}

/**
 * Generate email template for shortlisted notification
 */
const generateShortlistedEmail = (data: ShortlistedNotificationData): string => {
  const { student, job } = data
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Congratulations! You've been Shortlisted</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6E59F6 0%, #5d4ad5 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Dear ${student.name},</p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          We are thrilled to inform you that your application has been <strong>shortlisted</strong> for the following position:
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6E59F6;">
          <h2 style="color: #6E59F6; margin-top: 0; font-size: 22px;">${job.title}</h2>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${job.company}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${job.location}</p>
          ${job.salaryText ? `<p style="margin: 5px 0;"><strong>Salary:</strong> ${job.salaryText}</p>` : ''}
          ${job.type ? `<p style="margin: 5px 0;"><strong>Type:</strong> ${job.type.charAt(0).toUpperCase() + job.type.slice(1)}</p>` : ''}
        </div>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          Your profile has impressed our hiring team, and we would like to move forward with the next steps in the recruitment process.
        </p>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>📋 Next Steps:</strong><br>
            Our team will be in touch with you shortly to schedule the next round of interviews. Please keep an eye on your email and application dashboard for updates.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendUrl}/jobs/${job._id}" 
             style="background: #6E59F6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Job Details
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If you have any questions, please don't hesitate to reach out to our placement team.
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Best regards,<br>
          <strong>Campus Hire Placement Team</strong>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate WhatsApp message for shortlisted notification
 */
const generateShortlistedWhatsApp = (data: ShortlistedNotificationData): string => {
  const { student, job } = data
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const jobLink = `${frontendUrl}/jobs/${job._id}`

  return `Hi ${student.name},

🎉 *Congratulations!*

Your application has been *SHORTLISTED* for the following position:

*${job.title}*
Company: ${job.company}
Location: ${job.location}
${job.salaryText ? `Salary: ${job.salaryText}` : ''}

Your profile has impressed our hiring team, and we would like to move forward with the next steps in the recruitment process.

*Next Step:* Our team will be in touch with you shortly to schedule the next round of interviews. Please keep an eye on your email and application dashboard for updates.

*View Job Details:* ${jobLink}

If you have any questions, please don't hesitate to reach out to our placement team.

This is an automated message — please do not reply.

— Campus Hire Placement Team`
}

/**
 * Send shortlisted notifications (email + WhatsApp) to student
 */
export const sendShortlistedNotifications = async (
  data: ShortlistedNotificationData
): Promise<void> => {
  const { student } = data

  try {
    // Send email notification
    if (student.email) {
      await sendEmail({
        to: student.email,
        subject: `🎉 Congratulations! You've been Shortlisted - ${data.job.title}`,
        html: generateShortlistedEmail(data),
      })
      console.log(`Shortlisted email sent to ${student.email}`)
    }

    // Send WhatsApp notification (if phone number is available)
    if (student.phone) {
      await sendWhatsApp({
        to: student.phone,
        message: generateShortlistedWhatsApp(data),
      })
      console.log(`Shortlisted WhatsApp sent to ${student.phone}`)
    } else {
      console.warn(`No phone number found for student ${student.email}, skipping WhatsApp notification`)
    }
  } catch (error) {
    console.error('Error sending shortlisted notifications:', error)
    // Don't throw - notifications are not critical for the application flow
    // Log the error but allow the status update to proceed
  }
}

/**
 * Generate email template for job matching notification
 */
const generateJobMatchingEmail = (data: JobMatchingNotificationData): string => {
  const { student, job } = data
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const jobLink = `${frontendUrl}/jobs/${job._id}`

  // Format experience range
  const experienceText = job.experienceRange
    ? `${job.experienceRange.minYears} Yrs ${job.experienceRange.minMonths} Mon - ${job.experienceRange.maxYears} Yrs ${job.experienceRange.maxMonths} Mon`
    : job.experienceLevel || 'Not specified'

  // Format salary
  const salaryText = job.salaryText || 
    (job.salary ? `${(job.salary.min / 100000).toFixed(1)} - ${(job.salary.max / 100000).toFixed(1)} LPA` : 'Not specified')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Opportunity Matching Your Profile</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
      <div style="background: #0f1a2b; color: white; padding: 20px; border-radius: 10px; max-width: 600px; margin: 20px auto;">
        <h2 style="margin-top: 0; color: white;">Hi ${student.name}, 🎉</h2>
        <p style="font-size: 16px; line-height: 1.6;">Good news! We've found a new job matching your profile.</p>

        <div style="padding: 15px; background: #162238; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 10px 0;"><b style="color: #3f8cff;">Company:</b> ${job.company}</p>
          <p style="margin: 10px 0;"><b style="color: #3f8cff;">Role:</b> ${job.title}</p>
          <p style="margin: 10px 0;"><b style="color: #3f8cff;">Experience:</b> ${experienceText}</p>
          <p style="margin: 10px 0;"><b style="color: #3f8cff;">Location:</b> ${job.location}${job.workMode ? ` (${job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)})` : ''}</p>
          <p style="margin: 10px 0;"><b style="color: #3f8cff;">Salary:</b> ${salaryText}</p>
          ${job.type ? `<p style="margin: 10px 0;"><b style="color: #3f8cff;">Type:</b> ${job.type.charAt(0).toUpperCase() + job.type.slice(1).replace('-', ' ')}</p>` : ''}
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${jobLink}" 
             style="margin-top: 20px; display: inline-block; background: #3f8cff; padding: 12px 24px; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Apply Now
          </a>
        </div>

        <p style="font-size: 14px; color: #aaa; margin-top: 30px; text-align: center;">
          Best regards,<br>
          <strong>Campus Hire Team</strong>
        </p>
      </div>
    </body>
    </html>
  `
}

/**
 * Send job matching notification to student
 */
export const sendJobMatchingNotification = async (
  data: JobMatchingNotificationData
): Promise<void> => {
  const { student, job } = data

  try {
    // Send email notification
    if (student.email) {
      await sendEmail({
        to: student.email,
        subject: `New Job Opportunity Matching Your Profile - ${job.title} at ${job.company}`,
        html: generateJobMatchingEmail(data),
      })
      console.log(`Job matching email sent to ${student.email} for job: ${job.title}`)
    }

    // Send WhatsApp notification (if phone number is available)
    if (student.phone) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
      const jobLink = `${frontendUrl}/jobs/${job._id}`
      
      // Format experience
      const experienceText = job.experienceRange
        ? `${job.experienceRange.minYears} Yrs ${job.experienceRange.minMonths} Mon - ${job.experienceRange.maxYears} Yrs ${job.experienceRange.maxMonths} Mon`
        : job.experienceLevel || 'Not specified'

      // Format salary
      const salaryText = job.salaryText || 
        (job.salary ? `${(job.salary.min / 100000).toFixed(1)} - ${(job.salary.max / 100000).toFixed(1)} LPA` : 'Not specified')

      // Format work mode
      const workModeText = job.workMode 
        ? job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)
        : ''

      const whatsAppMessage = `Hi ${student.name},

🎉 *New Job Opportunity Matching Your Profile*

*${job.title}*
Company: ${job.company}
Location: ${job.location}${workModeText ? ` (${workModeText})` : ''}
Experience: ${experienceText}
Salary: ${salaryText}
${job.type ? `Type: ${job.type.charAt(0).toUpperCase() + job.type.slice(1).replace('-', ' ')}` : ''}

*Next Step:* Please log into your placement portal and apply for this position.

*Apply Now:* ${jobLink}

If you're not interested, you can dismiss this job from your dashboard.

This is an automated message — please do not reply.

— Campus Hire Placement Team`

      await sendWhatsApp({
        to: student.phone,
        message: whatsAppMessage,
      })
      console.log(`Job matching WhatsApp sent to ${student.phone} for job: ${job.title}`)
    } else {
      console.warn(`No phone number found for student ${student.email}, skipping WhatsApp notification`)
    }
  } catch (error) {
    console.error('Error sending job matching notifications:', error)
    // Don't throw - notifications are not critical for the application flow
  }
}

