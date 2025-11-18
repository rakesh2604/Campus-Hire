import { Response } from 'express'
import { body, validationResult } from 'express-validator'
import { chatWithAI, AIMessage } from '../utils/aiProvider'
import { ApiResponse } from '../types'
import { RequestWithUser } from '../types'
import { VEDA_SYSTEM_PROMPT } from '../utils/vedaKnowledge'
import { User } from '../models/User'

export const chatWithVedaAssistant = async (
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

    const { message, conversationHistory = [], feature } = req.body

    // Get user profile for context
    const user = await User.findById(req.user.userId)
    const userContext = user ? `
User Profile Context:
- Name: ${user.name}
- Role: ${user.role}
- Experience: ${user.workExperience || 0} years
- Location: ${user.currentLocation || 'Not specified'}
- Skills: ${user.workExperiences?.length || 0} work experiences, ${user.projects?.length || 0} projects
- Education: ${user.educations?.map(e => e.degree).join(', ') || 'Not specified'}
` : ''

    // Feature-specific system prompts
    let featurePrompt = ''
    if (feature === 'resume-review') {
      featurePrompt = `You are now in RESUME REVIEW mode. Analyze the user's resume content and provide:
- Strengths and weaknesses
- ATS optimization suggestions
- Formatting improvements
- Content enhancements
- Keyword optimization
- Quantifiable achievements suggestions`
    } else if (feature === 'hr-questions') {
      featurePrompt = `You are now in HR QUESTION GENERATION mode. Generate:
- Common HR interview questions for the user's role/experience
- Sample answers with STAR method
- Follow-up questions
- Tips for answering effectively`
    } else if (feature === 'company-prep') {
      featurePrompt = `You are now in COMPANY-WISE INTERVIEW PREP mode. Provide:
- Company-specific interview insights
- Culture and values information
- Common interview questions for that company
- Preparation strategies
- What the company looks for in candidates`
    } else if (feature === 'role-suggestions') {
      featurePrompt = `You are now in JOB ROLE SUGGESTIONS mode. Provide:
- Skills needed for the role
- Learning path and resources
- Career progression
- Salary expectations
- Market demand
- Required certifications/education`
    } else if (feature === 'ui-generate') {
      featurePrompt = `You are now in APP UI AUTO-GENERATE mode. Provide:
- UI/UX design suggestions
- Component recommendations
- Accessibility improvements
- Design patterns
- User experience enhancements
- Modern design trends`
    }

    // Prepare messages with enhanced system context
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `${VEDA_SYSTEM_PROMPT}${userContext}${featurePrompt}`,
      },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ]

    const responseText = await chatWithAI(messages)

    const response: ApiResponse<{
      message: string
      response: string
    }> = {
      success: true,
      data: {
        message,
        response: responseText,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Veda chat error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to get response from Veda assistant',
    }
    res.status(500).json(response)
  }
}

export const reviewResume = async (
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

    const { resumeContent } = req.body

    if (!resumeContent) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Resume content is required',
      }
      res.status(400).json(response)
      return
    }

    const user = await User.findById(req.user.userId)
    const userContext = user ? `
User Profile:
- Name: ${user.name}
- Experience: ${user.workExperience || 0} years
- Current Role: ${user.role}
- Work Experiences: ${JSON.stringify(user.workExperiences || [])}
- Education: ${JSON.stringify(user.educations || [])}
- Skills: ${user.projects?.map(p => p.technologies || []).flat().join(', ') || 'Not specified'}
` : ''

    const reviewPrompt = `${VEDA_SYSTEM_PROMPT}${userContext}

You are now performing a COMPREHENSIVE RESUME REVIEW. Analyze the following resume content and provide detailed feedback:

Resume Content:
${resumeContent}

Provide a structured review with:
1. **Overall Assessment** (strengths and weaknesses)
2. **ATS Optimization** (keyword suggestions, formatting)
3. **Content Improvements** (quantifiable achievements, action verbs)
4. **Formatting Recommendations** (layout, sections, readability)
5. **Missing Elements** (what should be added)
6. **Score** (out of 10) with breakdown
7. **Action Items** (specific steps to improve)

Be specific, actionable, and encouraging.`

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: reviewPrompt,
      },
      {
        role: 'user',
        content: 'Please review my resume and provide detailed feedback.',
      },
    ]

    const reviewText = await chatWithAI(messages)

    const response: ApiResponse<{
      review: string
    }> = {
      success: true,
      data: {
        review: reviewText,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Resume review error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to review resume',
    }
    res.status(500).json(response)
  }
}

