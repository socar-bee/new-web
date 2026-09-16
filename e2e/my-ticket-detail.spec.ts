import { expect, test } from '@playwright/test'

import { gotoHydrated } from './utils'

const seedAuth = JSON.stringify({
  state: { accessToken: 'E2E_AT', refreshToken: 'RT', userVerificationId: null, isLoggedIn: true, profile: null },
  version: 0
})

test.describe('내주차권 상세 (/my-ticket/[seq])', () => {
  test('회원 — 즉시 상세가 그려진다 (목록 카드 클릭 진입)', async ({ page }) => {
    await page.addInitScript((auth) => localStorage.setItem('auth-storage', auth), seedAuth)
    await gotoHydrated(page, '/tickets')

    // 목록 카드 클릭 → 상세로
    await page.getByText('평일 당일권').click()
    await page.waitForURL(/\/my-ticket\/70001\?type=p/)

    await expect(page.getByRole('heading', { name: '내 주차권' })).toBeVisible()
    await expect(page.getByText('사용 예정')).toBeVisible()
    await expect(page.getByRole('heading', { name: '평일 당일권' })).toBeVisible()
    await expect(page.getByText('12가 3456')).toBeVisible()
    await expect(page.getByText('2026-09-18')).toBeVisible()
    await expect(page.getByText('25,000원')).toBeVisible()
    await expect(page.getByText('서울 성동구 왕십리로 82')).toBeVisible()
    await expect(page.getByText('꼭 확인해주세요')).toBeVisible()
    await expect(page.getByRole('button', { name: '결제 취소' })).toBeVisible()
  })

  test('비회원 — 휴대폰 뒷 4자리 인증 후 상세가 그려진다', async ({ page }) => {
    // 결제 복귀가 남긴 guestSeq 세션
    await page.addInitScript(() => {
      localStorage.removeItem('auth-storage')
      localStorage.setItem('modu:guest-seq', '77')
    })
    await gotoHydrated(page, '/my-ticket/70001?type=p')

    await expect(page.getByText('휴대폰 뒷번호 4자리 입력')).toBeVisible()

    // 오답 → 에러 안내
    await page.getByLabel('휴대폰 뒷번호 4자리').fill('0000')
    await expect(page.getByText('휴대폰 번호가 일치하지 않습니다', { exact: false })).toBeVisible()

    // 정답(3456) → 상세 표시
    await page.getByLabel('휴대폰 뒷번호 4자리').fill('3456')
    await expect(page.getByRole('heading', { name: '평일 당일권' })).toBeVisible()
    await expect(page.getByText('12가 3456')).toBeVisible()
  })

  test('비회원 — guestSeq 세션이 없으면 조회 불가 안내', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('auth-storage')
      localStorage.removeItem('modu:guest-seq')
    })
    await gotoHydrated(page, '/my-ticket/70001?type=p')

    await expect(page.getByText('이 브라우저에서 조회할 수 없어요')).toBeVisible()
  })
})
