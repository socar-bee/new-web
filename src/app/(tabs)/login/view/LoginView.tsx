'use client'

import Link from 'next/link'

import { IcoEmail, IcoKakao, IcoNaver } from '@/shared/components/icons'

import { useLoginViewModel } from '../viewmodel'

export default function LoginView() {
  const vm = useLoginViewModel()

  return (
    <div className="bg-bg-white flex min-h-full w-full flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.webp" alt="모두의주차장" className="h-10" />
        <p className="text-text-sub mt-1.5" style={{ fontSize: 'var(--text-c2)' }}>
          대한민국 No.1 주차 플랫폼, 모두의주차장
        </p>
      </div>

      {!vm.showEmailForm ? (
        <>
          {/* Social Login Buttons */}
          <div className="mt-6 flex w-full max-w-[300px] flex-col gap-2.5">
            <button
              onClick={vm.handleKakaoLogin}
              className="rounded-12 text-t5 flex w-full items-center justify-center gap-2 bg-[#FEE500] py-3 font-bold text-[#191919] transition-opacity hover:opacity-90 active:opacity-80"
            >
              <IcoKakao />
              카카오로 3초만에 시작하기
            </button>

            <button
              onClick={vm.handleNaverLogin}
              className="rounded-12 text-static-white text-t5 flex w-full items-center justify-center gap-2 bg-[#03C75A] py-3 font-bold transition-opacity hover:opacity-90 active:opacity-80"
            >
              <IcoNaver />
              네이버로 시작하기
            </button>

            <button
              onClick={vm.openEmailForm}
              className="rounded-12 text-static-white text-t5 flex w-full items-center justify-center gap-2 bg-neutral-800 py-3 font-bold transition-opacity hover:opacity-90 active:opacity-80"
            >
              <IcoEmail />
              이메일로 시작하기
            </button>
          </div>

          {vm.error && <p className="text-error-base text-b5 mt-2">{vm.error}</p>}

          {/* Sign up + Guest — 가운데 vertical divider로 두 액션 분리 */}
          <div className="text-text-sub text-c2 mt-5 flex items-center gap-3 font-medium">
            <Link href="/signup" className="hover:text-primary transition-colors">
              회원가입
            </Link>
            <span className="bg-stroke-soft block h-3 w-px" />
            <Link
              href={process.env.NEXT_PUBLIC_WEBAPP_HOST || 'https://app.modu.kr'}
              className="hover:text-text-strong transition-colors"
            >
              비회원으로 둘러보기
            </Link>
          </div>

          {/* Terms */}
          <p className="text-text-soft mt-4 text-center leading-[16px]" style={{ fontSize: 'var(--text-c4)' }}>
            회원가입 시{' '}
            <Link href="#" className="underline">
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="#" className="underline">
              개인정보처리방침
            </Link>
            에 동의하게 됩니다
          </p>
        </>
      ) : (
        <>
          {/* Email Login Form */}
          <div className="mt-6 flex w-full max-w-[300px] flex-col gap-3">
            <div>
              <label className="text-text-sub text-c3 mb-1 block font-medium">이메일</label>
              <input
                type="email"
                value={vm.email}
                onChange={(e) => vm.setEmail(e.target.value)}
                placeholder="example@moduparking.com"
                className="rounded-12 border-stroke-soft text-text-strong placeholder:text-text-soft focus:border-primary text-b4 w-full border px-3.5 py-3 transition-colors outline-none"
                onKeyDown={(e) => e.key === 'Enter' && vm.handleEmailLogin()}
              />
            </div>
            <div>
              <label className="text-text-sub text-c3 mb-1 block font-medium">비밀번호</label>
              <input
                type="password"
                value={vm.password}
                onChange={(e) => vm.setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="rounded-12 border-stroke-soft text-text-strong placeholder:text-text-soft focus:border-primary text-b4 w-full border px-3.5 py-3 transition-colors outline-none"
                onKeyDown={(e) => e.key === 'Enter' && vm.handleEmailLogin()}
              />
            </div>

            {vm.error && <p className="text-error-base text-b5">{vm.error}</p>}

            <button
              onClick={vm.handleEmailLogin}
              disabled={vm.isLoading}
              className="rounded-12 bg-primary text-static-white text-t5 mt-1 w-full py-3 font-bold transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
            >
              {vm.isLoading ? '로그인 중...' : '로그인'}
            </button>

            <button onClick={vm.closeEmailForm} className="text-text-sub hover:text-text-strong text-c2 font-medium">
              다른 방법으로 로그인
            </button>
          </div>
        </>
      )}
    </div>
  )
}
