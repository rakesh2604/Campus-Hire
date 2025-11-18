import React, { useState } from 'react'
import { usePlacedAIGoalMutation } from '@/hooks/usePlacedAI'
import { showToast } from '@/utils/toast'

interface PlacedAIOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

const roles = ['SDE', 'Frontend Developer', 'Backend Developer', 'Fullstack Developer']
const companies = ['Google', 'Microsoft', 'Netflix', 'Amazon', 'Product-based', 'Service-based']

export const PlacedAIOnboardingModal: React.FC<PlacedAIOnboardingModalProps> = ({ isOpen, onClose }) => {
  const [targetRole, setTargetRole] = useState<string>('SDE')
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(['Product-based'])
  const [timelineWeeks, setTimelineWeeks] = useState<number>(8)
  const [intensity, setIntensity] = useState<'light' | 'normal' | 'intense'>('normal')

  const goalMutation = usePlacedAIGoalMutation()

  if (!isOpen) return null

  const toggleCompany = (company: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(company) ? prev.filter((c) => c !== company) : [...prev, company]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await goalMutation.mutateAsync({
        targetRole,
        targetCompanies: selectedCompanies,
        targetTimelineWeeks: timelineWeeks,
        intensity,
      })
      showToast('Your PlacedAI plan has been created!', 'success')
      onClose()
    } catch (error) {
      console.error('Failed to create PlacedAI plan', error)
      showToast('Failed to create PlacedAI plan. Please try again.', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Set up your PlacedAI plan</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target role</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target companies</label>
            <div className="flex flex-wrap gap-2">
              {companies.map((company) => {
                const selected = selectedCompanies.includes(company)
                return (
                  <button
                    key={company}
                    type="button"
                    onClick={() => toggleCompany(company)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {company}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline (weeks)</label>
              <select
                value={timelineWeeks}
                onChange={(e) => setTimelineWeeks(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[4, 8, 12].map((weeks) => (
                  <option key={weeks} value={weeks}>
                    {weeks} weeks
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
              <select
                value={intensity}
                onChange={(e) => setIntensity(e.target.value as 'light' | 'normal' | 'intense')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="light">Light</option>
                <option value="normal">Normal</option>
                <option value="intense">Intense</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={goalMutation.isPending}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {goalMutation.isPending ? 'Creating...' : 'Create plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


