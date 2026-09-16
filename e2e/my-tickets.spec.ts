import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

/** 로그인 상태를 만든다 — authStore 는 zustand persist(localStorage 'auth-storage') */
const seedAuth = (token: string) =>
  JSON.stringify({
    state: { accessToken: token, refreshToken: 'RT', userVerificationId: null, isLoggedIn: true, profile: null },
    version: 0
  })

test.describe('내 주차권 (/tickets)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((auth) => localStorage.setItem('auth-storage', auth), seedAuth('E2E_AT'))
  })

  test('활성 주차권 리스트 — 주차장·차량번호·이용일·주차권명·상태가 그려진다', async ({ page }) => {
    await gotoHydrated(page, '/tickets')

    await expect(page.getByRole('heading', { name: '내 주차권' })).toBeVisible()

    // 사용 예정 당일권
    await expect(page.getByText('평일 당일권')).toBeVisible()
    await expect(page.getByText('서울숲디티타워 주차장')).toBeVisible()
    await expect(page.getByText('12가 3456')).toBeVisible()
    await expect(page.getByText('2026-09-18')).toBeVisible()
    await expect(page.getByText('사용 예정')).toBeVisible()

    // 확인중 월정기
    await expect(page.getByText('월정기권')).toBeVisible()
    await expect(page.getByText('확인중')).toBeVisible()
    await expect(page.getByText('2026-09-01 ~ 2026-09-30')).toBeVisible()

    // 환불 완료 + 차량 미등록 폴백
    await expect(page.getByText('환불 완료')).toBeVisible()
    await expect(page.getByText('차량 미등록')).toBeVisible()
  })

  test('미로그인 — 로그인 화면이 뜬다', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('auth-storage'))
    await gotoHydrated(page, '/tickets')

    await expect(page.getByRole('heading', { name: '내 주차권' })).toBeHidden()
  })
})
