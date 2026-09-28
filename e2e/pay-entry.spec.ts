import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

/**
 * pay 결제웹뷰 진입 계약 — 회원(`/member`)·비회원(`/guest`) 두 갈래.
 * URL 계약의 원천은 src/shared/platform/pay.ts 다.
 */

/** Asia/Seoul 기준 오늘 (yyyy-MM-dd) */
const seoulDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

const seedAuth = JSON.stringify({
  state: { accessToken: 'E2E_AT', refreshToken: 'RT', userVerificationId: null, isLoggedIn: true, profile: null },
  version: 0
})

test.describe('pay 결제 진입 — 회원/비회원 분기', () => {
  test('비회원 — /guest 로 조회 키만 싣고 간다 (토큰 없음)', async ({ page }) => {
    await gotoHydrated(page, `/t/9101?parkingDate=${seoulDate()}`)

    await page.getByRole('button', { name: '25,000원 결제하기' }).click()
    await page.waitForURL(/\/guest\?/)

    const url = new URL(page.url())
    expect(url.pathname).toBe('/guest')
    expect(url.searchParams.get('flowType')).toBe('partner')
    expect(url.searchParams.get('couponSeq')).toBe('9101')
    expect(url.searchParams.get('parkingDate')).toBe(seoulDate())
    expect(url.searchParams.get('guestSeq')).toBe('0')
    // 인증 산출물은 오리진 경계를 넘지 않는다 — 전화인증은 pay 안에서 끝난다
    expect(url.hash).toBe('')
  })

  test('비회원 — 이전 복귀가 남긴 guestSeq 채널 코드를 이어붙인다', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('modu:guest-seq', '77'))
    await gotoHydrated(page, `/t/9101?parkingDate=${seoulDate()}`)

    await page.getByRole('button', { name: '25,000원 결제하기' }).click()
    await page.waitForURL(/\/guest\?/)

    expect(new URL(page.url()).searchParams.get('guestSeq')).toBe('77')
  })

  test('회원 — /member 로 가고 토큰은 hash 로만 넘긴다', async ({ page }) => {
    await page.addInitScript((auth) => localStorage.setItem('auth-storage', auth), seedAuth)
    await gotoHydrated(page, `/t/9101?parkingDate=${seoulDate()}`)

    await page.getByRole('button', { name: '25,000원 결제하기' }).click()
    await page.waitForURL(/\/member\?/)

    const url = new URL(page.url())
    expect(url.pathname).toBe('/member')
    expect(url.searchParams.get('flowType')).toBe('partner')
    expect(url.searchParams.get('couponSeq')).toBe('9101')
    expect(url.searchParams.get('returnUrl')).toContain('/purchase/result')
    // 토큰은 쿼리가 아니라 hash — 서버·프록시 접근 로그에 남지 않는다
    expect(url.searchParams.get('at')).toBeNull()
    expect(url.hash).toBe('#at=E2E_AT')
  })

  test('회원 — 공항(period)은 ISO 입·출차 시각을 조회 키로 싣는다', async ({ page }) => {
    await page.addInitScript((auth) => localStorage.setItem('auth-storage', auth), seedAuth)
    const sDate = encodeURIComponent('2026-10-01 09:00')
    const eDate = encodeURIComponent('2026-10-05 18:00')
    await gotoHydrated(page, `/airport/ticket/9501?sDate=${sDate}&eDate=${eDate}`)

    await page.getByRole('button', { name: '주차권 구매하기' }).click()
    await page.waitForURL(/\/member\?/)

    const url = new URL(page.url())
    expect(url.searchParams.get('flowType')).toBe('period')
    expect(url.searchParams.get('couponSeq')).toBe('9501')
    expect(url.searchParams.get('startDate')).toMatch(/^2026-10-01T/)
    expect(url.searchParams.get('endDate')).toMatch(/^2026-10-05T/)
  })
})
