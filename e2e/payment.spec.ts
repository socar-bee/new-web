import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

const seoulDate = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })

test.describe('결제 화면 (/payment)', () => {
  test('상세 조회가 화면의 원본이다 — 주차권 정보·금액이 실데이터로 그려진다', async ({ page }) => {
    await gotoHydrated(page, `/payment?couponSeq=9101&parkingDate=${seoulDate()}`)

    // 웹 헤더 제목
    await expect(page.getByRole('heading', { name: '결제하기' })).toBeVisible()

    // 1. 주차권 정보 — 진입 쿼리가 아닌 GET /ticket/{couponSeq} 응답 기준
    await expect(page.getByText('평일 당일권')).toBeVisible()
    await expect(page.getByText('서울숲디티타워 주차장')).toBeVisible()
    await expect(page.getByText('00:00~23:59 이용가능')).toBeVisible()

    // 섹션 골격 — 쿠폰 / 충전금 / 결제 금액 / 결제 수단 / 영수증
    await expect(page.getByText('쿠폰', { exact: true })).toBeVisible()
    await expect(page.getByText('충전금', { exact: true })).toBeVisible()
    await expect(page.getByText('결제 금액')).toBeVisible()
    await expect(page.getByText('결제 수단', { exact: true })).toBeVisible()
    await expect(page.getByText('영수증(현금영수증) 신청')).toBeVisible()

    // CTA — 상품 금액 그대로 (충전금 미사용)
    await expect(page.getByRole('button', { name: '25,000원 결제하기' })).toBeEnabled()
  })

  test('couponSeq 없이 진입하면 잘못된 접근으로 막는다', async ({ page }) => {
    await gotoHydrated(page, '/payment')

    await expect(page.getByText('잘못된 접근입니다.')).toBeVisible()
    await expect(page.getByRole('button', { name: '닫기' })).toBeVisible()
  })

  test('결제 수단 — 다른 결제 수단을 고르면 네이버페이/휴대폰 칩이 나온다', async ({ page }) => {
    await gotoHydrated(page, `/payment?couponSeq=9101&parkingDate=${seoulDate()}`)

    // 기본: 신용/체크카드 + 새 카드 추가 영역
    await expect(page.getByText('+ 새 카드 추가')).toBeVisible()

    await page.getByText('다른 결제 수단').click()
    await expect(page.getByRole('button', { name: '네이버페이' })).toBeVisible()
    await expect(page.getByRole('button', { name: '휴대폰' })).toBeVisible()
    await expect(page.getByText('+ 새 카드 추가')).toHaveCount(0)
  })

  test('비로그인 웹 — 충전금 잔액 0, 모두사용 비활성', async ({ page }) => {
    await gotoHydrated(page, `/payment?couponSeq=9101&parkingDate=${seoulDate()}`)

    await expect(page.getByText('보유 0P')).toBeVisible()
    await expect(page.getByRole('button', { name: '모두사용' })).toBeDisabled()
  })

  test('결제하기 → 결제 완료 화면으로 이어진다', async ({ page }) => {
    await gotoHydrated(page, `/payment?couponSeq=9101&parkingDate=${seoulDate()}`)

    await page.getByRole('button', { name: '25,000원 결제하기' }).click()

    await page.waitForURL(/\/purchase\/result\?/)
    expect(new URL(page.url()).searchParams.get('couponSeq')).toBe('9101')
    await expect(page.getByText('결제가 완료되었어요')).toBeVisible()
    await expect(page.getByRole('button', { name: '주차권 상세 보기' })).toBeVisible()
  })
})

test.describe('결제 화면 — 앱 웹뷰', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36 ParkingShare/400.0.0'
  })

  test('앱 진입 — 웹 헤더는 숨고 충전금 잔액을 브릿지 인증으로 조회한다', async ({ page }) => {
    await gotoHydrated(page, `/payment?couponSeq=9101&parkingDate=${seoulDate()}`)

    await expect(page.locator('header[data-web-only]')).toBeHidden()
    // 앱 판정이면 (브릿지 인터셉터 전제로) 잔액 조회가 돈다 — mock 1,500P
    await expect(page.getByText('보유 1,500P')).toBeVisible()
  })
})
