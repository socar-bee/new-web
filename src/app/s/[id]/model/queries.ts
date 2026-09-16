import { useQuery } from '@tanstack/react-query'

import { ParkingLotType, type SharedParkingLotDetail } from '@/shared/types/parking'

import { parkingQueryKeys } from '@/app/p/[id]/model'

import { fetchSharedParkingLotDetail } from './api'

export function useSharedParkingLotDetail(seq: number | null, initialData?: SharedParkingLotDetail) {
  return useQuery<SharedParkingLotDetail>({
    queryKey:
      seq !== null ? parkingQueryKeys.detail(seq, ParkingLotType.SHARE) : [...parkingQueryKeys.all, 'detail', null],
    queryFn: () => fetchSharedParkingLotDetail(seq!),
    enabled: seq !== null,
    staleTime: 60_000,
    ...(initialData ? { initialData, initialDataUpdatedAt: () => Date.now() } : {})
  })
}
