import { User, IUser } from '../models/User'
import { hashPassword } from '../utils/auth'
import { NotFoundError, ConflictError } from '../utils/errors'
import { cache, cacheKeys } from '../utils/cache'

/**
 * Service layer for user-related business logic
 */
export class UserService {
  /**
   * Get user by ID (with caching)
   */
  static async getUserById(id: string): Promise<IUser | null> {
    // Check cache first
    const cacheKey = cacheKeys.user(id)
    const cached = cache.get<IUser>(cacheKey)
    if (cached) {
      return cached
    }

    const user = await User.findById(id).lean()
    
    if (user) {
      // Cache for 5 minutes
      cache.set(cacheKey, user, 5 * 60 * 1000)
    }

    return user as IUser | null
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser> {
    const user = await User.findById(userId)
    
    if (!user) {
      throw new NotFoundError('User')
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: userId }
      })
      
      if (existingUser) {
        throw new ConflictError('Email already in use')
      }
    }

    // Update fields
    Object.assign(user, updateData)

    // Hash password if provided
    if (updateData.password) {
      user.password = await hashPassword(updateData.password)
    }

    await user.save()

    // Invalidate cache
    cache.delete(cacheKeys.user(userId))

    return user
  }

  /**
   * Delete user account
   */
  static async deleteAccount(userId: string): Promise<boolean> {
    const user = await User.findById(userId)
    
    if (!user) {
      throw new NotFoundError('User')
    }

    await user.deleteOne()

    // Invalidate cache
    cache.delete(cacheKeys.user(userId))

    return true
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<IUser | null> {
    const user = await User.findOne({ email: email.toLowerCase() }).lean()
    return user as IUser | null
  }
}

