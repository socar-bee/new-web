'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { requestGuestAuth } from '@/shared/lib/guestAuth'
import { readGuestSeq } from '@/shared/lib/guestSession'

import { useAuthStore } from '@/shared/stores/authStore'

import {
  cancelPayment,
  fetchMyTicketDetail,
  REFUND_REFUNDABLE_TYPE_SHARE,
  REFUND_REQUEST_TYPE_SHARE,
  requestRefund,
  shareCancelPayment,
  uploadRefundImages,
  requestUseMyTicket
} from '../model'
import { MyTicketType } from '@/shared/types/ticket'
import type { MyTicketDetail } from '@/shared/types/ticket'

import { getStatusMeta } from '@/app/(tabs)/tickets/viewmodel'
import { usePlatform } from '@/shared/platform'

export const MY_TICKET_TITLE = '내 주차권'

/**
 * 내주차권 상세 (modu-web-app /my-ticket/[id] 기준).
 * - 회원: authStore 토큰으로 즉시 조회.
 * - 비회원: 휴대폰 뒷 4자리 입력 → 게스트 토큰 발급(guestSeq) → 뒷 4자리를 guestCode 로 조회.
 *   guestSeq 는 결제 복귀(/purchase/result)가 이 브라우저에 남긴 값이다.
 */
