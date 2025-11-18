'use client'

import React, { useEffect, useMemo } from 'react'
import { useCurrentUser } from '@/hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { ProfileAvatar } from '@/components/common/ProfileAvatar'

export const DashboardPage: React.FC = () => {
  const { data: userData, isLoading: userLoading, refetch } = useCurrentUser()
  const navigate = useNavigate()

  const user = userData?.data

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

  // Redirect placement team and admin to their dashboard
  useEffect(() => {
    if (user && (user.role === 'placement' || user.role === 'admin')) {
      navigate('/placement/dashboard', { replace: true })
    }
  }, [user, navigate])
  
  // Refetch user data periodically to keep completion status real-time
  useEffect(() => {
    if (user?.role === 'candidate') {
      const interval = setInterval(() => {
        refetch()
      }, 5000) // Refetch every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [user?.role, refetch])

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is placement/admin, show loading while redirecting
  if (user.role === 'placement' || user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Candidate dashboard – exact-style copy of screenshot */}
          {user.role === 'candidate' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Skills assessment hero */}
                <div className="lg:col-span-2 bg-gradient-to-r from-teal-500 via-blue-500 to-purple-400 rounded-2xl px-8 py-10 text-white shadow-lg relative overflow-hidden animate-fade-in-up hover-glow transition-smooth">
                  {/* Star decorations */}
                  <div className="absolute right-8 top-4 text-white/30 text-4xl">✦</div>
                  <div className="absolute right-16 top-12 text-white/20 text-3xl">✦</div>
                  <div className="absolute right-12 bottom-8 text-white/25 text-2xl">✦</div>
                  
                  <div className="relative z-10">
                    <h2 className="text-4xl font-bold mb-4">Skills assessment</h2>
                    <p className="text-lg text-white/90 mb-6 max-w-xl">
                      Ace our AI evaluated assessment and showcase your scores to recruiters.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button className="px-6 py-2.5 rounded-full bg-white text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors">
                        Take Test →
                      </button>
                      <button className="px-6 py-2.5 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                        Practice Mock
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side: profile + hires of the week */}
                <div className="space-y-4">
                  {/* Profile completion */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between gap-4 card-enter animate-delay-200 hover-lift transition-smooth">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 mb-1">Your profile is {profileCompletion}% complete</p>
                      <p className="text-xs text-gray-600 mb-3">
                        Complete your profile now to get shortlisted by top recruiters.
                      </p>
                      <Link to="/profile" className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Update Profile →
                      </Link>
                    </div>
                    <ProfileAvatar
                      name={user.name}
                      size="lg"
                      className="ring-2 ring-purple-200"
                    />
                  </div>

                  {/* Hires of the week */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <p className="text-sm font-bold text-gray-900 mb-3">Hires of the Week</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-semibold text-sm">
                        B
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          B Varshitha got hired at <span className="font-semibold">NoBroker</span>.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 text-xs">%</span>
                        <span className="text-gray-400">👏</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Challenges section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Challenges</h2>
                  <Link to="/challenges" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                    See all &gt;
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Tower Research */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-blue-50">
                      <div className="relative w-8 h-8">
                        <div className="absolute top-0 left-0 w-5 h-5 bg-blue-600 rounded-sm"></div>
                        <div className="absolute top-1 left-1 w-5 h-5 bg-blue-400 rounded-sm"></div>
                        <div className="absolute top-2 left-2 w-5 h-5 bg-white rounded-sm"></div>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 mb-2 text-sm">Tower Research</p>
                    <p className="text-xs text-gray-600 mb-3">10 days • 48 problems</p>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Start &gt;</button>
                  </div>
                  
                  {/* Hotstar */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-blue-900">
                      <div className="text-white text-[8px] font-bold leading-tight text-center">
                        <div>DISNEY+</div>
                        <div className="text-[6px]">hotstar</div>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 mb-2 text-sm">Hotstar</p>
                    <p className="text-xs text-gray-600 mb-3">10 days • 47 problems</p>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Start &gt;</button>
                  </div>
                  
                  {/* Flipkart */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-blue-600">
                      <div className="relative w-8 h-8">
                        <div className="absolute inset-0 bg-yellow-400 rounded-sm"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-bold">f</span>
                        </div>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 mb-2 text-sm">Flipkart</p>
                    <p className="text-xs text-gray-600 mb-3">10 days • 48 problems</p>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Start &gt;</button>
                  </div>
                  
                  {/* Microsoft */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 grid grid-cols-2 gap-0.5 p-1">
                      <div className="w-5 h-5 bg-red-500 rounded-sm"></div>
                      <div className="w-5 h-5 bg-green-500 rounded-sm"></div>
                      <div className="w-5 h-5 bg-blue-500 rounded-sm"></div>
                      <div className="w-5 h-5 bg-yellow-500 rounded-sm"></div>
                    </div>
                    <p className="font-semibold text-gray-900 mb-2 text-sm">Microsoft</p>
                    <p className="text-xs text-gray-600 mb-3">10 days • 49 problems</p>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Start &gt;</button>
                  </div>
                  
                  {/* Google */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 via-green-500 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">G</span>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 mb-2 text-sm">Google</p>
                    <p className="text-xs text-gray-600 mb-3">10 days • 28 problems</p>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Start &gt;</button>
                  </div>
                  
                  {/* Software Development (<200) */}
                  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
                      <span className="text-white text-[9px] font-bold text-center leading-tight">&lt; 200<br/>(Score)</span>
                    </div>
                    <p className="font-semibold text-gray-900 mb-2 text-sm">Software Development (&lt;200)</p>
                    <p className="text-xs text-gray-600 mb-3">1 days • 108 problems</p>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Start &gt;</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Recruiter view stays as existing cards */}
          {user.role === 'recruiter' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Post Job Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl overflow-hidden card-hover">
                <div className="p-8 text-white">
                  <div className="text-5xl mb-4">🚀</div>
                  <h2 className="text-2xl font-bold mb-3">Post a New Job</h2>
                  <p className="text-blue-100 mb-6">
                    Reach thousands of qualified candidates with your job posting
                  </p>
                  <Link to="/jobs/new">
                    <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">
                      Post New Job →
                    </button>
                  </Link>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 overflow-hidden card-hover">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>📊</span>
                    <span>Quick Stats</span>
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📥</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Applications</p>
                          <p className="text-2xl font-bold text-gray-900">0</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">💼</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Active Jobs</p>
                          <p className="text-2xl font-bold text-gray-900">0</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
