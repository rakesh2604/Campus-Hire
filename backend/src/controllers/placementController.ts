import { Request, Response } from 'express'
import { body, validationResult, query } from 'express-validator'
import { User } from '../models/User'
import { Job } from '../models/Job'
import { Application } from '../models/Application'
import { Placement } from '../models/Placement'
import { ApiResponse } from '../../shared/types'
import { RequestWithUser } from '../types'
import { hashPassword } from '../utils/auth'

// Get eligible students (candidates) with batch filtering
export const getEligibleStudents = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const { batch, search, status } = req.query

    // Build query
    const query: Record<string, unknown> = { role: 'candidate' }

    if (batch) {
      query.graduationYear = batch
    }

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } },
        { currentLocation: { $regex: search as string, $options: 'i' } },
      ]
    }

    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })

    // Get placement status for each student
    const studentsWithPlacement = await Promise.all(
      students.map(async (student) => {
        const placements = await Placement.find({ studentId: student._id })
        const activePlacements = placements.filter((p) => p.status === 'in-progress')
        const selectedPlacements = placements.filter((p) => p.status === 'selected')

        // Get applications with round info
        const applications = await Application.find({ candidateId: student._id })
          .populate('jobId', 'title company')
          .sort({ createdAt: -1 })

        return {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          graduationYear: student.graduationYear,
          currentLocation: student.currentLocation,
          workExperience: student.workExperience,
          profilePicture: student.profilePicture,
          resume: student.resume,
          linkedin: student.linkedin,
          github: student.github,
          batch: student.graduationYear || 'N/A',
          activeApplications: applications.length,
          activePlacements: activePlacements.length,
          selectedCount: selectedPlacements.length,
          applications: applications.map((app) => ({
            id: app._id.toString(),
            jobId: app.jobId.toString(),
            job: {
              id: (app.jobId as any)._id?.toString() || app.jobId.toString(),
              title: (app.jobId as any).title || 'Unknown',
              company: (app.jobId as any).company || 'Unknown',
            },
            status: app.status,
            currentRound: app.currentRound || 1,
            totalRounds: app.totalRounds || 3,
            roundsCompleted: app.rounds?.filter((r) => r.status === 'completed' || r.status === 'passed').length || 0,
            rounds: app.rounds || [],
          })),
        }
      })
    )

    // Filter by status if provided
    let filteredStudents = studentsWithPlacement
    if (status === 'placed') {
      filteredStudents = studentsWithPlacement.filter((s) => s.selectedCount > 0)
    } else if (status === 'active') {
      filteredStudents = studentsWithPlacement.filter((s) => s.activePlacements > 0)
    } else if (status === 'unplaced') {
      filteredStudents = studentsWithPlacement.filter((s) => s.selectedCount === 0 && s.activePlacements === 0)
    }

    const response: ApiResponse<{
      students: typeof filteredStudents
      total: number
    }> = {
      success: true,
      data: {
        students: filteredStudents,
        total: filteredStudents.length,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get eligible students error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch eligible students',
    }
    res.status(500).json(response)
  }
}

