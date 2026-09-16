'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'

import type { FavoriteParking } from '@/shared/hooks/useFavorites'

import { useFavoritesViewModel } from '../viewmodel'

export default function FavoritesView() {
  const vm = useFavoritesViewModel()

  return (
    <main className="bg-bg-white flex min-h-full flex-col">
      <Header
        count={vm.favorites.length}
        sort={vm.sort}
        onSortChange={vm.setSort}
        onRequestClear={() => vm.setConfirmClear(true)}
      />

      {!vm.hydrated ? (
        <ListSkeleton />
      ) : vm.isEmpty ? (
        <EmptyState onCtaClick={vm.goToMap} />
      ) : (
        <ul className="flex flex-col gap-2 px-5 pt-3 pb-10">
          <AnimatePresence initial={false}>
            {vm.favorites.map((f) => (
              <FavoriteCard key={f.seq} favorite={f} onSelect={vm.goToParking} onRemove={vm.remove} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AnimatePresence>
        {vm.confirmClear && (
          <ConfirmClearDialog onConfirm={vm.handleClear} onCancel={() => vm.setConfirmClear(false)} />
        )}
      </AnimatePresence>
    </main>
  )
}

/* ─── Header ─── */
function Header({
  count,
  sort,
  onSortChange,
  onRequestClear
}: {
  count: number
  sort: 'recent' | 'name'
  onSortChange: (s: 'recent' | 'name') => void
  onRequestClear: () => void
}) {
  return (
    <header className="bg-bg-white border-stroke-soft sticky top-0 z-10 border-b">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-text-strong text-h4 flex items-baseline gap-1.5 font-extrabold">
          즐겨찾기
          {count > 0 && <span className="text-primary text-b4 tabular-nums">{count}</span>}
        </h1>
        {count > 0 && (
          <button onClick={onRequestClear} className="text-text-sub text-c3 cursor-pointer font-medium">
            전체삭제
          </button>
        )}
      </div>
      {count > 0 && (
        <div className="flex gap-1.5 px-5 pb-3">
          <SortPill active={sort === 'recent'} onClick={() => onSortChange('recent')}>
            최근순
          </SortPill>
          <SortPill active={sort === 'name'} onClick={() => onSortChange('name')}>
            이름순
          </SortPill>
        </div>
      )}
    </header>
  )
}

function SortPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-t6 cursor-pointer rounded-full px-3 py-1.5 font-semibold transition-colors ${
        active ? 'bg-primary text-static-white' : 'bg-bg-soft text-text-sub'
      }`}
    >
      {children}
    </button>
  )
}

/* ─── Empty State ─── */
function EmptyState({ onCtaClick }: { onCtaClick: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 py-16">
      <span className="flex size-24 items-center justify-center" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/icn_favorite.webp"
          alt=""
          width={96}
          height={96}
          className="size-24 object-contain"
          draggable={false}
        />
      </span>
      <div className="flex flex-col items-center gap-2">
        <p className="text-text-strong text-t4 font-bold">아직 즐겨찾기가 없어요</p>
        <p className="text-text-soft text-b4 text-center">
          자주 가는 주차장을 즐겨찾기에 추가하면
          <br />
          빠르게 찾아볼 수 있어요
        </p>
      </div>
      <button
        onClick={onCtaClick}
        className="bg-primary text-static-white text-t5 mt-1 cursor-pointer rounded-full px-6 py-3 font-semibold transition-transform active:scale-95"
      >
        지도에서 찾아보기
      </button>
    </div>
  )
}

/* ─── List Skeleton ─── */
function ListSkeleton() {
  return (
    <ul className="flex flex-col gap-2 px-5 pt-3 pb-10">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="bg-bg-soft border-stroke-soft flex items-center gap-3 rounded-2xl border p-3">
          <div className="bg-bg-weak size-16 shrink-0 animate-pulse rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="bg-bg-weak h-4 w-32 animate-pulse rounded" />
            <div className="bg-bg-weak h-3 w-20 animate-pulse rounded" />
          </div>
        </li>
      ))}
    </ul>
  )
}

/* ─── Favorite Card ─── */
const FavoriteCard = memo(function FavoriteCard({
  favorite,
  onSelect,
  onRemove
}: {
  favorite: FavoriteParking
  onSelect: (favorite: FavoriteParking) => void
  onRemove: (seq: number) => void
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="bg-bg-white border-stroke-soft flex items-center gap-3 rounded-2xl border p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      <button
        onClick={() => onSelect(favorite)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
      >
        <FavoriteThumbnail src={favorite.image} alt={favorite.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-text-strong text-t4 truncate font-semibold">{favorite.name}</p>
          {favorite.areaLabel && <p className="text-text-soft text-b5 truncate">{favorite.areaLabel}</p>}
          <p className="text-text-disabled text-b5 tabular-nums">{formatRelative(favorite.addedAt)}</p>
        </div>
      </button>
      <button
        onClick={() => onRemove(favorite.seq)}
        aria-label={`${favorite.name} 즐겨찾기 해제`}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform active:scale-90"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/icn_favorite.webp"
          alt=""
          width={22}
          height={22}
          draggable={false}
          className="size-[22px] object-contain"
        />
      </button>
    </motion.li>
  )
})

/* ─── Thumbnail with image-error fallback ─── */
function FavoriteThumbnail({ src, alt }: { src?: string; alt: string }) {
  // 실패한 src를 기억해서 동일 src에서만 fallback 표시 → src 변경 시 자연스럽게 reset
  const [erroredSrc, setErroredSrc] = useState<string | null>(null)
  const errored = src != null && src === erroredSrc

  if (!src || errored) {
    return (
      <div className="bg-bg-soft relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-stroke-sub">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="9" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M3 17l4-4 3 2 5-5 6 6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="bg-bg-soft relative size-16 shrink-0 overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        onError={() => setErroredSrc(src)}
        className="h-full w-full object-cover select-none"
      />
    </div>
  )
}

function formatRelative(addedAt: number): string {
  const diff = Date.now() - addedAt
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return '오늘 추가'
  if (diff < 7 * day) return `${Math.floor(diff / day)}일 전 추가`
  const d = new Date(addedAt)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} 추가`
}

/* ─── Confirm Clear ─── */
function ConfirmClearDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[480px] bg-black/50"
        style={{ bottom: 'var(--dock-height, 0px)' }}
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed top-1/2 left-1/2 z-50 w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl"
      >
        <p className="text-text-strong text-t4 text-center font-semibold">
          모든 즐겨찾기를
          <br />
          삭제할까요?
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="bg-bg-soft text-text-strong text-t5 flex-1 cursor-pointer rounded-xl py-2.5 font-semibold"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="bg-primary text-static-white text-t5 flex-1 cursor-pointer rounded-xl py-2.5 font-semibold"
          >
            삭제
          </button>
        </div>
      </motion.div>
    </>
  )
}
