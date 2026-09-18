import apiClient from '@/shared/lib/apiClient'

/**
 * 게스트 토큰 발급 — `POST /user/login/guest {guestSeq}` (modu-web-app purchaseClientApi 계약).
 * 내주차권 비회원 조회·공유 결제가 공용한다. guestSeq 미보유(신규) 게스트는 0(기본 채널).
 */
export async function requestGuestAuth(guestSeq: number): Promise<{ accessToken: string }> {
  const { data } = await apiClient.post<{ data: { accessToken: string } }>('/user/login/guest', { guestSeq })
  return data.data
}
