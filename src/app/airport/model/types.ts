/** 공항 주차대행 도메인 타입 — modu-web-app api/client/airport dto 이식 */

export interface AirportGroup {
  cgSeq: number
  title: string
}

export interface AirportGroupLabel {
  masterCode: number
  detailCode: number
  detailName: string
  detailDesc: string
}

export interface AirportGroupConfig {
  /** 지금부터 N시간 이후부터 입차 선택 가능 */
  entryAvailableAfterHours: number
  /** 입차는 N일 이내까지 선택 가능 */
  entryAvailableUntilDays: number
  /** 출차는 입차로부터 N일 이내까지 선택 가능 */
  exitAvailableUntilDays: number
  labels: AirportGroupLabel[]
}

export interface AirportTicketThumbnail {
  url: string
  width: number
  height: number
  description: string
}

export interface AirportTicket {
  couponSeq: number
  couponName: string
  labels: string[]
  totalPrice: number
  parkinglotName: string
  isSoldOut: boolean
  thumbnail: AirportTicketThumbnail | null
}

export interface AirportTicketList {
  cgSeq: number
  tickets: AirportTicket[]
  infoMsg: string
}

export interface AirportTicketAddonPrice {
  addonPolicyType: string
  price: number
}

export interface AirportTicketPhoto {
  fileName: string
  thumbnail: string
  width: number
  height: number
  pictureDesc: string | null
}

export interface AirportTicketDetail {
  couponSeq: number
  couponName: string
  parkinglotSeq: number
  parkinglotName: string
  labels: string[]
  basePrice: number
  addonPrice: AirportTicketAddonPrice[]
  photos: AirportTicketPhoto[]
  notice: string
  prePurchaseNotice: string
  postPurchaseNotice: string
  isSoldOut: boolean
}

/** "yyyy-MM-dd HH:mm" → Date — Safari 는 공백 구분 파싱이 불안정해 'T' 로 정규화한다 */
export function parseAirportDateTime(value: string): Date {
  return new Date(value.replace(' ', 'T'))
}
