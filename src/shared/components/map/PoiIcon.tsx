'use client'

import { MarkerType, type Pin } from '@/shared/types/map'

interface PoiIconProps {
  pin: Pin
  isOn?: boolean
  isFavorite?: boolean
}

const PinShadowIcon = () => (
  <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="6" cy="3" rx="6" ry="3" fill="black" fillOpacity="0.15" />
  </svg>
)

function PoiWrapper({ children }: { children: React.ReactNode }) {
  return <div className="relative h-full w-full">{children}</div>
}

/**
 * 마커 시각 체계 — brand 단일 hue, 채도/명도 램프로만 구분
 *
 * | 타입          | 원                                    | 의미        |
 * |---------------|---------------------------------------|-------------|
 * | 민영/공영 P   | 흰 배경 + slate 보더                  | 조회용 배경 |
 * | 제휴 P        | brand-700 솔리드 (딥)                 | 제휴        |
 * | 공유 S        | brand-100 필 + brand-400 보더 (라이트) | 공유        |
 * | 구매가능 카드 | brand-700 카드                        | 구매 CTA    |
 * | 구매불가 카드 | 흰 outline + slate 텍스트             | 비활성      |
 *
 * 상태: isOn(선택 · brand-950)만 색을 덮는다. 즐겨찾기는 색 대신 ⭐ 뱃지 — 가격 카드 위계 일관 유지.
 */
function getMarkerPalette(isOn: boolean) {
  if (isOn) {
    return {
      solidBg: 'var(--color-brand-950)',
      solidBorder: 'var(--color-brand-950)',
      solidText: '#ffffff',
      labelBg: 'var(--color-brand-950)',
      labelText: '#ffffff'
    }
  }
  return null
}

