'use client'

import React, { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useAuth'

export const ProtectedRoute: React.FC = () => {
  const { data, isLoading, isError } = useCurrentUser()
  const location = useLocation()
  const [mounted, setMounted] = useState(false)
  
  // Get token on mount
  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('authToken') : false

  // Mark as mounted after initial render
  useEffect(() => {
    setMounted(true)
  }, [])

  // If not mounted yet, show nothing (prevent flash)
  if (!mounted) {
    return null
  }

  // If no token, immediately redirect to login
  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If we have a token and are loading, show loading state
  if (hasToken && isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  // If error or no user data, redirect to login
  if (isError || !data?.success || !data.data) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If we have valid user data, render the protected content
  return <Outlet />
}

