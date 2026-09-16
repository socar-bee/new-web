import { useQuery } from '@tanstack/react-query'

import type { MyTicketActiveList } from '@/shared/types/ticket'

import { fetchActiveTickets } from './api'

export const myTicketQueryKeys = {
  all: ['myTickets'] as const,
  // 토큰을 키에 포함 — 계정이 바뀌면 이전 사용자의 주차권 캐시를 재사용하지 않는다
  active: (limit: number, offset: number, token: string | null) =>
    [...myTicketQueryKeys.all, 'active', limit, offset, token] as const
}

const PAGE_LIMIT = 20

export function useActiveTickets(token: string | null) {
  return useQuery<MyTicketActiveList>({
    queryKey: myTicketQueryKeys.active(PAGE_LIMIT, 0, token),
    queryFn: () => fetchActiveTickets({ limit: PAGE_LIMIT, offset: 0 }, token!),
    enabled: token !== null,
    staleTime: 30_000
  })
}
