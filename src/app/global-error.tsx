'use client'
import { IconChevronRightLine } from '@socar-inc/modu-ui/icons'
import Link from 'next/link'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <section className="flex h-dvh flex-col items-center justify-center px-6 text-center">
          <h1 className="text-text-strong mb-3 text-[20px] font-bold md:text-[24px]">일시적인 오류가 발생했습니다</h1>
          <p className="text-text-sub mb-10 max-w-[320px] text-[14px] leading-relaxed">
            잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터(1899-8242)로 문의해 주세요.
          </p>
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={reset}
              className="rounded-10 bg-primary inline-flex items-center gap-2 px-8 py-3.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 active:opacity-80"
            >
              다시 시도하기
              <IconChevronRightLine className="size-4" />
            </button>
            <Link href="/" className="text-text-sub hover:text-text-strong text-[14px] font-medium transition-colors">
              홈으로 돌아가기 →
            </Link>
          </div>
        </section>
      </body>
    </html>
  )
}
