import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

/** "yyyy-MM-dd HH:mm" (모웹 airportParkingInfo 포맷) */
function dateTimeValue(daysFromNow: number, hour: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hour)}:00`
}

test.describe('공항 주차대행 (/airport)', () => {
  test('검색 — 공항·시간 바텀시트 선택 후 목록으로 이동한다', async ({ page }) => {
    await gotoHydrated(page, '/airport')

    await expect(page.getByText('공항 주변 주차대행 예매')).toBeVisible()
    await expect(page.getByText('주차 대행 서비스 안내')).toBeVisible()

    // 종료를 먼저 누르면 안내 모달 (모웹 ExpirationModal)
    await page.getByText('종료 시간을 선택해주세요').click()
    await expect(page.getByText('시작 시간을 먼저 선택해주세요.')).toBeVisible()
    await page.getByRole('button', { name: '확인' }).click()

    // 공항 위치 바텀시트 — 라디오 + 선택완료
    await page.getByText('공항을 선택해주세요').click()
    await expect(page.getByText('공항 위치를 선택해주세요.')).toBeVisible()
    await page.getByText('인천공항 T1').click()
    await page.getByRole('button', { name: '선택완료' }).click()

    // 시작/종료 시간 — 휠 기본값(첫 날짜·첫 슬롯)으로 선택완료
    await page.getByText('시작 시간을 선택해주세요').click()
    await expect(page.getByText('주차 시작 시간을 선택해주세요.')).toBeVisible()
    await page.getByRole('button', { name: '선택완료' }).click()

    await page.getByText('종료 시간을 선택해주세요').click()
    await expect(page.getByText('주차 종료 시간을 선택해주세요.')).toBeVisible()
    await page.getByRole('button', { name: '선택완료' }).click()

    await page.getByRole('button', { name: '검색하기' }).click()
    await page.waitForURL(/\/airport\/tickets\?cgSeq=501/)

    // 목록 — 요약 헤더(변경 버튼) + mock 티켓 + 매진 + 라벨 필터 칩
    await expect(page.getByRole('button', { name: '변경' })).toBeVisible()
    await expect(page.getByText('인천공항 발렛 5일권')).toBeVisible()
    await expect(page.getByText('55,000')).toBeVisible()
    await expect(page.getByText('현재 매진')).toBeVisible()
    await expect(page.getByRole('button', { name: '발렛', exact: true })).toBeVisible()
  })

  test('상세 → 구매 — pay 결제웹뷰(guest, flowType=period)로 진입한다', async ({ page }) => {
    const sDate = encodeURIComponent(dateTimeValue(1, 9))
    const eDate = encodeURIComponent(dateTimeValue(5, 18))
    await gotoHydrated(page, `/airport/ticket/9501?sDate=${sDate}&eDate=${eDate}`)

    // 상세 — 모웹 개편 레이아웃: 요약 + 주차 가능 기간 + 이용 안내
    await expect(page.getByRole('heading', { name: '이용권 상세' })).toBeVisible()
    await expect(page.getByText('인천공항 발렛 5일권')).toBeVisible()
    await expect(page.getByText('주차 가능')).toBeVisible()
    await expect(page.getByText('꼭 확인해주세요')).toBeVisible()
    await expect(page.getByText('출국 2시간 전까지 입차해 주세요.')).toBeVisible()

    // 구매 — pay 결제웹뷰(비회원 guest 진입, flowType=period)로 이동한다
    await page.getByRole('button', { name: '주차권 구매하기' }).click()
    await page.waitForURL(/\/guest\?.*flowType=period.*couponSeq=9501/)
  })
})
