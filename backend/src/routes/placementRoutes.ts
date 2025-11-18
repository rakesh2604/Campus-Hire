import { Router } from 'express'
import { body } from 'express-validator'
import {
  getEligibleStudents,
  getPlacementDataByBatch,
  getAllBatches,
  updateRoundStatus,
  getPlacementDashboardStats,
  getPlacementMembers,
  createPlacementMember,
  deletePlacementMember,
  registerStudent,
  generateDummyStudents,
  importStudentsFromCSV,
} from '../controllers/placementController'
import { authenticateToken, requireRole } from '../middleware/auth'

const router = Router()

// All routes require authentication and placement/admin role
router.use(authenticateToken)
router.use(requireRole(['placement', 'admin']))

// Get placement dashboard stats
router.get('/dashboard/stats', getPlacementDashboardStats)

// Get all batches
router.get('/batches', getAllBatches)

// Get eligible students
router.get('/students', getEligibleStudents)

// Register student manually
router.post(
  '/students/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('graduationYear').optional().trim(),
    body('currentLocation').optional().trim(),
    body('workExperience').optional().isInt({ min: 0 }),
    body('linkedin').optional().isURL().withMessage('Invalid LinkedIn URL'),
    body('github').optional().isURL().withMessage('Invalid GitHub URL'),
  ],
  registerStudent
)

// Generate dummy students
router.post(
  '/students/generate-dummy',
  [
    body('count').optional().isInt({ min: 1, max: 100 }).withMessage('Count must be between 1 and 100'),
    body('batch').optional().trim(),
  ],
  generateDummyStudents
)

// Import students from CSV
router.post(
  '/students/import-csv',
  [
    body('students').isArray().withMessage('Students must be an array'),
    body('students.*.name').trim().notEmpty().withMessage('Name is required'),
    body('students.*.email').isEmail().withMessage('Valid email is required'),
    body('students.*.password').optional().isLength({ min: 6 }),
    body('students.*.graduationYear').optional().trim(),
    body('students.*.currentLocation').optional().trim(),
    body('students.*.workExperience').optional().isInt({ min: 0 }),
    body('students.*.linkedin').optional().isURL(),
    body('students.*.github').optional().isURL(),
  ],
  importStudentsFromCSV
)

// Get placement data by batch
router.get('/batch-data', getPlacementDataByBatch)

// Update round status
router.put(
  '/applications/:applicationId/rounds',
  [
    body('roundNumber').isInt({ min: 1 }).withMessage('Round number is required'),
    body('status')
      .isIn(['pending', 'scheduled', 'completed', 'passed', 'failed'])
      .withMessage('Invalid status'),
    body('feedback').optional().isString(),
    body('score').optional().isInt({ min: 0, max: 100 }),
    body('scheduledDate').optional().isISO8601(),
  ],
  updateRoundStatus
)

// Placement team members management (admin only)
router.get('/members', requireRole(['admin']), getPlacementMembers)
router.post(
  '/members',
  requireRole(['admin']),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['placement', 'admin']).withMessage('Invalid role'),
  ],
  createPlacementMember
)
router.delete('/members/:memberId', requireRole(['admin']), deletePlacementMember)

export default router

