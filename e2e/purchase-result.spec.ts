import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

test.describe('결제 완료 (/purchase/result)', () => {
  test('완료 메시지와 확인 버튼이 그려진다', async ({ page }) => {
    await gotoHydrated(page, '/purchase/result')

    await expect(page.getByText('결제가 완료되었어요')).toBeVisible()
    await expect(page.getByRole('button', { name: '확인' })).toBeEnabled()
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
