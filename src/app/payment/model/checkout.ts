// 결제 순수 로직 — pay 서비스 이관 (partner flowType 한정)
// 원본: modu-webview-monorepo/apps/pay/src/features/{discount,checkout}/lib/*,
//       shared/lib/date/serverTime.ts, shared/lib/apiErrorMessage.ts (2026-09-16 확인)
import type {
  OtherPaymentType,
  PaymentBillkeyResult,
  PaymentMethodType,
  PaymentOutcome,
  PaymentRoute,
  PaymentRouteResult,
  PaymentTicketBillkeyBody,
  PaymentTicketPointBody,
  PaymentTicketWebBody,
  PgType
} from './types'

import { PAYMENT_CALLBACK_PATH } from '../routes'

/** 웹뷰 결제 플랫폼 구분값 (2026-07-24 BE 확인) */
const PLATFORM_WEB = 'web'

// ── 금액 계산 — 순서: 상품가 → 쿠폰 차감(그 값이 포인트 상한) → 포인트 차감 → 0 하한 ──

export interface PaymentAmountInput {
  productPrice: number
  couponPrice: number | null
  usedPoints: number | null
}

export interface PaymentAmount {
  /** 쿠폰 적용 후 남은 결제금액 — 충전금 사용 한도 */
  maxUsablePoints: number
  /** 최종 결제금액 — BE totalPrice 는 할인 전 원가, 승인 금액은 price 필드 */
  payableAmount: number
  couponDiscount: number
}

export function calculatePaymentAmount({ productPrice, couponPrice, usedPoints }: PaymentAmountInput): PaymentAmount {
  const couponDiscount = couponPrice ?? 0
  const maxUsablePoints = Math.max(0, productPrice - couponDiscount)
  const payableAmount = Math.max(0, maxUsablePoints - (usedPoints ?? 0))

  return { maxUsablePoints, payableAmount, couponDiscount }
}

// ── 결제 경로 판정 ──

const OTHER_PG_TYPE: Record<OtherPaymentType, PgType> = { naverpay: 'naverpay', phone: 'mobilians' }

/** 신용/체크카드는 PG 결제창을 타지 않는다(빌링키 즉시 승인) → null */
export const toPgType = (method: PaymentMethodType, other: OtherPaymentType | null): PgType | null => {
  if (method === 'tosspay') return 'tosspay'
  if (method === 'other') return other === null ? null : OTHER_PG_TYPE[other]
  return null
}

interface ResolveRouteInput {
  method: PaymentMethodType
  other: OtherPaymentType | null
  selectedBillSeq: number | null
  payableAmount: number
  carConfirmed: boolean
}

/** 순서가 곧 규칙 — 차량 재확인은 0원 분기보다 앞이다(충전금 전액 결제도 차량이 필요) */
export function resolvePaymentRoute({
  method,
  other,
  selectedBillSeq,
  payableAmount,
  carConfirmed
}: ResolveRouteInput): PaymentRouteResult {
  if (!carConfirmed) return { ok: false, reason: 'carNotConfirmed' }

  // 결제액 0원 — 결제수단을 보지 않는다
  if (payableAmount === 0) return { ok: true, route: { kind: 'point' } }

  if (method === 'card') {
    if (selectedBillSeq === null) return { ok: false, reason: 'cardRequired' }
    return { ok: true, route: { kind: 'billkey', billSeq: selectedBillSeq } }
  }

  const pgType = toPgType(method, other)
  if (pgType === null) return { ok: false, reason: 'methodRequired' }
  return { ok: true, route: { kind: 'webview', pgType } }
}

// ── 시각 계약 — 결제 요청의 시각은 전부 ISO-UTC 로 강제한다 ──

/** 조회 슬롯이 `+09:00` 오프셋으로 올 수 있어 그대로 실으면 한 요청에 두 포맷이 섞인다 */
export function toServerTime(iso: string): string | null {
  const time = new Date(iso).getTime()
  if (Number.isNaN(time)) return null
  return new Date(time).toISOString()
}

// ── body 조립 (partner) ──

