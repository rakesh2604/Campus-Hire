'use client'

import React from 'react'

interface Contest {
  id: string
  title: string
  date: string
  time: string
  participants: number
}

interface LeaderboardEntry {
  rank: number
  name: string
  score: number
}

export const ContestsPage: React.FC = () => {
  // Past contests data
  const contests: Contest[] = [
    { id: '1', title: 'LevelUp Vita 13.0', date: '24 Oct', time: '08:30 pm', participants: 373 },
    { id: '2', title: 'LevelUp Vita 12.0', date: '17 Oct', time: '08:30 pm', participants: 342 },
    { id: '3', title: 'LevelUp Vita 11.0', date: '10 Oct', time: '08:30 pm', participants: 315 },
    { id: '4', title: 'LevelUp Vita 10.0', date: '03 Oct', time: '08:30 pm', participants: 298 },
    { id: '5', title: 'LevelUp Vita 9.0', date: '26 Sep', time: '08:30 pm', participants: 287 },
    { id: '6', title: 'LevelUp Vita 8.0', date: '19 Sep', time: '08:30 pm', participants: 265 },
    { id: '7', title: 'LevelUp Vita 7.0', date: '12 Sep', time: '08:30 pm', participants: 251 },
    { id: '8', title: 'LevelUp Vita 6.0', date: '05 Sep', time: '08:30 pm', participants: 238 },
    { id: '9', title: 'LevelUp Vita 5.0', date: '29 Aug', time: '08:30 pm', participants: 224 },
    { id: '10', title: 'LevelUp Vita 4.0', date: '22 Aug', time: '08:30 pm', participants: 212 },
    { id: '11', title: 'LevelUp Vita 3.0', date: '15 Aug', time: '08:30 pm', participants: 198 },
    { id: '12', title: 'LevelUp Vita 2.0', date: '08 Aug', time: '08:30 pm', participants: 185 },
    { id: '13', title: 'LevelUp Vita', date: '09 May', time: '08:30 pm', participants: 156 },
  ]

  // Leaderboard data
  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Shlok', score: 8145 },
    { rank: 2, name: 'Vinay', score: 8450 },
    { rank: 3, name: 'Aman', score: 8085 },
    { rank: 4, name: 'Anurag Mandloi', score: 7415 },
    { rank: 5, name: 'Vishnu Vardha...', score: 7246 },
    { rank: 6, name: 'M Laxminaraya...', score: 7120 },
    { rank: 7, name: 'Rishikesh Kum....', score: 6880 },
    { rank: 8, name: 'Shivam Singh', score: 6872 },
    { rank: 9, name: 'Chandra Shekh...', score: 6860 },
    { rank: 10, name: 'ANAND SAGAR', score: 6573 },
  ]


  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Past Contests */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Contests</h1>
              <p className="text-gray-600">Past Contests</p>
            </div>

            {/* Contests List */}
            <div className="space-y-4">
              {contests.map((contest, index) => (
                <div
                  key={contest.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden animate-fade-in"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards',
                    opacity: 0,
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{contest.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{contest.date}, {contest.time}</span>
                        <span>•</span>
                        <span>{contest.participants} participated</span>
                      </div>
                      <button className="mt-4 px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:scale-105 transition-all duration-200">
                        View Results
                      </button>
                    </div>

                    {/* Right Icon */}
                    <div className="ml-6 relative group">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-blue-50 to-green-50 rounded-lg flex items-center justify-center relative overflow-hidden transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        {/* Background patterns with animation */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/30 rounded-full blur-xl animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-green-100/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        {/* Code icon */}
                        <span className="text-4xl font-bold text-blue-600 relative z-10 transition-transform duration-300 group-hover:scale-110">&lt;/&gt;</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section - All time Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 sticky top-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">🏆</span>
                All time Leaderboard
              </h2>

              {/* Top 3 with special styling */}
              <div className="space-y-4 mb-6">
                {leaderboard.slice(0, 3).map((entry, index) => {
                  const rankColors = [
                    { bg: 'from-yellow-400 to-yellow-600', ring: 'ring-yellow-300', shadow: 'shadow-yellow-200', icon: '🥇' },
                    { bg: 'from-gray-300 to-gray-500', ring: 'ring-gray-200', shadow: 'shadow-gray-200', icon: '🥈' },
                    { bg: 'from-orange-400 to-orange-600', ring: 'ring-orange-300', shadow: 'shadow-orange-200', icon: '🥉' },
                  ]
                  const colors = rankColors[index]
                  
                  return (
                    <div
                      key={entry.rank}
                      className={`group relative flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-white to-gray-50 border-2 ${colors.ring} ${colors.shadow} shadow-xl hover:shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden`}
                      style={{
                        animationDelay: `${index * 150}ms`,
                        animation: 'slideInRight 0.8s ease-out forwards',
                        opacity: 0,
                      }}
                    >
                      {/* Animated background gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                      
                      {/* Rank badge with medal */}
                      <div className={`relative w-14 h-14 bg-gradient-to-br ${colors.bg} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg transform group-hover:rotate-12 transition-transform duration-300`}>
                        <span className="text-2xl absolute">{colors.icon}</span>
                        <span className="absolute text-xs font-black drop-shadow-lg">{entry.rank}</span>
                      </div>
                      
                      {/* User info */}
                      <div className="flex-1 min-w-0 relative z-10">
                        <p className="font-bold text-gray-900 truncate text-base group-hover:text-gray-800 transition-colors">
                          {entry.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm font-semibold text-gray-600">Score:</span>
                          <span className={`text-lg font-bold bg-gradient-to-r ${colors.bg} bg-clip-text text-transparent`}>
                            {entry.score.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </div>
                  )
                })}
              </div>

              {/* Ranks 4-10 */}
              <div className="space-y-2 border-t-2 border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Other Top Performers</h3>
                {leaderboard.slice(3).map((entry, index) => (
                  <div 
                    key={entry.rank} 
                    className="group flex items-center space-x-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-3 rounded-lg transition-all duration-300 hover:translate-x-2 hover:shadow-md cursor-pointer relative overflow-hidden"
                    style={{
                      animationDelay: `${(index + 3) * 80}ms`,
                      animation: 'slideInRight 0.6s ease-out forwards',
                      opacity: 0,
                    }}
                  >
                    {/* Rank number */}
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm flex-shrink-0 shadow-md group-hover:scale-110 group-hover:from-blue-400 group-hover:to-indigo-500 group-hover:text-white transition-all duration-300">
                      {entry.rank}
                    </div>
                    
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex-shrink-0 shadow-md group-hover:scale-110 group-hover:ring-2 group-hover:ring-blue-300 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-300 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-xs">
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    {/* Name and score */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm group-hover:text-blue-700 transition-colors">
                        {entry.name}
                      </p>
                      <p className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                        {entry.score.toLocaleString()} points
                      </p>
                    </div>
                    
                    {/* Score badge */}
                    <div className="px-3 py-1 bg-gray-100 rounded-full group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-indigo-600 transition-all duration-300">
                      <p className="text-xs font-bold text-gray-700 group-hover:text-white transition-colors">
                        {entry.score.toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

