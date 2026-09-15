'use client'

import { MButton, MCheckbox, MChips, MIcon, MRadio, MText } from '@socar-inc/modu-ui/components'
import { IconChevronDownLine, IconChevronLeftLine, IconChevronUpLine } from '@socar-inc/modu-ui/icons'

import { PAYMENT_TITLE, usePaymentViewModel } from '../viewmodel'

/**
 * 주차권 결제 — payment-webview 브랜치 DailyPaymentView(네이티브 TicketPaymentContentScreen 재현)를
 * 이 프로젝트 MVVM + modu-ui 토큰으로 이관. 금액·상품명은 상세 조회가 원본이다.
 */
export default function PaymentView() {
  const vm = usePaymentViewModel()

  if (vm.isInvalidEntry) {
    return (
      <div className="bg-bg-white flex h-full flex-col items-center justify-center gap-4 px-4">
        <MText typography="body_b3" color="text_strong_950">
          잘못된 접근입니다.
        </MText>
        <MButton size="large" tone="neutral" appearance="stroke" onClick={vm.goBack}>
          닫기
        </MButton>
      </div>
    )
  }

  if (vm.isLoading || !vm.ticket) {
    return (
      <div className="flex h-full items-center justify-center">
        <MText typography="body_b4" color="text_soft_400">
          로딩 중…
        </MText>
      </div>
    )
  }

  const t = vm.ticket

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
            {PAYMENT_TITLE}
          </h1>
          <div className="size-11 shrink-0" />
        </header>

        {/* ─── 1. 주차권 정보 ─── */}
        <section className="bg-bg-white flex flex-col gap-4 px-4 py-6">
          <MText typography="title_t2" color="text_strong_950">
            {t.couponName}
          </MText>
          <div className="flex flex-col gap-2">
            <InfoRow label="주차장" value={t.parkinglot?.parkinglotName ?? '-'} />
            <InfoRow label="이용일" value={vm.parkingDateLabel} />
            {(t.usagePeriodLabel || t.usingTimeLabel) && (
              <InfoRow label="이용시간" value={t.usagePeriodLabel || t.usingTimeLabel} />
            )}
          </div>
        </section>

        {/* ─── 2. 쿠폰 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col gap-3 px-4 py-6">
          <div className="flex items-center justify-between">
            <MText typography="title_t4" color="text_strong_950">
              쿠폰
            </MText>
            <MButton size="small" tone="neutral" appearance="stroke" disabled>
              쿠폰선택
            </MButton>
          </div>
          {/* TODO(구현): 보유 쿠폰 조회 API 연동 */}
          <MText typography="body_b4" color="text_soft_400">
            사용 가능한 쿠폰이 없어요
          </MText>
        </section>

        {/* ─── 3. 충전금 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col gap-3 px-4 py-6">
          <MText typography="title_t4" color="text_strong_950">
            충전금
          </MText>
          <div className="flex items-center gap-2">
            <div className="border-stroke-sub focus-within:border-stroke-strong rounded-6 flex flex-1 items-center border px-3 py-2.5">
              <input
                type="number"
                inputMode="numeric"
                value={vm.point || ''}
                onChange={(e) => vm.changePoint(Number(e.target.value) || 0)}
                placeholder="0"
                aria-label="사용할 충전금"
                className="modu-typography-body-b3 text-text-strong w-full bg-transparent outline-none"
              />
              <MText typography="body_b3" color="text_sub_600">
                P
              </MText>
            </div>
            <MButton
              size="medium"
              tone="neutral"
              appearance="stroke"
              onClick={vm.useAllPoint}
              disabled={vm.maxPoint === 0}
            >
              모두사용
            </MButton>
          </div>
          <MText typography="body_b5" color="text_sub_600">
            보유 {vm.pointBalance.toLocaleString()}P
          </MText>
        </section>

        {/* ─── 4. 결제 금액 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col px-4 py-6">
          <button className="flex w-full cursor-pointer items-center justify-between" onClick={vm.togglePriceOpen}>
            <MText typography="title_t4" color="text_strong_950">
              결제 금액
            </MText>
            <span className="flex items-center gap-1">
              <MText typography="title_t4" color="text_strong_950" className="tabular-nums">
                {vm.finalPrice.toLocaleString()}원
              </MText>
              <MIcon icon={vm.isPriceOpen ? IconChevronUpLine : IconChevronDownLine} size={16} decorative />
            </span>
          </button>
          {vm.isPriceOpen && (
            <div className="mt-4 flex flex-col gap-2">
              <PriceRow label="상품 금액" value={`${vm.price.toLocaleString()}원`} />
              {vm.point > 0 && <PriceRow label="충전금 사용" value={`-${vm.point.toLocaleString()}P`} discount />}
            </div>
          )}
        </section>

        {/* ─── 5. 결제 수단 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col gap-3 px-4 py-6">
          <MText typography="title_t4" color="text_strong_950">
            결제 수단
          </MText>
          <MRadio checked={vm.method === 'card'} label="신용/체크카드" onCheckedChange={() => vm.setMethod('card')} />
          {vm.method === 'card' && (
            <div className="border-stroke-soft rounded-8 border p-4">
              {/* TODO(구현): 빌링키 카드 목록·등록 연동 */}
              <div className="bg-bg-weak rounded-6 flex h-[88px] items-center justify-center">
                <MText typography="caption_c2" color="text_sub_600">
                  + 새 카드 추가
                </MText>
              </div>
            </div>
          )}
          <MRadio
            checked={vm.method !== 'card'}
            label="다른 결제 수단"
            onCheckedChange={() => vm.setMethod('naverpay')}
          />
          {vm.method !== 'card' && (
            <div className="grid grid-cols-2 gap-2">
              <MChips size="large" selected={vm.method === 'naverpay'} onClick={() => vm.setMethod('naverpay')}>
                네이버페이
              </MChips>
              <MChips size="large" selected={vm.method === 'phone'} onClick={() => vm.setMethod('phone')}>
                휴대폰
              </MChips>
            </div>
          )}
        </section>

        {/* ─── 6. 영수증 ─── */}
        <section className="bg-bg-white mt-2 px-4 py-5">
          <MCheckbox
            checked={vm.wantsReceipt}
            onCheckedChange={vm.toggleReceipt}
            label="영수증(현금영수증) 신청"
            labelWeight="regular"
          />
        </section>

        <div className="mt-2 flex-1" />

        {/* ─── 하단 고정 결제 버튼 ─── */}
        <footer className="bg-bg-white sticky bottom-0 z-20 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <MButton size="xLarge" fullWidth onClick={vm.handlePay}>
            {vm.finalPrice.toLocaleString()}원 결제하기
          </MButton>
        </footer>
      </main>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <MText typography="body_b4" color="text_sub_600" className="shrink-0">
        {label}
      </MText>
      <MText typography="body_b4" color="text_strong_950" className="truncate">
        {value}
      </MText>
    </div>
  )
}

function PriceRow({ label, value, discount }: { label: string; value: string; discount?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <MText typography="body_b4" color="text_sub_600">
        {label}
      </MText>
      <span className={`modu-typography-body-b4 tabular-nums ${discount ? 'text-primary' : 'text-text-strong'}`}>
        {value}
      </span>
    </div>
  )
}
