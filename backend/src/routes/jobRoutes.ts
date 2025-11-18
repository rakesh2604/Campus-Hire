import { Router } from 'express'
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  validateJob,
} from '../controllers/jobController'
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth'
import { requireRole } from '../middleware/auth'

const router = Router()

router.get('/', optionalAuthenticateToken, getJobs)
router.get('/:id', getJobById)
router.post('/', authenticateToken, requireRole(['recruiter', 'admin', 'placement']), validateJob, createJob)
router.put('/:id', authenticateToken, validateJob, updateJob)
router.delete('/:id', authenticateToken, deleteJob)

export default router

