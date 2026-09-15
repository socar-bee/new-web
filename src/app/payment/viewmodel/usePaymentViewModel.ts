'use client'

import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { resolveParkingDate } from '@/shared/lib/date'

import type { OtherPaymentType, PaymentMethodType, PaymentOutcome, PaymentRoute } from '../model'
import { useAuthStore } from '@/shared/stores/authStore'

import {
  buildPartnerWebBody,
  calculatePaymentAmount,
  classifyPaymentError,
  classifyPaymentResponse,
  executeBillkeyPayment,
  executePointPayment,
  executeWebviewPayment,
  resolvePaymentRoute,
  takePaymentError,
  toBillkeyBody,
  toPointBody,
  usePaymentConfig,
  useDailyAbleTimes
} from '../model'
import { PAYMENT_CALLBACK_PATH } from '../routes'

import { useTicketDetail } from '@/app/t/[id]/model'
import { APP_DEEPLINK, openAppScheme, usePlatform } from '@/shared/platform'

export const PAYMENT_TITLE = '이용권 결제'

/** 재시도가 두 번째 결제가 되는 응답 유실 — CTA 잠금을 유지한다 (pay UNCERTAIN_RESULT_MESSAGE) */
const UNCERTAIN_RESULT_MESSAGE = '결제 결과를 확인하지 못했어요. 결제 내역을 확인한 뒤 다시 시도해 주세요.'

/** 클라이언트 판정 차단 토스트 — FE 자체 문구는 여기와 UNCERTAIN 뿐, 나머지는 서버 사유만 표출 */
const BLOCK_TOAST = {
  cardRequired: '결제할 카드를 선택해주세요',
  methodRequired: '결제 수단을 선택해주세요',
  receiptEmailRequired: '현금영수증을 받을 이메일을 입력해주세요'
} as const

type PaymentStatus = 'idle' | 'paying' | 'error'

