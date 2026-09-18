import apiClient from '@/shared/lib/apiClient'

import type { AirportGroup, AirportGroupConfig, AirportTicketDetail, AirportTicketList } from './types'

/**
 * 공항 주차대행 API — modu-web-app airportClientApi 계약 이식.
 * 그룹(공항 위치) → config(시간 제약·라벨) → 티켓 목록 → 상세(/ticket/period).
 */

export async function fetchAirportGroups(): Promise<AirportGroup[]> {
  const { data } = await apiClient.get<{ data: { ticketGroups: AirportGroup[] } }>('/ticket/group', {
    params: { ticketGroupType: 'airport' }
  })
  return data.data.ticketGroups
}

export async function fetchAirportGroupConfig(): Promise<AirportGroupConfig> {
  const { data } = await apiClient.get<{ data: AirportGroupConfig }>('/ticket/group/config', {
    params: { ticketGroupType: 'airport' }
  })
  return data.data
}

export async function fetchAirportTickets(
  cgSeq: number,
  params: { predictBeginTime: Date; predictExitBeginTime: Date; labelCodes?: number[] }
): Promise<AirportTicketList> {
  const { data } = await apiClient.get<{ data: AirportTicketList }>(`/ticket/group/${cgSeq}`, {
    params: {
      predictBeginTime: params.predictBeginTime.toISOString(),
      predictExitBeginTime: params.predictExitBeginTime.toISOString(),
      labelCodes: params.labelCodes?.join(',')
    }
  })
  return data.data
}

/** 상세는 예상 입·출차 시각 쿼리가 필수다 — 없으면 400 (modu-web-app airportServerApi 계약) */
export async function fetchAirportTicketDetail(
  couponSeq: string | number,
  params: { predictBeginTime: Date; predictExitBeginTime: Date }
): Promise<AirportTicketDetail> {
  const { data } = await apiClient.get<{ data: AirportTicketDetail }>(`/ticket/period/${couponSeq}`, {
    params: {
      predictBeginTime: params.predictBeginTime.toISOString(),
      predictExitBeginTime: params.predictExitBeginTime.toISOString()
    }
  })
  return data.data
}
