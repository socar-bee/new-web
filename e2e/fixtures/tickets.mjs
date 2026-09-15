/**
 * E2E mock 픽스처 — 실제 API 응답 형태(`{ data: ... }` 래핑은 mock-server 가 담당)를 흉내낸다.
 * couponSeq 로 케이스를 구분한다: 9101 당일권 판매중 / 9102 월정기 / 9103 매진 / 9104 판매예정
 */

export const PARKINGLOT_SEQ = 501

export const pinFixture = {
  type: 'P',
  seq: PARKINGLOT_SEQ,
  basic: {
    calcPrices: { 60: 3000 },
    qty: 100,
    url: null,
    name: '서울숲디티타워 주차장',
    payYn: 'Y',
    phone: null,
    photos: [],
    address: '서울 성동구 성수동1가 685-700',
    caution: null,
    comment: null,
    extLink: null,
    options: [],
    category: 2,
    realtime: null,
    newAddress: '서울 성동구 왕십리로 82',
    extLinkText: null,
    latitude: 37.5444,
    longitude: 127.0374,
    moduComment: '',
    operationSeq: 1,
    partnerStatus: true,
    isAutopay: false,
    shareLink: ''
  },
  times: [],
  prices: [],
  evStation: null,
  openFree: { isOpen: false, weekday: null, saturday: null, holiday: null },
  modifyDate: '2026-09-01 00:00:00',
  aiDescription: null,
  isCarWash: false,
  isAirport: false,
  isFeedbackEventTarget: false,
  isFeedbackExist: false
}

const baseTicket = {
  couponTypeName: '당일권',
  usingTimeLabel: '00:00~23:59',
  usingDateLabel: '',
  nextTimeLabel: '',
  isOpen: true,
  isSoldOut: false,
  notice: '- 출차 방법: 번호판 자동인식\n- 만차 혹은 현장 사정에 따라 주차가 어려울 수 있음',
  notice2: '- 평일주차 간주차 절대불가\n- 당일 등록 불가, 최소 구매 다음 날부터 이용 가능',
  enteringNotice: '- 입출차는 1회만 가능하며, 주차권으로 출차 후 재입차 시 현장요금 적용',
  photos: [],
  parkinglot: {
    parkinglotSeq: PARKINGLOT_SEQ,
    parkinglotName: '서울숲디티타워 주차장',
    parkinglotAddress: '서울 성동구 왕십리로 82',
    parkinglotLatitude: 37.5444,
    parkinglotLongitude: 127.0374,
    coupons: []
  }
}

export const ticketFixtures = {
  9101: {
    ...baseTicket,
    couponSeq: 9101,
    couponName: '평일 당일권',
    couponTypeSeq: 0,
    couponTypeGroup: 1000,
    price: 25000,
    usagePeriodLabel: '00:00~23:59 이용가능',
    purchaseAvailability: { status: 'AVAILABLE', purchaseOpenDateTime: null }
  },
  9102: {
    ...baseTicket,
    couponSeq: 9102,
    couponName: '월정기권',
    couponTypeSeq: 10100,
    couponTypeGroup: 10000,
    couponTypeName: '월정기권',
    price: 220000,
    usagePeriodLabel: '기간내 00:00 ~ 23:59',
    purchaseAvailability: { status: 'AVAILABLE', purchaseOpenDateTime: null }
  },
  9103: {
    ...baseTicket,
    couponSeq: 9103,
    couponName: '주말 3시간권',
    couponTypeSeq: 0,
    couponTypeGroup: 2000,
    price: 12000,
    usagePeriodLabel: '00:00~23:59 이용가능',
    isSoldOut: true,
    purchaseAvailability: { status: 'SOLD_OUT', purchaseOpenDateTime: null }
  },
  9104: {
    ...baseTicket,
    couponSeq: 9104,
    couponName: '야간권',
    couponTypeSeq: 0,
    couponTypeGroup: 2000,
    price: 6000,
    usagePeriodLabel: '16:00~23:59 이용가능',
    purchaseAvailability: { status: 'NOT_YET_OPEN', purchaseOpenDateTime: '2026-09-20T16:00:00' }
  }
}

export const ticketListFixture = Object.values(ticketFixtures).map((t) => ({
  couponSeq: t.couponSeq,
  couponName: t.couponName,
  couponTypeSeq: t.couponTypeSeq,
  couponTypeGroup: t.couponTypeGroup,
  couponTypeName: t.couponTypeName,
  price: t.price,
  usagePeriodLabel: t.usagePeriodLabel,
  purchaseAvailability: t.purchaseAvailability,
  isOpen: t.isOpen,
  isSoldOut: t.isSoldOut,
  usingTimeLabel: t.usingTimeLabel,
  usingDateLabel: t.usingDateLabel,
  nextTimeLabel: t.nextTimeLabel
}))
