// 주차권 결제 API (안드로이드 TicketApi 대응)
// endpoint 패턴: /ticket/payment[/{kind}]/{method}
//   kind: '' (일반) | 'monthly' | 'monthly/extension' | 'share'
//   method: 'point' | 'billkey' | 'webview/{pgType}'
// 원본: payment-webview 브랜치 src/api/payment.ts · src/api/user.ts (2026-09-16 이관)
import apiClient from '@/shared/lib/apiClient'

import type { PaymentKind, PaymentWebResult, PgType } from './types'

const BASE = '/ticket/payment'

// TODO(구현): payload 타입 확정 (안드로이드 PaymentRequestPayload / TicketPaymentRepository 참조)
//   타입별·결제수단별 요청 바디 매핑은 정기권(monthly) 한 바퀴부터 채운다.

/** 포인트 결제 (결제금액 0) */
export async function payByPoint(kind: PaymentKind, payload: unknown) {
  const path = kind ? `${BASE}/${kind}/point` : `${BASE}/point`
  const { data } = await apiClient.post(path, payload)
  return data
}

/** 카드(빌링키) 결제 */
export async function payByBillkey(kind: PaymentKind, payload: unknown) {
  const path = kind ? `${BASE}/${kind}/billkey` : `${BASE}/billkey`
  const { data } = await apiClient.post(path, payload)
  return data
}

/** 웹뷰 PG 결제 (네이버페이/모빌리언스) */
export async function payByWebview(kind: PaymentKind, pgType: PgType, payload: unknown) {
  const path = kind ? `${BASE}/${kind}/webview/${pgType}` : `${BASE}/webview/${pgType}`
  const { data } = await apiClient.post<PaymentWebResult>(path, payload)
  return data
}

interface PointResult {
  point: { totalAmount: number }
}

/**
 * 충전금(포인트) 잔액 조회 — GET /user/asset/point
 * 앱: 브릿지 인터셉터가 토큰을 붙인다. 웹: authStore 토큰을 인자로 받는다.
 */
export async function fetchPointBalance(accessToken?: string | null): Promise<number> {
  const { data } = await apiClient.get<{ data: PointResult }>('/user/asset/point', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  })
  return data.data.point.totalAmount
}
