import React, { useState } from 'react'
import { usePlacedAIPlan, useUpdatePlacedAIItem } from '@/hooks/usePlacedAI'
import { PlacedAIOnboardingModal } from './PlacedAIOnboardingModal'

export const PlacedAIPlanCard: React.FC = () => {
  const { data, isLoading } = usePlacedAIPlan()
  const updateItem = useUpdatePlacedAIItem()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const plan = data?.data || null

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your PlacedAI plan</h2>
        </div>
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl text-white p-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Kickstart your PlacedAI plan</h2>
            <p className="text-blue-100 text-sm">
              Get a personalized weekly roadmap of challenges tailored to your target role and companies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 rounded-lg bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 shadow-md"
          >
            Create my plan
          </button>
        </div>
        <PlacedAIOnboardingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    )
  }

  const totalItems = plan.items.length
  const completedItems = plan.items.filter((i) => i.status === 'done').length
  const completion = totalItems ? Math.round((completedItems / totalItems) * 100) : 0

  const handleToggleComplete = (itemId: string, isDone: boolean) => {
    updateItem.mutate({ itemId, status: isDone ? 'pending' : 'done' })
  }

  return (
    <>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>🎯</span>
              <span>Your PlacedAI plan (this week)</span>
            </h2>
            <p className="text-sm text-gray-500">
              {completedItems} of {totalItems} tasks completed • {completion}% done
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            Adjust goal
          </button>
        </div>

        <div className="space-y-3">
          {plan.items.slice(0, 4).map((item) => (
            <div
              key={item._id}
              className="flex items-start justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/60 border border-gray-200"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.completedCount}/{item.targetCount} completed
                </p>
                <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (item.completedCount / Math.max(1, item.targetCount)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleComplete(item._id, item.status === 'done')}
                className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  item.status === 'done'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {item.status === 'done' ? 'Done' : 'Mark done'}
              </button>
            </div>
          ))}
        </div>
      </div>
      <PlacedAIOnboardingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}