// Get placement data by batch
export const getPlacementDataByBatch = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const { batch } = req.query

    if (!batch) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Batch parameter is required',
      }
      res.status(400).json(response)
      return
    }

    // Get all students in the batch
    const students = await User.find({
      role: 'candidate',
      graduationYear: batch,
    })

    // Get all placements for this batch
    const placements = await Placement.find({ batch: batch as string })
      .populate('studentId', 'name email graduationYear')
      .populate('jobId', 'title company location')
      .sort({ createdAt: -1 })

    // Get all applications for students in this batch
    const studentIds = students.map((s) => s._id)
    const applications = await Application.find({
      candidateId: { $in: studentIds },
    })
      .populate('jobId', 'title company')
      .populate('candidateId', 'name email')

    // Calculate statistics
    const stats = {
      totalStudents: students.length,
      placed: placements.filter((p) => p.status === 'selected').length,
      inProgress: placements.filter((p) => p.status === 'in-progress').length,
      rejected: placements.filter((p) => p.status === 'rejected').length,
      onHold: placements.filter((p) => p.status === 'on-hold').length,
      totalApplications: applications.length,
      pendingApplications: applications.filter((a) => a.status === 'pending').length,
      shortlistedApplications: applications.filter((a) => a.status === 'shortlisted').length,
    }

    const response: ApiResponse<{
      batch: string
      stats: typeof stats
      placements: Array<{
        id: string
        student: {
          id: string
          name: string
          email: string
          graduationYear?: string
        }
        job: {
          id: string
          title: string
          company: string
          location: string
        }
        status: string
        currentRound: number
        totalRounds: number
        rounds: Array<{
          roundNumber: number
          roundName: string
          status: string
          scheduledDate?: string
          completedDate?: string
          score?: number
        }>
        placementDate?: string
        offerDetails?: {
          ctc?: number
          joiningDate?: string
          location?: string
        }
        createdAt: string
      }>
      applications: Array<{
        id: string
        student: {
          id: string
          name: string
          email: string
        }
        job: {
          id: string
          title: string
          company: string
        }
        status: string
        currentRound: number
        totalRounds: number
        roundsCompleted: number
        createdAt: string
      }>
    }> = {
      success: true,
      data: {
        batch: batch as string,
        stats,
        placements: placements.map((p) => ({
          id: p._id.toString(),
          student: {
            id: (p.studentId as any)._id?.toString() || p.studentId.toString(),
            name: (p.studentId as any).name || 'Unknown',
            email: (p.studentId as any).email || 'Unknown',
            graduationYear: (p.studentId as any).graduationYear,
          },
          job: {
            id: (p.jobId as any)._id?.toString() || p.jobId.toString(),
            title: (p.jobId as any).title || 'Unknown',
            company: (p.jobId as any).company || 'Unknown',
            location: (p.jobId as any).location || 'Unknown',
          },
          status: p.status,
          currentRound: p.currentRound,
          totalRounds: p.totalRounds,
          rounds: p.rounds.map((r) => ({
            roundNumber: r.roundNumber,
            roundName: r.roundName,
            status: r.status,
            scheduledDate: r.scheduledDate?.toISOString(),
            completedDate: r.completedDate?.toISOString(),
            score: r.score,
          })),
          placementDate: p.placementDate?.toISOString(),
          offerDetails: p.offerDetails
            ? {
                ctc: p.offerDetails.ctc,
                joiningDate: p.offerDetails.joiningDate?.toISOString(),
                location: p.offerDetails.location,
              }
            : undefined,
          createdAt: p.createdAt.toISOString(),
        })),
        applications: applications.map((a) => ({
          id: a._id.toString(),
          student: {
            id: (a.candidateId as any)._id?.toString() || a.candidateId.toString(),
            name: (a.candidateId as any).name || 'Unknown',
            email: (a.candidateId as any).email || 'Unknown',
          },
          job: {
            id: (a.jobId as any)._id?.toString() || a.jobId.toString(),
            title: (a.jobId as any).title || 'Unknown',
            company: (a.jobId as any).company || 'Unknown',
          },
          status: a.status,
          currentRound: a.currentRound || 1,
          totalRounds: a.totalRounds || 3,
          roundsCompleted: a.rounds?.filter((r) => r.status === 'completed' || r.status === 'passed').length || 0,
          createdAt: a.createdAt.toISOString(),
        })),
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get placement data error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch placement data',
    }
    res.status(500).json(response)
  }
}

// Get all batches
export const getAllBatches = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const batches = await User.distinct('graduationYear', {
      role: 'candidate',
      graduationYear: { $ne: null, $exists: true },
    })

    const batchStats = await Promise.all(
      batches.map(async (batch) => {
        const students = await User.countDocuments({
          role: 'candidate',
          graduationYear: batch,
        })
        const placements = await Placement.countDocuments({ batch })
        const selected = await Placement.countDocuments({
          batch,
          status: 'selected',
        })

        return {
          batch,
          students,
          placements,
          selected,
          placementRate: students > 0 ? ((selected / students) * 100).toFixed(2) : '0.00',
        }
      })
    )

    const response: ApiResponse<{
      batches: typeof batchStats
    }> = {
      success: true,
      data: {
        batches: batchStats.sort((a, b) => b.batch.localeCompare(a.batch)),
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get batches error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch batches',
    }
    res.status(500).json(response)
  }
}

