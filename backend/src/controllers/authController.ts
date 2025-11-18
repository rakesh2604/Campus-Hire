import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { User } from '../models/User'
import { hashPassword, comparePassword, generateToken } from '../utils/auth'
import { ApiResponse } from '../../shared/types'
import { RequestWithUser } from '../types'
import { isDatabaseReady } from '../config/database'

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if MongoDB is connected
    if (!isDatabaseReady()) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Database connection not available. Please check your MongoDB connection.',
      }
      res.status(503).json(response)
      return
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const response: ApiResponse<never> = {
        success: false,
        error: errors.array()[0].msg,
      }
      res.status(400).json(response)
      return
    }

    const { email, password, name, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User with this email already exists',
      }
      res.status(400).json(response)
      return
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'candidate',
    })

    await user.save()

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    const response: ApiResponse<{
      user: {
        id: string
        email: string
        name: string
        role: string
      }
      token: string
    }> = {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
      message: 'User registered successfully',
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Registration error:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Failed to register user'
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        errorMessage = 'Email already exists'
      } else if (error.message.includes('validation')) {
        errorMessage = 'Invalid user data'
      } else {
        errorMessage = error.message
      }
    }
    
    const response: ApiResponse<never> = {
      success: false,
      error: errorMessage,
    }
    res.status(500).json(response)
  }
}

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Check if MongoDB is connected
    if (!isDatabaseReady()) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Database connection not available. Please check your MongoDB connection.',
      }
      res.status(503).json(response)
      return
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const response: ApiResponse<never> = {
        success: false,
        error: errors.array()[0].msg,
      }
      res.status(400).json(response)
      return
    }

    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid email or password',
      }
      res.status(401).json(response)
      return
    }

    // Check password
    if (!user.password) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Please login with Google',
      }
      res.status(401).json(response)
      return
    }

    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid email or password',
      }
      res.status(401).json(response)
      return
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    const response: ApiResponse<{
      user: {
        id: string
        email: string
        name: string
        role: string
      }
      token: string
    }> = {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
      message: 'Login successful',
    }

    res.json(response)
  } catch (error) {
    console.error('Login error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to login',
    }
    res.status(500).json(response)
  }
}

export const getCurrentUser = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User not authenticated',
      }
      res.status(401).json(response)
      return
    }

    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User not found',
      }
      res.status(404).json(response)
      return
    }

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
    }

    res.json(response)
  } catch (error) {
    console.error('Get current user error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to get user',
    }
    res.status(500).json(response)
  }
}

export const validateRegister = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('role')
    .optional()
    .isIn(['candidate', 'recruiter', 'admin', 'placement'])
    .withMessage('Invalid role'),
]

export const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
]

