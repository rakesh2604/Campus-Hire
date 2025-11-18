'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const questions = [
  {
    number: 1,
    text: 'Please provide a quick introduction and overview of your academic qualifications (1 min)',
  },
  {
    number: 2,
    text: 'Your key technical projects, your role in them, and the technologies you have worked on (2 min)',
  },
  {
    number: 3,
    text: 'Your future vision on your tech career (1 min)',
  },
]

export const VideoRecordPage: React.FC = () => {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [_recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)
  const audioTrackRef = useRef<MediaStreamTrack | null>(null)

  useEffect(() => {
    // Request camera and microphone access
    const requestMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        })
        streamRef.current = mediaStream
        setStream(mediaStream)
        setHasPermission(true)
        
        // Store video and audio tracks
        const videoTrack = mediaStream.getVideoTracks()[0]
        const audioTrack = mediaStream.getAudioTracks()[0]
        videoTrackRef.current = videoTrack
        audioTrackRef.current = audioTrack
        
        // Set initial states
        setIsVideoEnabled(videoTrack?.enabled ?? true)
        setIsAudioEnabled(audioTrack?.enabled ?? true)
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (error) {
        console.error('Error accessing media devices:', error)
        setHasPermission(false)
      }
    }

    requestMedia()

    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleStartRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    setHasRecorded(false)
    recordedChunksRef.current = []
    
    // Start timer
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
    
    // Start MediaRecorder
    if (streamRef.current) {
      try {
        const mediaRecorder = new MediaRecorder(streamRef.current, {
          mimeType: 'video/webm;codecs=vp8,opus',
        })
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data)
          }
        }
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
          setRecordedVideoBlob(blob)
          const url = URL.createObjectURL(blob)
          setRecordedVideoUrl(url)
        }
        
        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
      } catch (error) {
        console.error('Error starting MediaRecorder:', error)
      }
    }
  }

  const handleStopRecording = () => {
    setIsRecording(false)
    setHasRecorded(true)
    
    // Stop timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleRetake = () => {
    setIsRecording(false)
    setHasRecorded(false)
    setRecordingTime(0)
    
    // Clean up recorded video
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl)
      setRecordedVideoUrl(null)
    }
    setRecordedVideoBlob(null)
    recordedChunksRef.current = []
    
    // Stop timer if running
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    // Stop MediaRecorder if running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setIsRecording(false)
      setHasRecorded(false)
      setRecordingTime(0)
      
      // Clean up recorded video
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl)
        setRecordedVideoUrl(null)
      }
      setRecordedVideoBlob(null)
      recordedChunksRef.current = []
      
      // Stop timer if running
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }

  const handleSubmit = () => {
    // All questions completed
    // In production, this would upload all recorded videos
    navigate('/dashboard')
  }

  const toggleVideo = () => {
    if (videoTrackRef.current) {
      videoTrackRef.current.enabled = !videoTrackRef.current.enabled
      setIsVideoEnabled(videoTrackRef.current.enabled)
    }
  }

  const toggleAudio = () => {
    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = !audioTrackRef.current.enabled
      setIsAudioEnabled(audioTrackRef.current.enabled)
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      {/* Dark Grey Frame */}
      <div className="w-full max-w-5xl bg-gray-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-700 px-6 py-5">
          <div className="text-gray-300 text-sm font-medium mb-3">
            Question {questions[currentQuestion].number} of {questions.length}
          </div>
          <div className="text-white text-xl font-semibold leading-relaxed">
            {questions[currentQuestion].text}
          </div>
        </div>

        {/* Video Feed Area */}
        <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
          {/* Show recorded video on last question after recording */}
          {currentQuestion === questions.length - 1 && hasRecorded && recordedVideoUrl ? (
            <div className="w-full h-full bg-black">
              <video
                src={recordedVideoUrl}
                controls
                className="w-full h-full"
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : hasPermission && stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>Requesting camera access...</p>
              <p className="text-sm mt-2">Please allow camera and microphone access</p>
            </div>
          )}

          {/* Recording indicator with timer */}
          {isRecording && (
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-full z-10">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">Recording</span>
              <span className="text-white text-sm font-bold ml-2">{formatTime(recordingTime)}</span>
            </div>
          )}
          
          {/* Timer when not recording but has recorded (only for first 2 questions) */}
          {!isRecording && hasRecorded && currentQuestion < questions.length - 1 && (
            <div className="absolute top-4 right-4 bg-gray-600 px-4 py-2 rounded-full z-10">
              <span className="text-white text-sm font-medium">Recorded: {formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
          {/* Left side - Controls (interactive video/audio toggles) */}
          <div className="flex items-center space-x-3">
            {/* Camera toggle button */}
            <button
              onClick={toggleVideo}
              disabled={!hasPermission || !stream}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isVideoEnabled
                  ? 'bg-gray-600 hover:bg-gray-500 opacity-100'
                  : 'bg-red-600 hover:bg-red-500 opacity-100'
              } ${!hasPermission || !stream ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
            >
              {isVideoEnabled ? (
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              )}
            </button>
            {/* Microphone toggle button */}
            <button
              onClick={toggleAudio}
              disabled={!hasPermission || !stream}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isAudioEnabled
                  ? 'bg-gray-600 hover:bg-gray-500 opacity-100'
                  : 'bg-red-600 hover:bg-red-500 opacity-100'
              } ${!hasPermission || !stream ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isAudioEnabled ? (
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </button>
          </div>

          {/* Right side - Recording/Control buttons */}
          <div className="flex items-center space-x-4">
            {isRecording ? (
              <button
                onClick={handleStopRecording}
                className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Stop Recording
              </button>
            ) : hasRecorded ? (
              <>
                {/* Retake button - dark blue-grey */}
                <button
                  onClick={handleRetake}
                  className="px-6 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Retake
                </button>
                {/* Next Question or Submit button - light purple */}
                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 bg-purple-400 text-white font-semibold rounded-lg hover:bg-purple-500 transition-colors shadow-md"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-purple-400 text-white font-semibold rounded-lg hover:bg-purple-500 transition-colors shadow-md"
                  >
                    Submit
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleStartRecording}
                className="px-6 py-2.5 bg-purple-400 text-white font-semibold rounded-lg hover:bg-purple-500 transition-colors shadow-md"
              >
                Start Recording
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

