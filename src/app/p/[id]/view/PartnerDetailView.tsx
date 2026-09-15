'use client'

import { IconSearchLine } from '@socar-inc/modu-ui/icons'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import DockBar from '@/shared/components/layout/DockBar'
import MapPinLoader from '@/shared/components/map/MapPinLoader'
import { type SheetSnap } from '@/shared/components/ui/AnimationSheet'

import type { ParkingLotDetail, ParkingLotType } from '@/shared/types/parking'
import { ParkingLotType as PLType } from '@/shared/types/parking'

import ParkingDetailSheet, { type ParkingDetailData } from '@/app/(tabs)/map/view/ParkingDetailSheet'
import { useMapViewModel } from '@/app/(tabs)/map/viewmodel'

interface PartnerDetailViewProps {
  seq: number
  initialDetail?: ParkingLotDetail
}

/**
 * Hash 기반 시트 상태 파싱.
 * - `#sheet=0` → 닫힘
 * - `#sheet=1` / `#sheet=peek` → 열림 + peek
 * - `#sheet=half` → 열림 + half
 * - `#sheet=full` → 열림 + full (예: 추천 주차장 진입, 주차권 상세 뒤로가기)
 */
function parseSheetHash(hash: string): { open: boolean; snap: SheetSnap | null } {
  const m = hash.match(/^#sheet=(.+)$/)
  if (!m) return { open: false, snap: null }
  const v = m[1]
  if (v === '0') return { open: false, snap: null }
  if (v === 'full') return { open: true, snap: 'full' }
  if (v === 'half') return { open: true, snap: 'half' }
  return { open: true, snap: 'peek' } // '1' / 'peek' / 그 외
}

export default function PartnerDetailView({ seq, initialDetail }: PartnerDetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // /p/[id] 진입은 기본 'full'. hash로 명시(half/peek/full)하면 그 값 우선.
  const initialSnap: SheetSnap = (() => {
    if (typeof window !== 'undefined') {
      const fromHash = parseSheetHash(window.location.hash).snap
      if (fromHash) return fromHash
    }
    if (searchParams?.get('snap') === 'peek') return 'peek'
    if (searchParams?.get('snap') === 'half') return 'half'
    return 'full'
  })()
  const [detailSnap, setDetailSnap] = useState<SheetSnap>(initialSnap)
  const [detailOpen, setDetailOpen] = useState(false)

  const needPanRef = useRef(false)

  const lat = initialDetail?.basic.latitude
  const lng = initialDetail?.basic.longitude

  const parkingData: ParkingDetailData = {
    seq,
    name: initialDetail?.basic.name ?? '',
    isPartner: initialDetail?.basic.partnerStatus,
    parkingType: 'P' as ParkingLotType
  }

  // hash 동기화 — hash가 바뀌면 open 상태 + snap 동시 반영
  useEffect(() => {
    const sync = () => {
      const { open, snap } = parseSheetHash(window.location.hash)
      setDetailOpen(open)
      if (snap) setDetailSnap(snap)
    }
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  // 최초 진입 시 sheet 열기 — hash가 없으면 initialSnap에 맞춰 설정
  useEffect(() => {
    const current = parseSheetHash(window.location.hash)
    if (!current.open) {
      const target = `#sheet=${initialSnap === 'full' ? 'full' : initialSnap === 'half' ? 'half' : '1'}`
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${target}`)
    }
    setDetailOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeSheet = () => {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#sheet=0`)
    setDetailOpen(false)
  }

  // sheet "열림 → 닫힘" 전환 시에만 snap 리셋 (초기 mount의 false 상태로 hash snap을 덮지 않도록)
  const prevOpenRef = useRef(detailOpen)
  useEffect(() => {
    if (prevOpenRef.current && !detailOpen) setDetailSnap('peek')
    prevOpenRef.current = detailOpen
  }, [detailOpen])

  const vm = useMapViewModel({
    onMapClick: () => {
      if (!detailOpen) return
      if (detailSnap !== 'peek') {
        setDetailSnap('peek')
      } else {
        closeSheet()
      }
    },
    searchCoords: lat && lng ? { lat, lng } : null,
    onPinClick: (data: ParkingDetailData) => {
      if (data.parkingType === PLType.SHARE) return
      // 핀 클릭은 JS 이벤트 → 크롤러 못 따라감 → /map SPA로 전환하여 UX 확보
      router.push(`/map?type=${data.parkingType ?? 'P'}&id=${data.seq}#sheet=1`)
    }
  })

  // sheet 닫힐 때 선택 마커 초기화
  const clearSelectedPin = vm.clearSelectedPin
  useEffect(() => {
    if (!detailOpen) clearSelectedPin()
  }, [detailOpen, clearSelectedPin])

  // 최초 로드 후 해당 주차장 핀 선택
  const selectPin = vm.selectPin
  useEffect(() => {
    selectPin(seq)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // detail 로드 완료 시 좌표 수신 → URL 직접 진입 시 지도 이동
  const centerOnLatLng = vm.centerOnLatLng
  const handleLocationKnown = useCallback(
    (lat: number, lng: number) => {
      if (!needPanRef.current) return
      needPanRef.current = false
      centerOnLatLng(lat, lng)
    },
    [centerOnLatLng]
  )

  // 지도 스크립트 로드 + initMap
  useEffect(() => {
    if (window.naver?.maps) {
      vm.initMap()
      return
    }
    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAPS_KEY}&submodules=geocoder`
    script.async = true
    script.onload = () => vm.initMap()
    document.head.appendChild(script)
    return () => {
      if (script.parentNode) document.head.removeChild(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full flex-col">
      <main className="relative min-h-0 flex-1">
        {/* Search Bar */}
        <div className="absolute top-0 left-0 z-(--z-map-ui) flex w-full flex-col gap-2.5 px-4 pt-2">
          <Link
            href="/search"
            className="rounded-10 bg-bg-white shadow-02 flex h-12 w-full cursor-pointer items-center gap-2.5 px-4"
          >
            <IconSearchLine className="text-icon-soft size-5" />
            <span className="text-text-soft" style={{ fontSize: 'var(--font-size-b4)' }}>
              목적지 또는 주소 검색
            </span>
          </Link>
        </div>

        {/* 풀스크린 지도 (useMapViewModel은 id="map"을 찾음) */}
        <div id="map" className="size-full" />

        {/* Loading — 정중앙 Lottie 애니메이션 */}
        <MapPinLoader show={vm.isLoading} />

        {/* ParkingDetailSheet — initialSnap이 full/half면 슬라이드업 생략하고 즉시 정착 */}
        <ParkingDetailSheet
          isOpen={detailOpen}
          snap={detailSnap}
          onSnapChange={setDetailSnap}
          onClose={closeSheet}
          data={parkingData}
          onLocationKnown={handleLocationKnown}
          skipMountAnimation={initialSnap !== 'peek'}
        />
      </main>
      <DockBar />
    </div>
  )
}