// Update round status
export const updateRoundStatus = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const response: ApiResponse<never> = {
        success: false,
        error: errors.array()[0].msg,
      }
      res.status(400).json(response)
      return
    }

    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const { applicationId } = req.params
    const { roundNumber, status, feedback, score, scheduledDate } = req.body

    const application = await Application.findById(applicationId)
    if (!application) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Application not found',
      }
      res.status(404).json(response)
      return
    }

    // Initialize rounds if not exists
    if (!application.rounds) {
      application.rounds = []
    }

    // Find or create round
    let round = application.rounds.find((r) => r.roundNumber === roundNumber)
    if (!round) {
      round = {
        roundNumber,
        roundName: `Round ${roundNumber}`,
        status: 'pending',
      }
      application.rounds.push(round)
    }

    // Update round
    round.status = status
    if (feedback) round.feedback = feedback
    if (score !== undefined) round.score = score
    if (scheduledDate) round.scheduledDate = new Date(scheduledDate)
    if (status === 'completed' || status === 'passed' || status === 'failed') {
      round.completedDate = new Date()
    }

    // Update current round
    if (status === 'passed' && roundNumber < (application.totalRounds || 3)) {
      application.currentRound = roundNumber + 1
    } else if (status === 'failed') {
      application.status = 'rejected'
    } else if (status === 'passed' && roundNumber === (application.totalRounds || 3)) {
      application.status = 'accepted'
    }

    await application.save()

    // Update placement record if exists
    const placement = await Placement.findOne({ applicationId: application._id })
    if (placement) {
      const placementRound = placement.rounds.find((r) => r.roundNumber === roundNumber)
      if (placementRound) {
        placementRound.status = status
        if (feedback) placementRound.feedback = feedback
        if (score !== undefined) placementRound.score = score
        if (scheduledDate) placementRound.scheduledDate = new Date(scheduledDate)
        if (status === 'completed' || status === 'passed' || status === 'failed') {
          placementRound.completedDate = new Date()
        }
      }

      if (status === 'passed' && roundNumber < placement.totalRounds) {
        placement.currentRound = roundNumber + 1
      } else if (status === 'failed') {
        placement.status = 'rejected'
      } else if (status === 'passed' && roundNumber === placement.totalRounds) {
        placement.status = 'selected'
        placement.placementDate = new Date()
      }

      await placement.save()
    }

    const response: ApiResponse<{
      application: {
        id: string
        currentRound: number
        totalRounds: number
        status: string
        rounds: Array<{
          roundNumber: number
          roundName: string
          status: string
        }>
      }
    }> = {
      success: true,
      data: {
        application: {
          id: application._id.toString(),
          currentRound: application.currentRound || 1,
          totalRounds: application.totalRounds || 3,
          status: application.status,
          rounds: application.rounds.map((r) => ({
            roundNumber: r.roundNumber,
            roundName: r.roundName,
            status: r.status,
          })),
        },
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Update round status error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to update round status',
    }
    res.status(500).json(response)
  }
}

// Get placement team dashboard stats
export const getPlacementDashboardStats = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const totalStudents = await User.countDocuments({ role: 'candidate' })
    const totalJobs = await Job.countDocuments({ status: 'active' })
    const totalApplications = await Application.countDocuments()
    const activePlacements = await Placement.countDocuments({ status: 'in-progress' })
    const selectedPlacements = await Placement.countDocuments({ status: 'selected' })

    // Get batch-wise stats
    const batches = await User.distinct('graduationYear', {
      role: 'candidate',
      graduationYear: { $ne: null, $exists: true },
    })

    const batchStats = await Promise.all(
      batches.slice(0, 5).map(async (batch) => {
        const students = await User.countDocuments({
          role: 'candidate',
          graduationYear: batch,
        })
        const selected = await Placement.countDocuments({
          batch,
          status: 'selected',
        })
        return {
          batch,
          students,
          selected,
          placementRate: students > 0 ? ((selected / students) * 100).toFixed(2) : '0.00',
        }
      })
    )

    const response: ApiResponse<{
      totalStudents: number
      totalJobs: number
      totalApplications: number
      activePlacements: number
      selectedPlacements: number
      batchStats: typeof batchStats
    }> = {
      success: true,
      data: {
        totalStudents,
        totalJobs,
        totalApplications,
        activePlacements,
        selectedPlacements,
        batchStats,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch dashboard stats',
    }
    res.status(500).json(response)
  }
}

