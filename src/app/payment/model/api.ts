// 주차권 결제 API — pay 서비스 계약 이관 (partner flowType 한정)
// 원본: modu-webview-monorepo/apps/pay/src/shared/api/{paymentExecution,paymentConfig,predictTime}/index.ts (2026-09-16 확인)
import apiClient from '@/shared/lib/apiClient'

import type {
  DailyAbleTime,
  PaymentConfig,
  PaymentConfigParams,
  PaymentTicketBillkeyBody,
  PaymentTicketPointBody,
  PaymentTicketWebBody,
  PgType
} from './types'

/**
 * 인증 헤더 — 앱은 브릿지 인터셉터가 붙인다(빈 옵션). 웹은 authStore 토큰을 넘긴다.
 * 이미 Authorization 이 붙는 앱 경로에서는 accessToken 을 넘기지 않는다.
 */
const withAuth = (accessToken?: string | null) =>
  accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined

/**
 * 결제 진입 통합 조회 — 카드·쿠폰·차량·포인트·최근수단·최근영수증이메일 한 방.
 * `price` 와 `parkinglotSeq` 는 쌍이다 — 상세 조회가 끝나 둘 다 채워진 뒤에만 호출한다.
 */
export async function fetchPaymentConfig(
  params: PaymentConfigParams,
  accessToken?: string | null
): Promise<PaymentConfig> {
  const { data } = await apiClient.get<{ data: PaymentConfig }>('/user/payment-config', {
    params,
    ...withAuth(accessToken)
  })
  // SPA 폴백 HTML 200 방어 — point 가 없으면 정상 응답이 아니다
  if (!data?.data?.point) throw new Error('payment-config 응답이 비어 있습니다')
  return data.data
}

/** partner 입차 예정시간 슬롯 — GET /ticket/{couponSeq}/daily-able-time?parkingDate */
export async function fetchDailyAbleTimes(
  couponSeq: number,
  parkingDate: string,
  accessToken?: string | null
): Promise<DailyAbleTime[]> {
  const { data } = await apiClient.get<{ data: { times: DailyAbleTime[] } }>(`/ticket/${couponSeq}/daily-able-time`, {
    params: { parkingDate },
    ...withAuth(accessToken)
  })
  return data.data.times
}

// ── 결제 실행 — ticket variant (partner) ──
// POST /ticket/payment/webview/{pgType} | /ticket/payment/billkey | /ticket/payment/point

export async function executeWebviewPayment(pgType: PgType, body: PaymentTicketWebBody, accessToken?: string | null) {
  const { data } = await apiClient.post(`/ticket/payment/webview/${pgType}`, body, withAuth(accessToken))
  return data
}

export async function executeBillkeyPayment(body: PaymentTicketBillkeyBody, accessToken?: string | null) {
  const { data } = await apiClient.post('/ticket/payment/billkey', body, withAuth(accessToken))
  return data
}

export async function executePointPayment(body: PaymentTicketPointBody, accessToken?: string | null) {
  const { data } = await apiClient.post('/ticket/payment/point', body, withAuth(accessToken))
  return data
}
