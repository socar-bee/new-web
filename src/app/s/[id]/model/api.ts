import apiClient from '@/shared/lib/apiClient'

import { ParkingLotType, type SharedParkingLotDetail } from '@/shared/types/parking'

export async function fetchSharedParkingLotDetail(seq: string | number): Promise<SharedParkingLotDetail> {
  const { data } = await apiClient.get<{ data: SharedParkingLotDetail }>(`/poi/pins/${ParkingLotType.SHARE}/${seq}`)
  return data.data
}