// Get all placement team members (admin only)
export const getPlacementMembers = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const members = await User.find({
      role: { $in: ['placement', 'admin'] },
    })
      .select('-password')
      .sort({ createdAt: -1 })

    const response: ApiResponse<{
      members: Array<{
        id: string
        name: string
        email: string
        role: 'placement' | 'admin'
        profilePicture?: string
        createdAt: string
      }>
    }> = {
      success: true,
      data: {
        members: members.map((m) => ({
          id: m._id.toString(),
          name: m.name,
          email: m.email,
          role: m.role as 'placement' | 'admin',
          profilePicture: m.profilePicture,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get placement members error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch placement team members',
    }
    res.status(500).json(response)
  }
}

// Create new placement team member (admin only)
export const createPlacementMember = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const response: ApiResponse<never> = {
        success: false,
        error: errors.array()[0].msg,
      }
      res.status(400).json(response)
      return
    }

    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const { name, email, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User with this email already exists',
      }
      res.status(400).json(response)
      return
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'placement',
    })

    await user.save()

    const response: ApiResponse<{
      member: {
        id: string
        name: string
        email: string
        role: string
      }
    }> = {
      success: true,
      data: {
        member: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Create placement member error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to create placement team member',
    }
    res.status(500).json(response)
  }
}

// Delete placement team member (admin only)
export const deletePlacementMember = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const { memberId } = req.params

    // Prevent self-deletion
    if (memberId === req.user.userId) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'You cannot delete your own account',
      }
      res.status(400).json(response)
      return
    }

    const member = await User.findById(memberId)
    if (!member) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Member not found',
      }
      res.status(404).json(response)
      return
    }

    if (member.role !== 'placement' && member.role !== 'admin') {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User is not a placement team member',
      }
      res.status(400).json(response)
      return
    }

    await User.findByIdAndDelete(memberId)

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Member deleted successfully',
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Delete placement member error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to delete placement team member',
    }
    res.status(500).json(response)
  }
}

// Register student manually (placement/admin only)
export const registerStudent = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const response: ApiResponse<never> = {
        success: false,
        error: errors.array()[0].msg,
      }
      res.status(400).json(response)
      return
    }

    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const {
      name,
      email,
      password,
      graduationYear,
      currentLocation,
      workExperience,
      linkedin,
      github,
    } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Student with this email already exists',
      }
      res.status(400).json(response)
      return
    }

    // Hash password
    const hashedPassword = await hashPassword(password || 'Student@123') // Default password

    // Create student (candidate)
    const student = new User({
      email,
      password: hashedPassword,
      name,
      role: 'candidate',
      graduationYear,
      currentLocation,
      workExperience: workExperience || 0,
      linkedin,
      github,
    })

    await student.save()

    const response: ApiResponse<{
      student: {
        id: string
        name: string
        email: string
        graduationYear?: string
      }
    }> = {
      success: true,
      data: {
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          graduationYear: student.graduationYear,
        },
      },
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Register student error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to register student',
    }
    res.status(500).json(response)
  }
}