export const generateHRQuestions = async (
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

    const { jobRole, experienceLevel, company } = req.body

    const user = await User.findById(req.user.userId)
    const userContext = user ? `
User Profile:
- Experience: ${user.workExperience || 0} years
- Current Role: ${user.role}
- Work Experiences: ${JSON.stringify(user.workExperiences || [])}
` : ''

    const questionsPrompt = `${VEDA_SYSTEM_PROMPT}${userContext}

Generate comprehensive HR interview questions for:
- Job Role: ${jobRole || 'General'}
- Experience Level: ${experienceLevel || 'Mid-level'}
- Company: ${company || 'General'}

Provide:
1. **10-15 Common HR Questions** with context
2. **Sample Answers** using STAR method
3. **Follow-up Questions** that might be asked
4. **Tips** for answering each question
5. **Red Flags** to avoid

Format the response clearly with sections and examples.`

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: questionsPrompt,
      },
      {
        role: 'user',
        content: `Generate HR interview questions for ${jobRole || 'my role'} at ${company || 'a company'}.`,
      },
    ]

    const questionsText = await chatWithAI(messages)

    const response: ApiResponse<{
      questions: string
    }> = {
      success: true,
      data: {
        questions: questionsText,
      },
    }

    res.json(response)
  } catch (error: any) {
    console.error('HR questions generation error:', error)
    const errorMessage = error?.message || 'Failed to generate HR questions'
    const response: ApiResponse<never> = {
      success: false,
      error: errorMessage,
    }
    res.status(500).json(response)
  }
}

export const companyInterviewPrep = async (
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

    const { companyName, jobRole } = req.body

    if (!companyName) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Company name is required',
      }
      res.status(400).json(response)
      return
    }

    const user = await User.findById(req.user.userId)
    const userContext = user ? `
User Profile:
- Experience: ${user.workExperience || 0} years
- Skills: ${user.projects?.map(p => p.technologies || []).flat().join(', ') || 'Not specified'}
- Education: ${user.educations?.map(e => e.degree).join(', ') || 'Not specified'}
` : ''

    const prepPrompt = `${VEDA_SYSTEM_PROMPT}${userContext}

Provide comprehensive interview preparation for:
- Company: ${companyName}
- Job Role: ${jobRole || 'General'}

Include:
1. **Company Overview** (culture, values, mission)
2. **Interview Process** (typical rounds, format)
3. **Common Questions** (technical, behavioral, company-specific)
4. **What They Look For** (skills, qualities, values)
5. **Preparation Strategy** (what to study, practice)
6. **Tips** (dos and don'ts, insider insights)
7. **Questions to Ask** (shows interest and research)

Be specific and actionable.`

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: prepPrompt,
      },
      {
        role: 'user',
        content: `Help me prepare for an interview at ${companyName} for ${jobRole || 'a position'}.`,
      },
    ]

    const prepText = await chatWithAI(messages)

    const response: ApiResponse<{
      preparation: string
    }> = {
      success: true,
      data: {
        preparation: prepText,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Company prep error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to generate company interview prep',
    }
    res.status(500).json(response)
  }
}

