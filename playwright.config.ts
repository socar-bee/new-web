import { defineConfig, devices } from '@playwright/test'

/**
 * E2E — mock API(4010) 위에서 next dev(4300)를 띄운다.
 * `NEXT_PUBLIC_*` 는 dev 서버 프로세스 env 로 주입한다 (.env.local 보다 우선).
 */
const MOCK_HOST = 'http://127.0.0.1:4010'
const APP_PORT = 4300

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    // 반드시 localhost — 127.0.0.1 로 접근하면 Next dev 가 /_next 요청을
    // cross-origin 으로 차단해 hydration 이 통째로 죽는다 (allowedDevOrigins)
    baseURL: `http://localhost:${APP_PORT}`,
    trace: 'on-first-retry',
    // chromium 기반 모바일 에뮬레이션 (webkit 미설치 환경 고려)
    ...devices['Pixel 7']
  },
  webServer: [
    {
      command: 'node e2e/mock-server.mjs',
      port: 4010,
      reuseExistingServer: !process.env.CI
    },
    {
      command: `next dev -p ${APP_PORT} --turbopack`,
      port: APP_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        APP_ENV: 'local',
        NEXT_PUBLIC_MODU_API_HOST: MOCK_HOST,
        NEXT_PUBLIC_PAY_HOST: MOCK_HOST
      }
    }
  ]
})
