'use client'

import { useRouter } from 'next/navigation'
import { memo } from 'react'

import type { MyTicketRow, MyTicketStatusTone } from '../viewmodel'

import LoginView from '../../login/view'
import { useMyTicketsViewModel } from '../viewmodel'

const STATUS_DOT: Record<MyTicketStatusTone, string> = {
  active: 'bg-mint-700',
  pending: 'bg-yellow-500',
  done: 'bg-neutral-300',
  canceled: 'bg-red-500'
}

/**
 * 내 주차권 — 활성 주차권 리스트 (`/ticket/my-ticket/active`).
 * 카드는 주차장 상세의 티켓 스텁(노치 + 점선 3분할)과 같은 결로 그린다.
 */
export default function MyTicketsView() {
  const router = useRouter()
  const vm = useMyTicketsViewModel()

  // persist 복원 전 — 로그인 화면이 깜빡 뜨지 않도록 빈 배경만
  if (!vm.isMounted) return <div className="bg-bg-weak min-h-full" />

  if (!vm.isLoggedIn) return <LoginView />

  return (
    <div className="bg-bg-weak flex min-h-full flex-col pb-6">
      {/* ─── 헤더 — 홈 TopBar(검색바 영역)와 동일 높이 ─── */}
      <header className="bg-bg-white flex items-center px-5 pt-3 pb-2">
        <h1 className="text-t3 text-text-strong flex h-10 items-center font-bold">내 주차권</h1>
      </header>

      <div className="flex flex-col gap-2.5 px-5 pt-4">
        {vm.isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="bg-bg-soft h-[104px] animate-pulse rounded-2xl" />)
        ) : vm.isError ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-text-sub text-b4">주차권을 불러오지 못했어요.</p>
            <button
              onClick={() => vm.refetch()}
              className="border-stroke-soft text-text-strong text-c2 h-[38px] cursor-pointer rounded-lg border bg-white px-4 font-medium"
            >
              다시 시도
            </button>
          </div>
        ) : vm.tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-20">
            <p className="text-text-strong text-t5 font-bold">보유한 주차권이 없어요</p>
            <p className="text-text-sub text-b4">주차장을 찾고 주차권을 구매해 보세요.</p>
          </div>
        ) : (
          vm.tickets.map((ticket) => (
            <MyTicketCard
              key={ticket.key}
              ticket={ticket}
              onSelect={() => router.push(`/my-ticket/${ticket.seq}?type=${ticket.type}`)}
            />
          ))
        )}
      </div>
    </div>
  )
}

/* ─── 카드 — 주차장 상세 TicketStubCard 와 같은 노치+점선 스텁 ─── */
const MyTicketCard = memo(function MyTicketCard({ ticket, onSelect }: { ticket: MyTicketRow; onSelect: () => void }) {
  const isActive = ticket.status.tone === 'active'

  const cardBg = 'bg-white'
  const cardBorder = isActive ? 'border-primary/20' : 'border-slate-200'
  const cardShadow = isActive ? 'shadow-[0_2px_10px_rgba(59,130,246,0.09)]' : ''
  const dashBorder = isActive ? 'border-primary/45' : 'border-slate-300'

  return (
    <div className="relative w-full cursor-pointer" onClick={onSelect}>
      {/* 3분할: [정보] · [연결부] · [차량번호] — 상세 티켓 스텁과 동일 구조 */}
      <div className="flex min-h-[104px] w-full">
        {/* 왼쪽: 상태 · 주차권명 · 주차장 · 이용일 */}
        <div
          className={`flex flex-1 flex-col justify-center gap-1 rounded-l-2xl border-y border-l py-3.5 pl-4 ${cardBg} ${cardBorder} ${cardShadow}`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`h-[6px] w-[6px] shrink-0 rounded-full ${STATUS_DOT[ticket.status.tone]}`} />
            <span className={`text-c3 font-medium ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
              {ticket.status.label}
            </span>
          </div>
          <p className={`text-t4 truncate font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
            {ticket.ticketName}
          </p>
          <p className={`text-b5 truncate ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
            {ticket.parkinglotName}
          </p>
          <p className={`text-b5 truncate ${isActive ? 'text-slate-400' : 'text-slate-300'}`}>{ticket.usageDate}</p>
        </div>

        {/* 가운데 연결부 — 노치 + 점선 */}
        <div className={`relative w-5 shrink-0 ${cardBg}`}>
          <div
            className={`absolute -top-[1px] left-0 h-[9px] w-full rounded-b-full border-x border-b ${cardBorder} ${cardBg}`}
          />
          <div className={`absolute inset-y-2.5 left-1/2 w-px -translate-x-1/2 border-l border-dashed ${dashBorder}`} />
          <div
            className={`absolute -bottom-[1px] left-0 h-[9px] w-full rounded-t-full border-x border-t ${cardBorder} ${cardBg}`}
          />
        </div>

        {/* 오른쪽: 차량번호 · 결제금액 */}
        <div
          className={`flex w-[104px] shrink-0 flex-col items-center justify-center gap-1 rounded-r-2xl border-y border-r px-2 ${cardBg} ${cardBorder} ${cardShadow}`}
        >
          <p
            className={`text-t5 leading-none font-bold whitespace-nowrap ${isActive ? 'text-primary' : 'text-slate-400'}`}
          >
            {ticket.carNum || '차량 미등록'}
          </p>
          <p className={`text-c3 font-medium ${isActive ? 'text-primary/70' : 'text-slate-300'}`}>
            {ticket.totalPrice.toLocaleString()}원
          </p>
        </div>
      </div>
    </div>
  )
})
