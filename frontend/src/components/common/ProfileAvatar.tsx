'use client'

import React, { useState, useEffect } from 'react'

interface ProfileAvatarProps {
  name: string
  profilePicture?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-20 h-20 text-2xl',
  xl: 'w-24 h-24 text-3xl',
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  name,
  profilePicture,
  size = 'md',
  className = '',
}) => {
  // Only use the prop, don't fallback to localStorage (which is global and may contain other user's picture)
  const [currentPicture, setCurrentPicture] = useState<string | null | undefined>(
    profilePicture
  )
  
  const sizeClass = sizeClasses[size]
  const initial = name.charAt(0).toUpperCase()
  
  // Update when prop changes
  useEffect(() => {
    setCurrentPicture(profilePicture)
  }, [profilePicture])
  
  if (currentPicture) {
    return (
      <img
        src={currentPicture}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    )
  }
  
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ${className}`}
    >
      {initial}
    </div>
  )
}

