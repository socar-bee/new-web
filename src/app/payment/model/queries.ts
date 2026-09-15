import { useQuery } from '@tanstack/react-query'

import type { DailyAbleTime, PaymentConfig, PaymentConfigParams } from './types'

import { fetchDailyAbleTimes, fetchPaymentConfig } from './api'

export const paymentQueryKeys = {
  all: ['payment'] as const,
  config: (params: PaymentConfigParams | null, accessToken?: string | null) =>
    [...paymentQueryKeys.all, 'config', params, accessToken ?? ''] as const,
  dailyAbleTimes: (couponSeq: number | null, parkingDate: string, accessToken?: string | null) =>
    [...paymentQueryKeys.all, 'dailyAbleTimes', couponSeq ?? 0, parkingDate, accessToken ?? ''] as const
}

interface AuthOptions {
  /** 웹 회원 토큰. 앱은 브릿지 인터셉터가 붙이므로 null */
  accessToken?: string | null
  /** 인증 수단 자체가 없으면 조회하지 않는다 */
  authorized: boolean
}

/**
 * 결제 진입 통합 조회. `price`+`parkinglotSeq` 쌍이 완성되기 전에 쏘지 않는다
 * (상세 조회 완료가 게이트 — 하나만 보내면 400).
 */
export function usePaymentConfig(params: PaymentConfigParams | null, { accessToken, authorized }: AuthOptions) {
  return useQuery<PaymentConfig>({
    queryKey: paymentQueryKeys.config(params, accessToken),
    queryFn: () => fetchPaymentConfig(params!, accessToken),
    enabled: authorized && params != null,
    staleTime: 30_000,
    retry: 0
  })
}

/** partner 입차 예정시간 슬롯 — requiresEntryTime 상품만 */
export function useDailyAbleTimes(
  couponSeq: number | null,
  parkingDate: string,
  { accessToken, authorized, enabled }: AuthOptions & { enabled: boolean }
) {
  return useQuery<DailyAbleTime[]>({
    queryKey: paymentQueryKeys.dailyAbleTimes(couponSeq, parkingDate, accessToken),
    queryFn: () => fetchDailyAbleTimes(couponSeq!, parkingDate, accessToken),
    enabled: authorized && enabled && couponSeq != null,
    staleTime: 30_000,
    retry: 0
  })
}
