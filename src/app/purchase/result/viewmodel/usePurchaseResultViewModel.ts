'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useFavorites } from '@/shared/hooks/useFavorites'

import { requestGuestAuth } from '@/shared/lib/guestAuth'
import { saveGuestSeq } from '@/shared/lib/guestSession'

import { useAuthStore } from '@/shared/stores/authStore'

import type { MyTicketDetail } from '@/shared/types/ticket'

import { fetchMyTicketDetail } from '@/app/my-ticket/[seq]/model'
import { usePlatform } from '@/shared/platform'

/** 완료 화면 상세 행 — 권종마다 구성만 달라진다 (modu-android TicketPaymentCompleteScreen) */
export interface PurchaseResultRow {
  label: string
  value: string
}

export const PURCHASE_RESULT_TITLE = '결제 결과'

/**
 * pay 비회원(guest-pay) 결제 복귀 화면 — pay `/guest/callback` 이 이 라우트로 돌려보낸다.
 *
 * 반환 계약 (pay milestone/guest-pay GuestCallbackPage, 2026-09-16 확인):
 * - 성공: `?result=success&type=p&parkingSeq={couSeq}&guestCode=..&guestSeq=..`
 *   (제휴 주차권인데 파라미터 이름이 parkingSeq 다 — 구매건 seq(couSeq)가 실린다)
 * - 실패/취소: `?result=fail&type=p&couponSeq=..&guestSeq=..` (pay 게스트 세션은 유지 — 재시도 가능)
 *
 * 앱 결제 결과는 네이티브가 그린다 — 이 화면은 웹 복귀 전용이고,
 * `payment/PaymentResult` Pref 는 절대 읽지 않는다 (네이티브가 읽고 지우는 값).
 */
