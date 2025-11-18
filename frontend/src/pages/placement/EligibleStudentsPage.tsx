'use client'

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEligibleStudents, useAllBatches, useRegisterStudent, useGenerateDummyStudents, useImportStudentsFromCSV } from '@/hooks/usePlacement'
import { useCurrentUser } from '@/hooks/useAuth'
import { ProfileAvatar } from '@/components/common/ProfileAvatar'
import { useForm } from 'react-hook-form'
import { showToast } from '@/utils/toast'

interface StudentFormData {
  name: string
  email: string
  password?: string
  graduationYear: string
  currentLocation?: string
  workExperience?: number
  linkedin?: string
  github?: string
}

export const EligibleStudentsPage: React.FC = () => {
  const { data: userData } = useCurrentUser()
  const [selectedBatch, setSelectedBatch] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'placed' | 'active' | 'unplaced'>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [dummyCount, setDummyCount] = useState(20)
  const [dummyBatch, setDummyBatch] = useState('')

  const { data: batchesData } = useAllBatches()
  const { data: studentsData, isLoading } = useEligibleStudents({
    batch: selectedBatch || undefined,
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })
  const registerStudent = useRegisterStudent()
  const generateDummy = useGenerateDummyStudents()
  const importCSV = useImportStudentsFromCSV()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StudentFormData>()

  const user = userData?.data
  const students = studentsData?.data?.students || []
  const batches = batchesData?.data?.batches || []

  const onSubmitStudent = async (data: StudentFormData) => {
    try {
      await registerStudent.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
        graduationYear: data.graduationYear,
        currentLocation: data.currentLocation,
        workExperience: data.workExperience ? Number(data.workExperience) : 0,
        linkedin: data.linkedin,
        github: data.github,
      })
      showToast('Student registered successfully!', 'success')
      setIsAddModalOpen(false)
      reset()
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to register student', 'error')
    }
  }

  const handleGenerateDummy = async () => {
    try {
      const result = await generateDummy.mutateAsync({
        count: dummyCount,
        batch: dummyBatch || undefined,
      })
      showToast(`Successfully generated ${result.data?.count || 0} dummy students!`, 'success')
      setIsGenerateModalOpen(false)
      setDummyCount(20)
      setDummyBatch('')
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to generate dummy students', 'error')
    }
  }

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCsvFile(file)
    }
  }

  const handleCSVImport = async () => {
    if (!csvFile) {
      showToast('Please select a CSV file', 'error')
      return
    }

    try {
      // Parse CSV file
      const text = await csvFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const students = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const student: any = {}
        
        headers.forEach((header, index) => {
          const value = values[index] || ''
          if (header === 'name') student.name = value
          else if (header === 'email') student.email = value
          else if (header === 'password') student.password = value
          else if (header === 'graduationyear' || header === 'graduation_year' || header === 'batch') student.graduationYear = value
          else if (header === 'location' || header === 'currentlocation' || header === 'current_location') student.currentLocation = value
          else if (header === 'experience' || header === 'workexperience' || header === 'work_experience') student.workExperience = parseInt(value) || 0
          else if (header === 'linkedin') student.linkedin = value
          else if (header === 'github') student.github = value
        })
        
        if (student.name && student.email) {
          students.push(student)
        }
      }

      if (students.length === 0) {
        showToast('No valid students found in CSV file', 'error')
        return
      }

      const result = await importCSV.mutateAsync({ students })
      
      if (result.data?.errors && result.data.errors.length > 0) {
        showToast(`Imported ${result.data.count} students. ${result.data.errors.length} errors occurred.`, 'warning')
        console.error('Import errors:', result.data.errors)
      } else {
        showToast(`Successfully imported ${result.data?.count || 0} students!`, 'success')
      }
      
      setIsCSVModalOpen(false)
      setCsvFile(null)
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to import CSV', 'error')
    }
  }

  if (user?.role !== 'placement' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (student: typeof students[0]) => {
    if (student.selectedCount > 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Placed</span>
    }
    if (student.activePlacements > 0) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">In Progress</span>
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Unplaced</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Eligible Students</h1>
              <p className="mt-2 text-gray-600">View and manage student profiles and applications</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Add Student
              </button>
              <button
                onClick={() => setIsGenerateModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🎲 Generate Dummy Data
              </button>
              <button
                onClick={() => setIsCSVModalOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                📄 Import CSV
              </button>
              <Link
                to="/placement/dashboard"
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Batch Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch.batch} value={batch.batch}>
                    {batch.batch} ({batch.students} students)
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="placed">Placed</option>
                <option value="active">In Progress</option>
                <option value="unplaced">Unplaced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-600">Loading students...</div>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">No students found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <ProfileAvatar
                      name={student.name}
                      profilePicture={student.profilePicture}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                        {getStatusBadge(student)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{student.email}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        {student.batch && <span>Batch: {student.batch}</span>}
                        {student.currentLocation && <span>Location: {student.currentLocation}</span>}
                        {student.workExperience !== undefined && (
                          <span>Experience: {student.workExperience} years</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm mb-3">
                        <span className="text-gray-600">
                          Applications: <span className="font-semibold">{student.activeApplications}</span>
                        </span>
                        <span className="text-gray-600">
                          Active Placements: <span className="font-semibold">{student.activePlacements}</span>
                        </span>
                        <span className="text-gray-600">
                          Selected: <span className="font-semibold text-green-600">{student.selectedCount}</span>
                        </span>
                      </div>
                      {student.applications.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Recent Applications:</p>
                          {student.applications.slice(0, 3).map((app) => (
                            <div key={app.id} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{app.job.title}</p>
                                  <p className="text-xs text-gray-600">{app.job.company}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    app.status === 'shortlisted' ? 'bg-purple-100 text-purple-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {app.status}
                                  </span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Round {app.currentRound}/{app.totalRounds} ({app.roundsCompleted} completed)
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
                    {student.resume && (
                      <a
                        href={student.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Resume
                      </a>
                    )}
                    {student.linkedin && (
                      <a
                        href={student.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        LinkedIn
                      </a>
                    )}
                    {student.github && (
                      <a
                        href={student.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-900"
                      >
                        GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Student Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsAddModalOpen(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto animate-scale-in transition-spring">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Register New Student</h2>
              <form onSubmit={handleSubmit(onSubmitStudent)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...register('email', { required: 'Email is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password (Optional - defaults to Student@123)
                    </label>
                    <input
                      type="password"
                      {...register('password', { minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Graduation Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('graduationYear', { required: 'Graduation year is required' })}
                      placeholder="e.g., 2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                    <input
                      {...register('currentLocation')}
                      placeholder="e.g., Mumbai"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      {...register('workExperience', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      {...register('linkedin')}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                    <input
                      type="url"
                      {...register('github')}
                      placeholder="https://github.com/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false)
                      reset()
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerStudent.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {registerStudent.isPending ? 'Registering...' : 'Register Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Generate Dummy Students Modal */}
        {isGenerateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsGenerateModalOpen(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 animate-scale-in transition-spring">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Dummy Students</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Students <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={dummyCount}
                    onChange={(e) => setDummyCount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Between 1 and 100 students</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch (Optional)</label>
                  <select
                    value={dummyBatch}
                    onChange={(e) => setDummyBatch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Random Batches</option>
                    {batches.map((batch) => (
                      <option key={batch.batch} value={batch.batch}>
                        {batch.batch}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Leave empty to assign random batches</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> All dummy students will have default password: <code className="bg-yellow-100 px-1 rounded">Student@123</code>
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateDummy}
                    disabled={generateDummy.isPending || dummyCount < 1 || dummyCount > 100}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {generateDummy.isPending ? 'Generating...' : 'Generate Students'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {isCSVModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsCSVModalOpen(false)}
            />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 animate-scale-in transition-spring">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Import Students from CSV</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CSV File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {csvFile && (
                    <p className="text-xs text-gray-600 mt-1">Selected: {csvFile.name}</p>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm font-medium text-blue-900 mb-2">CSV Format:</p>
                  <p className="text-xs text-blue-800 mb-1">
                    Required columns: <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">email</code>
                  </p>
                  <p className="text-xs text-blue-800 mb-1">
                    Optional columns: <code className="bg-blue-100 px-1 rounded">password</code>, <code className="bg-blue-100 px-1 rounded">graduationYear</code>, <code className="bg-blue-100 px-1 rounded">location</code>, <code className="bg-blue-100 px-1 rounded">experience</code>, <code className="bg-blue-100 px-1 rounded">linkedin</code>, <code className="bg-blue-100 px-1 rounded">github</code>
                  </p>
                  <p className="text-xs text-blue-800">
                    Example: <code className="bg-blue-100 px-1 rounded">name,email,graduationYear,location</code>
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCSVModalOpen(false)
                      setCsvFile(null)
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCSVImport}
                    disabled={importCSV.isPending || !csvFile}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {importCSV.isPending ? 'Importing...' : 'Import Students'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

