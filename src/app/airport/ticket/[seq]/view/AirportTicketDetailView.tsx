'use client'

import { MIcon, MText } from '@socar-inc/modu-ui/components'
import { IconAlertFill, IconChevronLeftLine } from '@socar-inc/modu-ui/icons'

import { useAirportTicketDetailViewModel } from '../viewmodel'

/** 공항 시안(연박권) 하단 면책 — 모웹 DISCLAIMER 동일 */
const DISCLAIMER = '주차장에서 발생한 사고는 일체 책임지지 않습니다.\n현장 사정에 따라 주차가 어려울 수 있습니다.'

/** 모웹 TicketDetailSectionContainer — 흰 배경 / 상하 24 / 제목 + 간격 16 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-bg-white flex flex-col gap-4 py-6">
      <MText typography="title_t2" color="text_strong_950" className="block px-4">
        {title}
      </MText>
      {children}
    </section>
  )
}

interface AirportTicketDetailViewProps {
  seq: string
}

/**
 * 공항 이용권 상세 — modu-web-app AirportTicketDetailView 동일 구성.
 * 요약(주차장명·이용권명+가격·주차 가능 기간·라벨 뱃지) → 주차장 사진 → 이용 안내 → 구매 푸터.
 */
export default function AirportTicketDetailView({ seq }: AirportTicketDetailViewProps) {
  const vm = useAirportTicketDetailViewModel(seq)

  return (
    <div className="bg-bg-weak flex h-full flex-col">
      {/* 모웹 MNavigationBar — 중앙 타이틀 */}
      <header className="bg-bg-white flex h-14 shrink-0 items-center px-2">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={vm.goBack}
          className="flex size-11 cursor-pointer items-center justify-center"
        >
          <MIcon icon={IconChevronLeftLine} size={24} decorative />
        </button>
        <h1 className="modu-typography-title-t4 text-text-strong mx-1 flex-1 truncate text-center">이용권 상세</h1>
        <div className="size-11 shrink-0" />
      </header>

      {vm.isLoading ? (
        <div className="flex flex-col gap-4 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-bg-soft h-24 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !vm.detail ? (
        <div className="bg-bg-white flex flex-1 flex-col items-center justify-center gap-1.5 py-24">
          <p className="text-text-strong text-t5 font-bold">주차권을 불러오지 못했어요</p>
          <p className="text-text-sub text-b4">잠시 후 다시 시도해 주세요.</p>
        </div>
      ) : (
        <>
          <main className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-[86px]">
            {/* 이용권 요약 — 날짜는 진입 쿼리로 확정된 범위 표시만 */}
            <div className="bg-bg-white flex flex-col gap-6 px-4 py-6">
              <div className="flex flex-col gap-2">
                <MText typography="title_t4" color="text_sub_600" className="block">
                  {vm.detail.parkinglotName}
                </MText>
                <div className="flex items-start gap-2">
                  <h2 className="min-w-0 truncate">
                    <MText typography="heading_h4" color="text_strong_950">
                      {vm.detail.couponName}
                    </MText>
                  </h2>
                  <MText typography="heading_h4" color="text_strong_950" className="shrink-0 tabular-nums">
                    {vm.totalPrice.toLocaleString()}원
                  </MText>
                </div>
                {vm.formattedDateRange && (
                  <MText typography="title_t4" color="text_strong_950" className="block">
                    {vm.formattedDateRange} 주차 가능
                  </MText>
                )}
              </div>
              {vm.detail.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {vm.detail.labels.map((label) => (
                    <span
                      key={label}
                      className="border-stroke-soft bg-bg-white flex h-[22px] items-center justify-center rounded-full border px-2"
                    >
                      <MText typography="title_t4" color="text_strong_950">
                        {label}
                      </MText>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 주차장 사진 */}
            {vm.detail.photos.length > 0 && (
              <Section title="주차장 사진">
                <div className="scrollbar-hide overflow-x-auto">
                  <div className="flex w-max gap-2 px-4">
                    {vm.detail.photos.map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo.fileName}
                        src={photo.thumbnail}
                        alt={photo.pictureDesc ?? '주차장 사진'}
                        className="h-[160px] w-[240px] shrink-0 rounded-xl object-cover"
                      />
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {/* 이용 안내 */}
            <Section title="이용 안내">
              <div className="flex flex-col gap-4 px-4">
                {vm.cautionNotices.length > 0 && (
                  <div className="bg-information-lighter flex flex-col gap-2 rounded-lg p-4">
                    <div className="text-information-dark flex items-center gap-2">
                      <IconAlertFill width={16} height={16} aria-hidden />
                      <MText typography="title_t4">꼭 확인해주세요</MText>
                    </div>
                    <NoticeDotList items={vm.cautionNotices} colorClass="text-information-dark" />
                  </div>
                )}
                {vm.subNotices.length > 0 && <NoticeDotList items={vm.subNotices} colorClass="text-text-sub" />}
                <div className="bg-bg-weak rounded-lg p-4">
                  <MText typography="body_b4" color="text_sub_600" className="block whitespace-pre-line">
                    {DISCLAIMER}
                  </MText>
                </div>
              </div>
            </Section>
          </main>

          {/* 구매 푸터 — 모웹 ProcessFooter */}
          <footer className="bg-bg-white fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2">
            <div className="px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
              <button
                type="button"
                disabled={vm.detail.isSoldOut}
                onClick={vm.startPurchase}
                className="bg-primary text-static-white text-t5 h-14 w-full cursor-pointer rounded-lg font-semibold disabled:opacity-40"
              >
                {vm.detail.isSoldOut ? '매진' : '주차권 구매하기'}
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

/** 모웹 NoticeDotList — 불릿 리스트 */
function NoticeDotList({ items, colorClass }: { items: string[]; colorClass: string }) {
  return (
    <ul className={`text-b5 flex list-disc flex-col gap-1 pl-5 ${colorClass}`}>
      {items.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
