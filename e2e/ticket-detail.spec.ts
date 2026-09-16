import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

/** Asia/Seoul 기준 오늘/내일 (yyyy-MM-dd) — 앱과 같은 기준으로 날짜 셀을 검증한다 */
const seoulDate = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

test.describe('주차권 상세 — 당일권 (판매중)', () => {
  test('헤더·상품 정보·이용 안내가 modu-android 스펙으로 그려진다', async ({ page }) => {
    await gotoHydrated(page, '/t/9101')

    // 웹 헤더 — 고정 제목 「이용권 상세」
    await expect(page.getByRole('heading', { name: '이용권 상세' })).toBeVisible()

    // 헤더 섹션 — 주차장명 · 주차권명 + 가격 · 이용기간
    await expect(page.getByText('서울숲디티타워 주차장').first()).toBeVisible()
    await expect(page.getByText('평일 당일권').first()).toBeVisible()
    await expect(page.getByText('25,000원', { exact: true })).toBeVisible()
    await expect(page.getByText('00:00~23:59 이용가능').first()).toBeVisible()

    // 이용 안내 — 꼭 확인해주세요(notice2) + 면책 문구
    await expect(page.getByText('이용 안내')).toBeVisible()
    await expect(page.getByText('꼭 확인해주세요')).toBeVisible()
    await expect(page.getByText('현장에서 발생한 사고는 일체 책임지지 않으며', { exact: false })).toBeVisible()
  })

  test('날짜 셀 — 7일 노출, 오늘 선택, 탭하면 parkingDate 가 바뀐다', async ({ page }) => {
    await gotoHydrated(page, '/t/9101')

    const cells = page.locator('button[aria-pressed]')
    await expect(cells).toHaveCount(7)

    // 오늘 셀이 선택 상태
    await expect(cells.first()).toHaveAttribute('aria-pressed', 'true')
    await expect(cells.first()).toContainText('오늘')

    // 내일 셀 탭 → 쿼리의 parkingDate 갱신 + 선택 이동
    await cells.nth(1).click()
    await expect(page).toHaveURL(new RegExp(`parkingDate=${seoulDate(1)}`))
    await expect(cells.nth(1)).toHaveAttribute('aria-pressed', 'true')
  })

  test('CTA 「25,000원 결제하기」 → pay 비회원(guest-pay) 경로로 이동한다', async ({ page }) => {
    await gotoHydrated(page, `/t/9101?parkingDate=${seoulDate()}`)

    const cta = page.getByRole('button', { name: '25,000원 결제하기' })
    await expect(cta).toBeEnabled()
    await cta.click()

    // {PAY_HOST}/guest?couponSeq&parkingDate&guestSeq — 같은 탭 이동, 토큰 없음 (pay guestEntry 계약)
    await page.waitForURL(/\/guest\?/)
    const url = new URL(page.url())
    expect(url.pathname).toBe('/guest')
    expect(url.searchParams.get('couponSeq')).toBe('9101')
    expect(url.searchParams.get('parkingDate')).toBe(seoulDate())
    expect(url.searchParams.get('guestSeq')).toBe('0')
  })

  test('이런 이용권은 어떠세요? — 현재권 제외 목록, 탭하면 해당 상세로 이동', async ({ page }) => {
    await gotoHydrated(page, '/t/9101')

    await expect(page.getByText('이런 이용권은 어떠세요?')).toBeVisible()
    // 현재권(9101)은 목록에서 빠진다
    const recommendSection = page.locator('section', { hasText: '이런 이용권은 어떠세요?' })
    await expect(recommendSection.getByRole('button', { name: /평일 당일권/ })).toHaveCount(0)

    await recommendSection.getByRole('button', { name: /월정기권/ }).click()
    await expect(page).toHaveURL(/\/t\/9102/)
  })
})

test.describe('주차권 상세 — 타입·상태별 분기', () => {
  test('월정기권 — 날짜 셀 숨김, CTA 는 앱 유도', async ({ page }) => {
    await gotoHydrated(page, '/t/9102')

    await expect(page.getByText('월정기권').first()).toBeVisible()
    await expect(page.getByText('220,000원', { exact: true })).toBeVisible()

    // Monthly 는 날짜 피커를 그리지 않는다 (modu-android showDatePicker)
    await expect(page.locator('button[aria-pressed]')).toHaveCount(0)

    const cta = page.getByRole('button', { name: '모두의주차장 앱에서 구매하기' })
    await expect(cta).toBeEnabled()
  })

  test('매진 — CTA 「매진」 disabled', async ({ page }) => {
    await gotoHydrated(page, '/t/9103')

    const cta = page.getByRole('button', { name: '매진', exact: true })
    await expect(cta).toBeVisible()
    await expect(cta).toBeDisabled()
  })

  test('판매예정 — CTA 「M/d(요일) HH:mm부터 구매가능」 disabled', async ({ page }) => {
    await gotoHydrated(page, '/t/9104')

    // purchaseOpenDateTime 2026-09-20T16:00 → 9/20(일) 16:00부터 구매가능
    const cta = page.getByRole('button', { name: '9/20(일) 16:00부터 구매가능' })
    await expect(cta).toBeVisible()
    await expect(cta).toBeDisabled()
  })
})
