'use client'

import {
  IconChevronLeftLine,
  IconCopyLine,
  IconNaviFill,
  IconPhoneLine,
  IconPlusLine,
  IconXLine
} from '@socar-inc/modu-ui/icons'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ConfirmModal from '@/shared/components/ui/ConfirmModal'
import Toast from '@/shared/components/ui/Toast'

import { SHARE_CANCEL_REASONS, SHARE_REFUND_GUIDE, SHARE_REFUND_REASONS } from '../model'
import { MY_TICKET_TITLE, useMyTicketDetailViewModel } from '../viewmodel'

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
    // 루트 레이아웃이 h-dvh overflow-hidden — 스크롤은 이 페이지의 main 이 소유한다 (/t 상세와 동일 패턴)
    <div className="bg-bg-white flex h-full flex-col">
      {/* ─── 헤더 — 모웹 MyTicketHeader: 뒤로가기 · 타이틀 · 문의하기 ─── */}
      <header className="bg-bg-white z-10 flex h-14 shrink-0 items-center justify-between pr-4 pl-2">
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

      <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto">
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
      </main>

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

  // 취소 완료 상태 — 모웹 CancelHistory 풀스크린
  if (canceledDate) {
    return <CancelHistoryScreen vm={vm} />
  }

  return (
    <div className="flex flex-1 flex-col pb-[86px]">
      {/* 티켓 정보 — 모웹 MyTicketInfo: 주차권명 + 영수증 pill + 정보 rows */}
      <section className="flex flex-col gap-2.5 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-t3 text-text-strong font-bold">{ticket.ticketName}</h2>
          <button
            type="button"
            onClick={onComingSoon}
            className="border-stroke-sub text-text-strong text-c3 shrink-0 cursor-pointer rounded-full border px-2.5 py-0.5"
          >
            영수증
          </button>
        </div>

        <div className="mt-1.5 flex flex-col gap-2">
          <InfoRow label="차량번호" value={ticket.carNum || '미등록'} />
          {!vm.isShare && ticket.partner?.predictTime && (
            <InfoRow label="입차예정시간" value={ticket.partner.predictTime} />
          )}
          {ticket.usageTime && <InfoRow label="주차권 유효시간" value={ticket.usageTime} />}
        </div>

        {/* 결제 금액 — 모웹 MyTicketTotalPrice */}
        <div className="border-stroke-soft mt-2 flex items-center justify-between border-t pt-3">
          <span className="text-t5 text-text-strong font-bold">결제 금액</span>
          <span className="text-t4 text-text-strong font-bold">{ticket.totalPrice.toLocaleString()}원</span>
        </div>

        {/* 관리자 확인 / 연장 — 모웹 MyTicketAdminGroup */}
        {!vm.isShare && ticket.partner?.isNeedConfirm && (
          <button
            type="button"
            onClick={() => vm.setIsAdminConfirmOpen(true)}
            className="border-stroke-sub text-c2 text-text-strong mt-1 flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border font-medium"
          >
            ⚠️ 관리자 전용 버튼 <span className="text-text-sub text-c3">(주차권 이용자 사용 금지)</span>
          </button>
        )}
        {vm.isShare && ticket.share && (
          <button
            type="button"
            disabled={!ticket.share.isExtendable}
            onClick={vm.startExtend}
            className="border-primary text-primary text-c2 disabled:border-stroke-sub disabled:text-text-soft mt-1 flex h-11 w-full cursor-pointer items-center justify-center gap-1 rounded-lg border font-medium disabled:cursor-not-allowed"
          >
            {ticket.share.isExtendable ? (
              <>
                주차권 연장하기{' '}
                <span className="text-text-sub text-c3">(최대 {ticket.share.extendableMinute}분 가능)</span>
              </>
            ) : (
              '주차권 연장 불가'
            )}
          </button>
        )}
      </section>

      <div className="bg-bg-weak h-2.5" />

      {/* 이용 방법 — 모웹 MyTicketUseAge: 공유 가이드(주의색) + 이용가이드 + 사진 */}
      {(ticket.share?.usageTypeGuide || ticket.usageGuide || ticket.photos.length > 0) && (
        <>
          <section className="flex flex-col gap-3 py-6">
            <h3 className="text-t4 text-text-strong px-4 font-bold">이용 방법</h3>
            <div className="flex flex-col gap-2 px-4">
              {ticket.share?.usageTypeGuide && (
                <p className="text-error-base text-b5 whitespace-pre-line">{ticket.share.usageTypeGuide}</p>
              )}
              {ticket.usageGuide && <p className="text-text-strong text-b5 whitespace-pre-line">{ticket.usageGuide}</p>}
            </div>
            {ticket.photos.length > 0 && (
              <div className="scrollbar-hide overflow-x-auto">
                <div className="flex w-max gap-2 px-4">
                  {ticket.photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={photo.fileName}
                      src={photo.thumbnail}
                      alt={photo.pictureDesc ?? '주차장 사진'}
                      className="h-[120px] w-[160px] shrink-0 rounded-xl object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
          <div className="bg-bg-weak h-2.5" />
        </>
      )}

      {/* 주차장 정보 — 모웹 MyTicketParkinglot (지도/로드뷰 미이식 — 주소 복사·전화) */}
      <section className="flex flex-col gap-3 px-4 py-6">
        <h3 className="text-t4 text-text-strong font-bold">주차장 정보</h3>
        <p className="text-text-strong text-b4">{parkinglot.name}</p>
        <button
          className="flex w-full min-w-0 cursor-pointer items-center gap-1 text-left"
          onClick={() => onCopyAddress(parkinglot.address)}
        >
          <span className="text-text-sub text-b4 flex-1">{parkinglot.address}</span>
          <IconCopyLine className="text-icon-soft size-3.5 shrink-0" />
        </button>
        {parkinglot.phone && (
          <a
            href={`tel:${parkinglot.phone}`}
            className="border-stroke-soft text-text-strong text-t5 flex h-10 items-center justify-center gap-1.5 rounded-lg border font-semibold"
          >
            <IconPhoneLine className="size-4" />
            전화
          </a>
        )}
      </section>

      <div className="bg-bg-weak h-2.5" />

      {/* 이용 안내 — 모웹 MyTicketNotification */}
      {(ticket.notice2 || ticket.notice) && (
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
          </section>
          <div className="bg-bg-weak h-2.5" />
        </>
      )}

      {/* 환불 내역 — 모웹 MyTicketRefundHistory 요약 */}
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

      {/* 하단 고정 버튼 그룹 — 모웹 MyTicketBtnGroup: [결제취소|환불신청 회색] + [길찾기 primary] (flex 101:232) */}
      <footer className="bg-bg-white fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 shadow-[0_-2px_8px_rgba(14,18,27,0.06)]">
        <div className="flex items-center gap-2.5 p-4 pb-[max(env(safe-area-inset-bottom),16px)]">
          {vm.paymentActionLabel && (
            <button
              type="button"
              onClick={vm.onClickPaymentCancel}
              className="bg-bg-soft text-text-strong text-t5 flex h-[52px] flex-[101] cursor-pointer items-center justify-center rounded-lg font-semibold"
            >
              {vm.paymentActionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={vm.openNavigation}
            className="bg-primary text-static-white text-t5 flex h-[52px] flex-[232] cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold"
          >
            <IconNaviFill className="size-4" />
            길찾기
          </button>
        </div>
      </footer>

      {/* 관리자 확인 모달 — 모웹 TicketDetailConfirmModal */}
      {vm.isAdminConfirmOpen && (
        <ConfirmModal
          title={ticket.carNum || '차량번호 미등록'}
          body={'주차장 관리자 외 버튼 사용 금지\n반드시 관리자에게 확인을 받아주세요'}
          confirmLabel="사용 처리"
          isBusy={vm.isAdminUseSubmitting}
          onConfirm={vm.onConfirmAdminUse}
          onClose={() => vm.setIsAdminConfirmOpen(false)}
        />
      )}

      {/* 취소 확인 모달 */}
      {vm.cancelStep === 'confirm' && (
        <ConfirmModal
          title="결제를 취소하시겠어요?"
          body={vm.isShare ? '취소 사유 선택 후 결제가 취소됩니다.' : '취소 후에는 되돌릴 수 없습니다.'}
          confirmLabel={vm.isShare ? '다음' : '결제 취소'}
          isBusy={vm.isCancelSubmitting}
          onConfirm={vm.onConfirmCancel}
          onClose={vm.closeCancelFlow}
        />
      )}

      {/* 공유 취소 사유 선택 시트 */}
      {vm.cancelStep === 'reason' && (
        <BottomSheet title="취소 사유를 선택해 주세요" onClose={vm.closeCancelFlow}>
          <div className="flex flex-col">
            {SHARE_CANCEL_REASONS.map((reason) => (
              <RadioRow
                key={reason.id}
                label={reason.label}
                checked={vm.cancelReportType === reason.id}
                onSelect={() => vm.setCancelReportType(reason.id)}
              />
            ))}
          </div>
          <button
            type="button"
            disabled={vm.cancelReportType === null || vm.isCancelSubmitting}
            onClick={vm.onSubmitShareCancel}
            className="bg-primary text-static-white text-t5 mt-4 h-12 w-full cursor-pointer rounded-lg font-semibold disabled:opacity-40"
          >
            {vm.isCancelSubmitting ? '취소 처리 중…' : '결제 취소'}
          </button>
        </BottomSheet>
      )}

      {/* 취소/환불 결과 — 모웹 RequestResultSuccess/Failure 풀스크린 */}
      {vm.cancelResult && (
        <ResultScreen
          ok={vm.cancelResult.ok}
          title={vm.cancelResult.ok ? '결제 취소가 완료되었습니다.' : '결제를 취소하지 못했습니다.'}
          subText={vm.cancelResult.ok ? '주차권은 비활성화되며, 이후 사용이 불가합니다.' : vm.cancelResult.message}
          onClose={() => vm.setCancelResult(null)}
        />
      )}
      {vm.refundResult && (
        <ResultScreen
          ok={vm.refundResult.ok}
          title={vm.refundResult.ok ? '환불 신청을 완료했습니다.' : '환불 신청이 어렵습니다.'}
          subText={
            vm.refundResult.ok
              ? '주차장에 확인 후 환불을 진행합니다. 영업일 기준 최대 7일 소요될 수 있습니다.'
              : vm.refundResult.message
          }
          onClose={() => vm.setRefundResult(null)}
        />
      )}

      {/* 환불 신청 불가 안내 */}
      {vm.isRefundImpossibleOpen && (
        <ResultModal
          message={'환불 신청이 불가능한 주차권이에요.\n자세한 내용은 고객센터로 문의해 주세요.'}
          onClose={() => vm.setIsRefundImpossibleOpen(false)}
        />
      )}

      {/* 공유 환불 신청 프로세스 (3단계 풀스크린) */}
      {vm.refundStep > 0 && <ShareRefundProcess vm={vm} />}
    </div>
  )
}

/* ─── 공통: 결과 알림 모달 ─── */
function ResultModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-[480px] items-center justify-center bg-black/50 px-8">
      <div className="bg-bg-white flex w-full flex-col gap-5 rounded-2xl p-5 pt-7">
        <p className="text-t5 text-text-strong text-center font-semibold whitespace-pre-line">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="bg-primary text-static-white text-t5 h-12 w-full cursor-pointer rounded-lg font-semibold"
        >
          확인
        </button>
      </div>
    </div>
  )
}

/* ─── 결과 풀스크린 — 모웹 RequestResultSuccess/Failure ─── */
function ResultScreen({
  ok,
  title,
  subText,
  onClose
}: {
  ok: boolean
  title: string
  subText: string
  onClose: () => void
}) {
  return (
    <div className="bg-bg-white fixed inset-0 z-50 mx-auto flex w-full max-w-[480px] flex-col items-center justify-center gap-3 px-6">
      <span className="text-[56px] leading-none">{ok ? '✅' : '⚠️'}</span>
      <p className="text-t3 text-text-strong mt-3 text-center font-bold">{title}</p>
      <p className="text-text-sub text-b4 text-center whitespace-pre-line">{subText}</p>
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <button
          type="button"
          onClick={onClose}
          className="bg-primary text-static-white text-t5 h-[52px] w-full cursor-pointer rounded-lg font-semibold"
        >
          확인
        </button>
      </div>
    </div>
  )
}

/* ─── 취소 완료 화면 — 모웹 CancelHistory ─── */
function CancelHistoryScreen({ vm }: { vm: ReturnType<typeof useMyTicketDetailViewModel> }) {
  const detail = vm.detail!
  const { ticket, parkinglot, canceledDate } = detail
  return (
    <div className="flex flex-1 flex-col">
      {/* 구매 요약 */}
      <div className="flex flex-col gap-1 px-4 py-6">
        <p className="text-text-strong text-b4">{parkinglot.name}</p>
        <div className="flex justify-between">
          <span className="text-text-sub text-b4">{vm.isShare ? ticket.usageTime : ticket.ticketName}</span>
          <span className="text-text-sub text-b4">{ticket.totalPrice.toLocaleString()}원</span>
        </div>
      </div>

      <div className="bg-bg-weak h-2.5" />

      {/* 취소 내역 */}
      <div className="flex flex-col px-4 py-6">
        <h3 className="text-t4 text-text-strong pb-4 font-bold">취소 내역</h3>
        <p className="text-text-sub text-c2 pb-1.5">{canceledDate}</p>
        <p className="text-b3 text-text-strong pb-3.5 font-medium">주차권 결제취소</p>
        <div className="flex flex-col gap-1.5">
          <p className="text-c3 text-text-strong font-medium">구매정보</p>
          <div className="flex justify-between">
            <span className="text-text-sub text-c2">{ticket.ticketName}</span>
            <span className="text-text-sub text-c2">{ticket.totalPrice.toLocaleString()}원</span>
          </div>
          {ticket.paymentTime && (
            <div className="flex justify-between">
              <span className="text-text-sub text-c2">결제일시</span>
              <span className="text-text-sub text-c2">{ticket.paymentTime}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── 공통: 바텀시트 ─── */
function BottomSheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex w-full max-w-[480px] flex-col justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-bg-white flex flex-col rounded-t-2xl px-5 pt-6 pb-[max(env(safe-area-inset-bottom),20px)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-t4 text-text-strong pb-2 font-bold">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function RadioRow({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-3">
      <input type="radio" checked={checked} onChange={onSelect} className="accent-primary size-5 cursor-pointer" />
      <span className="text-b3 text-text-strong">{label}</span>
    </label>
  )
}

/* ─── 공유 환불 신청 프로세스 — 모웹 RefundSharedParkinglot 3단계 ─── */
function ShareRefundProcess({ vm }: { vm: ReturnType<typeof useMyTicketDetailViewModel> }) {
  const [isAgreed, setIsAgreed] = useState(false)
  const [isStopModalOpen, setIsStopModalOpen] = useState(false)
  const [photoOverToast, setPhotoOverToast] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 미리보기 URL — 파일 목록에서 파생, 언마운트/변경 시 해제
  const previews = useMemo(() => vm.refundPhotos.map((f) => URL.createObjectURL(f)), [vm.refundPhotos])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (vm.addRefundPhotos(files)) setPhotoOverToast(Date.now())
  }

  return (
    <div className="bg-bg-white fixed inset-0 z-50 mx-auto flex w-full max-w-[480px] flex-col">
      {/* 프로세스 헤더 */}
      <header className="flex h-14 shrink-0 items-center justify-between pr-2 pl-2">
        <button
          type="button"
          aria-label="이전 단계"
          onClick={() => (vm.refundStep === 1 ? setIsStopModalOpen(true) : vm.setRefundStep(vm.refundStep - 1))}
          className="flex size-10 cursor-pointer items-center justify-center"
        >
          <IconChevronLeftLine className="text-icon-strong size-[22px]" />
        </button>
        <h2 className="text-t4 text-text-strong font-bold">
          {vm.refundStep === 1 ? '환불 안내' : '공유주차권 환불 신청서'}
        </h2>
        <button
          type="button"
          aria-label="환불 신청 닫기"
          onClick={() => setIsStopModalOpen(true)}
          className="flex size-10 cursor-pointer items-center justify-center"
        >
          <IconXLine className="text-icon-strong size-[22px]" />
        </button>
      </header>

      {/* 1단계 — 환불 안내 + 동의 */}
      {vm.refundStep === 1 && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-3">
            <div className="mt-6 flex flex-col items-center gap-2 text-center">
              <p className="text-t4 text-text-strong font-bold">
                이런 경우 환불이 <span className="text-error-base">불가</span>해요!
              </p>
              <p className="text-text-sub text-c2">
                아래에 해당할 경우 <span className="text-error-base">환불신청이 반려</span>됩니다.
              </p>
            </div>
            <ul className="mt-6 flex flex-col gap-3">
              {SHARE_REFUND_GUIDE.map((content) => (
                <li key={content} className="bg-bg-weak text-b4 text-text-strong rounded-xl px-4 py-3.5">
                  {content}
                </li>
              ))}
            </ul>
          </div>
          <div className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
            <label className="mb-3.5 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={() => setIsAgreed((v) => !v)}
                className="accent-primary size-5 cursor-pointer"
              />
              <span className="text-b4 text-text-strong">위 내용 확인 후 환불 신청을 진행합니다.</span>
            </label>
            <button
              type="button"
              disabled={!isAgreed}
              onClick={() => vm.setRefundStep(2)}
              className="bg-primary text-static-white text-t5 h-12 w-full cursor-pointer rounded-lg font-semibold disabled:opacity-40"
            >
              확인했어요.
            </button>
          </div>
        </>
      )}

      {/* 2단계 — 환불 사유 */}
      {vm.refundStep === 2 && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-3">
            <p className="text-t4 text-text-strong pt-6 pb-4 font-bold">환불 사유를 선택해 주세요.</p>
            <div className="flex flex-col">
              {SHARE_REFUND_REASONS.map((reason) => (
                <RadioRow
                  key={reason.value}
                  label={reason.label}
                  checked={
                    reason.value === 'etc' ? vm.isEtcReason : !vm.isEtcReason && vm.refundReason === reason.value
                  }
                  onSelect={() => vm.onSelectRefundReason(reason.value)}
                />
              ))}
              {vm.isEtcReason && (
                <textarea
                  ref={textareaRef}
                  value={vm.refundReason}
                  maxLength={64}
                  placeholder="환불 상황을 입력해주세요.(최대 64자)"
                  onChange={(e) => vm.setRefundReason(e.target.value.trimStart())}
                  className="border-stroke-sub text-b4 text-text-strong min-h-[52px] resize-none rounded-lg border px-4 py-3"
                />
              )}
            </div>
          </div>
          <div className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
            <button
              type="button"
              disabled={!vm.refundReason}
              onClick={() => vm.setRefundStep(3)}
              className="bg-primary text-static-white text-t5 h-12 w-full cursor-pointer rounded-lg font-semibold disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </>
      )}

      {/* 3단계 — 현장 사진 첨부 */}
      {vm.refundStep === 3 && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-3">
            <div className="mt-6 flex flex-col gap-1.5">
              <p className="text-t4 text-text-strong font-bold">현장 사진을 첨부해 주세요.(최대 3개)</p>
              <p className="text-text-sub text-c2">
                주차 차량이 있는 경우 <span className="text-primary">차량번호가 보이도록 촬영</span>해 주세요.
              </p>
            </div>

            <div className="mt-5 flex gap-4">
              {previews.map((url, index) => (
                <div key={url} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`첨부 사진 ${index + 1}`}
                    className="border-stroke-soft size-[60px] rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    aria-label={`사진 ${index + 1} 삭제`}
                    onClick={() => vm.removeRefundPhoto(index)}
                    className="absolute -top-1.5 -right-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-black/65 text-white"
                  >
                    <IconXLine className="size-3" />
                  </button>
                </div>
              ))}
              {vm.refundPhotos.length < 3 && (
                <label className="border-stroke-sub flex size-[60px] cursor-pointer items-center justify-center rounded-lg border border-dashed">
                  <IconPlusLine className="text-icon-soft size-5" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onFilesChange} />
                </label>
              )}
            </div>

            <ul className="text-b5 text-text-strong mt-5 flex list-disc flex-col gap-1 pl-5">
              <li>
                환불 신청 후 주차하는 경우 <span className="text-error-base">부정 주차</span>로 간주됩니다.
              </li>
              <li>
                환불신청 후 <span className="text-error-base">접수 처리 전까지 취소 가능</span>합니다.
              </li>
            </ul>
          </div>
          <div className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
            <button
              type="button"
              disabled={vm.isRefundSubmitting}
              onClick={vm.onSubmitRefund}
              className="bg-primary text-static-white text-t5 h-12 w-full cursor-pointer rounded-lg font-semibold disabled:opacity-40"
            >
              {vm.isRefundSubmitting ? '신청 중…' : '환불 신청하기'}
            </button>
          </div>
          <Toast
            id={photoOverToast ?? undefined}
            message={photoOverToast ? '사진은 3개까지 첨부가 가능합니다.' : null}
            onDismiss={() => setPhotoOverToast(null)}
          />
        </>
      )}

      {/* 이탈 확인 모달 */}
      {isStopModalOpen && (
        <ConfirmModal
          title="환불신청을 취소하시겠어요?"
          body={'화면을 나갈 경우 작성한 정보들이\n모두 사라집니다.'}
          confirmLabel="계속하기"
          cancelLabel="나가기"
          onConfirm={() => setIsStopModalOpen(false)}
          onClose={() => {
            setIsStopModalOpen(false)
            vm.closeRefundProcess()
          }}
        />
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
