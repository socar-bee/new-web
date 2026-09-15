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
 * 마커 색상 팔레트 — 우선순위: isOn(선택) > isFavorite(즐겨찾기) > 기본
 * 파란색의 보색(레드/코럴)을 라이트 톤으로 가져가 부드럽게 어우러지게.
 */
function getMarkerPalette(isOn: boolean, isFavorite: boolean) {
  if (isOn) {
    return {
      solidBg: '#005c99', // brand-900
      solidBorder: '#003d66', // brand-950
      lightBg: '#005c99',
      lightBorder: '#003d66',
      lightText: '#FFFFFF',
      labelBg: '#003d66',
      labelText: '#FFFFFF'
    }
  }
  if (isFavorite) {
    return {
      solidBg: '#ff7575', // red-400 — light coral red, 핑크보다 빨강 쪽
      solidBorder: '#ff4c4c', // red-500
      lightBg: '#ffe2e2', // red-100
      lightBorder: '#ff7575',
      lightText: '#b33535', // red-800
      labelBg: '#ff7575',
      labelText: '#FFFFFF'
    }
  }
  return null
}

function favoriteShadow(baseShadow: string, _isFavorite: boolean): string {
  return baseShadow
}

const SHADOW_CIRCLE = '0 1px 3px rgba(0,0,0,0.25)'
const SHADOW_CARD = '0 2px 6px rgba(0,0,0,0.2)'
const SHADOW_CARD_DISABLED = '0 2px 4px rgba(0,0,0,0.12)'

function ParkingCircle({ isOn, isFavorite }: { isOn: boolean; isFavorite: boolean }) {
  const palette = getMarkerPalette(isOn, isFavorite)
  return (
    <div
      className={`flex h-[28px] w-[28px] items-center justify-center rounded-full border-[2px] ${
        palette ? '' : 'border-brand-600 bg-primary'
      }`}
      style={{
        boxShadow: favoriteShadow(SHADOW_CIRCLE, isFavorite),
        ...(palette ? { borderColor: palette.solidBorder, backgroundColor: palette.solidBg } : {})
      }}
    >
      <span className="text-[13px] leading-none font-bold text-white">P</span>
    </div>
  )
}

// ── PRIVATE/PUBLIC - light primary 배경 + primary border + 중앙 'P' ──
function NormalPublicPOI({ label, isOn, isFavorite }: { label: string; isOn: boolean; isFavorite: boolean }) {
  const palette = getMarkerPalette(isOn, isFavorite)
  return (
    <PoiWrapper>
      <div className="flex flex-col items-center">
        <div
          className={`flex h-[28px] w-[28px] items-center justify-center rounded-full border-[2px] ${
            palette ? '' : 'border-primary bg-primary-light'
          }`}
          style={{
            boxShadow: favoriteShadow(SHADOW_CIRCLE, isFavorite),
            ...(palette ? { borderColor: palette.lightBorder, backgroundColor: palette.lightBg } : {})
          }}
        >
          <span
            className={`text-[13px] leading-none font-bold ${palette ? '' : 'text-primary-dark'}`}
            style={palette ? { color: palette.lightText } : undefined}
          >
            P
          </span>
        </div>
        {label && (
          <div
            className={`mt-[2px] rounded-[10px] px-[5px] py-[1px] text-center text-[11px] leading-[15px] font-bold whitespace-nowrap ${
              isOn ? 'bg-brand-900 text-white' : 'bg-white text-slate-700'
            }`}
            style={{ textShadow: isOn ? 'none' : '0 0 3px rgba(255,255,255,0.8)' }}
          >
            {label}
          </div>
        )}
      </div>
    </PoiWrapper>
  )
}

// ── PARTNER (no primaryTicket) - primary label badge below circle ──
function NormalPartnerPOI({ label, isOn, isFavorite }: { label: string; isOn: boolean; isFavorite: boolean }) {
  const palette = getMarkerPalette(isOn, isFavorite)
  return (
    <PoiWrapper>
      <div className="flex flex-col items-center">
        <ParkingCircle isOn={isOn} isFavorite={isFavorite} />
        {label && (
          <div
            className={`mt-[2px] rounded-[10px] px-[6px] py-[1px] text-center text-[11px] leading-[15px] font-bold whitespace-nowrap text-white ${
              palette ? '' : 'bg-primary'
            }`}
            style={palette ? { backgroundColor: palette.labelBg, color: palette.labelText } : undefined}
          >
            {label}
          </div>
        )}
      </div>
    </PoiWrapper>
  )
}

