'use client'

import React from 'react'

export const ChallengesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-50 rounded-2xl p-8" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)' }}>
        <h2 className="text-3xl font-bold text-blue-900 text-center mb-8">Challenges</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
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
          
          {/* Software Development (>= 200...) */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
              <span className="text-white text-[9px] font-bold text-center leading-tight">200 to 500<br/>(Score)</span>
            </div>
            <p className="font-semibold text-gray-900 mb-2 text-sm">Software Development (&gt;= 200...)</p>
            <p className="text-xs text-gray-600 mb-3">7 days • 78 problems</p>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Start &gt;</button>
          </div>
          
          {/* Software Development (>=500) */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3">
              <span className="text-white text-[9px] font-bold text-center leading-tight">500+<br/>(Score)</span>
            </div>
            <p className="font-semibold text-gray-900 mb-2 text-sm">Software Development (&gt;=500)</p>
            <p className="text-xs text-gray-600 mb-3">5 days • 58 problems</p>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Start &gt;</button>
          </div>
          
          {/* Netflix */}
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-black">
              <span className="text-red-600 text-[10px] font-bold">NETFLIX</span>
            </div>
            <p className="font-semibold text-gray-900 mb-2 text-sm">Netflix</p>
            <p className="text-xs text-gray-600 mb-3">0% progress</p>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">Continue &gt;</button>
          </div>
        </div>
      </div>
    </div>
  )
}

