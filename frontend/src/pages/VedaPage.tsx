'use client'

import React, { useState } from 'react'
import { useVedaChat, useResumeReview, useHRQuestions, useCompanyPrep, useRoleSuggestions, useUIGenerate } from '@/hooks/useVeda'
import { Button } from '@/components/common/Button'
import { useCurrentUser } from '@/hooks/useAuth'
import { showToast } from '@/utils/toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type FeatureType = 'chat' | 'resume-review' | 'hr-questions' | 'company-prep' | 'role-suggestions' | 'ui-generate'

export const VedaPage: React.FC = () => {
  const { data: userData } = useCurrentUser()
  const user = userData?.data
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [activeFeature, setActiveFeature] = useState<FeatureType>('chat')
  const [resumeContent, setResumeContent] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [uiDescription, setUiDescription] = useState('')
  
  const chatMutation = useVedaChat()
  const resumeReviewMutation = useResumeReview()
  const hrQuestionsMutation = useHRQuestions()
  const companyPrepMutation = useCompanyPrep()
  const roleSuggestionsMutation = useRoleSuggestions()
  const uiGenerateMutation = useUIGenerate()

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')

    try {
      const result = await chatMutation.mutateAsync({
        message: input,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        feature: activeFeature !== 'chat' ? activeFeature : undefined,
      })

      if (result.success && result.data) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: result.data.response },
        ])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.'
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ])
      showToast('Failed to send message', 'error')
    }
  }

  const handleResumeReview = async () => {
    if (!resumeContent.trim()) {
      showToast('Please provide resume content', 'error')
      return
    }

    try {
      showToast('Analyzing your resume...', 'info')
      const result = await resumeReviewMutation.mutateAsync({ resumeContent })
      
      if (result.success && result.data) {
        setMessages([
          { role: 'assistant', content: result.data.review },
        ])
        setActiveFeature('chat')
        showToast('Resume review completed!', 'success')
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to review resume'
      showToast(errorMessage, 'error')
    }
  }

  const handleHRQuestions = async () => {
    try {
      showToast('Generating HR questions...', 'info')
      const result = await hrQuestionsMutation.mutateAsync({
        jobRole: jobRole || user?.workExperiences?.[0]?.title || 'Software Engineer',
        experienceLevel: user?.workExperience ? `${user.workExperience} years` : 'Mid-level',
        company: companyName || undefined,
      })
      
      if (result.success && result.data) {
        setMessages([
          { role: 'assistant', content: result.data.questions },
        ])
        setActiveFeature('chat')
        showToast('HR questions generated!', 'success')
      } else {
        showToast(result.error || 'Failed to generate questions', 'error')
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to generate questions'
      showToast(errorMessage, 'error')
    }
  }

  const handleCompanyPrep = async () => {
    if (!companyName.trim()) {
      showToast('Please enter a company name', 'error')
      return
    }

    try {
      showToast('Preparing interview guide...', 'info')
      const result = await companyPrepMutation.mutateAsync({
        companyName,
        jobRole: jobRole || undefined,
      })
      
      if (result.success && result.data) {
        setMessages([
          { role: 'assistant', content: result.data.preparation },
        ])
        setActiveFeature('chat')
        showToast('Interview prep guide ready!', 'success')
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to generate prep guide'
      showToast(errorMessage, 'error')
    }
  }

  const handleRoleSuggestions = async () => {
    if (!jobRole.trim()) {
      showToast('Please enter a job role', 'error')
      return
    }

    try {
      showToast('Generating career guidance...', 'info')
      const result = await roleSuggestionsMutation.mutateAsync({ jobRole })
      
      if (result.success && result.data) {
        setMessages([
          { role: 'assistant', content: result.data.suggestions },
        ])
        setActiveFeature('chat')
        showToast('Career guidance generated!', 'success')
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to generate suggestions'
      showToast(errorMessage, 'error')
    }
  }

  const handleUIGenerate = async () => {
    if (!uiDescription.trim()) {
      showToast('Please describe the UI you want', 'error')
      return
    }

    try {
      showToast('Generating UI code...', 'info')
      const result = await uiGenerateMutation.mutateAsync({
        description: uiDescription,
        techStack: 'React + TypeScript + Tailwind CSS',
      })
      
      if (result.success && result.data) {
        setMessages([
          { role: 'assistant', content: result.data.ui },
        ])
        setActiveFeature('chat')
        showToast('UI code generated!', 'success')
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to generate UI'
      showToast(errorMessage, 'error')
    }
  }

  const features = [
    {
      id: 'resume-review' as FeatureType,
      title: 'Resume Review',
      icon: '📄',
      description: 'Get AI-powered resume analysis and optimization suggestions',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'hr-questions' as FeatureType,
      title: 'HR Questions',
      icon: '❓',
      description: 'Generate interview questions with sample answers',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'company-prep' as FeatureType,
      title: 'Company Prep',
      icon: '🏢',
      description: 'Company-specific interview preparation guide',
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'role-suggestions' as FeatureType,
      title: 'Role Suggestions',
      icon: '💼',
      description: 'Career guidance and skill recommendations',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'ui-generate' as FeatureType,
      title: 'UI Generator',
      icon: '🎨',
      description: 'Auto-generate UI components and designs',
      color: 'from-pink-500 to-pink-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-bounce-in animate-float">
              <span className="text-3xl">🤖</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Veda AI</h1>
              <p className="text-lg text-gray-600">Your AI-powered career and recruitment assistant</p>
            </div>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trained on 100+ FAQs • Resume Review • HR Questions • Company Prep • Role Suggestions • UI Generator
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Features */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 animate-fade-in-up">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Features</h2>
              <div className="space-y-3">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => {
                      setActiveFeature(feature.id)
                      setMessages([])
                    }}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      activeFeature === feature.id
                        ? `bg-gradient-to-r ${feature.color} text-white shadow-lg transform scale-105`
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <div className="font-semibold">{feature.title}</div>
                        <div className={`text-sm ${activeFeature === feature.id ? 'text-white/90' : 'text-gray-500'}`}>
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 h-[700px] flex flex-col overflow-hidden animate-fade-in-up animate-delay-200">
              {/* Feature-specific input forms */}
              {activeFeature === 'resume-review' && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Resume Review</h3>
                  <textarea
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    placeholder="Paste your resume content here for AI-powered review..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <Button
                    onClick={handleResumeReview}
                    disabled={!resumeContent.trim() || resumeReviewMutation.isPending}
                    className="mt-3"
                  >
                    {resumeReviewMutation.isPending ? 'Analyzing...' : 'Review Resume'}
                  </Button>
                </div>
              )}

              {activeFeature === 'hr-questions' && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">HR Question Generator</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="Job Role (e.g., Software Engineer)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Name (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <Button
                      onClick={handleHRQuestions}
                      disabled={hrQuestionsMutation.isPending}
                    >
                      {hrQuestionsMutation.isPending ? 'Generating...' : 'Generate Questions'}
                    </Button>
                  </div>
                </div>
              )}

              {activeFeature === 'company-prep' && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Interview Prep</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Name *"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="Job Role (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <Button
                      onClick={handleCompanyPrep}
                      disabled={!companyName.trim() || companyPrepMutation.isPending}
                    >
                      {companyPrepMutation.isPending ? 'Preparing...' : 'Get Prep Guide'}
                    </Button>
                  </div>
                </div>
              )}

              {activeFeature === 'role-suggestions' && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Role Career Guide</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="Job Role (e.g., Full Stack Developer, Data Scientist)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <Button
                      onClick={handleRoleSuggestions}
                      disabled={!jobRole.trim() || roleSuggestionsMutation.isPending}
                    >
                      {roleSuggestionsMutation.isPending ? 'Generating...' : 'Get Career Guide'}
                    </Button>
                  </div>
                </div>
              )}

              {activeFeature === 'ui-generate' && (
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">UI Auto-Generator</h3>
                  <div className="space-y-3">
                    <textarea
                      value={uiDescription}
                      onChange={(e) => setUiDescription(e.target.value)}
                      placeholder="Describe the UI component you want (e.g., 'A modern login form with email and password fields')"
                      className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                    />
                    <Button
                      onClick={handleUIGenerate}
                      disabled={!uiDescription.trim() || uiGenerateMutation.isPending}
                    >
                      {uiGenerateMutation.isPending ? 'Generating...' : 'Generate UI Code'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Veda AI Assistant</h2>
                    <p className="text-sm text-blue-100">
                      {activeFeature === 'chat' && 'Ask me anything about careers, jobs, or recruitment'}
                      {activeFeature === 'resume-review' && 'Resume Review & Optimization'}
                      {activeFeature === 'hr-questions' && 'HR Interview Questions Generator'}
                      {activeFeature === 'company-prep' && 'Company-specific Interview Preparation'}
                      {activeFeature === 'role-suggestions' && 'Job Role Career Guidance'}
                      {activeFeature === 'ui-generate' && 'UI/UX Code Generator'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-12">
                    <div className="text-6xl mb-4">🤖</div>
                    <p className="text-xl font-semibold mb-2 text-gray-700">Welcome to Veda AI!</p>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {activeFeature === 'chat' && 'I can help you with job search advice, resume tips, interview preparation, and career guidance. Ask me anything!'}
                      {activeFeature === 'resume-review' && 'Paste your resume content above and get AI-powered feedback and optimization suggestions.'}
                      {activeFeature === 'hr-questions' && 'Enter your job role and get personalized HR interview questions with sample answers.'}
                      {activeFeature === 'company-prep' && 'Enter a company name to get comprehensive interview preparation guide.'}
                      {activeFeature === 'role-suggestions' && 'Enter a job role to get career guidance, skills needed, and learning path.'}
                      {activeFeature === 'ui-generate' && 'Describe the UI you want and get production-ready React/TypeScript code with Tailwind CSS.'}
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {(chatMutation.isPending || resumeReviewMutation.isPending || hrQuestionsMutation.isPending || 
                  companyPrepMutation.isPending || roleSuggestionsMutation.isPending || uiGenerateMutation.isPending) && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-gray-600 ml-2">Veda is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input - Only show for chat mode */}
              {activeFeature === 'chat' && (
                <div className="border-t border-gray-200 p-6 bg-gray-50/50">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      placeholder="Ask Veda anything about careers, jobs, or recruitment..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                      disabled={chatMutation.isPending}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || chatMutation.isPending}
                      size="lg"
                    >
                      Send →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
