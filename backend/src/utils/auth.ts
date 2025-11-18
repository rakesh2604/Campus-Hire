import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { JwtPayload } from '../types'

// JWT_SECRET is validated in env.ts, but add explicit check here for safety
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key' || JWT_SECRET.trim() === '') {
  throw new Error('JWT_SECRET is required and must be set in environment variables. Please check your backend/.env file.')
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}

