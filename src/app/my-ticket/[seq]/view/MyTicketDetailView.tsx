'use client'

import { IconChevronLeftLine, IconCopyLine, IconNaviFill, IconPhoneLine } from '@socar-inc/modu-ui/icons'
import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'

import Toast from '@/shared/components/ui/Toast'

import type { MyTicketStatusTone } from '@/app/(tabs)/tickets/viewmodel'

import { MY_TICKET_TITLE, useMyTicketDetailViewModel } from '../viewmodel'

const STATUS_BAR: Record<MyTicketStatusTone, string> = {
  active: 'bg-mint-700',
  pending: 'bg-yellow-500',
  done: 'bg-neutral-300',
  canceled: 'bg-red-500'
}

interface MyTicketDetailViewProps {
  seq: string
}

/**
 * 내주차권 상세 — modu-web-app /my-ticket/[id] 화면 기준 재구성.
 * 회원은 즉시 표시, 비회원은 휴대폰 뒷 4자리 인증(모웹 MyTicketPhoneAuth) 후 표시.
 */
export default function MyTicketDetailView({ seq }: MyTicketDetailViewProps) {
  const vm = useMyTicketDetailViewModel(seq)
  const [toastMsg, setToastMsg] = useState<{ id: number; message: string } | null>(null)

  const showToast = useCallback((message: string) => setToastMsg({ id: Date.now(), message }), [])

  const copyAddress = useCallback(
    async (address: string) => {
      try {
        await navigator.clipboard.writeText(address)
        showToast('주소가 복사되었어요')
      } catch {
        showToast('복사에 실패했어요')
      }
    },
    [showToast]
  )

  return (
    <div className="bg-bg-white flex min-h-full flex-col">
      {/* ─── 헤더 — 모웹 MyTicketHeader: 뒤로가기 · 타이틀 · 문의하기 ─── */}
      <header className="bg-bg-white sticky top-0 z-10 flex h-14 items-center justify-between pr-4 pl-2">
        <div className="flex items-center gap-1">
          <button
            onClick={vm.goBack}
            aria-label="뒤로가기"
            className="flex size-10 cursor-pointer items-center justify-center"
          >
            <IconChevronLeftLine className="text-icon-strong size-[22px]" />
          </button>
          <h1 className="text-t4 text-text-strong font-bold">{MY_TICKET_TITLE}</h1>
        </div>
        <Link
          href="https://page.modu.kr/userguide"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-strong text-c2"
        >
          문의하기
        </Link>
      </header>

      {vm.isLoading ? (
        <div className="flex flex-col gap-4 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-soft h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : vm.needAuth ? (
        <PhoneAuth
          value={vm.bulletValue}
          error={vm.authError}
          noGuestSession={vm.noGuestSession}
          onChange={vm.onChangeBullet}
        />
      ) : !vm.detail ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-24">
          <p className="text-text-strong text-t5 font-bold">주차권을 불러오지 못했어요</p>
          <p className="text-text-sub text-b4">잠시 후 다시 시도해 주세요.</p>
        </div>
      ) : (
        <TicketDetail vm={vm} onCopyAddress={copyAddress} onComingSoon={() => showToast('준비중인 서비스입니다')} />
      )}

      <Toast id={toastMsg?.id} message={toastMsg?.message ?? null} onDismiss={() => setToastMsg(null)} />
    </div>
  )
}

/* ─── 비회원 인증 — 모웹 MyTicketPhoneAuth: 휴대폰 뒷번호 4자리 ─── */
function PhoneAuth({
  value,
  error,
  noGuestSession,
  onChange
}: {
  value: string
  error: string
  noGuestSession: boolean
  onChange: (value: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (noGuestSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <p className="text-text-strong text-t5 font-bold">이 브라우저에서 조회할 수 없어요</p>
        <p className="text-text-sub text-b4">
          비회원 구매 내역이 없어요. 결제했던 브라우저에서 열거나,
          <br />
          로그인 후 내 주차권에서 확인해 주세요.
        </p>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="flex flex-1 cursor-text flex-col items-center gap-24 pt-[18%]"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-t3 text-text-strong font-bold">휴대폰 뒷번호 4자리 입력</h2>
        <p className="text-text-sub text-b4">구매 시 입력한 휴대폰 번호를 입력해 주세요.</p>
      </div>

      {/* 4칸 불릿 — 실제 입력은 숨은 input 이 받는다 */}
      <div className="relative flex items-center gap-4">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`size-4 rounded-full transition-colors ${i < value.length ? 'bg-text-strong' : 'bg-neutral-200'}`}
          />
        ))}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          aria-label="휴대폰 뒷번호 4자리"
          className="absolute inset-0 cursor-text opacity-0"
        />
      </div>

      {error && <p className="text-error-base text-c2 -mt-16">{error}</p>}
    </button>
  )
}

