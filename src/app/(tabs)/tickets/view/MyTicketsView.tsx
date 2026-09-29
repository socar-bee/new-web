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
              type="button"
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
          // 목록임을 알리는 건 ul 뿐이다 — 스크린리더가 "총 N개 중 k번째" 를 읽는 근거가 된다
          <ul className="flex flex-col gap-2.5">
            {vm.tickets.map((ticket) => (
              <li key={ticket.key}>
                <MyTicketCard
                  ticket={ticket}
                  onSelect={() => router.push(`/my-ticket/${ticket.seq}?type=${ticket.type}`)}
                />
              </li>
            ))}
          </ul>
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
    // 카드 전체가 상세로 가는 단일 동작이다 — button 이라야 포커스·Enter/Space 가 따라온다
    <button type="button" onClick={onSelect} className="relative w-full cursor-pointer text-left">
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

        {/* 가운데 연결부 — 점선만. 카드 외곽선은 여기서도 끊기지 않게 border-y 로 잇는다.
            반원 노치를 카드 bg(흰색)로 채우면 절개가 아니라 배경 위로 **튀어나온 혹**으로 보이고
            그 양옆으로 배경이 새어 들어온다 (절개로 보이게 하려면 노치를 배경색으로 채워야 하는데,
            이 카드는 배경이 다른 화면에서도 쓰여 색을 박을 수 없다) */}
        <div className={`relative w-5 shrink-0 border-y ${cardBg} ${cardBorder}`}>
          <div className={`absolute inset-y-2.5 left-1/2 w-px -translate-x-1/2 border-l border-dashed ${dashBorder}`} />
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
    </button>
  )
})