export interface PartnerSelections {
  /** 최종 결제액 — payableAmount */
  price: number
  /** 상품 원가 */
  totalPrice: number
  point: number
  couponUserId?: number
  couponPrice?: number
  email?: string
  carNum?: string
  /** false 이면 서버가 결제일시를 확정한다 — 플래그 자체는 전송하지 않는다 */
  requiresEntryTime?: boolean
  predictBeginTime?: string
  predictEndTime?: string
}

export function getPaymentReturnUrl(couponSeq: number, parkingDate: string): string {
  // BE 는 returnUrl 의 hostname 만 허용목록 대조한다 — 복귀 화면이 재진입 경로를 만들 수 있게
  // 조회 키를 쿼리로 실어 보낸다 (BE 302 가 status 쿼리를 덧붙인다)
  const query = new URLSearchParams({ couponSeq: String(couponSeq), parkingDate })
  return `${window.location.origin}${PAYMENT_CALLBACK_PATH}?${query.toString()}`
}

/** @returns 필수 선택값이 비면 null — 호출부가 CTA 잠금으로 걸렀어야 한다 */
export function buildPartnerWebBody(
  couponSeq: number,
  parkingDate: string,
  s: PartnerSelections
): PaymentTicketWebBody | null {
  const { price, totalPrice, point, couponUserId, couponPrice, email, carNum } = s
  if (carNum == null) return null

  const common = {
    couponSeq,
    carNum,
    price,
    totalPrice,
    point,
    couponUserId,
    couponPrice,
    email,
    platform: PLATFORM_WEB,
    returnUrl: getPaymentReturnUrl(couponSeq, parkingDate)
  }

  // 서버가 시간 입력을 생략하도록 지정한 상품은 결제일시도 서버에서 확정한다
  if (s.requiresEntryTime === false) return common

  if (s.predictBeginTime == null || s.predictEndTime == null) return null
  const predictBeginTime = toServerTime(s.predictBeginTime)
  const predictEndTime = toServerTime(s.predictEndTime)
  if (predictBeginTime == null || predictEndTime == null) return null

  return { ...common, predictBeginTime, predictEndTime }
}

export function toBillkeyBody(body: PaymentTicketWebBody, billSeq: number): PaymentTicketBillkeyBody {
  const { platform: _platform, returnUrl: _returnUrl, ...rest } = body
  return { ...rest, billSeq }
}

export function toPointBody(body: PaymentTicketWebBody): PaymentTicketPointBody {
  const { platform: _platform, returnUrl: _returnUrl, ...rest } = body
  return rest
}

// ── 에러 메시지 — HTTP 200 + 본문 error 와 axios throw → response.data 두 경로 모두 커버 ──

interface ErrorEnvelope {
  error?: { message?: string | null } | null
}

function readEnvelope(value: unknown): string | null {
  const message = (value as ErrorEnvelope | undefined)?.error?.message
  return message ? message : null
}

function readResponseData(caught: unknown): unknown {
  return (caught as { response?: { data?: unknown } } | undefined)?.response?.data
}

/** 토스트는 서버 사유만 표출한다 — FE 자체 문구를 지어내지 않는다 */
export function toApiErrorMessage(caught: unknown): string | null {
  return readEnvelope(caught) ?? readEnvelope(readResponseData(caught))
}

// ── 응답 분류 ──

const isImmediate = (route: PaymentRoute) => route.kind === 'billkey' || route.kind === 'point'

export function classifyPaymentResponse(route: PaymentRoute, data: unknown): PaymentOutcome {
  const failure = toApiErrorMessage(data)
  if (failure) return { kind: 'rejected', message: failure }

  const result = (data as { data?: PaymentBillkeyResult & { redirectUrl?: string } } | undefined)?.data

  if (isImmediate(route)) {
    if (result?.couSeq == null && result?.parkingSeq == null) return { kind: 'uncertain' }
    return { kind: 'approved', result }
  }

  if (!result?.redirectUrl) return { kind: 'failedSilently' }
  return { kind: 'redirect', url: result.redirectUrl }
}

export function classifyPaymentError(route: PaymentRoute, caught: unknown): PaymentOutcome {
  const rejection = toApiErrorMessage(caught)
  if (rejection) return { kind: 'rejected', message: rejection }
  return isImmediate(route) ? { kind: 'uncertain' } : { kind: 'failedSilently' }
}
