// 주차권 결제 — pay 서비스 계약 이관 (partner flowType 한정)
// 원본: modu-webview-monorepo/apps/pay/src/shared/api/{paymentExecution,paymentConfig,predictTime}/types.ts (2026-09-16 확인)

/**
 * PG 결제수단 식별자 (경로 변수) — OAS 고정 enum.
 * 서버 매핑: naverpay→NAVERPAY, mobilians→MOBILIANS, nicepay→NICEPAY, tosspay→TOSSPAY.
 */
export const PG_TYPES = ['naverpay', 'mobilians', 'nicepay', 'tosspay'] as const
export type PgType = (typeof PG_TYPES)[number]

/** 화면의 결제수단 선택 상태 */
export type PaymentMethodType = 'tosspay' | 'card' | 'other'
export type OtherPaymentType = 'naverpay' | 'phone'

// ── 결제 실행 body — 일반(시간제) ticket variant (partner·period) ──

export interface PaymentTicketWebBody {
  couponSeq: number
  /** 최종 결제액(원) — 쿠폰·충전금을 뺀 실제 승인 금액 */
  price: number
  /** 상품 원가(원) — 할인 전 금액. price 와 바꿔 넣으면 원가로 승인된다 */
  totalPrice: number
  point: number
  carNum: string
  /** ISO 날짜시각(UTC). partner 상세의 requiresEntryTime=false 인 상품만 두 필드를 생략한다 */
  predictBeginTime?: string
  predictEndTime?: string
  predictExitBeginTime?: string
  predictExitEndTime?: string
  couponUserId?: number
  couponPrice?: number
  email?: string
  /** 결제 플랫폼 구분값 — 웹뷰는 "web" 고정 (필수) */
  platform: string
  /** PG 결제 후 BE 가 302 로 돌려보낼 웹뷰 URL */
  returnUrl?: string
}

/** 등록카드(빌링키) 결제 — PG 결제창 전용 필드 제거 + billSeq */
export type PaymentTicketBillkeyBody = Omit<PaymentTicketWebBody, 'platform' | 'returnUrl'> & { billSeq: number }

/** 충전금 전액(0원) 결제 */
export type PaymentTicketPointBody = Omit<PaymentTicketWebBody, 'platform' | 'returnUrl'>

export interface PaymentWebResult {
  /** PG 결제 페이지 URL — 이 URL 을 로드한다 */
  redirectUrl: string
  /** 현재 미소비 — BE 가 returnUrl 302 에 `?status=` 를 실어 주는 방식으로 대체됨 */
  successUrl: string
}

/**
 * 즉시 승인 결제 응답 — 등록카드·충전금 전액 공통.
 * 제휴는 couSeq, 공유는 parkingSeq (권종별로 한쪽만 채워진다).
 */
export interface PaymentBillkeyResult {
  couSeq?: number
  parkingSeq?: number
}

// ── GET /user/payment-config — 카드·쿠폰·차량·포인트·최근수단 통합 조회 ──

/** 등록 결제카드 (GET /user/card 의 cardBills 와 동일 스키마) */
export interface PaymentCard {
  billSeq: number
  cardCode: string
  cardName: string
  createdAt: string
  nickName: string | null
  cardNum: string | null
  isCorp: boolean
  isTested: boolean
  hasAutoBilling: boolean
}

export type CouponPricingType = 'STATIC' | 'RATIO'

export interface PaymentCoupon {
  couponUserId: number
  name: string
  pricingType: CouponPricingType
  usageStartAt: string
  usageEndAt: string
  /** 요청한 주차장·금액 기준 실제 할인 금액(원). 계산 불가 시 null — 선택 불가 처리 */
  couponPrice: number | null
}

export interface PaymentCar {
  carSeq: number
  carNum: string
  comment: string | null
  isDefault: boolean
  isAgreeAutopay: boolean
  isAgreeEnterCarAlarm: boolean
}

export interface PointExpireScheduledAmount {
  desc: string
  amount: number
  expiredAt: string
}

export interface PaymentPoint {
  generalAmount: number
  voucherAmount: number
  expireScheduledAmounts: PointExpireScheduledAmount[]
  totalAmount: number
  isExistHistory: boolean
}

export type RecentPaymentType =
  | 'CELLPHONE'
  | 'MOBILIANS'
  | 'BILL'
  | 'CARD'
  | 'ARS'
  | 'NAVERPAY'
  | 'CITYPASS'
  | 'NAVERBOOKING'
  | 'KICC'
  | 'TOSSPAY'
  | (string & {})

export interface RecentPaymentMethod {
  method: RecentPaymentType
  billSeq: number | null
  paymentDate: string
}

export interface PaymentConfig {
  cards: PaymentCard[]
  coupons: PaymentCoupon[]
  cars: PaymentCar[]
  point: PaymentPoint
  recentPaymentMethod: RecentPaymentMethod | null
  /** 최근 사용한 현금영수증 이메일 — 진입 시 프리필 */
  recentReceiptEmail: string | null
}

/** 쿠폰 산정 파라미터 — price 와 parkinglotSeq 는 쌍이다. 하나만 보내면 400 */
export interface PaymentConfigParams {
  price: number
  parkinglotSeq: number
}

// ── GET /ticket/{couponSeq}/daily-able-time — partner 입차 예정시간 슬롯 ──

export interface DailyAbleTime {
  /** 표시 라벨 (예: "10:00 ~ 10:30") — 클라이언트가 조립하지 않는다 */
  title: string
  /** 입차 시작 예정 시각 — ISO-8601. 결제 body 에는 toServerTime 을 거쳐 싣는다 */
  predictBeginTime: string
  predictEndTime: string
}

// ── 결제 경로 판정 ──

export type PaymentRoute =
  | { kind: 'webview'; pgType: PgType }
  | { kind: 'billkey'; billSeq: number }
  | { kind: 'point' }

export type PaymentBlockReason = 'cardRequired' | 'methodRequired' | 'receiptEmailRequired' | 'carNotConfirmed'

export type PaymentRouteResult = { ok: true; route: PaymentRoute } | { ok: false; reason: PaymentBlockReason }

/**
 * 결제 응답 분류 — 재시도 안전성이 갈린다.
 * uncertain·approved 뒤 재시도는 두 번째 결제가 되므로 CTA 잠금을 유지해야 한다.
 */
export type PaymentOutcome =
  | { kind: 'rejected'; message: string }
  | { kind: 'uncertain' }
  | { kind: 'approved'; result: PaymentBillkeyResult }
  | { kind: 'redirect'; url: string }
  | { kind: 'failedSilently' }
