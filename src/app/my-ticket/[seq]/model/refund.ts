/**
 * 결제취소·환불 도메인 상수 — modu-web-app enums/myTicket + refund 계약 이식.
 */

/** 공유 취소/신고 사유 (modu-web-app REPORT_TYPE — 현행 값만) */
export enum ReportType {
  LOCATION_UNKNOWN = 6,
  ILLEGAL_PARKING = 7,
  OCCUPIED_BY_SHARER = 8,
  NO_PARKING_LINE = 9,
  OTHER = 10
}

/** 공유주차권 결제취소 사유 라디오 (modu-web-app cancelTicketReportTypeList) */
export const SHARE_CANCEL_REASONS: { label: string; id: ReportType }[] = [
  { label: '부정 주차 차량', id: ReportType.ILLEGAL_PARKING },
  { label: '공유자 주차 중', id: ReportType.OCCUPIED_BY_SHARER },
  { label: '주차선 없음', id: ReportType.NO_PARKING_LINE },
  { label: '위치 파악 불가', id: ReportType.LOCATION_UNKNOWN },
  { label: '기타', id: ReportType.OTHER }
]

/** 환불 요청 타입 (modu-web-app REFUND_REQUEST_TYPE) */
export const REFUND_REQUEST_TYPE_SHARE = 200
/** 환불 대상 타입 (modu-web-app REFUND_REFUNDABLE_TYPE) */
export const REFUND_REFUNDABLE_TYPE_SHARE = 'S'

/** 공유 환불 신청 사유 라디오 (modu-web-app sharedParkinglot reducer). value 'etc' 는 직접 입력 */
export const SHARE_REFUND_REASONS: { label: string; value: string }[] = [
  { label: '부정 주차 차량', value: '부정 주차 차량' },
  { label: '공유자 주차 중', value: '공유자 주차 중' },
  { label: '주차선 없음', value: '주차선 없음' },
  { label: '위치 파악 불가', value: '위치 파악 불가' },
  { label: '기타(직접 입력)', value: 'etc' }
]

/** 1단계 환불 안내 — "이런 경우 환불이 불가해요" (modu-web-app SHARE_REFUND_REFUND_GUIDE_FIELD) */
export const SHARE_REFUND_GUIDE = [
  '미사용 시간에 대해 부분 환불 신청',
  '최초 주차 이후 중간에 자리를 비워 발생한 주차 문제로 환불 신청'
]

export interface RefundPhoto {
  width: number
  height: number
  fileName: string
  thumbnail: string
}

export interface RefundRequestPayload {
  requestType: number
  refundableType: string
  refundableSeq: number
  requestReason: string
  requestTemplate: string
  requestJson: { parkingImages: RefundPhoto[] }
  guestCode: string
}
