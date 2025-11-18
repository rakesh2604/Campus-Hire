import { Router } from 'express'
import {
  chatWithVedaAssistant,
  reviewResume,
  generateHRQuestions,
  companyInterviewPrep,
  getRoleSuggestions,
  generateUI,
  validateChat,
  validateResumeReview,
  validateHRQuestions,
  validateCompanyPrep,
  validateRoleSuggestions,
  validateUIGenerate,
} from '../controllers/vedaController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// General chat
router.post('/chat', authenticateToken, validateChat, chatWithVedaAssistant)

// Specialized features
router.post('/resume-review', authenticateToken, validateResumeReview, reviewResume)
router.post('/hr-questions', authenticateToken, validateHRQuestions, generateHRQuestions)
router.post('/company-prep', authenticateToken, validateCompanyPrep, companyInterviewPrep)
router.post('/role-suggestions', authenticateToken, validateRoleSuggestions, getRoleSuggestions)
router.post('/ui-generate', authenticateToken, validateUIGenerate, generateUI)

export default router

