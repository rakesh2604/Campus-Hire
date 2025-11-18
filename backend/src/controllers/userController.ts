import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User'
import { hashPassword } from '../utils/auth'
import { ApiResponse } from '../../shared/types'
import { RequestWithUser } from '../types'

export const updateProfile = async (
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

    const {
      name,
      email,
      password,
      workExperience,
      graduationYear,
      currentLocation,
      description,
      portfolioLink,
      availableToJoin,
      preferredLocations,
      companyType,
      linkedin,
      github,
      currentCTC,
      desiredCTCMin,
      desiredCTCMax,
      profilePicture,
      resume,
      workExperiences,
      projects,
      educations,
      certificates,
    } = req.body

    const user = await User.findById(req.user.userId)

    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User not found',
      }
      res.status(404).json(response)
      return
    }

    // Update basic fields
    if (name !== undefined) user.name = name
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } })
      if (existingUser) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Email already in use',
        }
        res.status(400).json(response)
        return
      }
      user.email = email
    }
    if (password) {
      user.password = await hashPassword(password)
    }

    // Update profile fields
    if (workExperience !== undefined) user.workExperience = Number(workExperience)
    if (graduationYear !== undefined) user.graduationYear = graduationYear
    if (currentLocation !== undefined) user.currentLocation = currentLocation
    if (description !== undefined) user.description = description
    if (portfolioLink !== undefined) user.portfolioLink = portfolioLink
    if (availableToJoin !== undefined) user.availableToJoin = availableToJoin
    if (preferredLocations !== undefined) {
      try {
        user.preferredLocations = typeof preferredLocations === 'string' 
          ? JSON.parse(preferredLocations) 
          : preferredLocations
      } catch {
        user.preferredLocations = []
      }
    }
    if (companyType !== undefined) {
      try {
        user.companyType = typeof companyType === 'string' 
          ? JSON.parse(companyType) 
          : companyType
      } catch {
        user.companyType = []
      }
    }
    if (linkedin !== undefined) user.linkedin = linkedin
    if (github !== undefined) user.github = github
    if (currentCTC !== undefined) user.currentCTC = Number(currentCTC)
    if (desiredCTCMin !== undefined) user.desiredCTCMin = Number(desiredCTCMin)
    if (desiredCTCMax !== undefined) user.desiredCTCMax = Number(desiredCTCMax)
    if (profilePicture !== undefined) user.profilePicture = profilePicture
    if (resume !== undefined) user.resume = resume
    
    // Update arrays
    if (workExperiences !== undefined) {
      try {
        user.workExperiences = typeof workExperiences === 'string' 
          ? JSON.parse(workExperiences) 
          : workExperiences
      } catch {
        user.workExperiences = []
      }
    }
    if (projects !== undefined) {
      try {
        user.projects = typeof projects === 'string' 
          ? JSON.parse(projects) 
          : projects
      } catch {
        user.projects = []
      }
    }
    if (educations !== undefined) {
      try {
        user.educations = typeof educations === 'string' 
          ? JSON.parse(educations) 
          : educations
      } catch {
        user.educations = []
      }
    }
    if (certificates !== undefined) {
      try {
        user.certificates = typeof certificates === 'string' 
          ? JSON.parse(certificates) 
          : certificates
      } catch {
        user.certificates = []
      }
    }

    await user.save()

    const response: ApiResponse<{
      id: string
      email: string
      name: string
      role: string
      workExperience?: number
      graduationYear?: string
      currentLocation?: string
      description?: string
      portfolioLink?: string
      availableToJoin?: string
      preferredLocations?: string[]
      companyType?: string[]
      linkedin?: string
      github?: string
      currentCTC?: number
      desiredCTCMin?: number
      desiredCTCMax?: number
      profilePicture?: string
      resume?: string
      workExperiences?: Array<{
        title: string
        company: string
        location?: string
        duration?: string
        description: string
        startDate?: string
        endDate?: string
      }>
      projects?: Array<{
        name: string
        description: string
        link?: string
        technologies?: string[]
      }>
      educations?: Array<{
        degree: string
        institution: string
        location?: string
        startDate?: string
        endDate?: string
        fieldOfStudy?: string
      }>
      certificates?: Array<{
        name: string
        issuer: string
        date: string
        link?: string
      }>
    }> = {
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        workExperience: user.workExperience,
        graduationYear: user.graduationYear,
        currentLocation: user.currentLocation,
        description: user.description,
        portfolioLink: user.portfolioLink,
        availableToJoin: user.availableToJoin,
        preferredLocations: user.preferredLocations,
        companyType: user.companyType,
        linkedin: user.linkedin,
        github: user.github,
        currentCTC: user.currentCTC,
        desiredCTCMin: user.desiredCTCMin,
        desiredCTCMax: user.desiredCTCMax,
        profilePicture: user.profilePicture,
        resume: user.resume,
        workExperiences: user.workExperiences,
        projects: user.projects,
        educations: user.educations,
        certificates: user.certificates,
      },
      message: 'Profile updated successfully',
    }

    res.json(response)
  } catch (error) {
    console.error('Update profile error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to update profile',
    }
    res.status(500).json(response)
  }
}

// Delete user account
export const deleteAccount = async (
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

    const user = await User.findById(req.user.userId)
    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User not found',
      }
      res.status(404).json(response)
      return
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.userId)

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Account deleted successfully',
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Delete account error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to delete account',
    }
    res.status(500).json(response)
  }
}

export const validateUpdateProfile = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]

