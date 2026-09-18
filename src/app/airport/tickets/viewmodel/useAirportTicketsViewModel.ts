'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import type { AirportGroupConfig, AirportTicketList } from '../../model'

import { fetchAirportGroupConfig, fetchAirportGroups, fetchAirportTickets, parseAirportDateTime } from '../../model'
import { formatTimeOptionText } from '../../viewmodel'

export type AirportViewType = 'list' | 'card'

/**
 * 공항 주차권 목록 (modu-web-app /airport/tickets viewModel 이식).
 * 쿼리: cgSeq(공항 그룹) · sDate/eDate("yyyy-MM-dd HH:mm") · 라벨 필터 · 리스트/카드 토글.
 */
export function useAirportTicketsViewModel() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const cgSeq = Number(searchParams?.get('cgSeq') ?? 0)
  const sDate = searchParams?.get('sDate') ?? ''
  const eDate = searchParams?.get('eDate') ?? ''

  const [list, setList] = useState<AirportTicketList | null>(null)
  const [config, setConfig] = useState<AirportGroupConfig | null>(null)
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLabelCodes, setSelectedLabelCodes] = useState<number[]>([])
  const [viewType, setViewType] = useState<AirportViewType>('list')

  useEffect(() => {
    fetchAirportGroupConfig()
      .then(setConfig)
      .catch(() => {})
    fetchAirportGroups()
      .then((groups) => setTitle(groups.find((g) => g.cgSeq === cgSeq)?.title ?? ''))
      .catch(() => {})
  }, [cgSeq])

  useEffect(() => {
    if (!cgSeq || !sDate || !eDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false)
      return
    }
    let stale = false
    fetchAirportTickets(cgSeq, {
      predictBeginTime: parseAirportDateTime(sDate),
      predictExitBeginTime: parseAirportDateTime(eDate),
      labelCodes: selectedLabelCodes.length ? selectedLabelCodes : undefined
    })
      .then((data) => {
        if (!stale) setList(data)
      })
      .catch(() => {
        if (!stale) setList(null)
      })
      .finally(() => {
        if (!stale) setIsLoading(false)
      })
    return () => {
      stale = true
    }
  }, [cgSeq, sDate, eDate, selectedLabelCodes])

  const toggleLabel = (detailCode: number) => {
    setSelectedLabelCodes((prev) =>
      prev.includes(detailCode) ? prev.filter((c) => c !== detailCode) : [...prev, detailCode]
    )
  }

  const startText = useMemo(() => formatTimeOptionText(sDate), [sDate])
  const endText = useMemo(() => formatTimeOptionText(eDate), [eDate])

  const goToDetail = (couponSeq: number) => {
    router.push(`/airport/ticket/${couponSeq}?sDate=${encodeURIComponent(sDate)}&eDate=${encodeURIComponent(eDate)}`)
  }

  /** "변경" — 검색 화면으로 복귀 (모웹은 인라인 바텀시트 — 후속 이식 대상) */
  const goToSearch = () => router.push('/airport')

  return {
    isLoading,
    title,
    tickets: list?.tickets ?? [],
    infoMsg: list?.infoMsg ?? '',
    labels: config?.labels ?? [],
    selectedLabelCodes,
    toggleLabel,
    viewType,
    setViewType,
    startText,
    endText,
    sDate,
    eDate,
    goToDetail,
    goToSearch,
    goBack: () => router.back()
  }
}