// ── SHARE - 흰 배경 + primary border + 중앙 'S' ──
function NormalSharePOI({ label, isOn, isFavorite }: { label: string; isOn: boolean; isFavorite: boolean }) {
  const palette = getMarkerPalette(isOn, isFavorite)
  // share는 흰 배경 유지 + 컬러 보더/글자만 변경 (선택 시만 채워진 어두운 배경)
  const isFilled = isOn
  return (
    <PoiWrapper>
      <div className="flex flex-col items-center">
        <div
          className={`flex h-[28px] w-[28px] items-center justify-center rounded-full border-[2px] ${
            isFilled ? 'border-brand-950 bg-brand-900' : palette ? 'bg-white' : 'border-primary bg-white'
          }`}
          style={{
            boxShadow: favoriteShadow(SHADOW_CIRCLE, isFavorite),
            ...(!isFilled && palette ? { borderColor: palette.solidBorder } : {})
          }}
        >
          <span
            className={`text-[13px] leading-none font-bold ${isFilled ? 'text-white' : palette ? '' : 'text-primary'}`}
            style={!isFilled && palette ? { color: palette.solidBg } : undefined}
          >
            S
          </span>
        </div>
        {label && (
          <div
            className={`mt-[2px] rounded-[10px] px-[5px] py-[1px] text-center text-[11px] leading-[15px] font-bold whitespace-nowrap ${
              isOn ? 'bg-brand-900 text-white' : 'bg-white text-slate-700'
            }`}
            style={{ textShadow: isOn ? 'none' : '0 0 3px rgba(255,255,255,0.8)' }}
          >
            {label}
          </div>
        )}
      </div>
    </PoiWrapper>
  )
}

// ── PrimaryTicket (canBuy) - primary card with ticket name + price ──
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
  const palette = getMarkerPalette(isOn, isFavorite)
  return (
    <PoiWrapper>
      <div className="relative z-[13] flex flex-col items-center">
        <div
          className={`rounded-[8px] border-[1.5px] ${palette ? '' : 'border-brand-600 bg-primary'}`}
          style={{
            boxShadow: favoriteShadow(SHADOW_CARD, isFavorite),
            ...(palette ? { borderColor: palette.solidBorder, backgroundColor: palette.solidBg } : {})
          }}
        >
          <div className="flex min-w-[72px] flex-col items-center px-[10px] pt-[5px] pb-[6px]">
            <div className="text-[10px] leading-[14px] font-medium whitespace-nowrap text-white/80">{name}</div>
            <div className="mt-[1px] text-[15px] leading-[18px] font-bold text-white">{price}</div>
          </div>
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

// ── PrimaryTicket (!canBuy) - gray card with ticket name + price ──
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
  const palette = getMarkerPalette(isOn, isFavorite)
  return (
    <PoiWrapper>
      <div className="relative z-[11] flex flex-col items-center">
        <div
          className={`rounded-[8px] border-[1.5px] ${palette ? '' : 'border-slate-500 bg-slate-400'}`}
          style={{
            boxShadow: favoriteShadow(SHADOW_CARD_DISABLED, isFavorite),
            ...(palette ? { borderColor: palette.solidBorder, backgroundColor: palette.solidBg } : {})
          }}
        >
          <div className="flex min-w-[72px] flex-col items-center px-[10px] pt-[5px] pb-[6px]">
            <div className="text-[10px] leading-[14px] font-medium whitespace-nowrap text-white/70">{name}</div>
            <div className="mt-[1px] text-[15px] leading-[18px] font-bold text-white/90">{price}</div>
          </div>
        </div>
        <div
          className={`h-0 w-0 border-t-[5px] border-r-[5px] border-l-[5px] border-r-transparent border-l-transparent ${
            palette ? '' : 'border-t-slate-400'
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
