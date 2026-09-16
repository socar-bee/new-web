import apiClient from '@/shared/lib/apiClient'

import type { MyTicketDetail } from '@/shared/types/ticket'

/**
 * 내주차권 상세 — `GET /ticket/my-ticket/{type}/{seq}?guestCode=` (modu-web-app myTicketClientApi 계약).
 * 회원은 회원 accessToken + 빈 guestCode, 비회원은 게스트 토큰 + 휴대폰 뒷 4자리(guestCode)로 조회한다.
 */
export async function fetchMyTicketDetail(
  type: string,
  seq: string | number,
  token: string,
  guestCode = ''
): Promise<MyTicketDetail> {
  const { data } = await apiClient.get<{ data: MyTicketDetail }>(`/ticket/my-ticket/${type}/${seq}`, {
    params: { guestCode },
    headers: { Authorization: `Bearer ${token}` }
  })
  return data.data
}

/** 비회원 게스트 토큰 발급 — `POST /user/login/guest { guestSeq }` (modu-web-app purchaseClientApi 계약) */
export async function requestGuestAuth(guestSeq: number): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ data: { accessToken: string } }>('/user/login/guest', { guestSeq })
  return data.data
}
