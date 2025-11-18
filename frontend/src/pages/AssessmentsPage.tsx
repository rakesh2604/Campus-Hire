'use client'

import React from 'react'

export const AssessmentsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="text-center px-4">
        {/* Central Graphic - Circular background with stacked cards */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            {/* Circular grey background */}
            <div className="w-72 h-72 bg-gray-200 rounded-full flex items-center justify-center">
              {/* Stacked Cards Illustration */}
              <div className="relative w-56 h-64">
                {/* Bottom Card - Green icon */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-24 bg-blue-50 rounded-lg shadow-md border border-blue-100">
                  <div className="p-3 flex items-center justify-between h-full">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-1.5 bg-blue-200 rounded w-full"></div>
                        <div className="h-1.5 bg-blue-200 rounded w-3/4"></div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded ml-2 flex-shrink-0">
                      Apply
                    </button>
                  </div>
                </div>

                {/* Middle Card - Orange icon */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-24 bg-blue-100 rounded-lg shadow-lg border border-blue-200 z-10">
                  <div className="p-3 flex items-center justify-between h-full">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-1.5 bg-blue-300 rounded w-full"></div>
                        <div className="h-1.5 bg-blue-300 rounded w-3/4"></div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded ml-2 flex-shrink-0">
                      Apply
                    </button>
                  </div>
                </div>

                {/* Top Card - Red icon with exclamation */}
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-40 h-24 bg-blue-200 rounded-lg shadow-xl border border-blue-300 z-20">
                  <div className="p-3 flex items-center justify-between h-full">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold leading-none">!</span>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-1.5 bg-blue-400 rounded w-full"></div>
                        <div className="h-1.5 bg-blue-400 rounded w-3/4"></div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded ml-2 flex-shrink-0">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No round scheduled</h2>
        <p className="text-gray-600 text-base max-w-md mx-auto">
          Discover your level, insights and unlock opportunities.
        </p>
      </div>
    </div>
  )
}

