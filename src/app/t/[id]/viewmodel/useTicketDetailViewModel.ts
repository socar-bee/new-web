'use client'

import { addDays, format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo } from 'react'

import { getTodayInSeoul, resolveParkingDate } from '@/shared/lib/date'

import { useTicketDetail } from '../model'
import {
  CouponTypeGroup,
  PurchaseAvailabilityStatus,
  type ParkingLotDetail,
  type TicketDetail,
  type TicketListItem
} from '@/shared/types/parking'

import { usePlatform } from '@/shared/platform'

/** 네이티브·웹 헤더 공용 제목 (modu-android content_product_details_nav_title) */
export const TICKET_DETAIL_TITLE = '이용권 상세'

/** 날짜 선택 셀 — modu-android MDSDateCell 대응 */
export interface DateCellModel {
  /** `yyyy-MM-dd` */
  date: string
  /** 오늘 / 내일 / 요일(일~토) */
  label: string
  /** `M/d` */
  dayText: string
  isSelected: boolean
  /** 일요일만 빨간색 — 토요일은 평일색 (modu-android 정책) */
  isHoliday: boolean
}

/** 구매 버튼 — modu-android TicketDetailPurchaseButton 분기 */
export interface PurchaseButtonProps {
  text: string
  disabled: boolean
  /** true: 월정기 — 결제 대신 앱으로 유도 */
  isAbleApp: boolean
}

/** 추천 카드(이런 이용권은 어떠세요?) — 구매가능 여부로 스타일이 갈린다 */
export interface AnotherTicketModel {
  couponSeq: number
  couponName: string
  price: number
  /** 기간·판매예정 문구 자리 */
  subLabel: string
  isAvailable: boolean
}

interface UseTicketDetailViewModelParams {
  couponSeq: number | null
  /** SSR에서 받은 초기 데이터 */
  initialTicket?: TicketDetail
  /** 동일 주차장의 다른 티켓 목록 (추천 카드용) */
  parkingTickets?: TicketListItem[]
  /** 주차장 상세 (헤더/뒤로가기 대상) */
  pin?: ParkingLotDetail
}

/** 웹 진입값에는 availableDates 가 없어 오늘부터 7일을 그린다 (docs/07-app-webview.md 미정 사항) */
const DATE_CELL_COUNT = 7

