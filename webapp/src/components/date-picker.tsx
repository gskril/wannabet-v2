'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  minDate?: Date
  placeholder?: string
  className?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function DatePicker({
  value,
  onChange,
  minDate = new Date(),
  placeholder = 'Select date',
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      return new Date(value)
    }
    return new Date()
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value) : null

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  const handleSelectDate = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    selected.setHours(23, 59, 59, 999)
    onChange(selected.toISOString())
    setIsOpen(false)
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    const min = new Date(minDate)
    min.setHours(0, 0, 0, 0)
    return date < min
  }

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getFullYear() === viewDate.getFullYear()
    )
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    )
  }

  const formatDisplayDate = () => {
    if (!selectedDate) return placeholder
    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth())
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth())

  // Check if prev month button should be disabled
  const isPrevMonthDisabled = () => {
    const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
    const min = new Date(minDate)
    min.setDate(1)
    min.setHours(0, 0, 0, 0)
    return prevMonth < min
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-full items-center rounded-md border border-input bg-wb-sand px-3 py-1 text-left text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm',
          selectedDate ? 'text-wb-brown' : 'text-wb-taupe',
          className
        )}
      >
        {formatDisplayDate()}
      </button>

      {/* Calendar Dropdown - Fixed position to avoid clipping */}
      {isOpen && (
        <div className="fixed left-1/2 top-1/2 z-50 w-64 -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-wb-cream p-3 shadow-xl">
          {/* Header */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={isPrevMonthDisabled()}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-wb-brown transition-colors hover:bg-wb-sand disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs font-semibold text-wb-brown">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-wb-brown transition-colors hover:bg-wb-sand"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS.map((day) => (
              <div
                key={day}
                className="flex h-6 items-center justify-center text-[10px] font-medium text-wb-taupe"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before the first day of month */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const disabled = isDateDisabled(day)
              const selected = isDateSelected(day)
              const today = isToday(day)

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !disabled && handleSelectDate(day)}
                  disabled={disabled}
                  className={cn(
                    'flex h-7 items-center justify-center rounded text-xs transition-colors',
                    disabled && 'cursor-not-allowed text-wb-taupe/40',
                    !disabled && !selected && 'text-wb-brown hover:bg-wb-sand',
                    selected && 'bg-wb-coral text-white',
                    today && !selected && 'font-bold'
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
