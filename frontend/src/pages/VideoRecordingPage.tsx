'use client'

import React from 'react'
import { useNavigate } from 'react-router-dom'

export const VideoRecordingPage: React.FC = () => {
  const navigate = useNavigate()

  const handleNext = () => {
    navigate('/video/record')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Dark Blue/Grey Box */}
        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
            Introductory Video
          </h1>

          {/* Illustration */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-10">
            {/* Left: Woman with laptop illustration */}
            <div className="flex-shrink-0">
              <div className="w-56 h-72 bg-slate-600 rounded-xl flex items-end justify-center relative overflow-hidden shadow-lg">
                {/* Woman in suit with laptop - more detailed illustration */}
                <svg className="w-full h-full" viewBox="0 0 240 360" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background */}
                  <rect width="240" height="360" fill="#475569" />
                  
                  {/* Head */}
                  <circle cx="120" cy="80" r="35" fill="#64748b" />
                  {/* Hair */}
                  <ellipse cx="120" cy="60" rx="40" ry="25" fill="#1e293b" />
                  
                  {/* Body (suit) */}
                  <rect x="80" y="115" width="80" height="140" rx="8" fill="#334155" />
                  {/* Suit jacket */}
                  <path d="M 80 115 L 120 155 L 160 115" stroke="#1e293b" strokeWidth="3" fill="none" />
                  
                  {/* Arms */}
                  <ellipse cx="75" cy="180" rx="12" ry="50" fill="#334155" transform="rotate(-20 75 180)" />
                  <ellipse cx="165" cy="180" rx="12" ry="50" fill="#334155" transform="rotate(20 165 180)" />
                  
                  {/* Laptop */}
                  <rect x="100" y="200" width="40" height="28" rx="2" fill="#64748b" />
                  <rect x="102" y="202" width="36" height="24" fill="#1e293b" />
                  <line x1="110" y1="210" x2="130" y2="210" stroke="#475569" strokeWidth="1" />
                  <line x1="110" y1="215" x2="130" y2="215" stroke="#475569" strokeWidth="1" />
                  
                  {/* Legs */}
                  <rect x="95" y="255" width="20" height="80" rx="5" fill="#334155" />
                  <rect x="125" y="255" width="20" height="80" rx="5" fill="#334155" />
                </svg>
              </div>
            </div>

            {/* Right: Video player frame */}
            <div className="flex-shrink-0">
              <div className="w-72 h-52 bg-white rounded-xl shadow-2xl relative overflow-hidden border-2 border-gray-200">
                {/* Video player content - person in video call */}
                <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center relative">
                  {/* Person in video - more realistic */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Head */}
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-300 to-purple-300 flex items-center justify-center shadow-lg">
                      {/* Face features */}
                      <div className="relative">
                        {/* Eyes */}
                        <div className="absolute -top-4 -left-6 w-3 h-3 bg-gray-700 rounded-full"></div>
                        <div className="absolute -top-4 -right-6 w-3 h-3 bg-gray-700 rounded-full"></div>
                        {/* Smile */}
                        <path d="M -8 4 Q 0 8 8 4" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round" />
                      </div>
                    </div>
                    {/* Shoulders */}
                    <div className="absolute top-20 w-40 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-t-full"></div>
                  </div>
                  
                  {/* Play button overlay - bottom left */}
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 rounded-full p-2.5 hover:bg-opacity-80 transition-all">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Introductory Text */}
          <div className="mb-8">
            <p className="text-lg text-gray-200 text-center leading-relaxed">
              We recognize that you are more than just a resume. Your voice matters, and your individuality sets you apart. You need to respond to the following questions:
            </p>
          </div>

          {/* Questions List */}
          <div className="mb-10">
            <ol className="space-y-4 text-gray-200">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 mt-0.5">
                  1
                </span>
                <span className="text-lg leading-relaxed">
                  Your quick introduction and overview of your academic qualifications.
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 mt-0.5">
                  2
                </span>
                <span className="text-lg leading-relaxed">
                  Your key technical projects, your role in them, and the technologies you have worked on.
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4 mt-0.5">
                  3
                </span>
                <span className="text-lg leading-relaxed">
                  Your future vision on your tech career
                </span>
              </li>
            </ol>
          </div>

          {/* Tips Section */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Top tips for recording your video responses
            </h2>
            <ol className="space-y-3 text-gray-200">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4 mt-0.5">
                  1
                </span>
                <span className="text-base leading-relaxed">
                  Ensure you are in a quiet, distraction-free area.
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4 mt-0.5">
                  2
                </span>
                <span className="text-base leading-relaxed">
                  Check you have enough charge on your device and a good data connection.
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4 mt-0.5">
                  3
                </span>
                <span className="text-base leading-relaxed">
                  Practice to feel comfortable with the process.
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4 mt-0.5">
                  4
                </span>
                <span className="text-base leading-relaxed">
                  Make eye contact with the camera whenever possible.
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4 mt-0.5">
                  5
                </span>
                <span className="text-base leading-relaxed">
                  Remember to grant access to your camera and microphone when requested.
                </span>
              </li>
            </ol>
          </div>

          {/* Next Button */}
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg text-lg"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

