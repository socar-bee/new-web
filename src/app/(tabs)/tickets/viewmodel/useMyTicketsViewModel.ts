'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAuthStore } from '@/shared/stores/authStore'

import { useActiveTickets } from '../model'
import { MyTicketStatus } from '@/shared/types/ticket'
import type { MyTicketActiveItem } from '@/shared/types/ticket'

/** 상태 배지 톤 — 주차장 상세 티켓 스텁의 dot 컬러 체계를 따른다 */
export type MyTicketStatusTone = 'active' | 'pending' | 'done' | 'canceled'

interface StatusMeta {
  label: string
  tone: MyTicketStatusTone
}

/** 상태 코드 → 표시 라벨/톤. 미지의 코드는 원문 대신 중립 라벨로 떨어뜨린다 */
const STATUS_META: Record<string, StatusMeta> = {
  [MyTicketStatus.DAILY_BEFORE_USE]: { label: '사용 예정', tone: 'active' },
  [MyTicketStatus.PERIOD_BEFORE_USE]: { label: '사용 예정', tone: 'active' },
  [MyTicketStatus.MONTHLY_USING]: { label: '이용중', tone: 'active' },
  [MyTicketStatus.MONTHLY_PAYMENT_COMPLETED]: { label: '결제 완료', tone: 'active' },
  [MyTicketStatus.MONTHLY_REQUEST_CHECKING]: { label: '확인중', tone: 'pending' },
  [MyTicketStatus.MONTHLY_REQUEST_CHECKED]: { label: '확인 완료', tone: 'active' },
  [MyTicketStatus.DAILY_AFTER_USE]: { label: '사용 완료', tone: 'done' },
  [MyTicketStatus.PERIOD_AFTER_USE]: { label: '사용 완료', tone: 'done' },
  [MyTicketStatus.DAILY_EXPIRED]: { label: '기간 만료', tone: 'done' },
  [MyTicketStatus.PERIOD_EXPIRED]: { label: '기간 만료', tone: 'done' },
  [MyTicketStatus.MONTHLY_EXPIRED]: { label: '기간 만료', tone: 'done' },
  [MyTicketStatus.DAILY_CANCELED]: { label: '취소', tone: 'canceled' },
  [MyTicketStatus.PERIOD_CANCELED]: { label: '취소', tone: 'canceled' },
  [MyTicketStatus.DAILY_REFUND_REQUEST]: { label: '환불 요청', tone: 'pending' },
  [MyTicketStatus.PERIOD_REFUND_REQUEST]: { label: '환불 요청', tone: 'pending' },
  [MyTicketStatus.DAILY_REFUNDED]: { label: '환불 완료', tone: 'canceled' },
  [MyTicketStatus.PERIOD_REFUNDED]: { label: '환불 완료', tone: 'canceled' },
  [MyTicketStatus.MONTHLY_REJECTED]: { label: '신청 거절', tone: 'canceled' },
  [MyTicketStatus.MONTHLY_REJECTED_REFUNDED]: { label: '환불 완료', tone: 'canceled' },
  [MyTicketStatus.MONTHLY_STOPPED]: { label: '이용 중지', tone: 'canceled' },
  [MyTicketStatus.MONTHLY_STOPPED_REFUNDED]: { label: '환불 완료', tone: 'canceled' },
  [MyTicketStatus.MONTHLY_CANCELED_REFUNDED]: { label: '환불 완료', tone: 'canceled' }
}

export function getStatusMeta(status: string): StatusMeta {
  return STATUS_META[status] ?? { label: '확인 필요', tone: 'done' }
}

export interface MyTicketRow {
  key: string
  type: string
  seq: number
  parkinglotName: string
  ticketName: string
  carNum: string
  usageDate: string
  totalPrice: number
  status: StatusMeta
}

export function useMyTicketsViewModel() {
  // persist 복원 전 SSR/첫 렌더는 미로그인으로 그려진다 — 마운트 후 실제 상태로 동기화 (1회성, 의도적 예외)
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const accessToken = useAuthStore((s) => s.accessToken)

  const { data, isLoading, isError, refetch } = useActiveTickets(isMounted && isLoggedIn ? accessToken : null)

  const tickets = useMemo<MyTicketRow[]>(
    () =>
      (data?.results ?? []).map((item: MyTicketActiveItem) => ({
        key: `${item.type}-${item.seq}`,
        type: item.type,
        seq: item.seq,
        parkinglotName: item.parkinglotName,
        ticketName: item.ticketName,
        carNum: item.carNum,
        usageDate: item.usageDate,
        totalPrice: item.totalPrice,
        status: getStatusMeta(item.status)
      })),
    [data]
  )

  return {
    isMounted,
    isLoggedIn,
    tickets,
    total: data?.total ?? 0,
    isLoading,
    isError,
    refetch
  }
}
