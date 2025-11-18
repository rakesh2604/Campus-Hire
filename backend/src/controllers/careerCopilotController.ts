import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { JobTracker } from '../models/JobTracker'
import { Job } from '../models/Job'
import { User } from '../models/User'
import { Application } from '../models/Application'
import { ApiResponse } from '../../shared/types'
import { RequestWithUser } from '../types'
import { chatWithAI, AIMessage } from '../utils/aiProvider'

// Save job to tracker
export const saveJobToTracker = async (
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

    const { jobId } = req.body

    if (!jobId) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job ID is required',
      }
      res.status(400).json(response)
      return
    }

    // Check if job exists
    const job = await Job.findById(jobId)
    if (!job) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job not found',
      }
      res.status(404).json(response)
      return
    }

    // Check if already saved
    const existing = await JobTracker.findOne({
      userId: req.user.userId,
      jobId,
    })

    if (existing) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job already saved to tracker',
      }
      res.status(400).json(response)
      return
    }

    // Save to tracker
    const tracker = new JobTracker({
      userId: req.user.userId,
      jobId,
      status: 'saved',
    })

    await tracker.save()

    const response: ApiResponse<{
      id: string
      jobId: string
      status: string
      createdAt: string
    }> = {
      success: true,
      data: {
        id: tracker._id.toString(),
        jobId: tracker.jobId.toString(),
        status: tracker.status,
        createdAt: tracker.createdAt.toISOString(),
      },
      message: 'Job saved to tracker successfully',
    }

    res.json(response)
  } catch (error) {
    console.error('Save job to tracker error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to save job to tracker',
    }
    res.status(500).json(response)
  }
}

// Get job tracker
export const getJobTracker = async (
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

    const trackers = await JobTracker.find({ userId: req.user.userId })
      .populate('jobId')
      .sort({ createdAt: -1 })

    const response: ApiResponse<{
      jobs: Array<{
        id: string
        jobId: string
        job: {
          id: string
          title: string
          company: string
          location: string
        }
        status: string
        notes?: string
        appliedDate?: string
        createdAt: string
      }>
    }> = {
      success: true,
      data: {
        jobs: trackers.map((tracker) => ({
          id: tracker._id.toString(),
          jobId: tracker.jobId.toString(),
          job: {
            id: (tracker.jobId as any)._id?.toString() || tracker.jobId.toString(),
            title: (tracker.jobId as any).title || 'Unknown',
            company: (tracker.jobId as any).company || 'Unknown',
            location: (tracker.jobId as any).location || 'Unknown',
          },
          status: tracker.status,
          notes: tracker.notes,
          appliedDate: tracker.appliedDate?.toISOString(),
          createdAt: tracker.createdAt.toISOString(),
        })),
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Get job tracker error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch job tracker',
    }
    res.status(500).json(response)
  }
}

// AI Cover Letter Generator
export const generateCoverLetter = async (
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

    const { jobDescription, jobTitle, companyName, resume } = req.body

    // Get user profile for context
    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User not found',
      }
      res.status(404).json(response)
      return
    }

    const systemPrompt = `You are an expert career coach and cover letter writer. Generate a professional, compelling cover letter that:
1. Is tailored specifically to the job description and company
2. Highlights the candidate's relevant skills and experience
3. Shows genuine interest in the role and company
4. Is concise (3-4 paragraphs, under 400 words)
5. Uses professional but engaging tone
6. Includes specific examples from the candidate's background
7. Ends with a strong call to action

Format the cover letter professionally with proper greeting and closing.`

    const userPrompt = `Generate a cover letter for:
Job Title: ${jobTitle}
Company: ${companyName}
Job Description: ${jobDescription}

Candidate Information:
Name: ${user.name}
Experience: ${user.workExperience || 0} years
Skills: ${user.workExperiences?.map((exp) => exp.title).join(', ') || 'Not specified'}
Resume Summary: ${resume || user.description || 'Not provided'}

Generate a professional cover letter that matches the job requirements and showcases the candidate's strengths.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    const coverLetter = await chatWithAI(messages)

    const response: ApiResponse<{
      coverLetter: string
    }> = {
      success: true,
      data: {
        coverLetter,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Generate cover letter error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to generate cover letter',
    }
    res.status(500).json(response)
  }
}

// Summarize Job Description
export const summarizeJobDescription = async (
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

    const { jobDescription } = req.body

    const systemPrompt = `You are a career advisor. Summarize job descriptions in a clear, structured format. Extract and organize:
