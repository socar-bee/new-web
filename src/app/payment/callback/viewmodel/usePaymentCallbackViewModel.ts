'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { savePaymentError } from '@/app/payment/model'
import { paymentEntryUrl } from '@/app/payment/routes'
import {
  closeWebview,
  readPlatformKind,
  savePaymentResult,
  toPaymentResultPayload,
  usePlatformContext
} from '@/shared/platform'

/**
 * PG 결제 콜백 — BE 가 returnUrl 로 302 하는 합류 지점 (즉시 승인도 여기로 온다).
 * 원본: pay `pages/callback/ui/CallbackPage.tsx` + `shared/lib/session/paymentCallback.ts`
 *
 * 성공  ?status=success&couSeq=456 (+ 우리가 returnUrl 에 실어 둔 couponSeq·parkingDate)
 * 실패  ?status=failed&errorCode=..&errorMsg=...
 * 취소  ?status=canceled
 */
export function usePaymentCallbackViewModel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { bridge } = usePlatformContext()

  // 재진입 1회 제한 — 브릿지가 Provider effect 에서 설치돼 첫 렌더엔 null 이다
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current || !searchParams) return

    const status = searchParams.get('status')
    const couSeq = toSeq(searchParams.get('couSeq'))
    const parkingSeq = toSeq(searchParams.get('parkingSeq'))
    const errorMsg = searchParams.get('errorMsg')
    const couponSeq = toSeq(searchParams.get('couponSeq'))
    const parkingDate = searchParams.get('parkingDate') ?? ''

    // 환경 판정은 context kind 가 아니라 인라인 스크립트가 단 data-platform 을 직접 읽는다 —
    // 마운트 직후 context 는 아직 'web' 일 수 있다
    const isApp = readPlatformKind() === 'app'
    const payload = toPaymentResultPayload({ couSeq, parkingSeq })
    const backToPayment = () => router.replace(couponSeq ? paymentEntryUrl(couponSeq, parkingDate) : '/')

    // 앱 성공 처리는 브릿지가 필요하다 — 설치를 기다린다 (Provider 가 이 라우트에서 설치)
    if (isApp && status === 'success' && payload && !bridge) return

    handled.current = true
    // 결제 식별자가 히스토리에 남지 않게 지운다
    window.history.replaceState(null, '', pathname)

    if (status === 'canceled') {
      // 선택값은 그 자리 유지 — 결제 화면에서 재시도
      backToPayment()
      return
    }

    if (status === 'success' && payload) {
      if (isApp) {
        // 성공만 Pref 기록 — 네이티브가 읽고 결과 화면을 띄운 뒤 지운다
        void savePaymentResult(bridge!, payload).finally(() => closeWebview())
        return
      }
      const query = new URLSearchParams({ type: payload.type, seq: String(payload.seq) })
      if (couponSeq) query.set('couponSeq', String(couponSeq))
      if (parkingDate) query.set('parkingDate', parkingDate)
      router.replace(`/purchase/result?${query.toString()}`)
      return
    }

    // failed — status=success 인데 식별자가 없는 경우도 실패로 본다
    savePaymentError(errorMsg ?? '결제를 완료하지 못했어요. 다시 시도해주세요.')
    backToPayment()
  }, [searchParams, bridge, router, pathname])
}

function toSeq(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
