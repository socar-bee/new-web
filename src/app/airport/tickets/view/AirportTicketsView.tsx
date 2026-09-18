'use client'

import { IconChevronLeftLine, IconChevronRightLine } from '@socar-inc/modu-ui/icons'
import Image from 'next/image'

import type { AirportTicket } from '../../model'
import type { AirportViewType } from '../viewmodel'

import { useAirportTicketsViewModel } from '../viewmodel'

/**
 * 공항 주차권 목록 — modu-web-app /airport/tickets 동일 구성.
 * 요약 헤더(공항명·시작/종료·변경) · 라벨 필터 칩 + 리스트/카드 토글 · infoMsg · ListItem 카드.
 */
export default function AirportTicketsView() {
  const vm = useAirportTicketsViewModel()

  return (
    <div className="bg-bg-white flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-1 pl-2">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={vm.goBack}
          className="flex size-10 cursor-pointer items-center justify-center"
        >
          <IconChevronLeftLine className="text-icon-strong size-[22px]" />
        </button>
        <h1 className="text-t4 text-text-strong font-bold">주차권 목록</h1>
      </header>

      {/* 검색 요약 — 공항명 + 시작/종료 + 변경 (모웹 헤더 요약 박스) */}
      <div className="border-stroke-soft flex w-full shrink-0 items-center justify-between border-b px-4 py-3 shadow-[0_1px_2px_rgba(14,18,27,0.04)]">
        <div className="flex flex-col gap-1.5">
          <p className="text-b3 text-text-strong font-medium">{vm.title}</p>
          <div className="flex flex-col gap-1">
            <SummaryRow label="시작" value={vm.startText} />
            <SummaryRow label="종료" value={vm.endText} />
          </div>
        </div>
        <button
          type="button"
          onClick={vm.goToSearch}
          className="border-stroke-sub text-c3 text-text-strong cursor-pointer rounded-[5px] border px-2.5 py-0.5"
        >
          변경
        </button>
      </div>

      {/* 필터 칩 + 뷰 토글 */}
      <div className="flex w-full shrink-0 flex-col px-4 py-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {vm.labels.map((label) => (
              <button
                key={label.detailCode}
                type="button"
                onClick={() => vm.toggleLabel(label.detailCode)}
                className={`text-c2 cursor-pointer rounded-2xl border px-2.5 py-0.5 ${
                  vm.selectedLabelCodes.includes(label.detailCode)
                    ? 'border-primary-dark text-primary-dark'
                    : 'border-stroke-sub text-text-strong'
                }`}
              >
                {label.detailName}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ViewToggleButton current={vm.viewType} type="list" onSelect={vm.setViewType} />
            <div className="bg-stroke-soft h-4 w-px" />
            <ViewToggleButton current={vm.viewType} type="card" onSelect={vm.setViewType} />
          </div>
        </div>
        {vm.infoMsg && (
          <div className="bg-bg-soft mt-3 flex w-full items-center gap-1 rounded-lg px-3 py-2">
            <span aria-hidden>💡</span>
            <p className="text-c3 text-text-strong">{vm.infoMsg}</p>
          </div>
        )}
      </div>

      <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto">
        {vm.isLoading ? (
          <div className="flex flex-col gap-3 px-4 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-soft h-[120px] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : vm.tickets.length === 0 ? (
          <div className="bg-bg-soft flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <Image src="/images/light_img_empty_coupon.png" alt="" width={120} height={120} />
              <p className="text-text-sub text-c2">
                판매중인 주차권이 없습니다.
                <br />
                일정을 변경해보세요.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3 px-4 pb-[100px]">
            {vm.tickets.map((ticket) => (
              <ListItem
                key={ticket.couponSeq}
                data={ticket}
                variant={vm.viewType}
                onSelect={() => vm.goToDetail(ticket.couponSeq)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-c2 flex items-center gap-1.5">
      <span className="text-text-strong after:bg-stroke-sub flex items-center gap-1.5 after:block after:h-3 after:w-px">
        {label}
      </span>
      <span className="text-text-sub">{value}</span>
    </p>
  )
}

function ViewToggleButton({
  current,
  type,
  onSelect
}: {
  current: AirportViewType
  type: AirportViewType
  onSelect: (t: AirportViewType) => void
}) {
  const active = current === type
  return (
    <button
      type="button"
      aria-label={type === 'list' ? '리스트 보기' : '카드 보기'}
      aria-pressed={active}
      onClick={() => onSelect(type)}
      className={`cursor-pointer p-1 text-[15px] leading-none ${active ? 'text-primary' : 'text-icon-soft'}`}
    >
      {type === 'list' ? '☰' : '▦'}
    </button>
  )
}

/** 티켓 카드 — 모웹 ListItem (list/card 2가지 variant) */
function ListItem({
  data,
  variant,
  onSelect
}: {
  data: AirportTicket
  variant: AirportViewType
  onSelect: () => void
}) {
  const labelText =
    data.labels.length > 3
      ? `${data.labels.slice(0, 3).join(' · ')} 외 ${data.labels.length - 3}개`
      : data.labels.join(' · ')

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left shadow-[0_1px_4px_rgba(14,18,27,0.08)] ${
          data.isSoldOut ? 'border-stroke-soft bg-bg-soft' : 'border-stroke-soft bg-white'
        }`}
      >
        <div className="relative aspect-video w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.thumbnail?.url || '/images/img_nophoto.png'}
            alt={data.thumbnail?.description || data.couponName}
            className={`absolute inset-0 h-full w-full object-cover ${data.isSoldOut ? 'opacity-40 grayscale' : ''}`}
          />
          <div className="absolute top-2 left-2">
            <SaleBadge isSoldOut={data.isSoldOut} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className={`text-c1 line-clamp-1 font-medium ${data.isSoldOut ? 'text-text-soft' : 'text-text-strong'}`}>
              {data.couponName}
            </p>
            <p className={`text-c3 truncate ${data.isSoldOut ? 'text-text-soft' : 'text-text-sub'}`}>{labelText}</p>
            <p className={`text-c3 truncate ${data.isSoldOut ? 'text-text-soft' : 'text-text-sub'}`}>
              {data.parkinglotName}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <span className={`text-t4 font-bold ${data.isSoldOut ? 'text-text-soft' : 'text-primary'}`}>
              {data.totalPrice.toLocaleString()}
            </span>
            <span className={`text-c2 ${data.isSoldOut ? 'text-text-soft' : 'text-text-sub'}`}>원</span>
            <IconChevronRightLine className="text-icon-soft size-4" />
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full cursor-pointer gap-4 rounded-xl border py-2.5 pr-4 pl-2 text-left shadow-[0_1px_4px_rgba(14,18,27,0.06)] ${
        data.isSoldOut ? 'border-stroke-soft bg-bg-soft' : 'border-stroke-soft bg-white'
      }`}
    >
      <div className="border-stroke-soft relative h-[100px] w-[140px] shrink-0 overflow-hidden rounded-md border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.thumbnail?.url || '/images/img_nophoto.png'}
          alt={data.thumbnail?.description || data.couponName}
          className={`absolute inset-0 h-full w-full object-cover ${data.isSoldOut ? 'opacity-40 grayscale' : ''}`}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex flex-col gap-1">
          <p className={`text-c1 line-clamp-1 font-medium ${data.isSoldOut ? 'text-text-soft' : 'text-text-strong'}`}>
            {data.couponName}
          </p>
          <p className={`text-c3 truncate ${data.isSoldOut ? 'text-text-soft' : 'text-text-sub'}`}>{labelText}</p>
          <p className={`text-c3 truncate ${data.isSoldOut ? 'text-text-soft' : 'text-text-sub'}`}>
            {data.parkinglotName}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <SaleBadge isSoldOut={data.isSoldOut} plain />
          <div className="flex items-center gap-0.5">
            <span className={`text-t5 font-bold ${data.isSoldOut ? 'text-text-soft' : 'text-primary'}`}>
              {data.totalPrice.toLocaleString()}
            </span>
            <span className={`text-c3 ${data.isSoldOut ? 'text-text-soft' : 'text-text-sub'}`}>원</span>
            <IconChevronRightLine className="text-icon-soft size-4" />
          </div>
        </div>
      </div>
    </button>
  )
}

/** 판매중(초록 펄스 점) / 매진 뱃지 */
function SaleBadge({ isSoldOut, plain = false }: { isSoldOut: boolean; plain?: boolean }) {
  if (isSoldOut) {
    return plain ? (
      <span className="text-c3 text-text-soft font-medium">현재 매진</span>
    ) : (
      <span className="text-c3 rounded-md bg-black/70 px-2 py-1 font-medium text-white backdrop-blur-xs">매진</span>
    )
  }
  return (
    <span className={`flex items-center gap-1 ${plain ? '' : 'rounded-md bg-white/90 px-2 py-1 backdrop-blur-xs'}`}>
      <span className="size-1.5 animate-pulse rounded-full bg-[#03CF5D]" />
      <span className="text-c3 text-text-sub font-medium">판매중</span>
    </span>
  )
}