/** 즐겨찾기 별(icn_favorite) 미니 뱃지 — 마커 우상단 오버레이 */
function FavoriteBadge() {
  return (
    <div
      className="absolute -top-[5px] -right-[5px] z-[1] flex h-[14px] w-[14px] items-center justify-center rounded-full bg-white"
      style={{ boxShadow: '0 1px 2px rgba(14,18,27,0.25)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 네이버 마커 DOM 에 img 직접 렌더 */}
      <img src="/images/icn_favorite.webp" alt="" width={10} height={10} className="h-[10px] w-[10px] object-contain" />
    </div>
  )
}

const SHADOW_CIRCLE = '0 1px 2px rgba(14,18,27,0.16)'
const SHADOW_CARD = '0 2px 8px rgba(14,18,27,0.18)'
const SHADOW_CARD_DISABLED = '0 1px 3px rgba(14,18,27,0.08)'

/** 원 아래 텍스트 라벨 — 흰 필 + slate 텍스트 (지도 위 가독용) */
function PinLabel({
  label,
  palette,
  accent
}: {
  label: string
  palette: ReturnType<typeof getMarkerPalette>
  accent?: 'brand'
}) {
  if (!label) return null
  if (palette) {
    return (
      <div
        className="text-t6 mt-[2px] rounded-full px-[6px] py-[1px] text-center font-bold whitespace-nowrap"
        style={{ backgroundColor: palette.labelBg, color: palette.labelText }}
      >
        {label}
      </div>
    )
  }
  const accentText = accent === 'brand' ? 'text-brand-800' : 'text-slate-600'
  return (
    <div
      className={`text-t6 mt-[2px] rounded-full bg-white px-[6px] py-[1px] text-center font-bold whitespace-nowrap ${accentText}`}
      style={{ boxShadow: SHADOW_CIRCLE }}
    >
      {label}
    </div>
  )
}

// ── PRIVATE/PUBLIC — 조회용. 흰 원 + slate 보더로 배경 레이어에 머문다 ──
function NormalPublicPOI({ label, isOn, isFavorite }: { label: string; isOn: boolean; isFavorite: boolean }) {
  const palette = getMarkerPalette(isOn)
  return (
    <PoiWrapper>
      <div className="flex flex-col items-center">
        <div
          className={`relative flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] ${
            palette ? '' : 'border-slate-300 bg-white'
          }`}
          style={{
            boxShadow: SHADOW_CIRCLE,
            ...(palette ? { borderColor: palette.solidBorder, backgroundColor: palette.solidBg } : {})
          }}
        >
          <span className={`text-t6 leading-none font-bold ${palette ? 'text-white' : 'text-slate-600'}`}>P</span>
          {isFavorite && <FavoriteBadge />}
        </div>
        <PinLabel label={label} palette={palette} />
      </div>
    </PoiWrapper>
  )
}

// ── PARTNER (primaryTicket 없음) — brand-700 솔리드 원 ──
function NormalPartnerPOI({ label, isOn, isFavorite }: { label: string; isOn: boolean; isFavorite: boolean }) {
  const palette = getMarkerPalette(isOn)
  return (
    <PoiWrapper>
      <div className="flex flex-col items-center">
        <div
          className={`relative flex h-[28px] w-[28px] items-center justify-center rounded-full border-[2px] ${
            palette ? '' : 'border-brand-800 bg-brand-700'
          }`}
          style={{
            boxShadow: SHADOW_CIRCLE,
            ...(palette ? { borderColor: palette.solidBorder, backgroundColor: palette.solidBg } : {})
          }}
        >
          <span className="text-t5 leading-none font-bold text-white">P</span>
          {isFavorite && <FavoriteBadge />}
        </div>
        <PinLabel label={label} palette={palette} accent="brand" />
      </div>
    </PoiWrapper>
  )
}

// ── SHARE — brand 라이트 필. 제휴(딥 솔리드)와 같은 hue, 명도로 구분 ──
function NormalSharePOI({ label, isOn, isFavorite }: { label: string; isOn: boolean; isFavorite: boolean }) {
  const palette = getMarkerPalette(isOn)
  return (
    <PoiWrapper>
      <div className="flex flex-col items-center">
        <div
          className={`relative flex h-[28px] w-[28px] items-center justify-center rounded-full border-[2px] ${
            palette ? '' : 'border-brand-400 bg-brand-100'
          }`}
          style={{
            boxShadow: SHADOW_CIRCLE,
            ...(palette ? { borderColor: palette.solidBorder, backgroundColor: palette.solidBg } : {})
          }}
        >
          <span className={`text-t5 leading-none font-bold ${palette ? 'text-white' : 'text-brand-700'}`}>S</span>
          {isFavorite && <FavoriteBadge />}
        </div>
        <PinLabel label={label} palette={palette} accent="brand" />
      </div>
    </PoiWrapper>
  )
}

// ── PrimaryTicket (canBuy) — 구매 CTA. primary(brand-500) 카드 — 시간필터 active 칩과 동일 톤 ──
function PrimaryTicketPOI({
  name,
  price,
  isOn,
  isFavorite
}: {
  name: string
  price: string
  isOn: boolean
  isFavorite: boolean
}) {
  const palette = getMarkerPalette(isOn)
  return (
    <PoiWrapper>
      <div className="relative z-[13] flex flex-col items-center">
        <div
          className={`relative rounded-[10px] border-[1.5px] ${palette ? '' : 'border-brand-600 bg-primary'}`}
          style={{
            boxShadow: SHADOW_CARD,
            ...(palette ? { borderColor: palette.solidBorder, backgroundColor: palette.solidBg } : {})
          }}
        >
          <div className="flex min-w-[68px] flex-col items-center px-[10px] pt-[5px] pb-[6px]">
            <div className="text-c4 font-medium whitespace-nowrap text-white/75">{name}</div>
            <div className="text-t4 mt-[1px] font-bold text-white">{price}</div>
          </div>
          {isFavorite && <FavoriteBadge />}
        </div>
        <div
          className={`h-0 w-0 border-t-[5px] border-r-[5px] border-l-[5px] border-r-transparent border-l-transparent ${
            palette ? '' : 'border-t-primary'
          }`}
          style={palette ? { borderTopColor: palette.solidBg } : undefined}
        />
        <div className="absolute right-1/2 -bottom-[12px] h-[6px] w-[12px] translate-x-1/2">
          <PinShadowIcon />
        </div>
      </div>
    </PoiWrapper>
  )
}

// ── PrimaryTicket (!canBuy · 판매예정 등) — 비활성. 흰 outline 카드로 시각적 무게를 뺀다 ──
function PrimaryTicketDisabledPOI({
  name,
  price,
  isOn,
  isFavorite
}: {
  name: string
  price: string
  isOn: boolean
  isFavorite: boolean
}) {
  const palette = getMarkerPalette(isOn)
  return (
    <PoiWrapper>
      <div className="relative z-[11] flex flex-col items-center">
        <div
          className={`relative rounded-[10px] border-[1.5px] ${palette ? '' : 'border-slate-300 bg-white'}`}
          style={{
            boxShadow: SHADOW_CARD_DISABLED,
            ...(palette ? { borderColor: palette.solidBorder, backgroundColor: palette.solidBg } : {})
          }}
        >
          <div className="flex min-w-[68px] flex-col items-center px-[10px] pt-[5px] pb-[6px]">
            <div className={`text-c4 font-medium whitespace-nowrap ${palette ? 'text-white/75' : 'text-slate-400'}`}>
              {name}
            </div>
            <div className={`text-t4 mt-[1px] font-bold ${palette ? 'text-white' : 'text-slate-500'}`}>{price}</div>
          </div>
          {isFavorite && <FavoriteBadge />}
        </div>
        <div
          className={`h-0 w-0 border-t-[5px] border-r-[5px] border-l-[5px] border-r-transparent border-l-transparent ${
            palette ? '' : 'border-t-slate-300'
          }`}
          style={palette ? { borderTopColor: palette.solidBg } : undefined}
        />
        <div className="absolute right-1/2 -bottom-[12px] h-[6px] w-[12px] translate-x-1/2">
          <PinShadowIcon />
        </div>
      </div>
    </PoiWrapper>
  )
}

function formatPrice(price: number | undefined): string {
  return price?.toLocaleString() ?? ''
}

function normalizeLabel(label: string): string {
  const trimmed = label?.trim() ?? ''
  if (!trimmed || trimmed.toUpperCase() === 'P') return ''
  return trimmed
}

export default function PoiIcon({ pin, isOn = false, isFavorite = false }: PoiIconProps) {
  const label = normalizeLabel(pin.label)
  switch (pin.markerType) {
    case MarkerType.PrimaryTicket:
      return (
        <PrimaryTicketPOI
          name={pin.ticketName ?? ''}
          price={formatPrice(pin.ticketPrice)}
          isOn={isOn}
          isFavorite={isFavorite}
        />
      )
    case MarkerType.PrimaryTicketDisabled:
      return (
        <PrimaryTicketDisabledPOI
          name={pin.ticketName ?? ''}
          price={formatPrice(pin.ticketPrice)}
          isOn={isOn}
          isFavorite={isFavorite}
        />
      )
    case MarkerType.NormalPartner:
      return <NormalPartnerPOI label={label} isOn={isOn} isFavorite={isFavorite} />
    case MarkerType.NormalShare:
      return <NormalSharePOI label={label} isOn={isOn} isFavorite={isFavorite} />
    case MarkerType.NormalPublic:
    default:
      return <NormalPublicPOI label={label} isOn={isOn} isFavorite={isFavorite} />
  }
}
