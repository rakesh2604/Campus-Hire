import { Router } from 'express'
import {
  applyToJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  validateApplication,
  validateApply,
} from '../controllers/applicationController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

router.post('/jobs/:jobId/apply', authenticateToken, validateApply, applyToJob)
router.get('/my-applications', authenticateToken, getMyApplications)
router.get('/jobs/:jobId/applications', authenticateToken, getJobApplications)
router.put('/:id/status', authenticateToken, validateApplication, updateApplicationStatus)

export default router