export function useTicketDetailViewModel({
  couponSeq,
  initialTicket,
  parkingTickets = [],
  pin
}: UseTicketDetailViewModelParams) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = usePlatform()

  // ── time filter carry (parkingDate / durationId) ──
  // 화면이 가진 parkingDate 하나를 조회·날짜셀·결제 진입값에 같이 쓴다 (자정 어긋남 방지)
  const parkingDate = resolveParkingDate(searchParams?.get('parkingDate'))
  const durationId = searchParams?.get('durationId') ?? ''

  const carryQuery = useMemo(() => {
    const p = new URLSearchParams()
    if (searchParams?.get('parkingDate')) p.set('parkingDate', searchParams.get('parkingDate')!)
    if (durationId) p.set('durationId', durationId)
    const s = p.toString()
    return s ? `?${s}` : ''
  }, [searchParams, durationId])

  // ── ticket detail (TanStack Query, SSR initialData 가능) ──
  const { data: ticket, isLoading, refetch } = useTicketDetail(couponSeq, parkingDate, initialTicket)

  const isMonthly = ticket?.couponTypeGroup === CouponTypeGroup.MONTHLY

  // ── 뒤로가기 — 웹: 주차장 풀페이지(시트 full), 앱: 웹뷰 닫기 ──
  const goBack = useCallback(() => {
    platform.back(pin ? `/p/${pin.seq}${carryQuery}#sheet=full` : '/')
  }, [platform, pin, carryQuery])

  // ── 네이티브 상단바 (웹은 no-op — 화면 안 헤더가 맡는다) ──
  platform.useTopBar({ title: TICKET_DETAIL_TITLE, onBack: goBack })

  // ── 결제·앱 화면에서 돌아오면 판매 상태를 다시 읽는다 ──
  useEffect(() => platform.onReturn(() => refetch()), [platform, refetch])

  // ── 날짜 선택 (Daily 만 노출 — Monthly 는 숨김, modu-android showDatePicker) ──
  const showDatePicker = ticket != null && !isMonthly

  const dateCells = useMemo<DateCellModel[]>(() => {
    const today = parseISO(getTodayInSeoul())
    return Array.from({ length: DATE_CELL_COUNT }, (_, index) => {
      const date = addDays(today, index)
      const value = format(date, 'yyyy-MM-dd')
      const label = index === 0 ? '오늘' : index === 1 ? '내일' : format(date, 'EEEEE', { locale: ko })
      return {
        date: value,
        label,
        dayText: format(date, 'M/d'),
        isSelected: value === parkingDate,
        isHoliday: date.getDay() === 0
      }
    })
  }, [parkingDate])

  const selectDate = useCallback(
    (date: string) => {
      if (date === parkingDate) return
      const p = new URLSearchParams()
      p.set('parkingDate', date)
      if (durationId) p.set('durationId', durationId)
      router.replace(`/t/${couponSeq}?${p.toString()}`, { scroll: false })
    },
    [router, couponSeq, parkingDate, durationId]
  )

  // ── 구매 버튼 — modu-android 기준: {가격} 결제하기 / {일시}부터 구매가능 / 판매예정 / 매진 ──
  const purchaseButton = useMemo<PurchaseButtonProps>(() => {
    if (!ticket) return { text: '', disabled: true, isAbleApp: false }

    const status = ticket.purchaseAvailability?.status

    if (status === PurchaseAvailabilityStatus.AVAILABLE) {
      if (isMonthly) {
        // 월정기 결제는 이름·차량 입력 화면이 웹에 없어 앱으로 유도한다 (docs/07-app-webview.md)
        return { text: '모두의주차장 앱에서 구매하기', disabled: false, isAbleApp: true }
      }
      return { text: `${ticket.price.toLocaleString()}원 결제하기`, disabled: false, isAbleApp: false }
    }

    if (status === PurchaseAvailabilityStatus.NOT_YET_OPEN) {
      const openLabel = formatPurchaseOpenDateTime(ticket.purchaseAvailability?.purchaseOpenDateTime)
      return { text: openLabel ? `${openLabel}부터 구매가능` : '판매예정', disabled: true, isAbleApp: false }
    }

    // SOLD_OUT / CLOSED / 그 외 통합 — 디자인 가이드 "구매불가/현재매진 → 매진"
    return { text: '매진', disabled: true, isAbleApp: false }
  }, [ticket, isMonthly])

  // ── 이런 이용권은 어떠세요? — 현재 주차권 제외 ──
  const anotherTickets = useMemo<AnotherTicketModel[]>(
    () =>
      parkingTickets
        .filter((t) => t.couponSeq !== ticket?.couponSeq)
        .map((t) => {
          const status = t.purchaseAvailability?.status
          const isAvailable = status === PurchaseAvailabilityStatus.AVAILABLE && !t.isSoldOut
          const openLabel =
            status === PurchaseAvailabilityStatus.NOT_YET_OPEN
              ? formatPurchaseOpenDateTime(t.purchaseAvailability?.purchaseOpenDateTime)
              : null
          return {
            couponSeq: t.couponSeq,
            couponName: t.couponName,
            price: t.price,
            subLabel: openLabel ? `${openLabel}부터 구매가능` : t.usagePeriodLabel || t.usingTimeLabel || '',
            isAvailable
          }
        }),
    [parkingTickets, ticket?.couponSeq]
  )

  // ── 핸들러 ──
  const goToTicketDetail = useCallback(
    (nextCouponSeq: number) => {
      router.push(`/t/${nextCouponSeq}${carryQuery}`)
    },
    [router, carryQuery]
  )

  const goToParkinglotDetail = useCallback(
    (parkinglotSeq: number) => {
      router.push(`/p/${parkinglotSeq}${carryQuery}`)
    },
    [router, carryQuery]
  )

  /** 구매 — 웹: pay 비회원 경로, 앱: Pref 기록 후 pay 새 웹뷰 (platform 이 분기) */
  const handleClickPurchase = useCallback(() => {
    if (!ticket || purchaseButton.disabled) return

    if (purchaseButton.isAbleApp) {
      // 월정기 앱 유도 — 앱 웹뷰에서는 window.open 이 동작하지 않으므로 같은 탭 이동
      window.location.assign(`https://app.modu.kr/t/${ticket.couponSeq}`)
      return
    }

    void platform.startCheckout({ couponSeq: ticket.couponSeq, parkingDate })
  }, [ticket, purchaseButton, platform, parkingDate])

  return {
    ticket,
    isLoading,
    pin,
    showDatePicker,
    dateCells,
    selectDate,
    purchaseButton,
    anotherTickets,
    goToTicketDetail,
    goToParkinglotDetail,
    goBack,
    handleClickPurchase,
    parkingDate
  }
}

/** `purchaseOpenDateTime` → `M/d(목) HH:mm` (modu-android toPurchaseOpenDateTimeString) */
function formatPurchaseOpenDateTime(dateTime?: string | null): string | null {
  if (!dateTime) return null
  try {
    return format(parseISO(dateTime), 'M/d(EEEEE) HH:mm', { locale: ko })
  } catch {
    return null
  }
}
