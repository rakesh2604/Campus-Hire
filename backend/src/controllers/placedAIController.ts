import { Request, Response } from 'express'
import { PlacedAIPlan, UserGoal, PlacedAIIntensity } from '../models/PlacedAI'
import { RequestWithUser } from '../types'

export const saveUserGoal = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const { targetRole, targetCompanies = [], targetTimelineWeeks = 8, intensity = 'normal' } =
      req.body as {
        targetRole: string
        targetCompanies?: string[]
        targetTimelineWeeks?: number
        intensity?: PlacedAIIntensity
      }

    if (!targetRole) {
      res.status(400).json({ success: false, message: 'targetRole is required' })
      return
    }

    const goal = await UserGoal.findOneAndUpdate(
      { userId: req.user.userId },
      { targetRole, targetCompanies, targetTimelineWeeks, intensity },
      { new: true, upsert: true }
    )

    res.json({ success: true, data: goal })
  } catch (error) {
    console.error('Error saving user goal:', error)
    res.status(500).json({ success: false, message: 'Failed to save goal' })
  }
}

// Very simple heuristic weekly plan generator (Phase 1 MVP)
export const generateWeeklyPlan = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const goal = await UserGoal.findOne({ userId: req.user.userId })
    if (!goal) {
      res.status(400).json({ success: false, message: 'User goal not found. Please set your goal first.' })
      return
    }

    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)
    end.setDate(end.getDate() + 7)

    const baseProblemCount = 20
    const intensityMultiplier = goal.intensity === 'light' ? 0.6 : goal.intensity === 'intense' ? 1.4 : 1
    const targetProblems = Math.round(baseProblemCount * intensityMultiplier)

    const items = [
      {
        type: 'challenge' as const,
        referenceId: 'software-dev-generic',
        title: `Solve ${targetProblems} DSA problems from Software Development tracks`,
        targetCount: targetProblems,
        completedCount: 0,
        status: 'pending' as const,
      },
      {
        type: 'challenge' as const,
        referenceId: 'company-focused',
        title: goal.targetCompanies.length
          ? `Complete 1 challenge for ${goal.targetCompanies[0]}`
          : 'Complete 1 company-specific challenge',
        targetCount: 1,
        completedCount: 0,
        status: 'pending' as const,
      },
    ]

    const plan = await PlacedAIPlan.findOneAndUpdate(
      { userId: req.user.userId, startDate: { $lte: end }, endDate: { $gte: start } },
      { userId: req.user.userId, startDate: start, endDate: end, items },
      { new: true, upsert: true }
    )

    res.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error generating weekly plan:', error)
    res.status(500).json({ success: false, message: 'Failed to generate plan' })
  }
}

export const getCurrentPlan = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const now = new Date()
    const plan = await PlacedAIPlan.findOne({
      userId: req.user.userId,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })

    if (!plan) {
      res.json({ success: true, data: null })
      return
    }

    res.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error fetching current plan:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch plan' })
  }
}

export const updatePlanItem = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const { itemId } = req.params as { itemId: string }
    const { completedCount, status } = req.body as { completedCount?: number; status?: 'pending' | 'in_progress' | 'done' }

    const plan = await PlacedAIPlan.findOne({ userId: req.user.userId })
    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found' })
      return
    }

    const item = plan.items.id(itemId)
    if (!item) {
      res.status(404).json({ success: false, message: 'Plan item not found' })
      return
    }

    if (typeof completedCount === 'number') {
      item.completedCount = completedCount
    }
    if (status) {
      item.status = status
    }

    await plan.save()

    res.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error updating plan item:', error)
    res.status(500).json({ success: false, message: 'Failed to update plan item' })
  }
}


