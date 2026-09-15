'use client'

import { MAlert, MButton, MCheckbox, MChips, MIcon, MRadio, MText, MToastPopup } from '@socar-inc/modu-ui/components'
import { IconChevronDownLine, IconChevronLeftLine, IconChevronUpLine, IconPlusLine } from '@socar-inc/modu-ui/icons'
import { useEffect } from 'react'

import { PAYMENT_TITLE, usePaymentViewModel } from '../viewmodel'

/**
 * 주차권 결제 — pay 서비스(HomePage) 회원 partner 플로우 이관.
 * 섹션: 상품 정보(입차예정시간·차량) → 쿠폰·충전금 → 결제 정보 → 결제 수단 → 영수증 → CTA.
 * 금액·상품명의 원본은 상세 조회, 카드·쿠폰·차량·포인트는 GET /user/payment-config 한 방이다.
 */
export default function PaymentView() {
  const vm = usePaymentViewModel()

  // 토스트 자동 닫힘
  useEffect(() => {
    if (!vm.toast) return
    const timer = setTimeout(vm.dismissToast, 3000)
    return () => clearTimeout(timer)
  }, [vm.toast, vm.dismissToast])

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

  if (vm.needsLogin) {
    return (
      <div className="bg-bg-white flex h-full flex-col items-center justify-center gap-4 px-4">
        <div className="flex flex-col items-center gap-1.5">
          <MText typography="title_t3" color="text_strong_950">
            로그인이 필요해요
          </MText>
          <MText typography="body_b4" color="text_sub_600" className="text-center">
            주차권 결제는 로그인 후 이용할 수 있어요
          </MText>
        </div>
        <MButton size="large" onClick={vm.requestLogin}>
          로그인하기
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

        {/* ─── 1. 상품 정보 ─── */}
        <section className="bg-bg-white flex flex-col gap-4 px-4 py-6">
          <MText typography="title_t2" color="text_strong_950">
            {t.couponName}
          </MText>
          <div className="flex flex-col gap-2">
            <InfoRow label="주차장" value={t.parkinglot?.parkinglotName ?? '-'} />
            <InfoRow label="이용일" value={vm.parkingDateLabel} />
            {(t.usagePeriodLabel || t.usingTimeLabel) && (
              <InfoRow label="이용기간" value={t.usagePeriodLabel || t.usingTimeLabel} />
            )}
          </div>

          {/* 입차 예정시간 — requiresEntryTime 상품만. 슬롯 라벨은 서버가 준다 */}
          {vm.requiresEntryTime && (
            <div className="flex flex-col gap-2">
              <MText typography="title_t5" color="text_strong_950">
                입차 예정시간
              </MText>
              {vm.slots.length > 0 ? (
                <div className="scrollbar-hide -mx-4 overflow-x-auto">
                  <div className="flex w-max gap-2 px-4">
                    {vm.slots.map((slot) => (
                      <MChips
                        key={slot.predictBeginTime}
                        size="large"
                        selected={vm.selectedSlot?.predictBeginTime === slot.predictBeginTime}
                        onClick={() => vm.selectSlot(slot.predictBeginTime)}
                      >
                        {slot.title}
                      </MChips>
                    ))}
                  </div>
                </div>
              ) : (
                <MText typography="body_b4" color="text_soft_400">
                  선택 가능한 입차 시간이 없어요
                </MText>
              )}
            </div>
          )}

          {/* 차량 — payment-config 의 등록 차량에서 고른다 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <MText typography="title_t5" color="text_strong_950">
                차량
              </MText>
              <MButton
                size="xSmall"
                tone="neutral"
                appearance="ghost"
                leftIcon={<IconPlusLine />}
                onClick={vm.goRegisterCar}
              >
                차량 등록
              </MButton>
            </div>
            {vm.cars.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {vm.cars.map((car) => (
                  <MChips
                    key={car.carSeq}
                    size="large"
                    selected={vm.selectedCar?.carSeq === car.carSeq}
                    onClick={() => vm.selectCar(car.carSeq)}
                  >
                    {car.carNum}
                  </MChips>
                ))}
              </div>
            ) : (
              <MText typography="body_b4" color="text_soft_400">
                등록된 차량이 없어요 — 차량 등록 후 결제할 수 있어요
              </MText>
            )}
          </div>
        </section>

        {/* ─── 2. 쿠폰 · 충전금 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col gap-4 px-4 py-6">
          <div className="flex flex-col gap-2">
            <MText typography="title_t4" color="text_strong_950">
              쿠폰
            </MText>
            {vm.coupons.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {vm.coupons.map((coupon) => {
                  const selectable = coupon.couponPrice != null
                  const selected = vm.selectedCoupon?.couponUserId === coupon.couponUserId
                  return (
                    <button
                      key={coupon.couponUserId}
                      onClick={() => vm.selectCoupon(selected ? null : coupon.couponUserId)}
                      disabled={!selectable}
                      className={`rounded-8 flex cursor-pointer items-center justify-between border px-3 py-2.5 text-left ${
                        selected ? 'border-primary' : 'border-stroke-soft'
                      } ${selectable ? '' : 'cursor-default opacity-50'}`}
                    >
                      <span className="modu-typography-body-b4 text-text-strong min-w-0 flex-1 truncate">
                        {coupon.name}
                      </span>
                      <span className="modu-typography-title-t5 text-primary shrink-0 tabular-nums">
                        {coupon.couponPrice != null ? `-${coupon.couponPrice.toLocaleString()}원` : '적용 불가'}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <MText typography="body_b4" color="text_soft_400">
                사용 가능한 쿠폰이 없어요
              </MText>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <MText typography="title_t4" color="text_strong_950">
              충전금
            </MText>
            <div className="flex items-center gap-2">
              <div className="border-stroke-sub focus-within:border-stroke-strong rounded-6 flex flex-1 items-center border px-3 py-2.5">
                <input
                  type="number"
                  inputMode="numeric"
                  value={vm.usedPoints || ''}
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
                disabled={vm.usableCap === 0}
              >
                모두사용
              </MButton>
            </div>
            <MText typography="body_b5" color="text_sub_600">
              보유 {vm.pointBalance.toLocaleString()}P
            </MText>
          </div>
        </section>

        {/* ─── 3. 결제 정보 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col px-4 py-6">
          <button className="flex w-full cursor-pointer items-center justify-between" onClick={vm.togglePriceOpen}>
            <MText typography="title_t4" color="text_strong_950">
              결제 정보
            </MText>
            <span className="flex items-center gap-1">
              <MText typography="title_t4" color="text_strong_950" className="tabular-nums">
                {vm.amounts.payableAmount.toLocaleString()}원
              </MText>
              <MIcon icon={vm.isPriceOpen ? IconChevronUpLine : IconChevronDownLine} size={16} decorative />
            </span>
          </button>
          {vm.isPriceOpen && (
            <div className="mt-4 flex flex-col gap-2">
              <PriceRow label="상품 금액" value={`${t.price.toLocaleString()}원`} />
              {vm.amounts.couponDiscount > 0 && (
                <PriceRow label="쿠폰 할인" value={`-${vm.amounts.couponDiscount.toLocaleString()}원`} discount />
              )}
              {vm.usedPoints > 0 && (
                <PriceRow label="충전금 사용" value={`-${vm.usedPoints.toLocaleString()}P`} discount />
              )}
            </div>
          )}
        </section>

        {/* ─── 4. 결제 수단 — 0원이면 선택 불필요 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col gap-3 px-4 py-6">
          <MText typography="title_t4" color="text_strong_950">
            결제 수단
          </MText>
          {vm.amounts.payableAmount === 0 ? (
            <MText typography="body_b4" color="text_sub_600">
              충전금으로 전액 결제돼요 — 결제 수단을 고르지 않아도 돼요
            </MText>
          ) : (
            <>
              <MRadio
                checked={vm.method === 'tosspay'}
                label="토스페이"
                onCheckedChange={() => vm.setMethod('tosspay')}
              />
              <MRadio
                checked={vm.method === 'card'}
                label="신용/체크카드"
                onCheckedChange={() => vm.setMethod('card')}
              />
              {vm.method === 'card' && (
                <div className="scrollbar-hide -mx-4 overflow-x-auto">
                  <div className="flex w-max gap-2 px-4">
                    {vm.cards.map((card) => (
                      <button
                        key={card.billSeq}
                        onClick={() => vm.selectCard(card.billSeq)}
                        className={`rounded-8 flex h-[72px] w-[120px] shrink-0 cursor-pointer flex-col justify-between border p-3 text-left ${
                          vm.selectedBillSeq === card.billSeq ? 'border-primary' : 'border-stroke-soft'
                        }`}
                      >
                        <span className="modu-typography-title-t6 text-text-strong truncate">
                          {card.nickName || card.cardName}
                        </span>
                        <span className="modu-typography-caption-c3 text-text-soft tabular-nums">{card.cardNum}</span>
                      </button>
                    ))}
                    <button
                      onClick={vm.goRegisterCard}
                      className="border-stroke-sub rounded-8 flex h-[72px] w-[120px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed"
                    >
                      <MIcon icon={IconPlusLine} size={16} color="icon_soft_400" decorative />
                      <span className="modu-typography-caption-c3 text-text-soft">카드 추가</span>
                    </button>
                  </div>
                </div>
              )}
              <MRadio
                checked={vm.method === 'other'}
                label="다른 결제 수단"
                onCheckedChange={() => vm.setMethod('other')}
              />
              {vm.method === 'other' && (
                <div className="grid grid-cols-2 gap-2">
                  <MChips
                    size="large"
                    selected={vm.otherMethod === 'naverpay'}
                    onClick={() => vm.setOtherMethod('naverpay')}
                  >
                    네이버페이
                  </MChips>
                  <MChips size="large" selected={vm.otherMethod === 'phone'} onClick={() => vm.setOtherMethod('phone')}>
                    휴대폰 결제
                  </MChips>
                </div>
              )}
            </>
          )}
        </section>

        {/* ─── 5. 영수증 ─── */}
        <section className="bg-bg-white mt-2 flex flex-col gap-3 px-4 py-5">
          <MCheckbox
            checked={vm.receiptChecked}
            onCheckedChange={vm.toggleReceipt}
            label="영수증(현금영수증) 신청"
            labelWeight="regular"
          />
          {vm.receiptChecked && (
            <input
              type="email"
              inputMode="email"
              value={vm.receiptEmail}
              onChange={(e) => vm.setReceiptEmail(e.target.value)}
              placeholder="영수증 받을 이메일"
              aria-label="영수증 받을 이메일"
              className="modu-typography-body-b3 text-text-strong border-stroke-sub focus:border-stroke-strong rounded-6 border px-3 py-2.5 outline-none"
            />
          )}
        </section>

        <div className="mt-2 flex-1" />

        {/* ─── 하단 고정 결제 버튼 ─── */}
        <footer className="bg-bg-white sticky bottom-0 z-20 px-6 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <MButton size="xLarge" fullWidth disabled={!vm.canPay} onClick={() => vm.handlePay()}>
            {vm.isPaying ? '결제 중…' : `${vm.amounts.payableAmount.toLocaleString()}원 결제하기`}
          </MButton>
        </footer>
      </main>

      {/* ─── 차량 확인 — 결제 전 반드시 1회 되묻는다 (pay carNotConfirmed) ─── */}
      {vm.isCarConfirmOpen && vm.selectedCar && (
        <div className="bg-overlay-gray fixed inset-0 z-[var(--z-modal,500)] flex items-center justify-center px-4">
          <MAlert
            title="차량번호를 확인해주세요"
            description={`${vm.selectedCar.carNum} 차량으로 결제할까요?`}
            secondaryAction={
              <MButton size="large" tone="neutral" appearance="stroke" fullWidth onClick={vm.closeCarConfirm}>
                취소
              </MButton>
            }
            primaryAction={
              <MButton size="large" fullWidth onClick={vm.confirmCarAndPay}>
                결제하기
              </MButton>
            }
          />
        </div>
      )}

      {/* ─── 토스트 — 서버 사유·차단 안내 ─── */}
      {vm.toast && (
        <div className="fixed inset-x-4 bottom-24 z-[var(--z-toast,600)]">
          <MToastPopup variant="round" message={vm.toast} onClose={vm.dismissToast} />
        </div>
      )}
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
