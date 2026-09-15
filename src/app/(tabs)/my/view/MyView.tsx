'use client'

import {
  IconBellLine,
  IconCheckLine,
  IconChevronRightLine,
  IconCouponLine,
  IconDocumentLine,
  IconHeadsetLine,
  IconLogoutLine,
  IconMyFill,
  IconParkingticketLine,
  IconPointLine,
  IconSettingLine,
  IconStarLine,
  IconWonLine
} from '@socar-inc/modu-ui/icons'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'

import { useMyViewModel } from '../viewmodel'
import type { UserAuth, UserProfile } from '@/shared/types/auth'

export default function MyView() {
  const vm = useMyViewModel()

  return (
    <main className="bg-bg-weak flex min-h-full flex-col">
      {/* App Bar */}
      <header className="bg-bg-white sticky top-0 z-10 flex h-14 items-center justify-between px-5">
        <h1 className="text-text-strong text-[20px] font-extrabold tracking-tight">MY</h1>
        <div className="flex items-center gap-1">
          <AppBarBtn ariaLabel="알림" onClick={vm.goNotices} dot={(vm.profile?.noticeCount ?? 0) > 0}>
            <IconBellLine className="size-[22px]" />
          </AppBarBtn>
          <AppBarBtn ariaLabel="설정" onClick={vm.goCustomerCenter}>
            <IconSettingLine className="size-[22px]" />
          </AppBarBtn>
        </div>
      </header>

      {/* Profile */}
      <section className="bg-bg-white px-5 pt-5 pb-5">
        {vm.isLoading && !vm.profile ? (
          <ProfileSkeleton />
        ) : vm.profile ? (
          <ProfileRow profile={vm.profile} />
        ) : (
          <ProfileError onRetry={vm.refetch} />
        )}
      </section>

      {/* 본인인증 */}
      {vm.profile && !vm.profile.isVerifiedUser && (
        <>
          <div className="bg-bg-weak h-2" />
          <section className="bg-bg-white px-5 py-3">
            <VerifyBanner />
          </section>
        </>
      )}

      {/* Wallet */}
      <div className="bg-bg-weak h-2" />
      <section className="bg-bg-white px-5 py-1">
        <MenuRow
          icon={<IconParkingticketLine className="size-[18px]" />}
          label="주차권"
          value={vm.profile?.paymentcount ?? 0}
          unit="매"
          onClick={vm.goTickets}
        />
        <MenuRow
          icon={<IconCouponLine className="size-[18px]" />}
          label="쿠폰함"
          value={0}
          unit="매"
          onClick={vm.goTickets}
        />
        <MenuRow
          icon={<IconWonLine className="size-[18px]" />}
          label="충전금"
          value={0}
          unit="P"
          onClick={vm.goTickets}
        />
        <MenuRow
          icon={<IconPointLine className="size-[18px]" />}
          label="적립금"
          value={0}
          unit="P"
          onClick={vm.goTickets}
          last
        />
      </section>

      {/* Menu */}
      <div className="bg-bg-weak h-2" />
      <section className="bg-bg-white px-5 py-1">
        <MenuRow
          icon={<IconBellLine className="size-[18px]" />}
          label="공지사항"
          value={vm.profile?.noticeCount ?? 0}
          unit="건"
          onClick={vm.goNotices}
        />
        <MenuRow icon={<HeartMenuIcon />} label="즐겨찾기" onClick={vm.goFavorites} />
        <MenuRow icon={<IconStarLine className="size-[18px]" />} label="내 후기" onClick={vm.goReviews} />
        <MenuRow icon={<IconHeadsetLine className="size-[18px]" />} label="고객센터" onClick={vm.goCustomerCenter} />
        <MenuRow
          icon={<IconDocumentLine className="size-[18px]" />}
          label="이용약관 · 개인정보 처리방침"
          onClick={vm.goCustomerCenter}
          last
        />
      </section>

      {/* Footer */}
      <div className="bg-bg-weak h-2" />
      <section className="bg-bg-white flex items-center justify-between px-5 pt-4 pb-4">
        <button
          onClick={vm.handleLogout}
          className="text-text-soft hover:text-text-sub flex cursor-pointer items-center gap-1.5 text-[13px] transition-colors"
        >
          <IconLogoutLine className="size-[15px]" />
          로그아웃
        </button>
        <span className="text-text-disabled text-[11px] tabular-nums">v 1.0.0</span>
      </section>
    </main>
  )
}

/* ─── App Bar Button ─── */
function AppBarBtn({
  children,
  ariaLabel,
  onClick,
  dot
}: {
  children: React.ReactNode
  ariaLabel: string
  onClick: () => void
  dot?: boolean
}) {
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className="active:bg-bg-weak relative flex size-9 cursor-pointer items-center justify-center rounded-full text-neutral-700 transition-colors"
    >
      {children}
      {dot && <span className="bg-primary ring-bg-white absolute top-1.5 right-2 size-1.5 rounded-full ring-2" />}
    </button>
  )
}

