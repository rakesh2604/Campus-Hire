'use client'

import React from 'react'

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  variant?: 'text' | 'card' | 'avatar' | 'button'
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  lines = 1,
  variant = 'text',
}) => {
  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    )
  }

  if (variant === 'avatar') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="rounded-full bg-gray-200 w-12 h-12"></div>
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    )
  }

  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  )
}

