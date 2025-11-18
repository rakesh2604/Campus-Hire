'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useCurrentUser } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ProfileAvatar } from '@/components/common/ProfileAvatar'
import { useUpdateProfile } from '@/hooks/useProfile'
import { showToast } from '@/utils/toast'
import { fileToBase64, compressImage } from '@/utils/imageCompression'
import apiClient from '@/api/axios'

interface ProfileFormData {
  name: string
  workExperience: number
  graduationYear: string
  currentLocation: string
  description: string
  portfolioLink: string
  availableToJoin: string
  preferredLocations: string[]
  companyType: string[]
  linkedin: string
  github: string
  currentCTC: number
  desiredCTCMin: number
  desiredCTCMax: number
}

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { data: userData, refetch } = useCurrentUser()
  const user = userData?.data
  const updateProfile = useUpdateProfile()
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [preferredLocations, setPreferredLocations] = useState<string[]>([])
  const [companyTypes, setCompanyTypes] = useState<string[]>([])

  // Load user data on mount
  useEffect(() => {
    if (user) {
      // Load profile picture - prioritize database, then localStorage
      if (user.profilePicture) {
        setProfilePicture(user.profilePicture)
        localStorage.setItem('profilePicture', user.profilePicture)
      } else {
        const storedPicture = localStorage.getItem('profilePicture')
        if (storedPicture) {
          setProfilePicture(storedPicture)
        }
      }
      
      // Load resume
      if (user.resume) {
        // If resume is a base64 string, extract filename or use default
        if (user.resume.startsWith('data:')) {
          // It's a base64 file, try to extract filename or use default
          setResumeFileName('resume.pdf')
        } else {
          // It's a filename
          setResumeFileName(user.resume)
        }
      }
      
      // Load preferred locations
      if (user.preferredLocations && user.preferredLocations.length > 0) {
        setPreferredLocations(user.preferredLocations)
      } else {
        // Default locations
        setPreferredLocations([
          'Remote', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Gurugram', 
          'Noida', 'Delhi', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Lucknow', 
          'Bhubaneswar', 'Kanpur', 'Ranchi', 'Goa', 'Navi Mumbai', 'Other'
        ])
      }
      
      // Load company types
      if (user.companyType && user.companyType.length > 0) {
        setCompanyTypes(user.companyType)
      } else {
        // Default company types
        setCompanyTypes([
          'Large Enterprise (> 15 Yrs of existence)',
          'Medium Enterprise (> 10 Yrs of existence)',
          'Small Enterprise (> 5 Yrs of existence)'
        ])
      }
    }
  }, [user])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      workExperience: user?.workExperience || 0,
      graduationYear: user?.graduationYear || '2026',
      currentLocation: user?.currentLocation || 'Ranchi, Jharkhand',
      description: user?.description || '',
      portfolioLink: user?.portfolioLink || '',
      availableToJoin: user?.availableToJoin || 'Within 3 months',
      linkedin: user?.linkedin || '',
      github: user?.github || '',
      currentCTC: user?.currentCTC || 0,
      desiredCTCMin: user?.desiredCTCMin || 0,
      desiredCTCMax: user?.desiredCTCMax || 0
    }
  })

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        workExperience: user.workExperience || 0,
        graduationYear: user.graduationYear || '2026',
        currentLocation: user.currentLocation || 'Ranchi, Jharkhand',
        description: user.description || '',
        portfolioLink: user.portfolioLink || '',
        availableToJoin: user.availableToJoin || 'Within 3 months',
        linkedin: user.linkedin || '',
        github: user.github || '',
        currentCTC: user.currentCTC || 0,
        desiredCTCMin: user.desiredCTCMin || 0,
        desiredCTCMax: user.desiredCTCMax || 0
      })
    }
  }, [user, reset])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Convert profile picture to base64 if file is selected (already compressed)
      let profilePictureBase64: string | undefined
      if (profilePictureFile) {
        profilePictureBase64 = await fileToBase64(profilePictureFile, false)
      } else if (profilePicture && !profilePictureFile) {
        // Use existing profile picture if no new file
        profilePictureBase64 = profilePicture
      }

      // Convert resume to base64 if file is selected
      let resumeBase64: string | undefined
      if (resumeFile) {
        // For PDFs, we can't compress, but we can limit size
        if (resumeFile.size > 10 * 1024 * 1024) {
          showToast('Resume file is too large. Maximum size is 10MB', 'error')
          return
        }
        resumeBase64 = await fileToBase64(resumeFile, false)
      }

      const updateData = {
        name: data.name,
        workExperience: data.workExperience,
        graduationYear: data.graduationYear,
        currentLocation: data.currentLocation,
        description: data.description,
        portfolioLink: data.portfolioLink,
        availableToJoin: data.availableToJoin,
        preferredLocations: preferredLocations,
        companyType: companyTypes,
        linkedin: data.linkedin,
        github: data.github,
        currentCTC: data.currentCTC,
        desiredCTCMin: data.desiredCTCMin,
        desiredCTCMax: data.desiredCTCMax,
        ...(profilePictureBase64 && { profilePicture: profilePictureBase64 }),
        ...(resumeBase64 && { resume: resumeBase64 }),
      }

      await updateProfile.mutateAsync(updateData)
      showToast('Profile updated successfully!', 'success')
      refetch()
      navigate('/profile')
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update profile'
      showToast(errorMessage, 'error')
    }
  }

  const removeLocation = (location: string) => {
    setPreferredLocations(preferredLocations.filter(l => l !== location))
  }

  const removeCompanyType = (type: string) => {
    setCompanyTypes(companyTypes.filter(t => t !== type))
  }

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (PDF, DOC, DOCX)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!validTypes.includes(file.type)) {
        alert('Please select a PDF or Word document')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Resume size should be less than 10MB')
        return
      }

      setResumeFile(file)
      setResumeFileName(file.name)
    }
  }

  const removeResume = () => {
    setResumeFile(null)
    setResumeFileName(null)
  }

  const handleLinkedInImport = async () => {
    try {
      showToast('Importing LinkedIn profile...', 'info')
      
      // Call backend to import LinkedIn data
      const response = await apiClient.post('/auth/linkedin/import')
      const data = response.data

      if (data.success && data.data) {
        const linkedinData = data.data
        
        // Update form with LinkedIn data
        reset({
          name: linkedinData.name || user?.name || '',
          workExperience: linkedinData.workExperience || user?.workExperience || 0,
          graduationYear: linkedinData.graduationYear || user?.graduationYear || '2026',
          currentLocation: linkedinData.currentLocation || user?.currentLocation || '',
          description: linkedinData.description || user?.description || '',
          portfolioLink: user?.portfolioLink || '',
          linkedin: linkedinData.linkedin || user?.linkedin || '',
          github: user?.github || '',
          currentCTC: user?.currentCTC || 0,
          desiredCTCMin: user?.desiredCTCMin || 0,
          desiredCTCMax: user?.desiredCTCMax || 0,
        })

        // Update work experiences if available
        if (linkedinData.workExperiences && linkedinData.workExperiences.length > 0) {
          // Update profile with work experiences
          await updateProfile.mutateAsync({
            workExperiences: linkedinData.workExperiences,
          })
        }

        // Update educations if available
        if (linkedinData.educations && linkedinData.educations.length > 0) {
          // Update profile with educations
          await updateProfile.mutateAsync({
            educations: linkedinData.educations,
          })
        }

        showToast('LinkedIn profile imported successfully!', 'success')
        refetch() // Refresh user data
      } else {
        showToast(data.error || 'Failed to import LinkedIn profile', 'error')
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to import LinkedIn profile'
      showToast(errorMessage, 'error')
    }
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast('Please select an image file', 'error')
        return
      }
      
      // Validate file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error')
        return
      }

      try {
        // Compress image before storing
        const compressedFile = await compressImage(file, 800, 800, 0.8)
        setProfilePictureFile(compressedFile)
        
        // Create preview
        const imageData = await fileToBase64(compressedFile, false)
        setProfilePicture(imageData)
        
        // Store in localStorage for global access
        localStorage.setItem('profilePicture', imageData)
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('profilePictureUpdated'))
        
        showToast('Profile picture uploaded successfully', 'success')
      } catch (error) {
        console.error('Error processing image:', error)
        showToast('Failed to process image', 'error')
      }
    }
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    setProfilePictureFile(null)
    // Remove from localStorage
    localStorage.removeItem('profilePicture')
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('profilePictureUpdated'))
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Profile Picture Section */}
          <div className="flex items-start space-x-6 mb-8">
            <div className="flex flex-col items-center">
              <div className="relative">
                <ProfileAvatar
                  name={user.name}
                  profilePicture={profilePicture}
                  size="xl"
                  className="border-2 border-gray-200"
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
                {profilePicture && (
                  <button
                    onClick={removeProfilePicture}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 cursor-pointer hover:bg-red-600 transition-colors shadow-lg"
                    title="Remove photo"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-2">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
              <button
                type="button"
                onClick={handleLinkedInImport}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                in LinkedIn Import
              </button>
            </div>

            {/* Resume Upload */}
            <div className="flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Resume</label>
                {resumeFileName ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md">
                      <span className="text-sm text-gray-700 truncate max-w-xs">{resumeFileName}</span>
                      <button
                        type="button"
                        onClick={removeResume}
                        className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <label className="text-sm text-blue-600 hover:underline cursor-pointer">
                      Upload new resume
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="inline-block px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                    Upload Resume
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* BASIC DETAILS Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">BASIC DETAILS</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience (In years)</label>
                  <input
                    {...register('workExperience', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <div className="relative">
                    <input
                      {...register('graduationYear')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                  <div className="relative">
                    <input
                      {...register('currentLocation')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio/Website Link</label>
                  <input
                    {...register('portfolioLink')}
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* ADDITIONAL DETAILS Section */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">ADDITIONAL DETAILS</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    When will you be able to join a new job if you get a job offer?
                  </label>
                  <select
                    {...register('availableToJoin')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Within 3 months</option>
                    <option>Within 6 months</option>
                    <option>Within 1 year</option>
                    <option>Immediately</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What locations do you want to work in? (up to 5 locations)
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {preferredLocations.map((location) => (
                      <span
                        key={location}
                        className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {location}
                        <button
                          type="button"
                          onClick={() => removeLocation(location)}
                          className="ml-2 text-blue-700 hover:text-blue-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add location... (Press Enter to add, max 5)"
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const input = e.currentTarget
                        const value = input.value.trim()
                        if (value && preferredLocations.length < 5) {
                          if (!preferredLocations.includes(value)) {
                            setPreferredLocations([...preferredLocations, value])
                            input.value = ''
                          } else {
                            showToast('Location already added', 'info')
                          }
                        } else if (preferredLocations.length >= 5) {
                          showToast('Maximum 5 locations allowed', 'info')
                        }
                      }
                    }}
                  />
                  {preferredLocations.length >= 5 && (
                    <p className="mt-1 text-xs text-gray-500">Maximum 5 locations reached</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What type of company would you prefer to work in? (up to 3 preferences)
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {companyTypes.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => removeCompanyType(type)}
                          className="ml-2 text-blue-700 hover:text-blue-900"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  {companyTypes.length < 3 && (
                    <select
                      onChange={(e) => {
                        const value = e.target.value
                        if (value && !companyTypes.includes(value)) {
                          setCompanyTypes([...companyTypes, value])
                          e.target.value = ''
                        }
                      }}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="">Select company type...</option>
                      <option value="Large Enterprise (> 15 Yrs of existence)">Large Enterprise (&gt; 15 Yrs of existence)</option>
                      <option value="Medium Enterprise (> 10 Yrs of existence)">Medium Enterprise (&gt; 10 Yrs of existence)</option>
                      <option value="Small Enterprise (> 5 Yrs of existence)">Small Enterprise (&gt; 5 Yrs of existence)</option>
                      <option value="Startup (< 5 Yrs of existence)">Startup (&lt; 5 Yrs of existence)</option>
                    </select>
                  )}
                  {companyTypes.length >= 3 && (
                    <p className="mt-1 text-xs text-gray-500">Maximum 3 company types reached</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <input
                      {...register('linkedin')}
                      type="url"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Github</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <input
                      {...register('github')}
                      type="url"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What is your Current CTC (in LPA)?</label>
                  <input
                    {...register('currentCTC', { valueAsNumber: true })}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What is your desired CTC (in LPA)?</label>
                  <div className="flex items-center space-x-2">
                    <input
                      {...register('desiredCTCMin', { valueAsNumber: true })}
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      {...register('desiredCTCMax', { valueAsNumber: true })}
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                disabled={updateProfile.isPending}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {updateProfile.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