/* ─── Profile Row ─── */
function ProfileRow({ profile }: { profile: UserProfile }) {
  const linked = useMemo(() => buildSocials(profile.userAuth), [profile.userAuth])

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-4"
    >
      <Avatar src={profile.profileThumbnail} name={profile.userName} verified={profile.isVerifiedUser} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-text-strong truncate text-[17px] font-extrabold tracking-tight">
            {profile.userName || '이름 없음'}
          </span>
          {profile.isVerifiedUser && (
            <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
              인증 완료
            </span>
          )}
        </div>
        <p className="text-text-sub truncate text-[13px]">{profile.email}</p>
        {linked.length > 0 && (
          <div className="mt-1 flex items-center gap-1">
            {linked.map((s) => (
              <span
                key={s.key}
                title={s.name}
                className="flex size-[15px] items-center justify-center rounded-full text-[8px] font-extrabold"
                style={{ backgroundColor: s.bg, color: s.fg }}
              >
                {s.short}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function buildSocials(auth: UserAuth) {
  const list: { key: string; name: string; short: string; bg: string; fg: string }[] = []
  if (auth.isKakao) list.push({ key: 'kakao', name: '카카오', short: 'K', bg: '#FEE500', fg: '#191919' })
  if (auth.isNaver) list.push({ key: 'naver', name: '네이버', short: 'N', bg: '#03C75A', fg: '#fff' })
  if (auth.isApple) list.push({ key: 'apple', name: 'Apple', short: '', bg: '#0e121b', fg: '#fff' })
  if (auth.isFacebook) list.push({ key: 'fb', name: 'Facebook', short: 'f', bg: '#1877F2', fg: '#fff' })
  if (auth.isCitypass) list.push({ key: 'citypass', name: '시티패스', short: 'C', bg: '#af47ff', fg: '#fff' })
  return list
}

/* ─── Avatar ─── */
function Avatar({ src, name, verified }: { src?: string; name: string; verified?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const initial = (name?.trim() ?? '').charAt(0).toUpperCase()
  const showImage = !!src && failedSrc !== src

  return (
    <span className="relative size-[60px] shrink-0">
      <span className="bg-bg-soft ring-stroke-soft/60 block size-full overflow-hidden rounded-full ring-1 ring-inset">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="프로필"
            className="h-full w-full object-cover"
            draggable={false}
            onError={() => setFailedSrc(src ?? null)}
          />
        ) : initial ? (
          <span
            className="text-static-white flex h-full w-full items-center justify-center text-[20px] font-extrabold"
            style={{ background: 'linear-gradient(135deg,var(--color-brand-200),var(--color-primary))' }}
          >
            {initial}
          </span>
        ) : (
          <span className="text-text-disabled flex h-full w-full items-center justify-center">
            <IconMyFill className="size-[26px]" />
          </span>
        )}
      </span>
      {verified && (
        <span className="bg-primary text-static-white ring-bg-white absolute -right-0.5 -bottom-0.5 flex size-[16px] items-center justify-center rounded-full ring-2">
          <IconCheckLine className="size-[9px]" />
        </span>
      )}
    </span>
  )
}

/* ─── Verify Banner ─── */
function VerifyBanner() {
  return (
    <button className="border-primary/20 bg-primary/5 flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 text-left">
      <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-primary text-[14px] font-bold">본인인증을 진행해 주세요</span>
        <span className="text-text-sub text-[12px]">사전예약 · 결제를 위해 필요해요</span>
      </div>
      <IconChevronRightLine className="text-text-disabled size-4" />
    </button>
  )
}

/* ─── Menu Row ─── */
function MenuRow({
  icon,
  label,
  sub,
  value,
  unit,
  badge,
  onClick,
  last
}: {
  icon: React.ReactNode
  label: string
  sub?: string
  value?: number
  unit?: string
  badge?: number
  onClick: () => void
  last?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="active:bg-bg-soft/40 flex w-full cursor-pointer items-center gap-3 text-left transition-colors"
    >
      <span className="text-text-sub flex size-[22px] shrink-0 items-center justify-center">{icon}</span>
      <div className={`flex flex-1 items-center gap-2 py-[15px] ${last ? '' : 'border-stroke-soft/60 border-b'}`}>
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="text-text-strong text-[14px] font-semibold">{label}</span>
          {sub && <span className="text-text-soft text-[12px]">{sub}</span>}
        </div>
        {value != null && (
          <span className="text-text-sub flex items-center gap-1 text-[13px] tabular-nums">
            <span className="text-primary font-semibold">{value}</span>
            {unit && <span>{unit}</span>}
          </span>
        )}
        {badge != null && badge > 0 && (
          <span className="bg-primary text-static-white flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold">
            {badge}
          </span>
        )}
        <IconChevronRightLine className="text-text-disabled size-3.5 shrink-0" />
      </div>
    </button>
  )
}

/* ─── Skeleton & Error ─── */
function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <div className="bg-bg-soft size-[60px] shrink-0 animate-pulse rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="bg-bg-soft h-5 w-28 animate-pulse rounded" />
        <div className="bg-bg-soft h-3.5 w-40 animate-pulse rounded" />
      </div>
    </div>
  )
}

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-text-sub text-[13px]">프로필을 불러오지 못했어요</p>
      <button
        onClick={onRetry}
        className="bg-primary text-static-white cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-semibold"
      >
        다시 시도
      </button>
    </div>
  )
}

/* ─── Icons ─── */
// HeartMenuIcon은 modu-ui에 대응 아이콘이 없어 유지
function HeartMenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}
