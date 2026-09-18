'use client'

import { IconCalendarLine, IconChevronLeftLine, IconChevronRightLine, IconMarkerLine } from '@socar-inc/modu-ui/icons'
import Image from 'next/image'

import CtaBottomSheet from '@/shared/components/ui/CtaBottomSheet'
import WheelColumn from '@/shared/components/ui/WheelColumn'

import { useAirportSearchViewModel } from '../viewmodel'

/** 서비스 안내 슬라이드 (modu-web-app AirportInfoSlider) */
const SLIDE_IMAGES = [
  { src: '/images/img_airport_slide_1.png', alt: '업체 별 가격 비교 제공' },
  { src: '/images/img_airport_slide_2.png', alt: '발렛, 픽업/샌딩 제공' },
  { src: '/images/img_airport_slide_3.png', alt: '공항과 가까운 주차장 제공' }
]

/**
 * 공항 주차대행 검색 — modu-web-app AirportClientView 동일 구성.
 * 로고 · 타이틀 · ActionInput 3개(공항 위치/시작/종료 — 바텀시트) · 검색하기 · 서비스 안내 슬라이드.
 */
export default function AirportSearchView() {
  const vm = useAirportSearchViewModel()

  return (
    <div className="bg-bg-white flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center pl-2">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={vm.goBack}
          className="flex size-10 cursor-pointer items-center justify-center"
        >
          <IconChevronLeftLine className="text-icon-strong size-[22px]" />
        </button>
      </header>

      <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="px-4">
          <Image src="/images/img_modu_logo.png" alt="모두의주차장" width={160} height={26} />
          <h1 className="text-t2 text-text-strong pt-1.5 pb-4 font-bold">공항 주변 주차대행 예매</h1>

          {/* ActionInput — 공항 위치 · 시작/종료 시간 (row 간격 동일) */}
          <div className="flex flex-col">
            <ActionInputButton
              icon={<IconMarkerLine className="text-icon-sub size-5" />}
              label="공항 위치"
              placeholder="공항을 선택해주세요"
              value={vm.locationText}
              onClick={vm.openLocationSheet}
            />
            <ActionInputButton
              icon={<IconCalendarLine className="text-icon-sub size-5" />}
              label="시작 시간"
              placeholder="시작 시간을 선택해주세요"
              value={vm.startDateText}
              onClick={vm.openStartSheet}
            />
            <ActionInputButton
              icon={<IconCalendarLine className="text-icon-sub size-5" />}
              label="종료 시간"
              placeholder="종료 시간을 선택해주세요"
              value={vm.endDateText}
              onClick={vm.openEndSheet}
            />
          </div>

          <button
            type="button"
            disabled={vm.isDisableCTAButton}
            onClick={vm.search}
            className="bg-primary text-static-white text-t5 my-6 flex h-14 w-full cursor-pointer items-center justify-center rounded-md font-semibold disabled:opacity-40"
          >
            검색하기
          </button>
        </div>

        <div className="bg-bg-weak h-2.5" />

        {/* 주차 대행 서비스 안내 — 텍스트 + 이미지 슬라이드 */}
        <div className="flex w-full flex-col gap-4 pt-6 pb-16">
          <div className="flex flex-col gap-4 px-4">
            <p className="text-t4 text-text-strong font-bold">주차 대행 서비스 안내</p>
            <p className="text-text-strong text-c2">
              모두의주차장과 제휴를 맺은 주차대행 및 발렛 서비스로
              <br />
              공항 앞까지 발렛·픽업/샌딩 해드립니다.
            </p>
          </div>
          <div className="scrollbar-hide overflow-x-auto">
            <div className="flex w-max gap-2 px-4">
              {SLIDE_IMAGES.map((slide) => (
                <div key={slide.src} className="relative h-[200px] w-[210px] shrink-0">
                  <Image src={slide.src} alt={slide.alt} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* 공항 위치 바텀시트 — 라디오 + 선택완료 */}
      <CtaBottomSheet
        isOpen={vm.isLocationOpen}
        title="공항 위치를 선택해주세요."
        btnText="선택완료"
        btnDisabled={vm.pendingLocationIndex === null}
        onClick={vm.confirmLocation}
        onClose={() => vm.setIsLocationOpen(false)}
      >
        <div className="flex flex-col py-2">
          {vm.groups.map((group, i) => (
            <label key={group.cgSeq} className="flex cursor-pointer items-center gap-3 py-3">
              <input
                type="radio"
                checked={vm.pendingLocationIndex === i}
                onChange={() => vm.setPendingLocationIndex(i)}
                className="accent-primary size-5 cursor-pointer"
              />
              <span className="text-b3 text-text-strong">{group.title}</span>
            </label>
          ))}
        </div>
      </CtaBottomSheet>

      {/* 시작/종료 시간 바텀시트 — 날짜·시간 휠 피커 */}
      <CtaBottomSheet
        isOpen={vm.isStartDateOpen}
        title="주차 시작 시간을 선택해주세요."
        btnText="선택완료"
        onClick={vm.confirmStartDate}
        onClose={() => vm.setIsStartDateOpen(false)}
      >
        <DateTimeWheel vm={vm} />
      </CtaBottomSheet>
      <CtaBottomSheet
        isOpen={vm.isEndDateOpen}
        title="주차 종료 시간을 선택해주세요."
        btnText="선택완료"
        onClick={vm.confirmEndDate}
        onClose={() => vm.setIsEndDateOpen(false)}
      >
        <DateTimeWheel vm={vm} />
      </CtaBottomSheet>

      {/* 종료 먼저 누른 경우 (모웹 ExpirationModal) */}
      {vm.isStartFirstModalOpen && (
        <div className="fixed inset-0 z-[70] mx-auto flex w-full max-w-[480px] items-center justify-center bg-black/50 px-8">
          <div className="bg-bg-white flex w-full flex-col gap-5 rounded-2xl p-5 pt-8">
            <p className="text-t5 text-text-strong text-center font-semibold">시작 시간을 먼저 선택해주세요.</p>
            <button
              type="button"
              onClick={() => vm.setIsStartFirstModalOpen(false)}
              className="bg-primary text-static-white text-t5 h-12 w-full cursor-pointer rounded-lg font-semibold"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** 모웹 ActionInputButton — [아이콘 | 라벨 | 값/placeholder | chevron] */
function ActionInputButton({
  icon,
  label,
  placeholder,
  value,
  onClick
}: {
  icon: React.ReactNode
  label: string
  placeholder: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-stroke-soft flex h-14 w-full cursor-pointer items-center gap-3 border-b px-1 text-left"
    >
      {icon}
      <span className="text-c2 text-text-sub w-16 shrink-0">{label}</span>
      <span className={`text-b3 min-w-0 flex-1 truncate ${value ? 'text-text-strong' : 'text-text-soft'}`}>
        {value || placeholder}
      </span>
      <IconChevronRightLine className="text-icon-soft size-4 shrink-0" />
    </button>
  )
}

/** 날짜 + 시간(30분 슬롯) 휠 — 모웹 WheelDateTimePicker */
function DateTimeWheel({ vm }: { vm: ReturnType<typeof useAirportSearchViewModel> }) {
  return (
    <div className="flex gap-2 py-2">
      <WheelColumn
        options={vm.dateOptions.map((d) => d.text)}
        selectedIndex={vm.selectedDateIndex}
        onChange={vm.onChangeDateIndex}
        ariaLabel="날짜 선택"
      />
      <WheelColumn
        options={vm.hourOptions}
        selectedIndex={vm.selectedHourIndex}
        onChange={vm.setSelectedHourIndex}
        ariaLabel="시간 선택"
      />
    </div>
  )
}
