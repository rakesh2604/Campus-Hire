import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  saveUserGoal,
  generateWeeklyPlan,
  getCurrentPlan,
  updatePlanItem,
} from '../controllers/placedAIController'

const router = Router()

router.post('/goal', authenticateToken, saveUserGoal)
router.post('/plan/generate', authenticateToken, generateWeeklyPlan)
router.get('/plan/current', authenticateToken, getCurrentPlan)
router.patch('/plan/item/:itemId', authenticateToken, updatePlanItem)

export default router


