'use client'

import { addMonths, format, isToday, isTomorrow, parse, startOfMonth } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import Calendar from './Calendar'

const YYYY_MM_DD = 'yyyy-MM-dd'
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export interface TimeFilterDuration {
  id: string
  label: string
}

export interface TimeFilterOptions {
  dates: string[]
  defaults: { date: string; durationId: string }
  durations: TimeFilterDuration[]
}

interface TimeFilterSheetProps {
  isOpen: boolean
  options: TimeFilterOptions
  selectedDate: string
  selectedDurationId: string
  onDateChange: (date: string) => void
  onDurationChange: (durationId: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function formatDateLabel(dateStr: string): string {
  const date = parse(dateStr, YYYY_MM_DD, new Date())
  if (isToday(date)) return '오늘'
  if (isTomorrow(date)) return '내일'
  const dayName = DAY_NAMES[date.getDay()]
  return `${format(date, 'M.d')}(${dayName})`
}

export default function TimeFilterSheet({
  isOpen,
  options,
  selectedDate,
  selectedDurationId,
  onDateChange,
  onDurationChange,
  onClose,
  onConfirm
}: TimeFilterSheetProps) {
  const [draftDate, setDraftDate] = useState(selectedDate)
  const [draftDurationId, setDraftDurationId] = useState(selectedDurationId)

  // 시트 열릴 때 draft를 현재 값으로 초기화
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraftDate(selectedDate)

      setDraftDurationId(selectedDurationId)
    }
  }, [isOpen, selectedDate, selectedDurationId])

  const allowedDates = new Set(options.dates)
  const draftDateObj = parse(draftDate, YYYY_MM_DD, new Date())

  const lastDate =
    options.dates.length > 0 ? parse(options.dates[options.dates.length - 1], YYYY_MM_DD, new Date()) : new Date()
  const maxMonth = addMonths(startOfMonth(lastDate), 1)

  const filterDate = (date: Date) => allowedDates.has(format(date, YYYY_MM_DD))

  const handleDateSelect = (date: Date) => {
    const formatted = format(date, YYYY_MM_DD)
    if (allowedDates.has(formatted)) setDraftDate(formatted)
  }

  const handleConfirm = () => {
    onDateChange(draftDate)
    onDurationChange(draftDurationId)
    onConfirm()
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-0 z-[var(--z-backdrop)] mx-auto w-full max-w-[480px]"
            style={{ bottom: 'var(--dock-height, 0px)' }}
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-black/50" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="bg-bg-white fixed left-1/2 z-[var(--z-sheet)] flex w-full max-w-[480px] -translate-x-1/2 flex-col rounded-t-[24px]"
            style={{ bottom: 'var(--dock-height, 0px)' }}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-0">
              <h2 className="text-text-strong text-h4 text-center font-bold">날짜 및 이용시간</h2>
            </div>

            {/* Calendar */}
            <Calendar
              selectedDate={draftDateObj}
              onChange={handleDateSelect}
              filterDate={filterDate}
              minMonth={new Date()}
              maxMonth={maxMonth}
            />

            {/* Duration chips — 4열 grid */}
            <div className="px-6 pt-2 pb-2">
              <p className="text-text-strong text-t4 mb-3 font-semibold">주차 예정 시간</p>
              <div className="grid grid-cols-4 gap-2">
                {options.durations.map((dur) => {
                  const isSelected = dur.id === draftDurationId
                  return (
                    <button
                      key={dur.id}
                      onClick={() => setDraftDurationId(dur.id)}
                      className={`text-c2 flex h-[30px] cursor-pointer items-center justify-center rounded-full border font-medium whitespace-nowrap transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-static-white'
                          : 'border-stroke-soft bg-bg-white text-text-strong'
                      }`}
                    >
                      {dur.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="flex gap-2 px-4 py-4">
              <button
                onClick={onClose}
                className="rounded-8 bg-bg-soft text-text-strong text-t4 flex h-[52px] flex-1 cursor-pointer items-center justify-center font-semibold"
              >
                닫기
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-8 bg-primary text-static-white text-t4 flex h-[52px] flex-1 cursor-pointer items-center justify-center font-semibold"
              >
                선택 완료
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
