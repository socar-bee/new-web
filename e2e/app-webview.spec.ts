import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

/**
 * 앱 웹뷰 환경 — UA 에 `ParkingShare/{버전}` 이 붙는다 (docs/07-app-webview.md).
 * 인라인 판정 스크립트가 첫 페인트 전에 `<html data-platform="app">` 을 달고,
 * 웹 전용 크롬(`[data-web-only]`)은 CSS 로 숨는다.
 */
test.use({
  userAgent:
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 ParkingShare/400.0.0'
})

test.describe('앱 웹뷰 판정', () => {
  test('html[data-platform=app] 이 달리고 웹 헤더·DockBar 가 숨는다', async ({ page }) => {
    await gotoHydrated(page, '/t/9101')

    await expect(page.locator('html')).toHaveAttribute('data-platform', 'app')

    // 웹 전용 헤더 (네이티브 TopAppBar 가 대신한다)
    await expect(page.locator('header[data-web-only]')).toBeHidden()
    // DockBar (앱은 네이티브 탭)
    await expect(page.locator('nav[data-web-only]')).toBeHidden()

    // 콘텐츠 자체는 그대로 보인다 — 서버 HTML 은 환경과 무관하게 한 벌
    await expect(page.getByText('평일 당일권').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '25,000원 결제하기' })).toBeVisible()
  })

  test('구버전 앱(브릿지 없음) — 결제는 pay 비회원 경로로 폴백한다', async ({ page }) => {
    await gotoHydrated(page, '/t/9101')

    // 브라우저 환경엔 네이티브 transport 가 없어 브릿지 isAvailable=false → 웹(guest-pay) 폴백
    await page.getByRole('button', { name: '25,000원 결제하기' }).click()
    await page.waitForURL(/\/guest\?/)
    expect(new URL(page.url()).searchParams.get('couponSeq')).toBe('9101')
  })
})

test.describe('웹 환경 대조군', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
  })

  test('일반 브라우저 UA 는 data-platform 이 없고 웹 크롬이 보인다', async ({ page }) => {
    await gotoHydrated(page, '/t/9101')

    await expect(page.locator('html')).not.toHaveAttribute('data-platform', 'app')
    await expect(page.locator('header[data-web-only]')).toBeVisible()
    await expect(page.locator('nav[data-web-only]')).toBeVisible()
  })
})
