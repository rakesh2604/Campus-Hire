import { Router } from 'express'
import { body } from 'express-validator'
import {
  saveJobToTracker,
  getJobTracker,
  generateCoverLetter,
  summarizeJobDescription,
  generateLinkedInPost,
  optimizeLinkedIn,
  findWhoHiring,
} from '../controllers/careerCopilotController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// Job Tracker
router.post('/tracker/save', saveJobToTracker)
router.get('/tracker', getJobTracker)

// AI Features (Premium)
router.post(
  '/cover-letter',
  [
    body('jobDescription').notEmpty().withMessage('Job description is required'),
    body('jobTitle').notEmpty().withMessage('Job title is required'),
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('resume').optional().isString(),
  ],
  generateCoverLetter
)

router.post(
  '/summarize-job',
  [
    body('jobDescription').notEmpty().withMessage('Job description is required'),
  ],
  summarizeJobDescription
)

router.post(
  '/linkedin-post',
  [
    body('topic').notEmpty().withMessage('Topic is required'),
    body('tone').optional().isString(),
    body('hashtags').optional().isBoolean(),
  ],
  generateLinkedInPost
)

// LinkedIn Optimization
router.get('/linkedin-optimize', optimizeLinkedIn)

// Find Who's Hiring
router.get('/who-hiring', findWhoHiring)

export default router

