'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useAuth'
import { ProfileAvatar } from '@/components/common/ProfileAvatar'
import { showToast } from '@/utils/toast'
import { WorkExperienceModal } from '@/components/modals/WorkExperienceModal'
import { ProjectModal } from '@/components/modals/ProjectModal'
import { EducationModal } from '@/components/modals/EducationModal'
import { CertificateModal } from '@/components/modals/CertificateModal'
import { useUpdateProfile } from '@/hooks/useProfile'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { data: userData, refetch } = useCurrentUser()
  const user = userData?.data
  const updateProfile = useUpdateProfile()
  const [activeTab, setActiveTab] = useState<'stats' | 'profile'>('profile')
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})
  
  // Calculate profile completion percentage in real-time
  const profileCompletion = useMemo(() => {
    if (!user || user.role !== 'candidate') return 0
    
    let completedFields = 0
    const totalFields = 12
    
    if (user.name) completedFields++
    if (user.email) completedFields++
    if (user.profilePicture) completedFields++
    if (user.resume) completedFields++
    if (user.currentLocation) completedFields++
    if (user.graduationYear) completedFields++
    if (user.workExperience !== undefined) completedFields++
    if (user.linkedin) completedFields++
    if (user.github) completedFields++
    if (user.description) completedFields++
    if (user.workExperiences && user.workExperiences.length > 0) completedFields++
    if (user.projects && user.projects.length > 0) completedFields++
    
    return Math.round((completedFields / totalFields) * 100)
  }, [user])
  
  // Refetch user data periodically to keep completion status real-time
  useEffect(() => {
    if (user?.role === 'candidate') {
      const interval = setInterval(() => {
        refetch()
      }, 5000) // Refetch every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [user?.role, refetch])
  
  // Modal states
  const [isWorkExpModalOpen, setIsWorkExpModalOpen] = useState(false)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false)
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false)
  
  // Use user data if available, otherwise show empty array (no default data)
  const workExperiences = user?.workExperiences || []
  const projects = user?.projects || []
  const educations = user?.educations || []
  const certificates = user?.certificates || []

  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile`
    try {
      await navigator.clipboard.writeText(profileUrl)
      showToast('Profile link copied to clipboard!', 'success')
    } catch (error) {
      showToast('Failed to copy link', 'error')
    }
  }

  const handleDownloadResume = async () => {
    if (!user?.resume) {
      showToast('No resume uploaded yet', 'info')
      return
    }

    try {
      let blob: Blob
      let fileName = 'resume.pdf'
      let mimeType = 'application/pdf'

      // Check if resume is a base64 string
      if (user.resume.startsWith('data:')) {
        // Extract MIME type and base64 data
        const matches = user.resume.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          mimeType = matches[1]
          const base64Data = matches[2]
          
          // Determine file extension from MIME type
          if (mimeType.includes('pdf')) {
            fileName = 'resume.pdf'
            mimeType = 'application/pdf'
          } else if (mimeType.includes('msword') || mimeType.includes('wordprocessingml')) {
            fileName = mimeType.includes('wordprocessingml') ? 'resume.docx' : 'resume.doc'
            mimeType = mimeType.includes('wordprocessingml') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword'
          } else {
            fileName = 'resume.pdf'
            mimeType = 'application/pdf'
          }

          // Convert base64 to blob
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          blob = new Blob([byteArray], { type: mimeType })
        } else {
          // If it's base64 without data URI prefix, assume PDF
          const byteCharacters = atob(user.resume)
          const byteNumbers = new Array(byteCharacters.length)
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          blob = new Blob([byteArray], { type: 'application/pdf' })
        }
      } else if (user.resume.startsWith('http://') || user.resume.startsWith('https://')) {
        // If it's a URL, fetch the file
        const response = await fetch(user.resume)
        blob = await response.blob()
        // Try to get filename from URL or Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition')
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (fileNameMatch) {
            fileName = fileNameMatch[1]
          }
        } else {
          // Extract filename from URL
          const urlParts = user.resume.split('/')
          fileName = urlParts[urlParts.length - 1] || 'resume.pdf'
        }
      } else {
        // Assume it's a filename or plain text
        showToast('Resume format not supported', 'error')
        return
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast('Resume downloaded successfully!', 'success')
    } catch (error) {
      console.error('Error downloading resume:', error)
      showToast('Failed to download resume', 'error')
    }
  }

  const handleStartRecording = () => {
    navigate('/video/intro')
  }

  const handleSaveWorkExperience = async (data: {
    title: string
    company: string
    location?: string
    duration?: string
    description: string
    startDate?: string
    endDate?: string
  }) => {
    try {
      const currentExperiences = user?.workExperiences || []
      const updatedExperiences = [...currentExperiences, data]
      
      await updateProfile.mutateAsync({
        workExperiences: updatedExperiences,
      })
      
      showToast('Work experience added successfully!', 'success')
      refetch()
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save work experience'
      showToast(errorMessage, 'error')
    }
  }

  const handleSaveProject = async (data: {
    name: string
    description: string
    link?: string
    technologies?: string[]
  }) => {
    try {
      const currentProjects = user?.projects || []
      const updatedProjects = [...currentProjects, data]
      
      await updateProfile.mutateAsync({
        projects: updatedProjects,
      })
      
      showToast('Project added successfully!', 'success')
      refetch()
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save project'
      showToast(errorMessage, 'error')
    }
  }

  const handleSaveEducation = async (data: {
    degree: string
    institution: string
    location?: string
    startDate?: string
    endDate?: string
    fieldOfStudy?: string
  }) => {
    try {
      const currentEducations = user?.educations || []
      const updatedEducations = [...currentEducations, data]
      
      await updateProfile.mutateAsync({
        educations: updatedEducations,
      })
      
      showToast('Education added successfully!', 'success')
      refetch()
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save education'
      showToast(errorMessage, 'error')
    }
  }

  const handleSaveCertificate = async (data: {
    name: string
    issuer: string
    date: string
    link?: string
  }) => {
    try {
      const currentCertificates = user?.certificates || []
      const updatedCertificates = [...currentCertificates, data]
      
      await updateProfile.mutateAsync({
        certificates: updatedCertificates,
      })
      
      showToast('Certificate added successfully!', 'success')
      refetch()
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save certificate'
      showToast(errorMessage, 'error')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start space-x-4">
              {/* Profile Picture */}
              <ProfileAvatar
                name={user.name}
                size="lg"
                className="flex-shrink-0"
              />
              
              {/* Name and Details */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                
                {/* Key Details */}
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  {user?.role === 'candidate' && (
                    <>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{user?.workExperience && user.workExperience > 0 ? `${user.workExperience} Years exp.` : 'Fresher'}</span>
                      </div>
                      {user?.graduationYear && (
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          <span>Graduating in {user.graduationYear}</span>
                        </div>
                      )}
                    </>
                  )}
                  {user?.currentLocation && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{user.currentLocation}</span>
                    </div>
                  )}
                  {(user?.role === 'placement' || user?.role === 'admin') && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="capitalize">{user.role === 'admin' ? 'Administrator' : 'Placement Team'}</span>
                    </div>
                  )}
                </div>
                
                {/* Social Links */}
                <div className="flex items-center space-x-3">
                  {user?.linkedin && (
                    <a 
                      href={user.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors"
                      title="LinkedIn Profile"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                  )}
                  {user?.github && (
                    <a 
                      href={user.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-900 transition-colors"
                      title="GitHub Profile"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>
                  )}
                  {user?.portfolioLink && (
                    <a 
                      href={user.portfolioLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors"
                      title="Portfolio"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Completion Indicator - Only for candidates */}
            {user?.role === 'candidate' && (
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <svg className="transform -rotate-90 w-20 h-20">
                    <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36 * (profileCompletion / 100)} ${2 * Math.PI * 36}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold text-gray-900">{profileCompletion}%</span>
                    <span className="text-xs text-gray-600">Complete</span>
                  </div>
                </div>
              </div>
            )}
              </div>

          {/* Tabs and Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            {/* Tabs - Only show for candidates */}
            {user?.role === 'candidate' ? (
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'stats'
                      ? 'text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Stats
                  {activeTab === 'stats' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === 'profile'
                      ? 'text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Profile
                  {activeTab === 'profile' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700"></span>
                  )}
                </button>
              </div>
            ) : (
              <div></div>
            )}
            
            <div className="flex items-center space-x-2">
              <Link
                to="/profile/edit"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Profile</span>
              </Link>
              <button 
                onClick={handleShareProfile}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>Share Profile</span>
              </button>
              {user?.role === 'candidate' && (
                <button 
                  onClick={handleDownloadResume}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Resume</span>
                </button>
              )}
            </div>
          </div>
              </div>

        {/* Stats Tab Content */}
        {activeTab === 'stats' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">GITHUB STATS</h2>
            
            {/* Contributions Graph */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">58 Contributions in the last year</p>
              
              {/* Graph Container */}
              <div className="flex items-start space-x-2 overflow-x-auto pb-4">
                {/* Day Labels */}
                <div className="flex flex-col space-y-0.5 pt-6 pr-2 flex-shrink-0">
                  <div className="h-2.5"></div>
                  <div className="h-2.5 text-xs text-gray-500 leading-none">Mon</div>
                  <div className="h-2.5"></div>
                  <div className="h-2.5 text-xs text-gray-500 leading-none">Wed</div>
                  <div className="h-2.5"></div>
                  <div className="h-2.5 text-xs text-gray-500 leading-none">Fri</div>
                  <div className="h-2.5"></div>
                </div>
                
                {/* Graph Grid */}
                <div className="flex-1 min-w-0">
                  {/* Month Labels */}
                  <div className="flex mb-2 text-xs text-gray-500">
                    <span className="w-[8.5%]">Feb</span>
                    <span className="w-[8.5%]">Mar</span>
                    <span className="w-[8.5%]">Apr</span>
                    <span className="w-[8.5%]">May</span>
                    <span className="w-[8.5%]">Jun</span>
                    <span className="w-[8.5%]">Jul</span>
                    <span className="w-[8.5%]">Aug</span>
                    <span className="w-[8.5%]">Sep</span>
                    <span className="w-[8.5%]">Oct</span>
                    <span className="w-[8.5%]">Nov</span>
                  </div>
                  
                  {/* Contribution Squares Grid - 7 rows (days) x 53 columns (weeks) */}
                  <div className="overflow-x-auto">
                    <div className="inline-grid gap-1" style={{ gridTemplateColumns: 'repeat(53, 11px)', gridTemplateRows: 'repeat(7, 11px)' }}>
                      {(() => {
                        const weeks = 53
                        const days = 7
                        const contributions = []
                        
                        // Generate realistic contribution pattern
                        for (let day = 0; day < days; day++) {
                          for (let week = 0; week < weeks; week++) {
                            let intensity = 0
                            
                            // Create realistic patterns:
                            // - More activity in middle months (May-Aug)
                            // - Some activity in recent months (Oct-Nov)
                            // - Less activity in early months (Feb-Mar)
                            const monthProgress = week / weeks
                            
                            if (monthProgress >= 0.25 && monthProgress <= 0.65) {
                              // May to August - more activity
                              if (Math.random() > 0.75) {
                                intensity = Math.floor(Math.random() * 4) + 1
                              }
                            } else if (monthProgress >= 0.75) {
                              // October to November - some activity
                              if (Math.random() > 0.85) {
                                intensity = Math.floor(Math.random() * 3) + 1
                              }
                            } else {
                              // February to April - less activity
                              if (Math.random() > 0.92) {
                                intensity = Math.floor(Math.random() * 2) + 1
                              }
                            }
                            
                            contributions.push({ intensity, day, week })
                          }
                        }
                        
                        return contributions.map(({ intensity }, i) => {
                          // GitHub-like colors
                          const colors = [
                            '#ebedf0', // No contributions
                            '#9be9a8', // 1-3 contributions
                            '#40c463', // 4-6 contributions
                            '#30a14e', // 7-9 contributions
                            '#216e39'  // 10+ contributions
                          ]
                          return (
                            <div
                              key={i}
                              className="rounded-sm hover:ring-2 hover:ring-gray-400 hover:scale-110 transition-all cursor-pointer"
                              style={{
                                width: '11px',
                                height: '11px',
                                backgroundColor: colors[intensity]
                              }}
                              title={`${intensity > 0 ? intensity : 'No'} contribution${intensity !== 1 ? 's' : ''}`}
                            />
                          )
                        })
                      })()}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-end space-x-2 mt-4 text-xs text-gray-500">
                    <span>Less</span>
                    <div className="flex space-x-1">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#ebedf0' }}></div>
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#9be9a8' }}></div>
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#40c463' }}></div>
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#30a14e' }}></div>
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#216e39' }}></div>
                    </div>
                    <span>More</span>
                  </div>
                  </div>
                </div>
              </div>

            {/* Repositories and Pinned */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">Total 0 repositories</p>
              <div className="relative">
                <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                  <span>Pinned</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <>
            {user?.role === 'candidate' ? (
              <>
                {/* STUDENT INFO Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 card-enter animate-delay-300 hover-lift transition-smooth">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">STUDENT INFO</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Available to join</p>
                      <p className="text-sm text-gray-600">{user?.availableToJoin || 'Within 3 months'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Company type preferences</p>
                      <p className="text-sm text-gray-600">
                        {user?.companyType && user.companyType.length > 0 
                          ? user.companyType.join(', ')
                          : 'Large Enterprise, Medium Enterprise, Small Enterprise'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Current location</p>
                      <p className="text-sm text-gray-600">{user?.currentLocation || 'Ranchi, Jharkhand'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Preferred locations</p>
                      <p className="text-sm text-gray-600">
                        {user?.preferredLocations && user.preferredLocations.length > 0
                          ? user.preferredLocations.join(', ')
                          : 'Remote, Bengaluru, Mumbai, Hyderabad, Pune, Chennai, Gurugram, Noida, Delhi, Kolkata, Ahmedabad, Jaipur, Chandigarh, Lucknow, Bhubaneswar, Kanpur, Ranchi, Goa, Navi Mumbai, Other'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* WORK EXPERIENCE Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">WORK EXPERIENCE</h2>
                    <button 
                      onClick={() => setIsWorkExpModalOpen(true)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Add Work Experience"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {workExperiences.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No work experience added yet. Click the + icon to add one.</p>
                    ) : (
                      workExperiences.map((exp, index) => {
                      const expId = `exp-${index}`
                      const isExpanded = expandedDescriptions[expId]
                      const shortDescription = exp.description.length > 150 
                        ? exp.description.substring(0, 150) + '...'
                        : exp.description
                      
                      return (
                        <div key={index}>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {exp.title} {exp.company && `at ${exp.company}`}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {exp.location && `${exp.location} • `}
                            {exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} - ${exp.endDate}` : '')}
                          </p>
                          <div className="text-sm text-gray-700">
                            {exp.description.length > 150 ? (
                              <>
                                <p>{isExpanded ? exp.description : shortDescription}</p>
                                <button
                                  onClick={() => toggleDescription(expId)}
                                  className="text-blue-600 hover:underline mt-1"
                                >
                                  {isExpanded ? 'Read less' : 'Read more'}
                                </button>
                              </>
                            ) : (
                              <p>{exp.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    }))}
                  </div>
                </div>

                {/* PROJECTS Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">PROJECTS</h2>
                    <button 
                      onClick={() => setIsProjectModalOpen(true)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Add Project"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {projects.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No projects added yet. Click the + icon to add one.</p>
                    ) : (
                      projects.map((project, index) => (
                      <div key={index}>
                        <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                        <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                        {project.link && project.link !== '#' && (
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Project Link
                          </a>
                        )}
                      </div>
                    )))}
                  </div>
                </div>

                {/* EDUCATION Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">EDUCATION</h2>
                    <button 
                      onClick={() => setIsEducationModalOpen(true)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Add Education"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {educations.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No education added yet. Click the + icon to add one.</p>
                    ) : (
                      educations.map((edu, index) => (
                      <div key={index}>
                        <h3 className="font-semibold text-gray-900 mb-1">{edu.degree}</h3>
                        <p className="text-sm text-gray-600 mb-1">
                          {edu.institution}
                          {edu.location && `, ${edu.location}`}
                        </p>
                        {(edu.startDate || edu.endDate) && (
                          <p className="text-sm text-gray-600">
                            {edu.startDate} {edu.endDate && `- ${edu.endDate}`}
                          </p>
                        )}
                      </div>
                    )))}
                  </div>
                </div>

                {/* CERTIFICATES Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">CERTIFICATES</h2>
                    <button 
                      onClick={() => setIsCertificateModalOpen(true)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Add Certificate"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {certificates.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No certificates added yet. Click the + icon to add one.</p>
                    ) : (
                      certificates.map((cert, index) => (
                      <div key={index}>
                        <h3 className="font-semibold text-gray-900 mb-1">{cert.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{cert.date}</p>
                        {cert.link && cert.link !== '#' && (
                          <a 
                            href={cert.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Certificate Link
                          </a>
                        )}
                      </div>
                    )))}
                  </div>
                </div>

                {/* PERSONALITY Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">PERSONALITY</h2>
                  <p className="text-sm text-gray-700 mb-4">
                    Personality is determined through a video resume that enables recruiters to gain insight into your behavioural aspects.
                  </p>
                  <button 
                    onClick={handleStartRecording}
                    className="px-6 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Start Recording
                  </button>
                </div>
              </>
            ) : (
              /* Placement Team / Admin Info Section */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">TEAM MEMBER INFO</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Role</p>
                    <p className="text-sm text-gray-600 capitalize">{user.role === 'admin' ? 'Administrator' : 'Placement Team Member'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  {user?.currentLocation && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Location</p>
                      <p className="text-sm text-gray-600">{user.currentLocation}</p>
                    </div>
                  )}
                  {user?.description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                      <p className="text-sm text-gray-600">{user.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modals */}
        <WorkExperienceModal
          isOpen={isWorkExpModalOpen}
          onClose={() => setIsWorkExpModalOpen(false)}
          onSave={handleSaveWorkExperience}
        />
        
        <ProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onSave={handleSaveProject}
        />
        
        <EducationModal
          isOpen={isEducationModalOpen}
          onClose={() => setIsEducationModalOpen(false)}
          onSave={handleSaveEducation}
        />
        
        <CertificateModal
          isOpen={isCertificateModalOpen}
          onClose={() => setIsCertificateModalOpen(false)}
          onSave={handleSaveCertificate}
        />
      </div>
    </div>
  )
}
