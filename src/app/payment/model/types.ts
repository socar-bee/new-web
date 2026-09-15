// 주차권 결제 — 도메인 타입 (안드로이드 PaymentRequestPayload / PaymentType 대응)
// 원본: payment-webview 브랜치 src/types/payment.ts (2026-09-16 이관)

/** 결제수단 (안드로이드 PaymentType.code 대응) */
export const PAYMENT_METHOD = {
  /** 카드(빌링키) */
  CREDIT_CARD: 200,
  /** 휴대폰 결제(모빌리언스) */
  PHONE: 300,
  /** 네이버페이 */
  NAVER_PAY: 400,
  /** 포인트(결제금액 0) */
  POINT: 0
} as const
export type PaymentMethodCode = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]

/** 화면의 결제수단 선택 상태 */
export type PayMethod = 'card' | 'naverpay' | 'phone'

/** PG 웹뷰 결제 종류 (webview/{pgType}) */
export type PgType = 'naverpay' | 'mobilians'

/** 결제 endpoint 의 kind 세그먼트 — /ticket/payment[/{kind}]/{method} */
export type PaymentKind = '' | 'monthly' | 'monthly/extension' | 'share'

/** 웹뷰 PG 결제 응답 (네이버페이/모빌리언스 → redirectUrl 로 이동) */
export interface PaymentWebResult {
  redirectUrl: string
  successUrl: string
}