export function usePurchaseResultViewModel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = usePlatform()

  const { toggle: toggleFavorite, favorites } = useFavorites()

  const result = searchParams?.get('result')
  const isFail = result === 'fail'
  /** 내주차권 조회 경로 구분 — 제휴·단기권 `p`, 공유 `s` (pay 가 실어 보낸다) */
  const ticketType = searchParams?.get('type') ?? 'p'

  const [detail, setDetail] = useState<MyTicketDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(true)

  /** 성공 시 구매건 seq (couSeq) — type='p' 제휴 기준 */
  const purchasedSeq = searchParams?.get('parkingSeq')
  /** 실패 시 재시도 키 */
  const couponSeq = searchParams?.get('couponSeq')
  const parkingDate = searchParams?.get('parkingDate')
  /** 권종 — 상세 라우트가 권종마다 다르다. 없으면 제휴로 본다 (pay 가 flowType 을 싣기 전 링크) */
  const flowType = searchParams?.get('flowType')
  const sDate = searchParams?.get('sDate')
  const eDate = searchParams?.get('eDate')
  /** 게스트 구매내역 조회 키 — 내 주차권(guestCode 조회) 연동 시 사용 (1차 미사용) */
  const guestCode = searchParams?.get('guestCode')
  const guestSeq = searchParams?.get('guestSeq')

  // 비회원 구매 세션 보관 — 이후 내주차권 비회원 조회(POST /user/login/guest)의 키
  useEffect(() => {
    if (!isFail && guestSeq) saveGuestSeq(guestSeq)
  }, [isFail, guestSeq])

  /**
   * 주소에서 비회원 조회 키를 지운다 — `guestCode` 는 휴대폰 뒷 4자리이고 `guestSeq` 는 채널 코드다.
   * 값은 이미 이 화면이 들고 있어(아래 조회에 쓴다) 주소에 남을 이유가 없는데,
   * 남겨두면 히스토리·공유 링크와 외부 리소스 Referer 로 새어 나간다.
   *
   * `replaceState` 는 Next 라우터에 알리지 않으므로 이미 읽어 둔 `searchParams` 값은 그대로 유지된다.
   */
  useEffect(() => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('guestCode') && !url.searchParams.has('guestSeq')) return

    url.searchParams.delete('guestCode')
    url.searchParams.delete('guestSeq')
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  }, [])

  /**
   * 구매한 주차권 상세 — 완료 화면의 주차장·상품·차량번호 행이 전부 여기서 온다
   * (modu-android 는 결제 응답을 그대로 그리지만, 웹은 pay 가 조회 키만 돌려주므로 한 번 더 조회한다).
   *
   * 회원은 보유 토큰으로, 비회원은 복귀 URL 이 실어 준 `guestSeq`·`guestCode` 로 게스트 토큰을 받아 조회한다.
   * 실패하면 행 없이 완료 문구만 그린다 — 결제는 이미 끝났고 여기서 되돌릴 것이 없다.
   */
  useEffect(() => {
    if (isFail || !purchasedSeq) {
      setIsDetailLoading(false)
      return
    }

    let alive = true

    const load = async (): Promise<MyTicketDetail | null> => {
      const { accessToken } = useAuthStore.getState()
      if (accessToken) return await fetchMyTicketDetail(ticketType, purchasedSeq, accessToken)

      if (!guestSeq || !guestCode) return null
      const guest = await requestGuestAuth(Number(guestSeq))
      return await fetchMyTicketDetail(ticketType, purchasedSeq, guest.accessToken, guestCode)
    }

    load()
      .catch((error: unknown) => {
        console.error('구매 주차권 조회 실패:', error)
        return null
      })
      .then((loaded) => {
        if (!alive) return
        setDetail(loaded)
        setIsDetailLoading(false)
      })

    return () => {
      alive = false
    }
  }, [isFail, purchasedSeq, ticketType, guestSeq, guestCode])

  /**
   * 상세 행 — 권종별로 **구성만** 달라진다 (android 와 같은 순서: 상품명 → 이용시간 → 차량번호).
   * 값이 없는 행은 그리지 않는다 — 권종마다 서버가 채우는 필드가 다르다.
   */
  const rows = useMemo<PurchaseResultRow[]>(() => {
    if (!detail) return []

    const { ticket } = detail
    const list: PurchaseResultRow[] = []

    if (ticket.ticketName) list.push({ label: '상품명', value: ticket.ticketName })
    if (ticket.usageDate) list.push({ label: '이용일', value: ticket.usageDate })
    if (ticket.usageTime) list.push({ label: '이용시간', value: ticket.usageTime })
    // 공유주차권은 종료 시각이 별도 필드다 (modu-web-app MyTicketDetailModel.share)
    if (ticket.share?.endTime) list.push({ label: '종료시간', value: ticket.share.endTime })
    if (ticket.carNum) list.push({ label: '차량번호', value: ticket.carNum })

    return list
  }, [detail])

  const parkinglot = detail?.parkinglot ?? null
  const isFavorite = parkinglot ? favorites.some((favorite) => favorite.seq === parkinglot.seq) : false

  /** 즐겨찾기 토글 — android 완료 화면의 주차장명 옆 북마크와 같은 자리 */
  const onToggleFavorite = useCallback(() => {
    if (!parkinglot) return
    toggleFavorite({ seq: parkinglot.seq, name: parkinglot.name, areaLabel: parkinglot.address })
  }, [parkinglot, toggleFavorite])

  const goHome = useCallback(() => {
    platform.back('/')
  }, [platform])

  platform.useTopBar({ title: PURCHASE_RESULT_TITLE, onBack: goHome })

  /** 권종별 상세 경로 — 단기권·공항은 `/airport/ticket`, 그 외는 제휴 `/t` */
  const ticketDetailPath = useCallback(() => {
    if (!couponSeq) return null
    if (flowType === 'period') {
      // 공항 상세는 입·출차 일시가 없으면 가격을 조회하지 못한다 — pay 가 되돌려 준 값을 그대로 잇는다
      if (!sDate || !eDate) return `/airport/ticket/${couponSeq}`
      const query = new URLSearchParams({ sDate, eDate })
      return `/airport/ticket/${couponSeq}?${query.toString()}`
    }

    return `/t/${couponSeq}${parkingDate ? `?parkingDate=${parkingDate}` : ''}`
  }, [couponSeq, flowType, sDate, eDate, parkingDate])

  /** 실패 재시도 — 주차권 상세로 (pay 게스트 세션이 유지돼 바로 다시 결제 진입 가능) */
  const goRetry = useCallback(() => {
    const path = ticketDetailPath()
    if (!path) {
      platform.back('/')
      return
    }
    router.replace(path)
  }, [router, platform, ticketDetailPath])

  const goTicketDetail = useCallback(() => {
    const path = ticketDetailPath()
    if (!path) return
    router.push(path)
  }, [router, ticketDetailPath])

  /** 구매한 내주차권 상세로 — parkingSeq(구매건 seq)가 my-ticket 경로 변수다 */
  const goMyTicket = useCallback(() => {
    if (!purchasedSeq) return
    // 권종은 pay 가 실어 보낸 값을 그대로 잇는다 — 공유는 `s`, 제휴·단기권은 `p` 로 조회 경로가 갈린다
    router.push(`/my-ticket/${purchasedSeq}?type=${ticketType}`)
  }, [router, purchasedSeq, ticketType])

  return {
    isFail,
    isDetailLoading,
    parkinglotName: parkinglot?.name ?? '',
    isFavorite,
    onToggleFavorite,
    rows,
    purchasedSeq,
    couponSeq,
    guestCode,
    guestSeq,
    goHome,
    goRetry,
    goTicketDetail,
    goMyTicket
  }
}
