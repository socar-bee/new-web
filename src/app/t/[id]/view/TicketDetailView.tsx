'use client'

import { MButton, MIcon, MText } from '@socar-inc/modu-ui/components'
import { IconAlertFill, IconChevronLeftLine, IconChevronRightLine, IconXLine } from '@socar-inc/modu-ui/icons'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import DockBar from '@/shared/components/layout/DockBar'

import type { DateCellModel } from '../viewmodel/useTicketDetailViewModel'

import { TICKET_DETAIL_TITLE, useTicketDetailViewModel } from '../viewmodel'
import type { ParkingLotDetail, TicketDetail, TicketListItem, TicketPhoto } from '@/shared/types/parking'

interface TicketDetailViewProps {
  couponSeq: number
  initialTicket?: TicketDetail
  parkingTickets?: TicketListItem[]
  pin?: ParkingLotDetail
}

/**
 * 주차권 상세 — modu-android `ticket/detail/TicketDetailScreen.kt` 기준 재구성.
 * bg-weak 바탕 위에 흰 섹션 카드가 8px 간격으로 얹힌다.
 * 웹 전용 크롬(헤더·DockBar)은 data-web-only — 앱 웹뷰에서는 네이티브 상단바가 대신한다.
 */
export default function TicketDetailView({ couponSeq, initialTicket, parkingTickets, pin }: TicketDetailViewProps) {
  const vm = useTicketDetailViewModel({ couponSeq, initialTicket, parkingTickets, pin })
  const [viewer, setViewer] = useState<{ open: boolean; startIndex: number }>({ open: false, startIndex: 0 })

  if (vm.isLoading || !vm.ticket) {
    return (
      <div className="flex h-full flex-col">
        <main className="flex flex-1 items-center justify-center">
          <MText typography="body_b4" color="text_soft_400">
            로딩 중…
          </MText>
        </main>
        <DockBar />
      </div>
    )
  }

  const t = vm.ticket
  const parkinglotName = pin?.basic.name ?? t.parkinglot?.parkinglotName
  const periodLabel = t.usagePeriodLabel || t.usingTimeLabel

  return (
    <div className="flex h-full flex-col">
      <main className="bg-bg-weak scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto">
        {/* ─── 웹 전용 헤더 — 앱은 네이티브 TopAppBar 가 맡는다 ─── */}
        <header
          data-web-only
          className="bg-bg-white sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between px-1"
        >
          <button
            onClick={vm.goBack}
            aria-label="뒤로"
            className="flex size-11 cursor-pointer items-center justify-center"
          >
            <MIcon icon={IconChevronLeftLine} size={24} decorative />
          </button>
          <h1 className="modu-typography-title-t4 text-text-strong mx-1 flex-1 truncate text-center">
            {TICKET_DETAIL_TITLE}
          </h1>
          <div className="size-11 shrink-0" />
        </header>

        {/* ─── 헤더 섹션 — 주차장명 · 주차권명+가격 · 이용기간 · 날짜 선택 ─── */}
        <section className="bg-bg-white flex flex-col gap-6 py-6">
          <div className="flex flex-col gap-2 px-4">
            {parkinglotName && (
              <button
                onClick={() => pin && vm.goToParkinglotDetail(pin.seq)}
                disabled={!pin}
                className={`flex items-center gap-0.5 self-start ${pin ? 'cursor-pointer' : ''}`}
              >
                <MText typography="title_t4" color="text_sub_600" className="truncate">
                  {parkinglotName}
                </MText>
                {pin && <MIcon icon={IconChevronRightLine} size={16} color="icon_sub_600" decorative />}
              </button>
            )}
            <div className="flex items-baseline gap-2">
              <MText typography="heading_h4" color="text_strong_950" className="min-w-0 truncate">
                {t.couponName}
              </MText>
              <MText typography="heading_h4" color="text_strong_950" className="shrink-0 tabular-nums">
                {t.price.toLocaleString()}원
              </MText>
            </div>
            {periodLabel && (
              <MText typography="title_t4" color="text_strong_950">
                {periodLabel}
              </MText>
            )}
          </div>

          {/* 날짜 선택 — Daily 만 (Monthly 숨김), 일요일만 빨간색 */}
          {vm.showDatePicker && (
            <div className="scrollbar-hide overflow-x-auto">
              <div className="flex w-max gap-2 px-4">
                {vm.dateCells.map((cell) => (
                  <DateCell key={cell.date} cell={cell} onSelect={vm.selectDate} />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ─── 주차장 사진 ─── */}
        {t.photos.length > 0 && (
          <section className="bg-bg-white mt-2 flex flex-col gap-4 py-6">
            <MText typography="title_t2" color="text_strong_950" className="px-4">
              주차장 사진
            </MText>
            <div className="scrollbar-hide overflow-x-auto">
              <div className="flex w-max gap-2 px-4">
                {t.photos.map((photo, index) => (
                  <button
                    key={photo.fileName}
                    onClick={() => setViewer({ open: true, startIndex: index })}
                    aria-label="주차장 사진 크게 보기"
                    className="border-stroke-soft bg-bg-soft rounded-8 relative h-[144px] w-[256px] shrink-0 cursor-pointer overflow-hidden border"
                  >
                    <Image
                      src={photo.fileName}
                      alt={photo.pictureDesc ?? ''}
                      fill
                      sizes="256px"
                      className="object-cover"
                      priority={index === 0}
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── 이용 안내 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col gap-4 py-6">
          <MText typography="title_t2" color="text_strong_950" className="px-4">
            이용 안내
          </MText>
          <div className="flex flex-col gap-4 px-4">
            {/* 꼭 확인해주세요 — 서버 notice2 */}
            {t.notice2 && (
              <div className="bg-information-lighter rounded-8 flex flex-col gap-2 p-4">
                <div className="flex items-center gap-1.5">
                  <MIcon icon={IconAlertFill} size={16} decorative className="text-information-base" />
                  <span className="modu-typography-title-t4 text-information-dark">꼭 확인해주세요</span>
                </div>
                <NoticeDotList body={t.notice2} className="text-information-dark" />
              </div>
            )}

            {/* 일반 안내 — 입출차 + 공통 */}
            {(t.enteringNotice || t.notice) && (
              <NoticeDotList body={[t.enteringNotice, t.notice].filter(Boolean).join('\n')} className="text-text-sub" />
            )}

            {/* 면책 문구 */}
            <div className="bg-bg-weak rounded-8 p-4">
              <MText typography="body_b4" color="text_sub_600">
                현장에서 발생한 사고는 일체 책임지지 않으며, 사정에 따라 이용이 어려울 수 있습니다.
              </MText>
            </div>
          </div>
        </section>

        {/* ─── 이런 이용권은 어떠세요? ─── */}
        {vm.anotherTickets.length > 0 && (
          <section className="bg-bg-white mt-2 flex flex-col gap-4 py-6">
            <MText typography="title_t2" color="text_strong_950" className="px-4">
              이런 이용권은 어떠세요?
            </MText>
            <div className="scrollbar-hide overflow-x-auto">
              <div className="flex w-max gap-2 px-4">
                {vm.anotherTickets.map((another) => (
                  <button
                    key={another.couponSeq}
                    onClick={() => vm.goToTicketDetail(another.couponSeq)}
                    className={`rounded-8 flex w-[227px] shrink-0 cursor-pointer flex-col gap-1 border p-4 text-left ${
                      another.isAvailable ? 'border-primary bg-bg-white' : 'border-stroke-sub bg-bg-weak'
                    }`}
                  >
                    <span
                      className={`modu-typography-body-b3 truncate ${
                        another.isAvailable ? 'text-text-strong' : 'text-text-soft'
                      }`}
                    >
                      {another.couponName}
                    </span>
                    <span
                      className={`modu-typography-title-t4 tabular-nums ${
                        another.isAvailable ? 'text-text-strong' : 'text-text-soft'
                      }`}
                    >
                      {another.price.toLocaleString()}원
                    </span>
                    {another.subLabel && (
                      <span
                        className={`modu-typography-body-b4 truncate ${
                          another.isAvailable ? 'text-text-sub' : 'text-text-soft'
                        }`}
                      >
                        {another.subLabel}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="mt-2 flex-1" />

        {/* ─── 하단 고정 CTA — {가격} 결제하기 / {일시}부터 구매가능 / 판매예정 / 매진 ─── */}
        <footer className="bg-bg-white sticky bottom-0 z-20 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <MButton size="xLarge" fullWidth disabled={vm.purchaseButton.disabled} onClick={vm.handleClickPurchase}>
            {vm.purchaseButton.text}
          </MButton>
        </footer>
      </main>

      <DockBar />

      {/* ─── Photo Viewer — fullscreen dim + 가로 슬라이드 ─── */}
      <AnimatePresence>
        {viewer.open && t.photos.length > 0 && (
          <PhotoViewer
            photos={t.photos}
            startIndex={viewer.startIndex}
            onClose={() => setViewer({ open: false, startIndex: 0 })}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── 날짜 셀 — modu-android MDSDateCell (58×58, radius8) ─── */
function DateCell({ cell, onSelect }: { cell: DateCellModel; onSelect: (date: string) => void }) {
  const labelColor = cell.isSelected ? 'text-static-white' : cell.isHoliday ? 'text-red-500' : 'text-text-strong'

  return (
    <button
      onClick={() => onSelect(cell.date)}
      aria-pressed={cell.isSelected}
      className={`rounded-8 flex size-[58px] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 ${
        cell.isSelected ? 'bg-primary' : 'bg-transparent'
      }`}
    >
      <span className={`modu-typography-title-t6 ${labelColor}`}>{cell.label}</span>
      <span className={`modu-typography-title-t4 tabular-nums ${labelColor}`}>{cell.dayText}</span>
    </button>
  )
}

/* ─── 안내 dot 리스트 — modu-android NoticeDotListView 규칙:
   줄 단위 split, "- " prefix 제거 후 bullet, "(" 시작 줄은 bullet 없는 들여쓰기 ─── */
function NoticeDotList({ body, className }: { body: string; className?: string }) {
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <ul className={`flex flex-col gap-1 ${className ?? ''}`}>
      {lines.map((line, index) => {
        const noBullet = line.startsWith('(')
        const text = line.startsWith('- ') ? line.slice(2) : line
        return (
          <li key={index} className="modu-typography-body-b4 flex gap-1.5">
            <span aria-hidden className={noBullet ? 'w-1.5 shrink-0' : 'w-1.5 shrink-0 text-center'}>
              {noBullet ? '' : '·'}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap">{text}</span>
          </li>
        )
      })}
    </ul>
  )
}

/* ─── Photo Viewer — 풀스크린 dim + 가로 슬라이드 + 페이지 인디케이터 ─── */
function PhotoViewer({
  photos,
  startIndex,
  onClose
}: {
  photos: TicketPhoto[]
  startIndex: number
  onClose: () => void
}) {
  const sliderRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(startIndex)

  // 진입 시 startIndex 위치로 즉시 점프 (animation 없이)
  useEffect(() => {
    const el = sliderRef.current
    if (!el) return
    el.scrollTo({ left: startIndex * el.offsetWidth, behavior: 'instant' as ScrollBehavior })
  }, [startIndex])

  // 스크롤 → 현재 인덱스 추적
  useEffect(() => {
    const el = sliderRef.current
    if (!el) return
    const onScroll = () => {
      const w = el.offsetWidth
      if (w > 0) setIndex(Math.round(el.scrollLeft / w))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [photos.length])

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-overlay-gray fixed inset-0 z-[var(--z-modal,9999)] flex items-center justify-center"
      onClick={onClose}
    >
      {/* 상단바 — z-10 으로 슬라이더 위에 렌더 (X 버튼 클릭 영역 확보) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <span className="modu-typography-title-t5 text-static-white tabular-nums">
          {photos.length > 1 ? `${index + 1} / ${photos.length}` : ''}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="닫기"
          className="bg-static-white/10 hover:bg-static-white/20 pointer-events-auto flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors"
        >
          <MIcon icon={IconXLine} size={22} color="icon_white_0" decorative />
        </button>
      </div>

      {/* 슬라이더 */}
      <div
        ref={sliderRef}
        className="scrollbar-hide flex h-full w-full overflow-x-auto"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        {photos.map((photo, i) => (
          <div
            key={i}
            className="relative flex h-full w-full shrink-0 items-center justify-center"
            style={{ scrollSnapAlign: 'center' }}
          >
            <Image
              src={photo.fileName}
              alt={photo.pictureDesc ?? ''}
              fill
              sizes="100vw"
              className="object-contain"
              priority={i === startIndex}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
