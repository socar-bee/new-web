'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { AirportGroup, AirportGroupConfig } from '../model'

import { fetchAirportGroupConfig, fetchAirportGroups } from '../model'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export interface DateOption {
  value: Date
  text: string
}

/** "MM.dd(요일)" (modu-web-app generateDates MMdd_EEE) */
function formatDateOption(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}(${WEEKDAYS[date.getDay()]})`
}

/** 날짜 옵션 N일치 (modu-web-app generateDates) */
function generateDates(startDate: Date, count: number): DateOption[] {
  return Array.from({ length: count }, (_, i) => {
    const value = new Date(startDate)
    value.setDate(value.getDate() + i)
    return { value, text: formatDateOption(value) }
  })
}

/** 30분 슬롯 "HH:mm~HH:mm" — startDate 이후부터 그 날 끝까지 (modu-web-app generateHalfHourIntervals) */
function generateHalfHourIntervals(startDate: Date): string[] {
  const slots: string[] = []
  const start = new Date(startDate)
  const rest = start.getMinutes() % 30
  if (rest !== 0) start.setMinutes(start.getMinutes() + (30 - rest), 0, 0)
  else start.setSeconds(0, 0)
  const dayEnd = new Date(startDate)
  dayEnd.setHours(24, 0, 0, 0)

  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const cursor = new Date(start)
  while (cursor.getTime() + 30 * 60_000 < dayEnd.getTime()) {
    const next = new Date(cursor.getTime() + 30 * 60_000)
    slots.push(`${fmt(cursor)}~${fmt(next)}`)
    cursor.setTime(next.getTime())
  }
  slots.push('23:30~24:00')
  return slots
}

/** "yyyy-MM-dd HH:mm" — 목록/결제로 넘기는 값 (modu-web-app airportParkingInfo 포맷) */
function toDateTimeString(date: Date, hourSlot: string) {
  const hhmm = hourSlot.split('~')[0]
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${hhmm}`
}

/** "MM.dd(요일) HH:mm ~ HH:mm" — ActionInput 표기 (modu-web-app generateTimeOption) */
export function formatTimeOptionText(dateTime: string) {
  if (!dateTime) return ''
  const [dateOnly, timeOnly] = dateTime.split(' ')
  const d = new Date(`${dateOnly}T${timeOnly}`)
  const end = new Date(d.getTime() + 30 * 60_000)
  const endText = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
  return `${formatDateOption(d)} ${timeOnly} ~ ${endText}`
}

/**
 * 공항 주차대행 검색 (modu-web-app airport viewModel 이식).
 * ActionInput 3개(공항 위치·시작·종료) → 각각 바텀시트(라디오 / 휠 데이트타임 피커) → 검색하기.
 */