export function usePaymentViewModel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = usePlatform()
  const accessToken = useAuthStore((s) => s.accessToken)

  // ── 진입값 — 조회 키만. couponSeq 는 채울 값이 없어 없으면 무효다 (pay getEntryParams 규칙)
  const couponSeq = toPositiveInt(searchParams?.get('couponSeq'))
  const parkingDate = resolveParkingDate(searchParams?.get('parkingDate'))
  const isInvalidEntry = couponSeq == null

  /** 앱은 브릿지 인터셉터가 인증을 붙인다. 웹은 authStore 토큰 — 없으면 로그인 유도 */
  const isApp = platform.kind === 'app'
  const authorized = isApp || !!accessToken
  const webToken = isApp ? null : accessToken

  // ── 상세 조회 — 금액·상품명·requiresEntryTime 의 원본
  const { data: ticket, isLoading: isTicketLoading } = useTicketDetail(couponSeq, parkingDate)
  const requiresEntryTime = ticket ? ticket.requiresEntryTime !== false : true
  const parkinglotSeq = ticket?.parkinglot?.parkinglotSeq

  // ── 뒤로가기 + 네이티브 상단바
  const goBack = useCallback(() => {
    platform.back(couponSeq ? `/t/${couponSeq}?parkingDate=${parkingDate}` : '/')
  }, [platform, couponSeq, parkingDate])

  platform.useTopBar({ title: PAYMENT_TITLE, onBack: goBack })

  // ── 통합 조회 — price+parkinglotSeq 쌍이 완성된 뒤에만 (하나만 보내면 400)
  const configParams = useMemo(
    () => (ticket && parkinglotSeq != null && ticket.price >= 1 ? { price: ticket.price, parkinglotSeq } : null),
    [ticket, parkinglotSeq]
  )
  const {
    data: config,
    isLoading: isConfigLoading,
    refetch: refetchConfig
  } = usePaymentConfig(configParams, {
    accessToken: webToken,
    authorized
  })

  // ── 입차 예정시간 슬롯 (requiresEntryTime 상품만)
  const { data: slots = [] } = useDailyAbleTimes(couponSeq, parkingDate, {
    accessToken: webToken,
    authorized,
    enabled: ticket != null && requiresEntryTime
  })

  // ── 선택 상태 — 목록에서 고르는 값은 식별자만 든다 (사라진 항목이 자연히 무시되게)
  const [selectedSlotBegin, setSelectedSlotBegin] = useState<string | null>(null)
  const [selectedCarSeq, setSelectedCarSeq] = useState<number | null>(null)
  const [selectedCouponUserId, setSelectedCouponUserId] = useState<number | null>(null)
  const [usedPoints, setUsedPoints] = useState<number | null>(null)
  const [method, setMethod] = useState<PaymentMethodType>('tosspay')
  const [otherMethod, setOtherMethod] = useState<OtherPaymentType | null>(null)
  const [selectedBillSeq, setSelectedBillSeq] = useState<number | null>(null)
  const [receiptChecked, setReceiptChecked] = useState(false)
  const [receiptEmail, setReceiptEmail] = useState('')
  const [isPriceOpen, setIsPriceOpen] = useState(true)
  const [isCarConfirmOpen, setIsCarConfirmOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // ── 결제 상태기계 — uncertain·approved·redirect 는 일부러 'paying' 유지 (더블탭 = 2차 결제)
  const [status, setStatus] = useState<PaymentStatus>('idle')

  // ── 프리셀렉트 — 최초 1회만. 이후 재조회(onResume)가 사용자 선택을 덮지 않는다
  const prefilled = useRef(false)
  useEffect(() => {
    if (!config || prefilled.current) return
    prefilled.current = true

    const recent = config.recentPaymentMethod?.method
    if (recent === 'CARD' || recent === 'BILL') {
      setMethod('card')
      setSelectedBillSeq(config.recentPaymentMethod?.billSeq ?? null)
    } else if (recent === 'NAVERPAY') {
      setMethod('other')
      setOtherMethod('naverpay')
    } else if (recent === 'CELLPHONE' || recent === 'MOBILIANS') {
      setMethod('other')
      setOtherMethod('phone')
    } else if (recent === 'TOSSPAY') {
      setMethod('tosspay')
    }

    if (config.recentReceiptEmail) setReceiptEmail(config.recentReceiptEmail)

    const defaultCar = config.cars.find((car) => car.isDefault) ?? config.cars[0]
    if (defaultCar) setSelectedCarSeq(defaultCar.carSeq)
  }, [config])

  // ── 불변식 — 재조회로 목록에서 사라진 항목은 즉시 비운다 (죽은 seq 가 body 로 나가면 안 된다)
  useEffect(() => {
    if (!config) return
    setSelectedBillSeq((prev) => (prev != null && !config.cards.some((c) => c.billSeq === prev) ? null : prev))
    setSelectedCouponUserId((prev) =>
      prev != null && !config.coupons.some((c) => c.couponUserId === prev) ? null : prev
    )
    setSelectedCarSeq((prev) => (prev != null && !config.cars.some((c) => c.carSeq === prev) ? null : prev))
  }, [config])

  // 카드 결제인데 카드 미선택이면 첫 카드를 채운다
  useEffect(() => {
    if (method !== 'card' || !config?.cards.length) return
    setSelectedBillSeq((prev) => prev ?? config.cards[0].billSeq)
  }, [method, config])

  // 카드 등록 복귀 — 직전 조회에 없던 새 카드를 자동 선택
  const prevCardSeqs = useRef<Set<number> | null>(null)
  useEffect(() => {
    if (!config) return
    const current = new Set(config.cards.map((c) => c.billSeq))
    const prev = prevCardSeqs.current
    prevCardSeqs.current = current
    if (!prev) return
    const added = config.cards.find((c) => !prev.has(c.billSeq))
    if (added) {
      setMethod('card')
      setSelectedBillSeq(added.billSeq)
    }
  }, [config])

  // ── 파생 선택 모델
  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.predictBeginTime === selectedSlotBegin) ?? null,
    [slots, selectedSlotBegin]
  )
  const selectedCar = useMemo(
    () => config?.cars.find((car) => car.carSeq === selectedCarSeq) ?? null,
    [config, selectedCarSeq]
  )
  const selectedCoupon = useMemo(
    () => config?.coupons.find((coupon) => coupon.couponUserId === selectedCouponUserId) ?? null,
    [config, selectedCouponUserId]
  )

  /** couponPrice=null 쿠폰은 선택 불가 — 살리면 할인 0원 + couponUserId 가 나가 쿠폰만 소진된다 */
  const selectCoupon = useCallback(
    (couponUserId: number | null) => {
      if (couponUserId == null) {
        setSelectedCouponUserId(null)
        return
      }
      const coupon = config?.coupons.find((c) => c.couponUserId === couponUserId)
      if (coupon?.couponPrice == null) return
      setSelectedCouponUserId(couponUserId)
    },
    [config]
  )

  // ── 금액 — 상품가 → 쿠폰 차감(그 값이 포인트 상한) → 포인트 차감 → 0 하한
  const pointBalance = config?.point.totalAmount ?? 0
  const amounts = useMemo(
    () =>
      calculatePaymentAmount({
        productPrice: ticket?.price ?? 0,
        couponPrice: selectedCoupon?.couponPrice ?? null,
        usedPoints
      }),
    [ticket?.price, selectedCoupon, usedPoints]
  )
  const usableCap = Math.min(pointBalance, amounts.maxUsablePoints)

  // 쿠폰 변경 등으로 상한이 줄면 사용액을 클램프
  const priceConfirmed = ticket != null
  useEffect(() => {
    if (!config || !priceConfirmed) return
    setUsedPoints((prev) => (prev != null && prev > usableCap ? (usableCap > 0 ? usableCap : null) : prev))
  }, [config, priceConfirmed, usableCap])

  const changePoint = useCallback(
    (value: number) => setUsedPoints(Math.max(0, Math.min(value, usableCap)) || null),
    [usableCap]
  )
  const useAllPoint = useCallback(() => setUsedPoints(usableCap > 0 ? usableCap : null), [usableCap])

  // ── PG 실패 복귀 토스트 (sessionStorage 1회 소비)
  useEffect(() => {
    const message = takePaymentError()
    if (message) setToast(message)
  }, [])

  // ── PG 왕복 복귀(bfcache)·앱 복귀 — 잠금 해제 + 재조회 (카드 등록 복귀 대응)
  useEffect(
    () =>
      platform.onReturn(() => {
        setStatus('idle')
        if (authorized && configParams) void refetchConfig()
      }),
    [platform, authorized, configParams, refetchConfig]
  )

  // ── 등록 이동 — 앱 딥링크 (웹뷰 위에 쌓이고 복귀 시 재조회), 웹은 앱 안내
  const goRegisterCard = useCallback(() => {
    if (isApp) openAppScheme(APP_DEEPLINK.registerCard)
    else setToast('카드 등록은 모두의주차장 앱에서 할 수 있어요')
  }, [isApp])
  const goRegisterCar = useCallback(() => {
    if (isApp) openAppScheme(APP_DEEPLINK.registerCar)
    else setToast('차량 등록은 모두의주차장 앱에서 할 수 있어요')
  }, [isApp])

  // ── CTA 게이트 — 시간(정책상 필요할 때)·차량이 채워져야 열린다
  const requiredFilled = (!requiresEntryTime || selectedSlot != null) && selectedCar != null
  const isPaying = status === 'paying'
  const canPay = !isInvalidEntry && priceConfirmed && requiredFilled && !isPaying

  // ── 결제 실행
  const executeByRoute = useCallback(
    async (route: PaymentRoute) => {
      if (!ticket || couponSeq == null) return

      const body = buildPartnerWebBody(couponSeq, parkingDate, {
        price: amounts.payableAmount,
        totalPrice: ticket.price,
        point: usedPoints ?? 0,
        couponUserId: selectedCoupon?.couponUserId,
        couponPrice: selectedCoupon?.couponPrice ?? undefined,
        email: receiptChecked ? receiptEmail || undefined : undefined,
        carNum: selectedCar?.carNum,
        requiresEntryTime,
        predictBeginTime: selectedSlot?.predictBeginTime,
        predictEndTime: selectedSlot?.predictEndTime
      })
      if (!body) return

      setStatus('paying')

      let outcome: PaymentOutcome
      try {
        const response =
          route.kind === 'billkey'
            ? await executeBillkeyPayment(toBillkeyBody(body, route.billSeq), webToken)
            : route.kind === 'point'
              ? await executePointPayment(toPointBody(body), webToken)
              : await executeWebviewPayment(route.pgType, body, webToken)
        outcome = classifyPaymentResponse(route, response)
      } catch (caught) {
        outcome = classifyPaymentError(route, caught)
      }

      switch (outcome.kind) {
        case 'rejected':
          setStatus('error')
          setToast(outcome.message)
          return
        case 'uncertain':
          // 승인 여부 불명 — 재시도가 두 번째 결제가 되므로 잠금 유지
          setToast(UNCERTAIN_RESULT_MESSAGE)
          return
        case 'approved': {
          // 즉시 승인도 /payment/callback 으로 합류 — 완료 처리 지점을 한 곳으로
          const query = new URLSearchParams({ status: 'success', couponSeq: String(couponSeq), parkingDate })
          if (outcome.result.couSeq != null) query.set('couSeq', String(outcome.result.couSeq))
          router.replace(`${PAYMENT_CALLBACK_PATH}?${query.toString()}`)
          return
        }
        case 'redirect':
          window.location.href = outcome.url
          return
        case 'failedSilently':
          // 서버 사유 없는 실패 — 재시도 안전, 토스트 없이 CTA 재개방
          setStatus('error')
          return
      }
    },
    [
      ticket,
      couponSeq,
      parkingDate,
      amounts.payableAmount,
      usedPoints,
      selectedCoupon,
      receiptChecked,
      receiptEmail,
      selectedCar,
      requiresEntryTime,
      selectedSlot,
      webToken,
      router
    ]
  )

  /** 결제하기 — 영수증 가드 → 경로 판정 → 차량 확인(1회 되묻기) → 실행 */
  const handlePay = useCallback(
    (carConfirmed = false) => {
      if (!canPay) return

      if (receiptChecked && !receiptEmail) {
        setToast(BLOCK_TOAST.receiptEmailRequired)
        return
      }

      const result = resolvePaymentRoute({
        method,
        other: otherMethod,
        selectedBillSeq,
        payableAmount: amounts.payableAmount,
        carConfirmed
      })

      if (!result.ok) {
        if (result.reason === 'carNotConfirmed') {
          setIsCarConfirmOpen(true)
          return
        }
        setToast(BLOCK_TOAST[result.reason])
        return
      }

      void executeByRoute(result.route)
    },
    [canPay, receiptChecked, receiptEmail, method, otherMethod, selectedBillSeq, amounts.payableAmount, executeByRoute]
  )

  const confirmCarAndPay = useCallback(() => {
    setIsCarConfirmOpen(false)
    handlePay(true)
  }, [handlePay])

  /** 이용일 라벨 — `2026.09.16 (수)` */
  const parkingDateLabel = useMemo(() => {
    try {
      return format(parseISO(parkingDate), 'yyyy.MM.dd (EEE)', { locale: ko })
    } catch {
      return parkingDate
    }
  }, [parkingDate])

  return {
    isInvalidEntry,
    needsLogin: !authorized,
    requestLogin: platform.requestLogin,
    isLoading: isTicketLoading || (authorized && configParams != null && isConfigLoading),
    ticket,
    parkingDateLabel,
    requiresEntryTime,
    slots,
    selectedSlot,
    selectSlot: setSelectedSlotBegin,
    cars: config?.cars ?? [],
    selectedCar,
    selectCar: setSelectedCarSeq,
    goRegisterCar,
    coupons: config?.coupons ?? [],
    selectedCoupon,
    selectCoupon,
    pointBalance,
    usedPoints: usedPoints ?? 0,
    usableCap,
    changePoint,
    useAllPoint,
    amounts,
    cards: config?.cards ?? [],
    selectedBillSeq,
    selectCard: setSelectedBillSeq,
    goRegisterCard,
    method,
    otherMethod,
    setMethod,
    setOtherMethod,
    receiptChecked,
    toggleReceipt: () => setReceiptChecked((v) => !v),
    receiptEmail,
    setReceiptEmail,
    isPriceOpen,
    togglePriceOpen: () => setIsPriceOpen((v) => !v),
    isCarConfirmOpen,
    closeCarConfirm: () => setIsCarConfirmOpen(false),
    confirmCarAndPay,
    isPaying,
    canPay,
    toast,
    dismissToast: () => setToast(null),
    goBack,
    handlePay
  }
}

function toPositiveInt(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
