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

export const SHARE_SEQ = 8001

export const sharedPinFixture = {
  type: 'S',
  seq: SHARE_SEQ,
  basic: {
    calcPrices: { 60: 1200 },
    qty: 3,
    url: null,
    name: '성수 공유주차장',
    type: 'UNIT',
    phone: null,
    photos: [],
    address: '서울 성동구 성수동2가 300-1',
    caution: '거주자 우선구역과 혼동 주의',
    comment: null,
    extLink: null,
    options: ['CCTV'],
    category: 2,
    extLinkText: null,
    newAddress: '서울 성동구 아차산로 49',
    moduComment: '',
    operationSeq: 2,
    isTestOperation: false,
    isAbleUsingPoint: true,
    operationTime: '평일 09:00~18:00',
    latitude: 37.5446,
    longitude: 127.0559,
    shareLink: ''
  },
  times: [
    {
      title: '운영 시간',
      contents: [
        { key: '일요일', value: '미운영' },
        { key: '평일', value: '09:00~18:00' },
        { key: '토요일', value: '미운영' }
      ]
    }
  ],
  prices: [
    {
      title: '요금',
      contents: [
        { key: '기본요금', value: '10분 200원' },
        { key: '추가요금', value: '10분당 200원' }
      ]
    }
  ]
}

/** 내 주차권 — /ticket/my-ticket/active */
export const myTicketActiveFixture = {
  offset: 0,
  limit: 20,
  total: 3,
  results: [
    {
      type: 'p',
      seq: 70001,
      updatedAt: '2026-09-16 10:00:00',
      ticketName: '평일 당일권',
      parkinglotName: '서울숲디티타워 주차장',
      totalPrice: 25000,
      carNum: '12가 3456',
      usageDate: '2026-09-18',
      paymentSeq: 90001,
      status: 'DAILY_BEFORE_USE',
      refunds: []
    },
    {
      type: 'p',
      seq: 70002,
      updatedAt: '2026-09-10 10:00:00',
      ticketName: '월정기권',
      parkinglotName: '성수 월정기 주차장',
      totalPrice: 180000,
      carNum: '34나 5678',
      usageDate: '2026-09-01 ~ 2026-09-30',
      paymentSeq: 90002,
      status: 'MONTHLY_REQUEST_CHECKING',
      refunds: []
    },
    {
      type: 'p',
      seq: 70003,
      updatedAt: '2026-08-30 10:00:00',
      ticketName: '휴일 당일권',
      parkinglotName: '을지로 타워 주차장',
      totalPrice: 12000,
      carNum: '',
      usageDate: '2026-08-30',
      paymentSeq: 90003,
      status: 'DAILY_REFUNDED',
      refunds: []
    }
  ]
}

/** 내주차권 상세 — /ticket/my-ticket/p/{seq} */
export const myTicketDetailFixture = {
  parkinglot: {
    type: 'P',
    seq: 501,
    name: '서울숲디티타워 주차장',
    address: '서울 성동구 왕십리로 82',
    latitude: 37.5444,
    longitude: 127.0374,
    phone: '02-1234-5678'
  },
  ticket: {
    type: 'p',
    paymentTime: '2026-09-16 10:00:00',
    seq: 70001,
    paymentType: 'BILL',
    totalPrice: 25000,
    addonPrices: [],
    ticketName: '평일 당일권',
    carNum: '12가 3456',
    usageDate: '2026-09-18',
    refunds: [],
    status: 'DAILY_BEFORE_USE',
    paymentSeq: 90001,
    usageTime: '00:00~23:59',
    usageGuide: '',
    notice: '',
    notice2: '- 출차 방법: 번호판 자동인식\n- 만차 시 주차가 어려울 수 있습니다',
    photos: [],
    isCancelable: true,
    isTicketRefundable: true,
    isOnSiteRefundable: false,
    refundRequestTemplate: '',
    refundRequestTemplateKeys: [],
    partner: null
  },
  canceledDate: null
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

