import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

/**
 * pay 비회원(guest-pay) 결제 복귀 계약:
 * 성공  ?result=success&type=p&parkingSeq={couSeq}&guestCode=..&guestSeq=..
 * 실패  ?result=fail&type=p&couponSeq=..&guestSeq=..
 */
test.describe('결제 결과 (/purchase/result)', () => {
  test('guest-pay 성공 복귀 — 완료 메시지가 그려진다', async ({ page }) => {
    await gotoHydrated(page, '/purchase/result?result=success&type=p&parkingSeq=90001&guestCode=abc123&guestSeq=0')

    await expect(page.getByText('결제가 완료되었어요')).toBeVisible()
    await expect(page.getByRole('button', { name: '확인' })).toBeEnabled()
  })

  test('guest-pay 실패 복귀 — 다시 시도하면 주차권 상세로 돌아간다', async ({ page }) => {
    await gotoHydrated(page, '/purchase/result?result=fail&type=p&couponSeq=9101&guestSeq=0')

    await expect(page.getByText('결제를 완료하지 못했어요')).toBeVisible()
    await page.getByRole('button', { name: '다시 시도하기' }).click()
    await expect(page).toHaveURL(/\/t\/9101/)
  })

  test('쿼리 없이 진입해도 완료 화면이 그려진다', async ({ page }) => {
    await gotoHydrated(page, '/purchase/result')

    await expect(page.getByText('결제가 완료되었어요')).toBeVisible()
    // couponSeq 없이 진입하면 상세 보기 버튼은 없다
    await expect(page.getByRole('button', { name: '주차권 상세 보기' })).toHaveCount(0)
  })

  test('couponSeq 쿼리가 있으면 주차권 상세로 돌아갈 수 있다', async ({ page }) => {
    await gotoHydrated(page, '/purchase/result?couponSeq=9101')

    await page.getByRole('button', { name: '주차권 상세 보기' }).click()
    await expect(page).toHaveURL(/\/t\/9101/)
  })

  test('확인 → 홈으로 이동한다 (웹)', async ({ page }) => {
    await gotoHydrated(page, '/purchase/result')

    await page.getByRole('button', { name: '확인' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
