/* ─── Enums ─── */

export enum ParkingLotType {
  PARKINGLOT = 'P',
  SHARE = 'S'
}

export enum CouponTypeGroup {
  UNKNOWN = 0,
  DAILY_RANGE = 1000,
  DAILY_HOUR = 2000,
  DAILY_CONSECUTIVE = 3000,
  MONTHLY = 10000
}

export enum CouponTypeSeq {
  DAILY = 0,
  MONTHLY_PERIOD = 10100,
  MONTHLY_UNIT = 10200,
  MONTHLY_PARTIAL = 10300
}

export enum CategorySeq {
  PUBLIC = 1,
  PRIVATE = 2
}

/** 주차권 구매 가능 상태 (purchaseAvailability.status) */
export enum PurchaseAvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  NOT_YET_OPEN = 'NOT_YET_OPEN',
  SOLD_OUT = 'SOLD_OUT',
  CLOSED = 'CLOSED'
}

export interface PurchaseAvailability {
  status: PurchaseAvailabilityStatus
  purchaseOpenDateTime: string | null
}

/* ─── ParkingLot Detail ─── */

export interface ParkingLotPhoto {
  file_name: string
  thumbnail: string
  width: number
  height: number
}

export interface ParkingLotRealtime {
  type: number
  text: string
  timestamp: string
}

export interface ParkingLotBasic {
  calcPrices: Record<string, number>
  qty: number
  url: string | null
  name: string
  payYn: 'Y' | 'N'
  phone: string | null
  photos: ParkingLotPhoto[]
  address: string
  caution: string | null
  comment: string | null
  extLink: string | null
  options: string[]
  category: number
  realtime: ParkingLotRealtime | null
  newAddress: string
  extLinkText: string | null
  latitude: number
  longitude: number
  moduComment: string
  operationSeq: number
  partnerStatus: boolean
  isAutopay: boolean
  shareLink: string
}

export interface ParkingLotTimeContent {
  title: string
  contents: { key: string; value: string }[]
}

export interface ParkingLotOpenFree {
  isFree: boolean
  isClosed: boolean
  operationTime: string | null
}

export interface ParkingLotAiDescription {
  nrSeq: number
  response: string
}

export interface ParkingLotDetail {
  type: ParkingLotType.PARKINGLOT
  seq: number
  basic: ParkingLotBasic
  times: ParkingLotTimeContent[]
  prices: ParkingLotTimeContent[]
  evStation: null
  openFree: ParkingLotOpenFree
  modifyDate: string
  aiDescription: ParkingLotAiDescription | null
  isCarWash: boolean
  isAirport: boolean
  isFeedbackEventTarget: boolean
  isFeedbackExist: boolean
}

/* ─── Shared ParkingLot Detail (공유주차장, /poi/pins/S/{seq}) ─── */

export interface SharedParkingLotBasic {
  calcPrices: Record<string, number>
  qty: number
  url: string | null
  name: string
  /** 개별 면 공유(UNIT) / 구역 공유(SECTION) */
  type: 'UNIT' | 'SECTION'
  phone: string | null
  photos: ParkingLotPhoto[]
  address: string
  caution: string | null
  comment: string | null
  extLink: string | null
  options: string[]
  category: number
  extLinkText: string | null
  newAddress: string
  moduComment: string
  operationSeq: number
  isTestOperation: boolean
  isAbleUsingPoint: boolean
  operationTime: string
  latitude: number
  longitude: number
  shareLink: string
}

export interface SharedParkingLotDetail {
  type: ParkingLotType.SHARE
  seq: number
  basic: SharedParkingLotBasic
  times: ParkingLotTimeContent[]
  prices: ParkingLotTimeContent[]
}

/* ─── Ticket (주차장에 속한 주차권 목록/상세) ─── */

export interface TicketListItem {
  couponSeq: number
  couponName: string
  couponTypeSeq: CouponTypeSeq
  couponTypeGroup: CouponTypeGroup
  couponTypeName: string
  price: number
  /** 사용 기간 라벨 (예: "10/10 ~ 10/15") */
  usagePeriodLabel?: string
  /** 구매 가능 상태 + 오픈 시각 */
  purchaseAvailability?: PurchaseAvailability
  isOpen: boolean
  isSoldOut: boolean
  usingTimeLabel: string
  usingDateLabel: string
  nextTimeLabel: string
}

export interface TicketPhoto {
  fileName: string
  thumbnail: string
  width: number
  height: number
  pictureDesc: string | null
}

export interface TicketViewParkingLotCoupon {
  couponSeq: number
  couponName: string
}

export interface TicketViewParkingLot {
  parkinglotSeq: number
  parkinglotName: string
  parkinglotAddress: string
  parkinglotLatitude: number
  parkinglotLongitude: number
  coupons: TicketViewParkingLotCoupon[]
}

export interface TicketDetail {
  couponSeq: number
  couponName: string
  couponTypeSeq: CouponTypeSeq
  couponTypeGroup: CouponTypeGroup
  couponTypeName: string
  price: number
  /**
   * partner 결제의 입차예정시간 입력 여부 — 미제공 서버는 기존 시간 선택을 유지한다.
   * (pay 계약: false 일 때만 시간 선택을 생략하고 서버가 결제일시를 확정)
   */
  requiresEntryTime?: boolean
  /** 사용 기간 라벨 (NOT_YET_OPEN 시 버튼 서브타이틀로도 사용) */
  usagePeriodLabel: string
  /** 구매 가능 상태 + 오픈 시각 — 구매 버튼 분기 핵심 */
  purchaseAvailability: PurchaseAvailability
  isOpen: boolean
  isSoldOut: boolean
  usingTimeLabel: string
  usingDateLabel: string
  nextTimeLabel: string
  notice: string
  notice2: string
  enteringNotice: string
  photos: TicketPhoto[]
  parkinglot: TicketViewParkingLot
}

/* ─── User Input Template ─── */

export interface TicketUserInputTemplate {
  userInputTemplate: string | null
}