1. Key Requirements (skills, experience, education)
2. Responsibilities (main duties)
3. Benefits & Perks (if mentioned)
4. Company Culture (if mentioned)
5. Must-Have vs Nice-to-Have qualifications
6. Salary/Compensation info (if mentioned)
7. Work Mode (remote/onsite/hybrid)

Format the summary in a clear, easy-to-read structure with bullet points.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Summarize this job description:\n\n${jobDescription}` },
    ]

    const summary = await chatWithAI(messages)

    const response: ApiResponse<{
      summary: string
    }> = {
      success: true,
      data: {
        summary,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Summarize job description error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to summarize job description',
    }
    res.status(500).json(response)
  }
}

// AI LinkedIn Post Generator
export const generateLinkedInPost = async (
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

    const { topic, tone, hashtags } = req.body

    const systemPrompt = `You are a LinkedIn content expert. Generate engaging LinkedIn posts that:
1. Are professional yet authentic
2. Include relevant hashtags (5-7 hashtags)
3. Are optimized for engagement (questions, storytelling, value-driven)
4. Are 150-300 words (optimal LinkedIn post length)
5. Include a clear call-to-action
6. Match the requested tone (professional, casual, inspirational, etc.)

Format with proper line breaks for readability.`

    const userPrompt = `Generate a LinkedIn post about: ${topic}
Tone: ${tone || 'professional'}
Include hashtags: ${hashtags ? 'yes' : 'no'}

Make it engaging and valuable for the LinkedIn audience.`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    const post = await chatWithAI(messages)

    const response: ApiResponse<{
      post: string
    }> = {
      success: true,
      data: {
        post,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Generate LinkedIn post error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to generate LinkedIn post',
    }
    res.status(500).json(response)
  }
}

// LinkedIn Optimization
export const optimizeLinkedIn = async (
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

    const user = await User.findById(req.user.userId).select('-password')
    if (!user) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User not found',
      }
      res.status(404).json(response)
      return
    }

    const systemPrompt = `You are a LinkedIn profile optimization expert. Analyze a user's profile and provide:
1. Headline Optimization (compelling, keyword-rich)
2. About/Summary Suggestions (engaging, value-driven)
3. Skills Recommendations (based on their experience)
4. Experience Section Improvements
5. Keyword Optimization (for ATS and recruiters)
6. Profile Completeness Score
7. Actionable recommendations

Provide specific, actionable advice with examples.`

    const userProfile = `
Name: ${user.name}
Current Role: ${user.workExperiences?.[0]?.title || 'Not specified'}
Company: ${user.workExperiences?.[0]?.company || 'Not specified'}
Experience: ${user.workExperience || 0} years
Location: ${user.currentLocation || 'Not specified'}
Description: ${user.description || 'Not provided'}
Skills: ${user.workExperiences?.map((exp) => exp.title).join(', ') || 'Not specified'}
Education: ${user.educations?.map((edu) => `${edu.degree} from ${edu.institution}`).join(', ') || 'Not specified'}
`

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze and optimize this LinkedIn profile:\n\n${userProfile}` },
    ]

    const optimization = await chatWithAI(messages)

    const response: ApiResponse<{
      optimization: string
    }> = {
      success: true,
      data: {
        optimization,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('LinkedIn optimization error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to optimize LinkedIn profile',
    }
    res.status(500).json(response)
  }
}

// Find Out Who's Hiring
export const findWhoHiring = async (
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

    const { location, role, industry } = req.query

    // Get active jobs matching criteria
    const query: Record<string, unknown> = { status: 'active' }

    if (location) {
      query.location = { $regex: location as string, $options: 'i' }
    }

    if (role) {
      query.title = { $regex: role as string, $options: 'i' }
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email company')
      .sort({ createdAt: -1 })
      .limit(50)

    // Group by company
    const companiesMap = new Map<string, {
      company: string
      jobs: Array<{
        id: string
        title: string
        location: string
        type: string
      }>
      totalJobs: number
    }>()

    jobs.forEach((job) => {
      const company = job.company
      if (!companiesMap.has(company)) {
        companiesMap.set(company, {
          company,
          jobs: [],
          totalJobs: 0,
        })
      }

      const companyData = companiesMap.get(company)!
      companyData.jobs.push({
        id: job._id.toString(),
        title: job.title,
        location: job.location,
        type: job.type,
      })
      companyData.totalJobs += 1
    })

    const companies = Array.from(companiesMap.values())
      .sort((a, b) => b.totalJobs - a.totalJobs)

    const response: ApiResponse<{
      companies: typeof companies
      totalJobs: number
    }> = {
      success: true,
      data: {
        companies,
        totalJobs: jobs.length,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Find who hiring error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to find hiring companies',
    }
    res.status(500).json(response)
  }
}

