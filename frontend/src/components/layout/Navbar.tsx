'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { ProfileAvatar } from '@/components/common/ProfileAvatar'
import { useMutation } from '@tanstack/react-query'
import apiClient from '@/api/axios'
import { showToast } from '@/utils/toast'

export const Navbar: React.FC = () => {
  const { data, isLoading } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const location = useLocation()
  const user = data?.data
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  
  // Don't show navbar content while loading to prevent flash
  const isAuthenticating = isLoading

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    if (user?.role === 'placement' || user?.role === 'admin') {
      return '/placement/dashboard'
    }
    return '/dashboard'
  }

  // Check if route is active
  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete('/auth/account')
      return response.data
    },
    onSuccess: () => {
      showToast('Account deleted successfully', 'success')
      logout()
      navigate('/login')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete account', 'error')
    },
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isDropdownOpen || isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, isMobileMenuOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
    setIsDropdownOpen(false)
    setIsMobileMenuOpen(false)
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      deleteAccountMutation.mutate()
    }
    setIsDropdownOpen(false)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const NavLink: React.FC<{ to: string; children: React.ReactNode; className?: string; onClick?: () => void }> = ({ to, children, className = '', onClick }) => {
    const isActive = isActiveRoute(to)
    return (
      <Link
        to={to}
        className={`${className} ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'} transition-all duration-300 font-medium hover:scale-105`}
        onClick={onClick}
      >
        {children}
      </Link>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 animate-fade-in-down shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link to={user ? getDashboardRoute() : '/'} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                CampusHire
              </span>
            </Link>
            {/* Navigation links - Role-based (Desktop) */}
            <div className="hidden md:ml-10 md:flex md:space-x-6">
              {/* Common links for all authenticated users */}
              {user && (
                <>
                  <NavLink to="/jobs">Jobs</NavLink>
                  <NavLink to="/veda">🤖 Veda AI</NavLink>
                </>
              )}

              {/* Candidate-specific links */}
              {user?.role === 'candidate' && (
                <>
                  <NavLink to="/career-copilot">Career Copilot</NavLink>
                  <NavLink to="/assessments">Assessments</NavLink>
                  <NavLink to="/contests">Contests</NavLink>
                  <NavLink to="/challenges">Challenges</NavLink>
                  <NavLink to="/my-applications">My Applications</NavLink>
                </>
              )}

              {/* Recruiter-specific links */}
              {user?.role === 'recruiter' && (
                <>
                  <NavLink to="/jobs/new">Post Job</NavLink>
                </>
              )}

              {/* Placement Team & Admin links */}
              {(user?.role === 'placement' || user?.role === 'admin') && (
                <>
                  <NavLink to="/placement/students">👥 Students</NavLink>
                  {user?.role === 'admin' && (
                    <NavLink to="/placement/members">👨‍💼 Team</NavLink>
                  )}
                </>
              )}

              {/* Admin gets all links */}
              {user?.role === 'admin' && (
                <>
                  <NavLink to="/jobs/new">Post Job</NavLink>
                </>
              )}
            </div>
          </div>

          {/* Right side - Flame icon and Profile */}
          <div className="flex items-center space-x-4">
            {!isAuthenticating && user ? (
              <>
                {/* Flame icon with count */}
                <div className="flex items-center space-x-1 text-gray-700">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">0</span>
                </div>
                {/* Profile avatar with dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <ProfileAvatar
                      name={user.name}
                      size="md"
                    />
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-semibold text-gray-900 text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {user.email}
                        </p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          My Profile
                        </Link>
                        {user?.role === 'candidate' && (
                          <Link
                            to="/my-applications"
                            onClick={() => setIsDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            My Applications
                          </Link>
                        )}
                        {(user?.role === 'recruiter' || user?.role === 'admin') && (
                          <Link
                            to="/jobs/new"
                            onClick={() => setIsDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Post New Job
                          </Link>
                        )}
                        {(user?.role === 'placement' || user?.role === 'admin') && (
                          <Link
                            to="/placement/dashboard"
                            onClick={() => setIsDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Placement Dashboard
                          </Link>
                        )}
                        <Link
                          to="/jobs"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Browse Jobs
                        </Link>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteAccountMutation.isPending}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                        </button>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : !isAuthenticating ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}
          </div>

          {/* Mobile menu button */}
          {user && (
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Mobile menu */}
        {user && isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-gray-200 py-4 animate-fade-in-down"
          >
            <div className="space-y-1">
              <NavLink
                to="/jobs"
                className="block px-4 py-2 text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Jobs
              </NavLink>
              <NavLink
                to="/veda"
                className="block px-4 py-2 text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🤖 Veda AI
              </NavLink>
              {user?.role === 'candidate' && (
                <>
                  <NavLink
                    to="/career-copilot"
                    className="block px-4 py-2 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Career Copilot
                  </NavLink>
                  <NavLink
                    to="/my-applications"
                    className="block px-4 py-2 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Applications
                  </NavLink>
                </>
              )}
              {(user?.role === 'placement' || user?.role === 'admin') && (
                <>
                  <NavLink
                    to="/placement/students"
                    className="block px-4 py-2 text-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    👥 Students
                  </NavLink>
                  {user?.role === 'admin' && (
                    <NavLink
                      to="/placement/members"
                      className="block px-4 py-2 text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      👨‍💼 Team Members
                    </NavLink>
                  )}
                </>
              )}
              {(user?.role === 'recruiter' || user?.role === 'admin') && (
                <NavLink
                  to="/jobs/new"
                  className="block px-4 py-2 text-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Post Job
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