/* ─── 상세 본문 — 모웹 ticketDetail 섹션 구성 ─── */
function TicketDetail({
  vm,
  onCopyAddress,
  onComingSoon
}: {
  vm: ReturnType<typeof useMyTicketDetailViewModel>
  onCopyAddress: (address: string) => void
  onComingSoon: () => void
}) {
  const detail = vm.detail!
  const { ticket, parkinglot, canceledDate } = detail
  const status = vm.statusMeta!

  return (
    <div className="flex flex-1 flex-col">
      {/* 상태 라이브바 — 모웹 ParkingLiveBar */}
      <div className="px-4">
        <div className={`flex h-10 items-center justify-center rounded-lg ${STATUS_BAR[status.tone]}`}>
          <span className="text-t5 font-bold text-white">{status.label}</span>
        </div>
      </div>

      {/* 티켓 정보 — 모웹 MyTicketInfo */}
      <section className="flex flex-col gap-2.5 px-4 pt-5 pb-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-t3 text-text-strong font-bold">{ticket.ticketName}</h2>
        </div>
        <p className="text-text-sub text-b4">{parkinglot.name}</p>

        <div className="mt-1.5 flex flex-col gap-2">
          <InfoRow label="차량번호" value={ticket.carNum || '미등록'} />
          {ticket.partner?.predictTime && <InfoRow label="입차예정시간" value={ticket.partner.predictTime} />}
          {ticket.usageDate && <InfoRow label="이용일" value={ticket.usageDate} />}
          {ticket.usageTime && <InfoRow label="주차권 유효시간" value={ticket.usageTime} />}
          {ticket.paymentTime && <InfoRow label="결제일시" value={ticket.paymentTime} />}
          {canceledDate && <InfoRow label="취소일시" value={canceledDate} />}
        </div>

        {/* 결제 금액 — 모웹 MyTicketTotalPrice */}
        <div className="border-stroke-soft mt-2 flex items-center justify-between border-t pt-3">
          <span className="text-t5 text-text-strong font-bold">결제 금액</span>
          <span className="text-t4 text-text-strong font-bold">{ticket.totalPrice.toLocaleString()}원</span>
        </div>
      </section>

      <div className="bg-bg-weak h-2.5" />

      {/* 주차장 정보 — 모웹 MyTicketParkinglot */}
      <section className="flex flex-col gap-3 px-4 py-6">
        <h3 className="text-t4 text-text-strong font-bold">주차장 정보</h3>
        <button
          className="flex w-full min-w-0 cursor-pointer items-center gap-1 text-left"
          onClick={() => onCopyAddress(parkinglot.address)}
        >
          <span className="text-text-strong text-b4 flex-1">{parkinglot.address}</span>
          <IconCopyLine className="text-icon-soft size-3.5 shrink-0" />
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={vm.openNavigation}
            className="bg-primary text-static-white text-t5 flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg font-semibold"
          >
            <IconNaviFill className="size-4" />
            길찾기
          </button>
          {parkinglot.phone && (
            <a
              href={`tel:${parkinglot.phone}`}
              className="border-stroke-soft text-text-strong text-t5 flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border font-semibold"
            >
              <IconPhoneLine className="size-4" />
              전화
            </a>
          )}
        </div>
      </section>

      <div className="bg-bg-weak h-2.5" />

      {/* 이용 안내 — 모웹 MyTicketNotification (/t 상세와 같은 결) */}
      {(ticket.notice2 || ticket.notice || ticket.usageGuide) && (
        <>
          <section className="flex flex-col gap-3 px-4 py-6">
            <h3 className="text-t4 text-text-strong font-bold">이용 안내</h3>
            {ticket.notice2 && (
              <div className="bg-information-lighter flex flex-col gap-1.5 rounded-xl p-4">
                <p className="text-t5 text-text-strong font-bold">꼭 확인해주세요</p>
                <p className="text-text-sub text-b5 whitespace-pre-line">{ticket.notice2}</p>
              </div>
            )}
            {ticket.notice && <p className="text-text-sub text-b5 whitespace-pre-line">{ticket.notice}</p>}
            {ticket.usageGuide && <p className="text-text-sub text-b5 whitespace-pre-line">{ticket.usageGuide}</p>}
          </section>
          <div className="bg-bg-weak h-2.5" />
        </>
      )}

      {/* 환불 내역 — 모웹 CancelHistory 요약 */}
      {ticket.refunds.length > 0 && (
        <>
          <section className="flex flex-col gap-3 px-4 py-6">
            <h3 className="text-t4 text-text-strong font-bold">환불 내역</h3>
            {ticket.refunds.map((refund) => (
              <div key={refund.requestSeq} className="border-stroke-soft flex flex-col gap-1.5 rounded-xl border p-4">
                <InfoRow label="요청일시" value={refund.createdAt} />
                {refund.refundedAt && <InfoRow label="환불일시" value={refund.refundedAt} />}
              </div>
            ))}
          </section>
          <div className="bg-bg-weak h-2.5" />
        </>
      )}

      {/* 결제 취소 — 취소 플로우(사유 선택·환불 요청)는 미이식. TODO(취소): 모웹 cancel API 연동 */}
      {ticket.isCancelable && !canceledDate && (
        <footer className="mt-auto px-6 pt-4 pb-[max(env(safe-area-inset-bottom),16px)]">
          <button
            type="button"
            onClick={onComingSoon}
            className="border-stroke-soft text-text-sub text-t5 h-12 w-full cursor-pointer rounded-lg border font-semibold"
          >
            결제 취소
          </button>
        </footer>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-text-sub text-b4 shrink-0">{label}</span>
      <span className="text-text-strong text-b4 text-right">{value}</span>
    </div>
  )
}
