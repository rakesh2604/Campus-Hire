import { IJob } from '../models/Job'
import { IUser } from '../models/User'

export interface ValidationResult {
  isValid: boolean
  reasons: string[]
  score: number // 0-100
}

/**
 * Validate student resume/profile against job criteria
 */
export const validateResumeAgainstJob = (
  student: IUser,
  job: IJob
): ValidationResult => {
  const reasons: string[] = []
  let score = 0
  const maxScore = 100
  let currentScore = 0

  // 1. Experience Validation (30 points)
  if (job.experienceRange) {
    const studentExperience = student.workExperience || 0
    const jobMinYears = job.experienceRange.minYears || 0
    const jobMinMonths = job.experienceRange.minMonths || 0
    const jobMaxYears = job.experienceRange.maxYears || 0
    const jobMaxMonths = job.experienceRange.maxMonths || 0

    const studentTotalMonths = studentExperience * 12
    const jobMinTotalMonths = jobMinYears * 12 + jobMinMonths
    const jobMaxTotalMonths = jobMaxYears * 12 + jobMaxMonths

    if (studentTotalMonths < jobMinTotalMonths) {
      reasons.push(
        `Experience requirement not met: Job requires ${jobMinYears} years ${jobMinMonths} months, but candidate has ${studentExperience} years`
      )
    } else if (jobMaxTotalMonths > 0 && studentTotalMonths > jobMaxTotalMonths) {
      reasons.push(
        `Over-qualified: Job requires up to ${jobMaxYears} years ${jobMaxMonths} months, but candidate has ${studentExperience} years`
      )
      // Still give some points for over-qualification
      currentScore += 20
    } else {
      currentScore += 30
    }
  } else {
    // No experience requirement specified, give full points
    currentScore += 30
  }

  // 2. Location Preference (15 points)
  if (job.location && student.preferredLocations && student.preferredLocations.length > 0) {
    const jobLocationLower = job.location.toLowerCase()
    const hasPreferredLocation = student.preferredLocations.some(
      (loc) => loc.toLowerCase().includes(jobLocationLower) || jobLocationLower.includes(loc.toLowerCase())
    )
    if (hasPreferredLocation) {
      currentScore += 15
    } else {
      reasons.push(`Location preference mismatch: Job is in ${job.location}, but candidate prefers ${student.preferredLocations.join(', ')}`)
    }
  } else {
    // No location preference specified, give full points
    currentScore += 15
  }

  // 3. Resume Availability (20 points)
  if (student.resume) {
    currentScore += 20
  } else {
    reasons.push('Resume not uploaded')
  }

  // 4. Profile Completeness (20 points)
  let profileCompleteness = 0
  if (student.description) profileCompleteness += 5
  if (student.workExperiences && student.workExperiences.length > 0) profileCompleteness += 5
  if (student.projects && student.projects.length > 0) profileCompleteness += 5
  if (student.educations && student.educations.length > 0) profileCompleteness += 5
  currentScore += profileCompleteness

  if (profileCompleteness < 15) {
    reasons.push('Profile is incomplete - missing key information')
  }

  // 5. Skills/Qualifications Match (15 points)
  // This is a basic check - in a real system, you'd parse resume text or use AI
  if (job.keyQualifications && job.keyQualifications.length > 0) {
    // Check if student has relevant projects/experiences that might indicate skills
    const hasRelevantContent =
      (student.projects && student.projects.length > 0) ||
      (student.workExperiences && student.workExperiences.length > 0) ||
      (student.description && student.description.length > 50)

    if (hasRelevantContent) {
      currentScore += 15
    } else {
      reasons.push('Limited evidence of required qualifications in profile')
    }
  } else {
    currentScore += 15
  }

  score = Math.min(currentScore, maxScore)
  const isValid = score >= 60 // Minimum 60% match required

  return {
    isValid,
    reasons,
    score,
  }
}

