import { Router } from 'express'
import {
  register,
  login,
  getCurrentUser,
  validateRegister,
  validateLogin,
} from '../controllers/authController'
import { updateProfile, validateUpdateProfile, deleteAccount } from '../controllers/userController'
import { authenticateToken } from '../middleware/auth'
import { importLinkedInProfile, getLinkedInAuthUrl } from '../controllers/linkedinController'

const router = Router()

router.post('/register', validateRegister, register)
router.post('/login', validateLogin, login)
router.get('/linkedin/auth-url', getLinkedInAuthUrl)
router.post('/linkedin/import', authenticateToken, importLinkedInProfile)
router.get('/me', authenticateToken, getCurrentUser)
router.put('/profile', authenticateToken, validateUpdateProfile, updateProfile)
router.delete('/account', authenticateToken, deleteAccount)

export default router

