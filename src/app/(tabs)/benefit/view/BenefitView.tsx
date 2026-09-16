'use client'

import { MButton } from '@socar-inc/modu-ui/components'
import Image from 'next/image'

import Toast from '@/shared/components/ui/Toast'

import { useBenefitViewModel } from '../viewmodel'

/**
 * 혜택 — Figma 메인화면 개편 4537-20722 기준.
 * 헤더 → 롤링 띠배너(서버 배너) → 응모 이벤트 카드 → 놓치지 마세요(개별 카드 4종).
 * 하단 독은 (tabs) 레이아웃의 DockBar 를 그대로 쓴다 (시안의 GNB 미사용).
 */
export default function BenefitView() {
  const vm = useBenefitViewModel()

  return (
    <div className="bg-bg-weak flex min-h-full flex-col pb-6">
      {/* ─── 헤더 — 홈 TopBar(검색바 영역)와 동일 높이: pt-3 + 40px + pb-2 ─── */}
      <header className="bg-bg-white flex items-center px-5 pt-3 pb-2">
        <h1 className="text-t3 text-text-strong flex h-10 items-center font-bold">혜택</h1>
      </header>

      <div className="flex flex-col gap-5 px-5 pt-1">
        {/* ─── 띠배너 — 삼성화재 다이렉트 (Figma 4537-20722 image 169, 정적) ─── */}
        <button onClick={() => vm.onClickMission('insurance')} className="block w-full cursor-pointer">
          <Image
            src="/images/img_benefit_insurance_banner.webp"
            alt="삼성화재 다이렉트 — 내차 보험료 확인하면 모두의주차장 7,000원 쿠폰 지급"
            width={1059}
            height={285}
            priority
            className="w-full rounded-[12px] object-cover"
          />
        </button>

        {/* ─── 응모 이벤트 카드 ─── */}
        <section className="bg-bg-white border-stroke-soft flex flex-col items-center rounded-2xl border p-6">
          <h2 className="text-h3 text-text-strong text-center font-bold whitespace-pre-line">{vm.raffle.title}</h2>
          <p className="text-b3 text-text-soft mt-2 text-center whitespace-pre-line">{vm.raffle.subtitle}</p>
          <Image
            src={vm.raffle.image}
            alt=""
            width={212}
            height={125}
            className="my-10 h-[125px] w-[212px] object-contain"
          />
          <ul className="text-c3 text-text-sub flex flex-col items-center gap-0.5">
            {vm.raffle.schedule.map((line) => (
              <li key={line} className="flex items-center gap-1.5">
                <span aria-hidden className="bg-text-sub size-[3px] shrink-0 rounded-full" />
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-10 w-full">
            <MButton size="xLarge" fullWidth onClick={vm.onClickRaffle}>
              {vm.raffle.cta}
            </MButton>
          </div>
        </section>

        {/* ─── 놓치지 마세요 ─── */}
        <section className="flex flex-col gap-3.5">
          <h2 className="text-t3 text-text-strong font-bold">놓치지 마세요</h2>
          {vm.missions.map((mission) => (
            <button
              key={mission.id}
              onClick={() => vm.onClickMission(mission.id)}
              className="bg-bg-white flex h-[90px] cursor-pointer items-center gap-4 rounded-2xl px-5 text-left"
            >
              <Image src={mission.icon} alt="" width={58} height={58} className="size-[58px] shrink-0 object-contain" />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-t3 text-text-strong font-bold">{mission.title}</span>
                <span className="text-t5 text-primary font-bold">{mission.highlight}</span>
              </span>
            </button>
          ))}
        </section>
      </div>

      <Toast id={vm.toastMsg?.id} message={vm.toastMsg?.message ?? null} onDismiss={vm.dismissToast} />
    </div>
  )
}