export function useMyTicketDetailViewModel(seq: string) {
  const router = useRouter()
  const platform = usePlatform()
  const searchParams = useSearchParams()
  const type = searchParams?.get('type') ?? 'p'

  const [detail, setDetail] = useState<MyTicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needAuth, setNeedAuth] = useState(false)
  const [bulletValue, setBulletValue] = useState('')
  const [authError, setAuthError] = useState('')
  /** 비회원인데 guestSeq 도 없으면 이 브라우저에선 조회를 시작할 수 없다 */
  const [noGuestSession, setNoGuestSession] = useState(false)
  const verifyingRef = useRef(false)
  /** 조회에 성공한 인증 컨텍스트 — 취소·환불 요청에 재사용 (회원: guestCode '') */
  const authRef = useRef<{ token: string; guestCode: string } | null>(null)

  // 진입 판정 — persist 복원 이후를 봐야 하므로 마운트 후 1회
  useEffect(() => {
    const { accessToken } = useAuthStore.getState()

    if (accessToken) {
      authRef.current = { token: accessToken, guestCode: '' }
      fetchMyTicketDetail(type, seq, accessToken)
        .then(setDetail)
        .catch(() => setDetail(null))
        .finally(() => setIsLoading(false))
      return
    }

    // 비회원 — 휴대폰 뒷 4자리 인증부터
    setIsLoading(false)
    setNeedAuth(true)
    if (readGuestSeq() === null) setNoGuestSession(true)
  }, [seq, type])

  /** 뒷 4자리 입력 — 4자리가 차면 게스트 토큰 발급 후 조회 시도 */
  const onChangeBullet = useCallback(
    async (raw: string) => {
      const value = raw.replace(/\D/g, '').slice(0, 4)
      setAuthError('')
      setBulletValue(value)

      if (value.length < 4 || verifyingRef.current) return

      const guestSeq = readGuestSeq()
      if (guestSeq === null) {
        setNoGuestSession(true)
        return
      }

      verifyingRef.current = true
      try {
        const { accessToken } = await requestGuestAuth(guestSeq)
        const data = await fetchMyTicketDetail(type, seq, accessToken, value)
        authRef.current = { token: accessToken, guestCode: value }
        setDetail(data)
        setNeedAuth(false)
      } catch {
        setAuthError('휴대폰 번호가 일치하지 않습니다. 다시 입력해 주세요.')
        setBulletValue('')
      } finally {
        verifyingRef.current = false
      }
    },
    [type, seq]
  )

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back()
    else router.push('/tickets')
  }, [router])

  const openNavigation = useCallback(() => {
    if (!detail) return
    const { latitude, longitude, name } = detail.parkinglot
    window.location.href = `nmap://route/car?dlat=${latitude}&dlng=${longitude}&dname=${encodeURIComponent(name)}&appname=kr.modu.app`
  }, [detail])

  const statusMeta = detail ? getStatusMeta(detail.ticket.status) : null

  // ─── 결제취소 · 환불 (modu-web-app ticketDetail viewModel 플로우) ───

  const isShare = detail?.ticket.type === MyTicketType.SHARE

  /** 취소 모달 단계: confirm(취소 확인) → share 면 reason(사유 선택) */
  const [cancelStep, setCancelStep] = useState<'confirm' | 'reason' | null>(null)
  const [cancelReportType, setCancelReportType] = useState<number | null>(null)
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false)
  /** 결과 모달: { ok, message } — null 이면 닫힘 */
  const [cancelResult, setCancelResult] = useState<{ ok: boolean; message: string } | null>(null)
  /** 환불 신청 불가 안내 모달 */
  const [isRefundImpossibleOpen, setIsRefundImpossibleOpen] = useState(false)

  /** 환불 신청 프로세스: 0=닫힘, 1=안내, 2=사유, 3=사진 첨부 */
  const [refundStep, setRefundStep] = useState(0)
  const [refundReason, setRefundReason] = useState('')
  const [isEtcReason, setIsEtcReason] = useState(false)
  const [refundPhotos, setRefundPhotos] = useState<File[]>([])
  const [isRefundSubmitting, setIsRefundSubmitting] = useState(false)
  const [refundResult, setRefundResult] = useState<{ ok: boolean; message: string } | null>(null)

  const refetchDetail = useCallback(async () => {
    const auth = authRef.current
    if (!auth) return
    try {
      setDetail(await fetchMyTicketDetail(type, seq, auth.token, auth.guestCode || undefined))
    } catch {
      /* 재조회 실패는 무시 — 기존 화면 유지 */
    }
  }, [type, seq])

  /**
   * 하단 버튼 분기 (모웹 onClickPaymentCancel):
   * isCancelable → 취소 확인 모달 / 취소 불가 + 환불 가능(공유) → 환불 프로세스 /
   * 공유인데 환불도 불가 → 불가 안내
   */
  const onClickPaymentCancel = useCallback(() => {
    if (!detail) return
    if (detail.ticket.isCancelable) {
      setCancelStep('confirm')
      return
    }
    if (isShare) {
      if (detail.ticket.isTicketRefundable) setRefundStep(1)
      else setIsRefundImpossibleOpen(true)
    }
  }, [detail, isShare])

  /** 취소 확인 — 공유는 사유 선택으로, 제휴는 즉시 취소 요청 */
  const onConfirmCancel = useCallback(async () => {
    const auth = authRef.current
    if (!detail || !auth) return
    if (isShare) {
      setCancelStep('reason')
      return
    }
    setIsCancelSubmitting(true)
    try {
      await cancelPayment(detail.ticket.paymentSeq, auth.token, auth.guestCode)
      await refetchDetail()
      setCancelResult({ ok: true, message: '결제가 취소되었어요.' })
    } catch {
      setCancelResult({ ok: false, message: '취소에 실패했어요. 잠시 후 다시 시도해 주세요.' })
    } finally {
      setIsCancelSubmitting(false)
      setCancelStep(null)
    }
  }, [detail, isShare, refetchDetail])

  /** 공유 취소 — 선택한 사유(reportType)와 함께 요청 */
  const onSubmitShareCancel = useCallback(async () => {
    const auth = authRef.current
    if (!detail || !auth || cancelReportType === null) return
    setIsCancelSubmitting(true)
    try {
      await shareCancelPayment(detail.ticket.paymentSeq, auth.token, {
        guestCode: auth.guestCode,
        reportType: cancelReportType
      })
      await refetchDetail()
      setCancelResult({ ok: true, message: '결제가 취소되었어요.' })
    } catch {
      setCancelResult({ ok: false, message: '취소에 실패했어요. 잠시 후 다시 시도해 주세요.' })
    } finally {
      setIsCancelSubmitting(false)
      setCancelStep(null)
      setCancelReportType(null)
    }
  }, [detail, cancelReportType, refetchDetail])

  const closeCancelFlow = useCallback(() => {
    setCancelStep(null)
    setCancelReportType(null)
  }, [])

  // ── 관리자 확인(주차권 사용 처리) — 모웹 onClickConfirmEnteringCar ──

  const [isAdminConfirmOpen, setIsAdminConfirmOpen] = useState(false)
  const [isAdminUseSubmitting, setIsAdminUseSubmitting] = useState(false)

  const onConfirmAdminUse = useCallback(async () => {
    const auth = authRef.current
    if (!detail || !auth || isAdminUseSubmitting) return
    setIsAdminUseSubmitting(true)
    try {
      await requestUseMyTicket({ couSeq: detail.ticket.seq, guestCode: auth.guestCode }, auth.token)
      await refetchDetail()
      setIsAdminConfirmOpen(false)
    } catch {
      setCancelResult({ ok: false, message: '처리에 실패했어요. 잠시 후 다시 시도해 주세요.' })
    } finally {
      setIsAdminUseSubmitting(false)
    }
  }, [detail, isAdminUseSubmitting, refetchDetail])

  // ── 환불 프로세스 핸들러 ──

  const onSelectRefundReason = useCallback((value: string) => {
    if (value === 'etc') {
      setIsEtcReason(true)
      setRefundReason('')
    } else {
      setIsEtcReason(false)
      setRefundReason(value)
    }
  }, [])

  /** 사진 추가 — 최대 3장 (초과분은 잘라냄, 초과 여부 반환해 뷰에서 토스트) */
  const addRefundPhotos = useCallback(
    (files: File[]): boolean => {
      const next = [...refundPhotos, ...files]
      setRefundPhotos(next.slice(0, 3))
      return next.length > 3
    },
    [refundPhotos]
  )

  const removeRefundPhoto = useCallback((index: number) => {
    setRefundPhotos((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const closeRefundProcess = useCallback(() => {
    setRefundStep(0)
    setRefundReason('')
    setIsEtcReason(false)
    setRefundPhotos([])
  }, [])

  /** 환불 신청 제출 — 사진 업로드(있으면) → 환불 요청 → 상세 재조회 (모웹 onNextStep step 3) */
  const onSubmitRefund = useCallback(async () => {
    const auth = authRef.current
    if (!detail || !auth || isRefundSubmitting) return
    setIsRefundSubmitting(true)
    try {
      const parkingImages = refundPhotos.length
        ? await uploadRefundImages(refundPhotos, auth.token, auth.guestCode)
        : []
      await requestRefund(
        {
          requestType: REFUND_REQUEST_TYPE_SHARE,
          refundableType: REFUND_REFUNDABLE_TYPE_SHARE,
          refundableSeq: detail.ticket.seq,
          requestReason: refundReason,
          requestTemplate: detail.ticket.refundRequestTemplate,
          requestJson: { parkingImages },
          guestCode: auth.guestCode
        },
        auth.token
      )
      await refetchDetail()
      closeRefundProcess()
      setRefundResult({ ok: true, message: '환불 신청이 접수되었어요.' })
    } catch {
      setRefundResult({ ok: false, message: '환불 신청에 실패했어요. 잠시 후 다시 시도해 주세요.' })
    } finally {
      setIsRefundSubmitting(false)
    }
  }, [detail, isRefundSubmitting, refundPhotos, refundReason, refetchDetail, closeRefundProcess])

  /** 공유 연장 — pay 결제웹뷰(flowType=shareExtend)로 진입. 자체 결제 화면은 두지 않는다 */
  const startExtend = useCallback(() => {
    if (!detail?.ticket.share?.isExtendable) return
    void platform.startCheckout({ flowType: 'shareExtend', parkingSeq: detail.ticket.seq })
  }, [platform, detail])

  /** 하단 버튼 라벨 (모웹 myTicketBtnGroup) — null 이면 버튼 숨김. 불가 케이스도 클릭 시 안내 모달로 응답 */
  const paymentActionLabel =
    detail && !detail.canceledDate ? (detail.ticket.isCancelable ? '결제 취소' : isShare ? '환불 신청' : null) : null

  return {
    type,
    detail,
    statusMeta,
    isLoading,
    needAuth,
    noGuestSession,
    bulletValue,
    authError,
    onChangeBullet,
    goBack,
    openNavigation,
    // 결제취소
    isShare,
    paymentActionLabel,
    cancelStep,
    cancelReportType,
    setCancelReportType,
    isCancelSubmitting,
    cancelResult,
    setCancelResult,
    isRefundImpossibleOpen,
    setIsRefundImpossibleOpen,
    isAdminConfirmOpen,
    setIsAdminConfirmOpen,
    isAdminUseSubmitting,
    onConfirmAdminUse,
    startExtend,
    onClickPaymentCancel,
    onConfirmCancel,
    onSubmitShareCancel,
    closeCancelFlow,
    // 환불
    refundStep,
    setRefundStep,
    refundReason,
    setRefundReason,
    isEtcReason,
    refundPhotos,
    isRefundSubmitting,
    refundResult,
    setRefundResult,
    onSelectRefundReason,
    addRefundPhotos,
    removeRefundPhoto,
    closeRefundProcess,
    onSubmitRefund
  }
}
