'use client'

import { IconSearchLine } from '@socar-inc/modu-ui/icons'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import DockBar from '@/shared/components/layout/DockBar'
import MapPinLoader from '@/shared/components/map/MapPinLoader'
import { type SheetSnap } from '@/shared/components/ui/AnimationSheet'

import type { SharedParkingLotDetail } from '@/shared/types/parking'
import { ParkingLotType as PLType } from '@/shared/types/parking'

import { type ParkingDetailData } from '@/app/(tabs)/map/view/ParkingDetailSheet'
import { useMapViewModel } from '@/app/(tabs)/map/viewmodel'

import SharedDetailSheet from './SharedDetailSheet'

interface SharedDetailViewProps {
  seq: number
  initialDetail?: SharedParkingLotDetail
}

/**
 * 공유주차장 상세 (/s/[id]) — modu-web-app /s 라우트 기준.
 * /p/[id](PartnerDetailView)와 동일한 지도 배경 + 시트 구조, 시트 내용만 공유주차장 전용.
 */
function parseSheetHash(hash: string): { open: boolean; snap: SheetSnap | null } {
  const m = hash.match(/^#sheet=(.+)$/)
  if (!m) return { open: false, snap: null }
  const v = m[1]
  if (v === '0') return { open: false, snap: null }
  if (v === 'full') return { open: true, snap: 'full' }
  if (v === 'half') return { open: true, snap: 'half' }
  return { open: true, snap: 'peek' }
}

export default function SharedDetailView({ seq, initialDetail }: SharedDetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // /s/[id] 직접 진입은 기본 'full'. hash로 명시(half/peek/full)하면 그 값 우선.
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

  // sheet "열림 → 닫힘" 전환 시에만 snap 리셋
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
      // 핀 클릭은 JS 이벤트 → 크롤러 못 따라감 → 상세 라우트로 전환
      if (data.parkingType === PLType.SHARE) {
        router.push(`/s/${data.seq}#sheet=1`)
        return
      }
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

  // SSR로 좌표를 못 받은 경우(클라 fetch 경로)엔 로드 후 지도 이동 필요
  useEffect(() => {
    if (lat == null || lng == null) needPanRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            <span className="text-text-soft" style={{ fontSize: 'var(--text-b4)' }}>
              목적지 또는 주소 검색
            </span>
          </Link>
        </div>

        {/* 풀스크린 지도 (useMapViewModel은 id="map"을 찾음) */}
        <div id="map" className="size-full" />

        {/* Loading — 정중앙 Lottie 애니메이션 */}
        <MapPinLoader show={vm.isLoading} />

        <SharedDetailSheet
          seq={seq}
          isOpen={detailOpen}
          snap={detailSnap}
          onSnapChange={setDetailSnap}
          onClose={closeSheet}
          onLocationKnown={handleLocationKnown}
          skipMountAnimation={initialSnap !== 'peek'}
        />
      </main>
      <DockBar />
    </div>
  )
}
