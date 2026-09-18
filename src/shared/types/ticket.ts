/* ─── Enums ─── */

export enum MyTicketType {
  PARTNER = 'p',
  SHARE = 's'
}

export enum MyTicketStatus {
  UNKNOWN = 'UNKNOWN',
  DAILY_BEFORE_USE = 'DAILY_BEFORE_USE',
  DAILY_AFTER_USE = 'DAILY_AFTER_USE',
  DAILY_CANCELED = 'DAILY_CANCELED',
  DAILY_EXPIRED = 'DAILY_EXPIRED',
  DAILY_REFUND_REQUEST = 'DAILY_REFUND_REQUEST',
  DAILY_REFUNDED = 'DAILY_REFUNDED',
  MONTHLY_PAYMENT_COMPLETED = 'MONTHLY_PAYMENT_COMPLETED',
  MONTHLY_REQUEST_CHECKING = 'MONTHLY_REQUEST_CHECKING',
  MONTHLY_REQUEST_CHECKED = 'MONTHLY_REQUEST_CHECKED',
  MONTHLY_USING = 'MONTHLY_USING',
  MONTHLY_EXPIRED = 'MONTHLY_EXPIRED',
  MONTHLY_REJECTED = 'MONTHLY_REJECTED',
  MONTHLY_REJECTED_REFUNDED = 'MONTHLY_REJECTED_REFUNDED',
  MONTHLY_STOPPED = 'MONTHLY_STOPPED',
  MONTHLY_STOPPED_REFUNDED = 'MONTHLY_STOPPED_REFUNDED',
  MONTHLY_CANCELED_REFUNDED = 'MONTHLY_CANCELED_REFUNDED',
  PERIOD_BEFORE_USE = 'PERIOD_BEFORE_USE',
  PERIOD_AFTER_USE = 'PERIOD_AFTER_USE',
  PERIOD_CANCELED = 'PERIOD_CANCELED',
  PERIOD_EXPIRED = 'PERIOD_EXPIRED',
  PERIOD_REFUND_REQUEST = 'PERIOD_REFUND_REQUEST',
  PERIOD_REFUNDED = 'PERIOD_REFUNDED'
}

export enum PaymentType {
  BILL = 'BILL',
  NAVERBOOKING = 'NAVERBOOKING',
  NAVERPAY = 'NAVERPAY',
  CELLPHONE = 'CELLPHONE'
}

export enum RefundRequestType {
  DAILY = 100,
  PERIOD = 130
}

export enum RefundRequestStatus {
  REQUESTED = 100,
  RECEIVED = 150,
  COMPLETED = 200,
  TRANSFER_REQUESTED = 300,
  TRANSFER_RECEIVED = 310,
  CLOSED = 900,
  WAITING_FOR_RETRY = 910
}

export enum CouponAddonPolicyType {
  ADDITIONAL_CHARGE = 1,
  VALET_PICKUP_SENDING = 2,
  LATE_NIGHT_ENTRY = 3,
  LATE_NIGHT_EXIT = 4,
  CAR_WASH = 5
}

/* ─── Active (목록) ─── */

export interface MyTicketRefund {
  requestSeq: number
  requestType: number
  requestStatus: number
  createdAt: string
  refundedAt: string | null
}

export interface MyTicketActiveItem {
  type: string
  seq: number
  updatedAt: string
  ticketName: string
  parkinglotName: string
  totalPrice: number
  carNum: string
  usageDate: string
  paymentSeq: number
  status: string
  refunds: MyTicketRefund[]
}

export interface MyTicketActiveList {
  offset: number
  limit: number
  total: number
  results: MyTicketActiveItem[]
}

/* ─── Detail (상세) ─── */

export interface MyTicketPhoto {
  fileName: string
  thumbnail: string
  width: number
  height: number
  pictureDesc: string | null
}

export interface MonthlyInfo {
  cmouSeq: number
  copSeq: number
  userName: string
  userPhone: string
  carModel: string
  carNum: string
  startedAt: string
  finishedAt: string
  isExtension: boolean
  extensionInfo: null
}

export interface MyTicketPartner {
  couponTypeSeq: number
  predictTime: string
  monthlyInfo: MonthlyInfo | null
  isNeedConfirm: boolean
  isWebDiscountTicket: boolean
  isTicketApplied: boolean
  isEntered: boolean
  isPayAfterEntered: boolean
  enterTime: string | null
  isExpired: boolean
  reserveDate: string | null
  reserveEndDate: string | null
  predictEndTime: string
  labels: string[]
  userInput?: string | null
  userInputTemplate?: string | null
  userInputEditableUntil: string | null
}

export interface MyTicketParkinglot {
  type: string
  seq: number
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
}

export interface MyTicketDetail {
  parkinglot: MyTicketParkinglot
  ticket: {
    type: MyTicketType
    paymentTime: string
    seq: number
    paymentType: PaymentType | ''
    totalPrice: number
    addonPrices: { addonPolicyType: CouponAddonPolicyType; price: number }[]
    ticketName: string
    carNum: string
    usageDate: string
    refunds: MyTicketRefund[]
    status: MyTicketStatus
    paymentSeq: number
    usageTime: string
    usageGuide: string
    notice: string
    notice2: string
    photos: MyTicketPhoto[]
    isCancelable: boolean
    isTicketRefundable: boolean
    isOnSiteRefundable: boolean
    refundRequestTemplate: string
    refundRequestTemplateKeys: string[]
    partner: MyTicketPartner | null
    /** 공유주차권 전용 (modu-web-app MyTicketDetailModel.share) */
    share?: {
      endTime: string
      usageTypeGuide: string
      isExtendable: boolean
      extendableMinute: number
      detailType: string
      isExtend: boolean
      usingTime: number
    } | null
  }
  canceledDate: string | null
}
