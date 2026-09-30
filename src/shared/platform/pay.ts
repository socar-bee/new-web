import type { CheckoutTicket } from '@/shared/platform/types'

/**
 * pay 결제웹뷰 진입 계약 — **회원 · 비회원 두 갈래를 여기 한 곳에서 판정한다.**
 * (modu-web-app 의 `shared/utils/guestPay.ts` 가 하던 역할)
 *
 * 계약 원천 (modu-webview-monorepo):
 * - 회원 앱 웹뷰 — `apps/pay/src/shared/bridge/entryParams.type.ts` (Pref `payment/PaymentEntry`).
 *   이 파일이 아니라 `platform/bridge/paymentEntry.ts` 가 담당한다.
 * - 비회원 웹 — `apps/pay/src/shared/guest/guestEntry.ts` (`/guest` 쿼리).
 * - 회원 웹 — **신설 계약. 원천이 이 파일이다** (pay 미구현, 2026-09-28 기준).
 *
 * pay 는 서비스를 **path 로 판별한다** (`apps/pay/src/app/router.ts`) — 런타임 브릿지 감지는
 * 초기화 타이밍에 의존해 결제에서 오분기 비용이 크다는 이유다. 회원 웹을 앱 웹뷰(`/`)와 같은
 * path 에 두지 않는 것도 같은 이유 — 인증 어댑터가 브릿지 vs 토큰 핸드오프로 서로 다르다.
 */

/** pay 서비스별 진입 경로 */
export const PAY_PATH = {
  /** 회원 웹 — 토큰 핸드오프 진입 (신설) */
  member: '/member',
  /** 비회원 웹 — pay 가 전화인증·게스트 토큰 발급을 안에서 끝낸다 */
  guest: '/guest'
} as const

export type PayService = keyof typeof PAY_PATH

/**
 * pay 원점은 환경변수로만 받는다 — API 호스트 문자열로 운영 여부를 추정하지 않는다.
 * (modu-web-app `payOrigin()` 이 `api.modu.kr` 판정으로 운영 사용자를 pay-dev 로 보내는 버그가 있었다)
 */
export function payHost(): string | null {
  return process.env.NEXT_PUBLIC_PAY_HOST ?? null
}

/**
 * flowType 별 조회 키 — pay `entryParams.type.ts` 계약과 1:1.
 * 금액·상품명은 넘기지 않는다. 화면 값의 원본은 pay 가 하는 상세 조회다.
 */
export function checkoutEntryKeys(ticket: CheckoutTicket): Record<string, string> {
  switch (ticket.flowType) {
    case 'period':
      return { couponSeq: String(ticket.couponSeq), startDate: ticket.startDate, endDate: ticket.endDate }
    case 'monthly':
      // 신청 정보(시작 희망일·차량·차량모델·이름)는 pay 화면에서 받는다 — 조회 키만 넘긴다
      return { couponSeq: String(ticket.couponSeq) }
    case 'monthlyExtend':
      return { couSeq: String(ticket.couSeq) }
    case 'share':
      return { shareSeq: String(ticket.shareSeq) }
    case 'shareExtend':
      return { parkingSeq: String(ticket.parkingSeq) }
    default:
      return { couponSeq: String(ticket.couponSeq), parkingDate: ticket.parkingDate }
  }
}

interface PayUrlOptions {
  /** 회원 토큰 — 있으면 회원(`/member`), 없으면 비회원(`/guest`) */
  accessToken?: string | null
  /** 게스트 채널 코드. pay `/user/login/guest` body 에 실린다 — 누락은 무효가 아니라 기본값 0 */
  guestSeq?: number | null
  /** 결제 결과 복귀 지점 (이 웹의 `/purchase/result`) */
  returnUrl: string
}

/**
 * 결제 진입 URL 을 만든다. 회원·비회원 모두 **조회 키만** 싣는다 — 금액·상품명은 pay 가 조회한다.
 *
 * - 회원: `{PAY_HOST}/member?flowType&<조회키>&returnUrl#at=<accessToken>`
 *   토큰은 hash 에 싣는다. hash 는 서버로 전송되지 않아 pay 웹서버·중간 프록시 접근 로그에 남지 않고,
 *   pay 가 읽은 뒤 `history.replaceState` 로 주소에서 지운다 (devEntry 가 쓰는 것과 같은 방식).
 * - 비회원: `{PAY_HOST}/guest?flowType&<조회키>&guestSeq`
 *   인증 산출물이 오리진 경계를 넘지 않는다 — 전화인증·토큰 발급이 pay 안에서 끝나 URL 에 실을 게 없다.
 */
export function buildPayUrl(host: string, ticket: CheckoutTicket, options: PayUrlOptions): string {
  const flowType = ticket.flowType ?? 'partner'
  const entryKeys = checkoutEntryKeys(ticket)

  if (options.accessToken) {
    const query = new URLSearchParams({ flowType, ...entryKeys, returnUrl: options.returnUrl })
    return `${host}${PAY_PATH.member}?${query.toString()}#at=${encodeURIComponent(options.accessToken)}`
  }

  const query = new URLSearchParams({
    flowType,
    ...entryKeys,
    guestSeq: String(options.guestSeq ?? 0),
    returnUrl: options.returnUrl
  })
  return `${host}${PAY_PATH.guest}?${query.toString()}`
}
