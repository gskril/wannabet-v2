'use client'

import { BetStatus } from 'indexer/types'
import { STATUS_CONFIG } from './status-pennant'

interface StatusFilterProps {
  selectedStatuses: BetStatus[]
  onStatusChange: (statuses: BetStatus[]) => void
}

const ALL_STATUSES = Object.values(BetStatus)

export function StatusFilter({ selectedStatuses, onStatusChange }: StatusFilterProps) {
  const allSelected = selectedStatuses.length === 0 || selectedStatuses.length === ALL_STATUSES.length

  const handleAllClick = () => {
    onStatusChange([])
  }

  const handleStatusClick = (status: BetStatus) => {
    if (allSelected) {
      // If all are selected, select only this one
      onStatusChange([status])
    } else if (selectedStatuses.includes(status)) {
      // If this status is selected, deselect it
      const newStatuses = selectedStatuses.filter((s) => s !== status)
      // If no statuses remain, go back to "all"
      onStatusChange(newStatuses.length === 0 ? [] : newStatuses)
    } else {
      // Add this status to selection
      const newStatuses = [...selectedStatuses, status]
      // If all statuses are now selected, reset to "all"
      if (newStatuses.length === ALL_STATUSES.length) {
        onStatusChange([])
      } else {
        onStatusChange(newStatuses)
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleAllClick}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          allSelected
            ? 'bg-wb-coral text-white'
            : 'bg-wb-cream text-wb-brown hover:bg-wb-sand'
        }`}
      >
        All
      </button>
      {ALL_STATUSES.map((status) => {
        const config = STATUS_CONFIG[status]
        const isSelected = !allSelected && selectedStatuses.includes(status)

        return (
          <button
            key={status}
            onClick={() => handleStatusClick(status)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              isSelected
                ? `${config.bg} text-wb-brown`
                : 'bg-wb-cream text-wb-brown hover:bg-wb-sand'
            }`}
          >
            <span className="text-base">{config.emoji}</span>
            <span>{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}
