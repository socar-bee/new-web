import apiClient from '@/shared/lib/apiClient'

import type { RefundPhoto, RefundRequestPayload } from './refund'

import type { MyTicketDetail } from '@/shared/types/ticket'

/**
 * 내주차권 상세 — `GET /ticket/my-ticket/{type}/{seq}` (modu-android TicketApi 계약).
 * 회원은 accessToken 만으로 조회하며 guestCode 파라미터를 보내지 않는다 — 빈 guestCode= 를 붙이면 400.
 * 비회원은 게스트 토큰 + 휴대폰 뒷 4자리(guestCode)로 조회한다 (modu-web-app myTicketClientApi 계약).
 */
export async function fetchMyTicketDetail(
  type: string,
  seq: string | number,
  token: string,
  guestCode?: string
): Promise<MyTicketDetail> {
  const { data } = await apiClient.get<{ data: MyTicketDetail }>(`/ticket/my-ticket/${type}/${seq}`, {
    params: guestCode ? { guestCode } : undefined,
    headers: { Authorization: `Bearer ${token}` }
  })
  return data.data
}

/**
 * 비회원 조회 키 — **값이 있을 때만** 싣는다.
 *
 * 서버 DTO 의 `guestCode` 는 선택값이지만 주면 4자 이상이어야 한다
 * (modu-api-ticket `CancelReqDto`·`ShareCancelReqDto`·`MyTicketUseRequestDto`, minLength 4).
 * 회원은 뒷 4자리가 없어 빈 문자열이 실리는데, 그 값은 "생략" 이 아니라 **길이 위반**이다.
 * 상세 조회에서 빈 `guestCode=` 로 400 을 받았던 것과 같은 이유다.
 */
function withGuestCode<T extends object>(payload: T, guestCode: string): T & { guestCode?: string } {
  return guestCode ? { ...payload, guestCode } : payload
}

/** 제휴 결제취소 — `POST /ticket/payment/{paymentSeq}/cancel` (modu-web-app requestCancelPayment) */
export async function cancelPayment(paymentSeq: number, token: string, guestCode = ''): Promise<void> {
  await apiClient.post(`/ticket/payment/${paymentSeq}/cancel`, withGuestCode({}, guestCode), {
    headers: { Authorization: `Bearer ${token}` }
  })
}

/**
 * 공유 결제취소 — `POST /ticket/payment/share/{paymentSeq}/cancel {guestCode, reportType}`
 * (modu-web-app shareRequestCancelPayment)
 */
export async function shareCancelPayment(
  paymentSeq: number,
  token: string,
  payload: { guestCode: string; reportType: number }
): Promise<void> {
  const { guestCode, ...body } = payload
  await apiClient.post(`/ticket/payment/share/${paymentSeq}/cancel`, withGuestCode(body, guestCode), {
    headers: { Authorization: `Bearer ${token}` }
  })
}

/**
 * 환불 신청 이미지 업로드 — `POST /ticket/my-ticket/refund/image` FormData(refundImage*, guestCode)
 * (modu-web-app uploadRefundImages)
 */
export async function uploadRefundImages(files: File[], token: string, guestCode = ''): Promise<RefundPhoto[]> {
  const formData = new FormData()
  if (guestCode) formData.append('guestCode', guestCode)
  files.forEach((file) => formData.append('refundImage', file))
  const { data } = await apiClient.post<{ data: RefundPhoto[] }>('/ticket/my-ticket/refund/image', formData, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
  })
  return Array.isArray(data.data) ? data.data : [data.data]
}

/** 주차권 사용(관리자 확인) — `POST /ticket/my-ticket/use {couSeq, guestCode}` (modu-web-app requestUseMyTicket) */
export async function requestUseMyTicket(payload: { couSeq: number; guestCode: string }, token: string): Promise<void> {
  const { guestCode, ...body } = payload
  await apiClient.post('/ticket/my-ticket/use', withGuestCode(body, guestCode), {
    headers: { Authorization: `Bearer ${token}` }
  })
}

/** 환불 신청 — `POST /ticket/my-ticket/refund` (modu-web-app requestRefund) */
export async function requestRefund(payload: RefundRequestPayload, token: string): Promise<{ requestSeq: number }> {
  const { guestCode, ...body } = payload
  const { data } = await apiClient.post<{ data: { requestSeq: number } }>(
    '/ticket/my-ticket/refund',
    withGuestCode(body, guestCode),
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return data.data
}