export const getRoleSuggestions = async (
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

    const { jobRole } = req.body

    if (!jobRole) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Job role is required',
      }
      res.status(400).json(response)
      return
    }

    const user = await User.findById(req.user.userId)
    const userContext = user ? `
User Profile:
- Current Experience: ${user.workExperience || 0} years
- Current Skills: ${user.projects?.map(p => p.technologies || []).flat().join(', ') || 'Not specified'}
- Education: ${user.educations?.map(e => e.degree).join(', ') || 'Not specified'}
- Work Experience: ${JSON.stringify(user.workExperiences || [])}
` : ''

    const suggestionsPrompt = `${VEDA_SYSTEM_PROMPT}${userContext}

Provide comprehensive career guidance for the role: ${jobRole}

Include:
1. **Required Skills** (technical and soft skills)
2. **Learning Path** (step-by-step guide, resources, courses)
3. **Career Progression** (entry → senior → lead)
4. **Salary Range** (by experience level, location)
5. **Market Demand** (current trends, future outlook)
6. **Certifications** (recommended, required)
7. **Portfolio/Projects** (what to build)
8. **Interview Preparation** (what to expect)
9. **Day-to-Day Work** (typical tasks, responsibilities)
10. **Growth Opportunities** (next steps, related roles)

Be detailed, specific, and actionable.`

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: suggestionsPrompt,
      },
      {
        role: 'user',
        content: `I want to pursue a career as ${jobRole}. Provide comprehensive guidance.`,
      },
    ]

    const suggestionsText = await chatWithAI(messages)

    const response: ApiResponse<{
      suggestions: string
    }> = {
      success: true,
      data: {
        suggestions: suggestionsText,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Role suggestions error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to generate role suggestions',
    }
    res.status(500).json(response)
  }
}

export const generateUI = async (
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

    const { description, componentType, techStack } = req.body

    if (!description) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Description is required',
      }
      res.status(400).json(response)
      return
    }

    const uiPrompt = `${VEDA_SYSTEM_PROMPT}

You are now in APP UI AUTO-GENERATE mode. Generate UI/UX design and code for:

Description: ${description}
Component Type: ${componentType || 'General'}
Tech Stack: ${techStack || 'React + Tailwind CSS'}

Provide:
1. **Design Concept** (layout, color scheme, typography)
2. **Component Structure** (hierarchy, components needed)
3. **Code Implementation** (React/TypeScript with Tailwind CSS)
4. **Accessibility Features** (ARIA labels, keyboard navigation)
5. **Responsive Design** (mobile, tablet, desktop)
6. **User Experience** (interactions, animations, feedback)
7. **Best Practices** (performance, SEO, maintainability)

Generate production-ready code with:
- TypeScript types
- Tailwind CSS classes
- Proper component structure
- Accessibility considerations
- Responsive design
- Modern UI patterns

Format code with proper indentation and comments.`

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: uiPrompt,
      },
      {
        role: 'user',
        content: `Generate UI for: ${description}`,
      },
    ]

    const uiText = await chatWithAI(messages)

    const response: ApiResponse<{
      ui: string
    }> = {
      success: true,
      data: {
        ui: uiText,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('UI generation error:', error)
    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to generate UI',
    }
    res.status(500).json(response)
  }
}

export const validateChat = [
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('conversationHistory').optional().isArray(),
  body('feature').optional().isString(),
]

export const validateResumeReview = [
  body('resumeContent').trim().notEmpty().withMessage('Resume content is required'),
]

export const validateHRQuestions = [
  // All fields are optional, so we use optional validation
  body('jobRole').optional().trim().isString().withMessage('Job role must be a string'),
  body('experienceLevel').optional().trim().isString().withMessage('Experience level must be a string'),
  body('company').optional().trim().isString().withMessage('Company must be a string'),
]

export const validateCompanyPrep = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('jobRole').optional().isString(),
]

export const validateRoleSuggestions = [
  body('jobRole').trim().notEmpty().withMessage('Job role is required'),
]

export const validateUIGenerate = [
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('componentType').optional().isString(),
  body('techStack').optional().isString(),
]