export function useAirportSearchViewModel() {
  const router = useRouter()

  const [groups, setGroups] = useState<AirportGroup[]>([])
  const [config, setConfig] = useState<AirportGroupConfig | null>(null)

  // 확정 값
  const [location, setLocation] = useState<number | null>(null)
  const [locationText, setLocationText] = useState('')
  const [startDate, setStartDate] = useState('') // "yyyy-MM-dd HH:mm"
  const [endDate, setEndDate] = useState('')

  // 바텀시트/모달
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)
  const [isStartFirstModalOpen, setIsStartFirstModalOpen] = useState(false)

  // 바텀시트 임시 선택 상태
  const [pendingLocationIndex, setPendingLocationIndex] = useState<number | null>(null)
  const [dateOptions, setDateOptions] = useState<DateOption[]>([])
  const [hourOptions, setHourOptions] = useState<string[]>([])
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedHourIndex, setSelectedHourIndex] = useState(0)

  useEffect(() => {
    Promise.all([fetchAirportGroups(), fetchAirportGroupConfig()])
      .then(([groupList, groupConfig]) => {
        setGroups(groupList)
        setConfig(groupConfig)
      })
      .catch(() => {})
  }, [])

  const entryAfterHours = config?.entryAvailableAfterHours ?? 3
  const entryUntilDays = config?.entryAvailableUntilDays ?? 90
  const exitUntilDays = config?.exitAvailableUntilDays ?? 30

  // ── 공항 위치 ──
  const openLocationSheet = useCallback(() => {
    setPendingLocationIndex(location !== null ? groups.findIndex((g) => g.cgSeq === location) : null)
    setIsLocationOpen(true)
  }, [groups, location])

  const confirmLocation = useCallback(() => {
    if (pendingLocationIndex !== null && groups[pendingLocationIndex]) {
      setLocation(groups[pendingLocationIndex].cgSeq)
      setLocationText(groups[pendingLocationIndex].title)
    }
    setIsLocationOpen(false)
  }, [pendingLocationIndex, groups])

  // ── 시작 시간 — 지금+N시간 이후부터 (모웹 handleOnClickStartDateTimeInput) ──
  const openStartSheet = useCallback(() => {
    const base = new Date(Date.now() + entryAfterHours * 3_600_000)
    setDateOptions(generateDates(base, entryUntilDays))
    setHourOptions(generateHalfHourIntervals(base))
    setSelectedDateIndex(0)
    setSelectedHourIndex(0)
    setIsStartDateOpen(true)
  }, [entryAfterHours, entryUntilDays])

  // ── 종료 시간 — 시작 미선택 시 안내 모달, 시작+1일부터 (모웹 handleOnClickEndDateTimeInput) ──
  const openEndSheet = useCallback(() => {
    if (!startDate) {
      setIsStartFirstModalOpen(true)
      return
    }
    const nextDay = new Date(`${startDate.split(' ')[0]}T00:00`)
    nextDay.setDate(nextDay.getDate() + 1)
    setDateOptions(generateDates(nextDay, exitUntilDays))
    setHourOptions(generateHalfHourIntervals(nextDay))
    setSelectedDateIndex(0)
    setSelectedHourIndex(0)
    setIsEndDateOpen(true)
  }, [startDate, exitUntilDays])

  // 날짜 휠 변경 시 시간 옵션 재계산 — 첫 날만 "지금 이후" 제약 (모웹 useEffect 동일)
  const onChangeDateIndex = useCallback(
    (index: number) => {
      setSelectedDateIndex(index)
      if (isStartDateOpen) {
        const base =
          index === 0 ? new Date(Date.now() + entryAfterHours * 3_600_000) : new Date(new Date().setHours(0, 0, 0, 0))
        setHourOptions(generateHalfHourIntervals(base))
        setSelectedHourIndex(0)
      }
    },
    [isStartDateOpen, entryAfterHours]
  )

  const confirmStartDate = useCallback(() => {
    const date = dateOptions[selectedDateIndex]
    const hour = hourOptions[selectedHourIndex]
    if (date && hour) {
      setStartDate(toDateTimeString(date.value, hour))
      setEndDate('') // 시작이 바뀌면 종료 재선택 (모웹 동일)
    }
    setIsStartDateOpen(false)
  }, [dateOptions, hourOptions, selectedDateIndex, selectedHourIndex])

  const confirmEndDate = useCallback(() => {
    const date = dateOptions[selectedDateIndex]
    const hour = hourOptions[selectedHourIndex]
    if (date && hour) setEndDate(toDateTimeString(date.value, hour))
    setIsEndDateOpen(false)
  }, [dateOptions, hourOptions, selectedDateIndex, selectedHourIndex])

  const isDisableCTAButton = useMemo(() => !location || !startDate || !endDate, [location, startDate, endDate])

  const search = useCallback(() => {
    if (isDisableCTAButton) return
    router.push(
      `/airport/tickets?cgSeq=${location}&sDate=${encodeURIComponent(startDate)}&eDate=${encodeURIComponent(endDate)}`
    )
  }, [router, isDisableCTAButton, location, startDate, endDate])

  return {
    groups,
    locationText,
    startDateText: formatTimeOptionText(startDate),
    endDateText: formatTimeOptionText(endDate),
    isLocationOpen,
    isStartDateOpen,
    isEndDateOpen,
    isStartFirstModalOpen,
    setIsStartFirstModalOpen,
    setIsLocationOpen,
    setIsStartDateOpen,
    setIsEndDateOpen,
    pendingLocationIndex,
    setPendingLocationIndex,
    dateOptions,
    hourOptions,
    selectedDateIndex,
    selectedHourIndex,
    onChangeDateIndex,
    setSelectedHourIndex,
    openLocationSheet,
    openStartSheet,
    openEndSheet,
    confirmLocation,
    confirmStartDate,
    confirmEndDate,
    isDisableCTAButton,
    search,
    goBack: () => router.back()
  }
}
