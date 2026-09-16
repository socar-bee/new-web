import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

test.describe('공유주차장 상세 (/s/[id]) — modu-web-app /s 기준', () => {
  test('타이틀·공유 배지·주차 시작하기 CTA·정보 섹션이 그려진다', async ({ page }) => {
    await gotoHydrated(page, '/s/8001')

    // 타이틀 + 공유 배지 + 면수
    await expect(page.getByRole('heading', { name: '성수 공유주차장' })).toBeVisible()
    await expect(page.getByText('공유').first()).toBeVisible()
    await expect(page.getByText('3면').first()).toBeVisible()

    // CTA — modu-web-app /s 와 동일 카피
    await expect(page.getByText('주차 시작하기')).toBeVisible()
    await expect(page.getByText('결제 직후 바로 주차가 시작 됩니다.')).toBeVisible()

    // 주소 + 요금(60분 기준) + 운영 시간
    await expect(page.getByText('서울 성동구 아차산로 49')).toBeVisible()
    await expect(page.getByText('1시간 기준 1,200원')).toBeVisible()
    await expect(page.getByText('추가요금')).toBeVisible()

    // 개별 유의사항(caution)
    await expect(page.getByText('거주자 우선구역과 혼동 주의')).toBeVisible()
  })

  test('운영 시간 — 일요일이 맨 뒤로 회전된다', async ({ page }) => {
    await gotoHydrated(page, '/s/8001')

    await expect(page.getByText('평일', { exact: true })).toBeVisible()
    // 일요일 row 가 평일 row 보다 아래에 위치 (fixture 는 일요일이 맨 앞)
    const weekdayBox = await page.getByText('평일', { exact: true }).boundingBox()
    const sundayBox = await page.getByText('일요일', { exact: true }).boundingBox()
    expect(weekdayBox && sundayBox && sundayBox.y > weekdayBox.y).toBeTruthy()
  })

  test('주차 시작하기 — 결제 미연동 상태에선 준비중 토스트', async ({ page }) => {
    await gotoHydrated(page, '/s/8001')

    await page.getByText('주차 시작하기').click()
    await expect(page.getByText('준비중인 서비스입니다')).toBeVisible()
  })
})