// Generate dummy students data
export const generateDummyStudents = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const { count = 20, batch } = req.body

    const firstNames = [
      'Aarav', 'Aditya', 'Akshay', 'Ananya', 'Arjun', 'Avni', 'Dev', 'Isha', 'Karan', 'Kavya',
      'Manish', 'Neha', 'Pranav', 'Priya', 'Rahul', 'Riya', 'Rohan', 'Sneha', 'Vikram', 'Zara',
      'Aryan', 'Diya', 'Harsh', 'Ishita', 'Krishna', 'Meera', 'Nikhil', 'Pooja', 'Raj', 'Sanjana',
      'Siddharth', 'Tanvi', 'Varun', 'Yash', 'Anjali', 'Bhavya', 'Chirag', 'Disha', 'Gaurav', 'Himanshu'
    ]

    const lastNames = [
      'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Mehta', 'Jain', 'Shah',
      'Agarwal', 'Malhotra', 'Kapoor', 'Chopra', 'Bansal', 'Arora', 'Saxena', 'Tiwari', 'Mishra', 'Yadav'
    ]

    const locations = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad',
      'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna'
    ]

    const batches = batch ? [batch] : ['2024', '2025', '2026', '2027']

    const createdStudents = []

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const name = `${firstName} ${lastName}`
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@student.edu`
      const graduationYear = batches[Math.floor(Math.random() * batches.length)]
      const currentLocation = locations[Math.floor(Math.random() * locations.length)]
      const workExperience = Math.floor(Math.random() * 3) // 0-2 years
      const linkedin = `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`
      const github = `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`

      // Check if email already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        continue // Skip if already exists
      }

      // Hash password
      const hashedPassword = await hashPassword('Student@123')

      // Create student (explicitly set profilePicture to null/undefined to avoid any default)
      const student = new User({
        email,
        password: hashedPassword,
        name,
        role: 'candidate',
        graduationYear,
        currentLocation,
        workExperience,
        linkedin,
        github,
        profilePicture: undefined, // Explicitly set to undefined so it shows initials
      })

      await student.save()
      createdStudents.push({
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        graduationYear: student.graduationYear,
      })
    }

    const response: ApiResponse<{
      students: typeof createdStudents
      count: number
    }> = {
      success: true,
      data: {
        students: createdStudents,
        count: createdStudents.length,
      },
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Generate dummy students error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to generate dummy students',
    }
    res.status(500).json(response)
  }
}

// Import students from CSV
export const importStudentsFromCSV = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Authentication required',
      }
      res.status(401).json(response)
      return
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const response: ApiResponse<never> = {
        success: false,
        error: errors.array()[0].msg,
      }
      res.status(400).json(response)
      return
    }

    // CSV parsing would be done here
    // For now, we'll accept JSON array of students
    const { students: studentsData } = req.body

    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid CSV data. Expected an array of students.',
      }
      res.status(400).json(response)
      return
    }

    const createdStudents = []
    const importErrors = []

    for (let i = 0; i < studentsData.length; i++) {
      const studentData = studentsData[i]
      
      try {
        const { name, email, password, graduationYear, currentLocation, workExperience, linkedin, github } = studentData

        if (!name || !email) {
          importErrors.push(`Row ${i + 1}: Name and email are required`)
          continue
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
          importErrors.push(`Row ${i + 1}: Student with email ${email} already exists`)
          continue
        }

        // Hash password
        const hashedPassword = await hashPassword(password || 'Student@123')

        // Create student (explicitly set profilePicture to undefined to avoid any default)
        const student = new User({
          email,
          password: hashedPassword,
          name,
          role: 'candidate',
          graduationYear,
          currentLocation,
          workExperience: workExperience || 0,
          linkedin,
          github,
          profilePicture: undefined, // Explicitly set to undefined so it shows initials
        })

        await student.save()
        createdStudents.push({
          id: student._id.toString(),
          name: student.name,
          email: student.email,
          graduationYear: student.graduationYear,
        })
      } catch (error) {
        importErrors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Failed to create student'}`)
      }
    }

    const response: ApiResponse<{
      students: typeof createdStudents
      count: number
      errors: string[]
    }> = {
      success: true,
      data: {
        students: createdStudents,
        count: createdStudents.length,
        errors: importErrors,
      },
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Import students from CSV error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to import students from CSV',
    }
    res.status(500).json(response)
  }
}

