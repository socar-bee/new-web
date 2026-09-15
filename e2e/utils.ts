import type { Page } from '@playwright/test'

/**
 * 이동 후 hydration 까지 기다린다 — SSR HTML 은 hydration 전에도 보여서
 * 그냥 클릭하면 이벤트가 유실된다 (PlatformProvider 가 `data-hydrated` 를 단다).
 */
export async function gotoHydrated(page: Page, url: string) {
  await page.goto(url)
  await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' })
}
