import type { Metadata, Viewport } from 'next'

import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import '@socar-inc/modu-ui/styles.css'
import './globals.css'

import { PLATFORM_DETECT_SCRIPT } from '@/shared/platform/detect'
import { PlatformProvider } from '@/shared/platform/PlatformProvider'
import QueryProvider from '@/shared/providers/QueryProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover'
}

export const metadata: Metadata = {
  title: '모두의주차장',
  description: '주차장 검색부터 주차권 구매까지, 모두의주차장',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/favicon.ico'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans">
        {/* 첫 페인트 전에 앱 웹뷰 판정 — hydration 뒤에 달면 웹 전용 UI 가 깜빡인다 */}
        <script dangerouslySetInnerHTML={{ __html: PLATFORM_DETECT_SCRIPT }} />
        <QueryProvider>
          <PlatformProvider>
            <div className="mx-auto h-dvh w-full max-w-[480px] overflow-hidden shadow-[0_0_12px_rgba(0,0,0,0.04)]">
              {children}
            </div>
          </PlatformProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
