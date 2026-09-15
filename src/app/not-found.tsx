import { IconChevronRightLine } from '@socar-inc/modu-ui/icons'
import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="flex min-h-full flex-col items-center justify-center px-6 text-center">
      <h1 className="text-text-strong mb-3 text-[20px] font-bold md:text-[24px]">페이지를 찾을 수 없습니다</h1>
      <p className="text-text-sub mb-10 max-w-[320px] text-[14px] leading-relaxed">
        요청하신 페이지가 존재하지 않거나, 주소가 변경되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="rounded-10 bg-primary text-static-white inline-flex items-center gap-2 px-8 py-3.5 text-[14px] font-bold transition-opacity hover:opacity-90 active:opacity-80"
      >
        홈으로 돌아가기
        <IconChevronRightLine className="size-4" />
      </Link>
    </section>
  )
}
