'use client'

import { IconChevronLeftLine, IconChevronRightLine } from '@socar-inc/modu-ui/icons'
import { ko } from 'date-fns/locale'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface CalendarProps {
  selectedDate: Date | null
  onChange: (date: Date) => void
  filterDate?: (date: Date) => boolean
  minMonth?: Date
  maxMonth?: Date
}

export default function Calendar({ selectedDate, onChange, filterDate, minMonth, maxMonth }: CalendarProps) {
  const handleChange = (date: Date | null) => {
    if (!date) return
    onChange(date)
  }

  return (
    <div className="modu-calendar">
      <DatePicker
        locale={ko}
        selected={selectedDate}
        onChange={handleChange}
        filterDate={filterDate}
        inline
        fixedHeight
        disabledKeyboardNavigation
        renderCustomHeader={({ monthDate, decreaseMonth, increaseMonth }) => {
          const y = monthDate.getFullYear()
          const m = monthDate.getMonth() // 0-based
          const isPrevDisabled = minMonth
            ? y < minMonth.getFullYear() || (y === minMonth.getFullYear() && m <= minMonth.getMonth())
            : false
          const isNextDisabled = maxMonth
            ? y > maxMonth.getFullYear() || (y === maxMonth.getFullYear() && m >= maxMonth.getMonth())
            : false

          return (
            <div className="flex items-center justify-between px-6 py-2">
              <span className="text-text-strong text-t4 font-semibold">{`${y}년 ${m + 1}월`}</span>
              <div className="flex items-center gap-7 opacity-80">
                <button onClick={decreaseMonth} disabled={isPrevDisabled} className="p-0">
                  <IconChevronLeftLine
                    className={`size-6 ${isPrevDisabled ? 'text-icon-disabled' : 'text-icon-strong'}`}
                  />
                </button>
                <button onClick={increaseMonth} disabled={isNextDisabled} className="p-0">
                  <IconChevronRightLine
                    className={`size-6 ${isNextDisabled ? 'text-icon-disabled' : 'text-icon-strong'}`}
                  />
                </button>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}
