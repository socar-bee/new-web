import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

import { gotoHydrated } from './utils'

const seoulDate = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

/** 웹 회원 로그인 시드 — authStore(zustand persist) 스냅샷을 심는다 */
const seedLogin = (page: Page) =>
  page.addInitScript(() => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          accessToken: 'e2e-access-token',
          refreshToken: 'e2e-refresh-token',
          userVerificationId: null,
          isLoggedIn: true,
          profile: null
        },
        version: 0
      })
    )
  })

const entryUrl = () => `/payment?couponSeq=9101&parkingDate=${seoulDate()}`

test.describe('결제 화면 — 비로그인 웹', () => {
  test('로그인 유도 화면으로 막는다', async ({ page }) => {
    await gotoHydrated(page, entryUrl())

    await expect(page.getByText('로그인이 필요해요')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인하기' })).toBeEnabled()
  })

  test('couponSeq 없이 진입하면 잘못된 접근으로 막는다', async ({ page }) => {
    await gotoHydrated(page, '/payment')

    await expect(page.getByText('잘못된 접근입니다.')).toBeVisible()
  })
})

test.describe('결제 화면 — 회원 (pay 계약)', () => {
  test.beforeEach(async ({ page }) => {
    await seedLogin(page)
  })

  test('상세·payment-config 실데이터로 그려진다', async ({ page }) => {
    await gotoHydrated(page, entryUrl())

    // 상품 정보 — GET /ticket/{couponSeq} 가 원본
    await expect(page.getByText('평일 당일권')).toBeVisible()
    await expect(page.getByText('서울숲디티타워 주차장')).toBeVisible()

    // 입차 예정시간 슬롯 — GET /ticket/{couponSeq}/daily-able-time
    await expect(page.getByRole('button', { name: '10:00 ~ 10:30' })).toBeVisible()

    // 차량 — payment-config 의 기본 차량이 프리셀렉트
    await expect(page.getByRole('button', { name: '12가3456' })).toBeVisible()

    // 쿠폰 — couponPrice=null 쿠폰은 적용 불가
    await expect(page.getByText('신규가입 할인')).toBeVisible()
    await expect(page.getByText('-2,000원')).toBeVisible()
    await expect(page.getByText('적용 불가', { exact: true })).toBeVisible()

    // 충전금 잔액
    await expect(page.getByText('보유 1,500P')).toBeVisible()

    // 결제 정보 — 상품가 그대로
    await expect(page.getByRole('button', { name: '25,000원 결제하기' })).toBeVisible()
  })

  test('입차시간이 채워져야 CTA 가 열린다', async ({ page }) => {
    await gotoHydrated(page, entryUrl())

    const cta = page.getByRole('button', { name: /원 결제하기/ })
    await expect(cta).toBeDisabled()

    await page.getByRole('button', { name: '10:00 ~ 10:30' }).click()
    await expect(cta).toBeEnabled()
  })

  test('쿠폰·충전금 — 상품가 → 쿠폰 차감 → 포인트 차감 순서로 금액이 갱신된다', async ({ page }) => {
    await gotoHydrated(page, entryUrl())

    await page.getByText('신규가입 할인').click()
    await expect(page.getByRole('button', { name: '23,000원 결제하기' })).toBeVisible()

    await page.getByRole('button', { name: '모두사용' }).click()
    await expect(page.getByRole('button', { name: '21,500원 결제하기' })).toBeVisible()
  })

  test('카드(빌링키) — 차량 확인 1회 후 즉시 승인 → 완료 화면', async ({ page }) => {
    await gotoHydrated(page, entryUrl())

    await page.getByRole('button', { name: '10:00 ~ 10:30' }).click()
    await page.getByText('신용/체크카드').click()
    // 카드 결제 선택 시 첫 카드가 자동 선택된다
    await expect(page.getByText('KB국민')).toBeVisible()

    await page.getByRole('button', { name: '25,000원 결제하기' }).click()

    // 결제 전 차량번호 재확인 (pay carNotConfirmed 규칙)
    await expect(page.getByText('차량번호를 확인해주세요')).toBeVisible()
    await expect(page.getByText('12가3456 차량으로 결제할까요?')).toBeVisible()
    await page.getByRole('button', { name: '결제하기', exact: true }).click()

    // 즉시 승인 → /payment/callback 합류 → 완료 화면
    await page.waitForURL(/\/purchase\/result\?/)
    const url = new URL(page.url())
    expect(url.searchParams.get('type')).toBe('p')
    expect(url.searchParams.get('seq')).toBe('90001')
    await expect(page.getByText('결제가 완료되었어요')).toBeVisible()
  })

  test('네이버페이(PG) — redirectUrl 왕복 후 완료 화면', async ({ page }) => {
    await gotoHydrated(page, entryUrl())

    await page.getByRole('button', { name: '10:00 ~ 10:30' }).click()
    await page.getByText('다른 결제 수단').click()
    await page.getByRole('button', { name: '네이버페이' }).click()

    await page.getByRole('button', { name: '25,000원 결제하기' }).click()
    await page.getByRole('button', { name: '결제하기', exact: true }).click()

    // mock 이 PG·BE 302 를 생략하고 returnUrl(=/payment/callback)로 성공 복귀시킨다
    await page.waitForURL(/\/purchase\/result\?/)
    expect(new URL(page.url()).searchParams.get('seq')).toBe('90003')
    await expect(page.getByText('결제가 완료되었어요')).toBeVisible()
  })
})

test.describe('결제 화면 — 앱 웹뷰', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 ParkingShare/400.0.0'
  })

  test('웹 헤더는 숨고 브릿지 인증 전제로 payment-config 를 조회한다', async ({ page }) => {
    await gotoHydrated(page, entryUrl())

    await expect(page.locator('header[data-web-only]')).toBeHidden()
    // 앱 판정이면 토큰 시드 없이도 조회가 돈다 (브릿지 인터셉터 전제, mock 은 인증 미검사)
    await expect(page.getByText('보유 1,500P')).toBeVisible()
  })
})
