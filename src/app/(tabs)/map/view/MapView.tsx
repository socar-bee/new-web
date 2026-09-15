'use client'

import { IconLocateLine, IconSearchLine } from '@socar-inc/modu-ui/icons'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import MapPinLoader from '@/shared/components/map/MapPinLoader'
import TimeFilterSheet, { formatDateLabel } from '@/shared/components/map/TimeFilterSheet'
import { type SheetSnap } from '@/shared/components/ui/AnimationSheet'
import Toast from '@/shared/components/ui/Toast'

import { useMapViewModel } from '../viewmodel'
import { ParkingLotType } from '@/shared/types/parking'

import LocationConsentSheet from './LocationConsentSheet'
import ParkingDetailSheet, { type ParkingDetailData } from './ParkingDetailSheet'

interface ToastState {
  id: number
  message: string
  duration?: number
}

export default function MapView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [detailSnap, setDetailSnap] = useState<SheetSnap>('peek')
  const [showConsent, setShowConsent] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // 핀 클릭 vs URL 직접 진입 구분: 핀 클릭 시엔 지도 이동 불필요
  const pinClickedRef = useRef(false)
  const needPanRef = useRef(false)

  // URL query params에서 주차장 정보 읽기 (sheet 상태는 #hash로 분리)
  const idParam = searchParams.get('id')
  const typeParam = searchParams.get('type')
  const selectedParking: ParkingDetailData | null = idParam
    ? { seq: Number(idParam), name: '', parkingType: (typeParam ?? 'P') as ParkingLotType }
    : null

  const latParam = searchParams.get('lat')
  const lngParam = searchParams.get('lng')
  const searchCoords = latParam && lngParam ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) } : null
  const initialBuyableOnly = searchParams.get('buyable') === '1'
  const initialTimeFilterOpen = searchParams.get('timefilter') === '1'

  // mount + hashchange + popstate → hash에서 sheet 상태 동기화
  useEffect(() => {
    const sync = () => setDetailOpen(window.location.hash === '#sheet=1')
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  // router.push/replace는 hashchange를 발생시키지 않으므로 searchParams 변경 시 재동기화
  useEffect(() => {
    setDetailOpen(window.location.hash === '#sheet=1')
  }, [searchParams])

  const closeSheet = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + '#sheet=0')
    setDetailOpen(false)
  }

  const showToast = useCallback((message: string, duration?: number) => {
    setToast({ id: Date.now(), message, duration })
  }, [])

  const vm = useMapViewModel({
    onMapClick: () => {
      if (!detailOpen) return
      if (detailSnap !== 'peek') {
        // half/full → peek으로 축소
        setDetailSnap('peek')
      } else {
        // peek 상태에서 지도 클릭 → sheet 닫기 (#sheet=0)
        closeSheet()
      }
    },
    searchCoords,
    initialBuyableOnly,
    initialTimeFilterOpen,
    onPinClick: (data: ParkingDetailData) => {
      if (data.parkingType === ParkingLotType.SHARE) {
        showToast('준비중인 서비스입니다')
        return
      }
      // 핀 직접 클릭 → 이미 지도에 보이므로 location 수신 후 지도 이동 불필요
      pinClickedRef.current = true
      setDetailSnap('peek')
      const url = `/map?type=${data.parkingType ?? ParkingLotType.PARKINGLOT}&id=${data.seq}#sheet=1`
      // 시트가 이미 열려 있으면 replace (히스토리 중첩 방지), 닫혀 있으면 push
      if (detailOpen) router.replace(url)
      else router.push(url)
      // router.push/replace는 hashchange를 발생시키지 않으므로 직접 상태 반영
      setDetailOpen(true)
    }
  })

  const handleCloseDetail = closeSheet

  // sheet 닫힐 때 선택된 마커 활성 상태 초기화 + snap을 peek으로 리셋
  const clearSelectedPin = vm.clearSelectedPin
  useEffect(() => {
    if (!detailOpen) {
      clearSelectedPin()
      setDetailSnap('peek')
    }
  }, [detailOpen, clearSelectedPin])

  // idParam 변경(URL 직접 진입 포함) → 핀 선택 상태 주입
  const selectPin = vm.selectPin
  useEffect(() => {
    if (!idParam) return
    selectPin(Number(idParam))
    // 핀 클릭이 아닌 경우(URL 직접 진입, 외부 링크 등) → detail 로드 후 지도 이동
    if (!pinClickedRef.current) needPanRef.current = true
    pinClickedRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam])

  // detail 로드 완료 시 좌표 수신 → URL 직접 진입인 경우에만 지도 이동
  const centerOnLatLng = vm.centerOnLatLng
  const handleLocationKnown = useCallback(
    (lat: number, lng: number) => {
      if (!needPanRef.current) return
      needPanRef.current = false
      centerOnLatLng(lat, lng)
    },
    [centerOnLatLng]
  )

  // buyableOnly 필터 결과 없을 때 토스트, 다시 생기면 닫기
  useEffect(() => {
    if (vm.buyableEmpty) {
      showToast('이 지역에 구매 가능한 주차장이 없습니다', 99999999)
    } else {
      setToast(null)
    }
  }, [vm.buyableEmpty, showToast])

  const handleConsentAllow = () => {
    localStorage.setItem('modu_location_consent', 'granted')
    setShowConsent(false)
    vm.moveToCurrentLocation(false)
  }

  const handleConsentDeny = () => {
    localStorage.setItem('modu_location_consent', 'denied')
    setShowConsent(false)
  }

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
      document.head.removeChild(script)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // 검색 좌표로 진입한 경우 현재 위치 이동 건너뜀
    if (searchCoords) return
    const consent = localStorage.getItem('modu_location_consent')
    if (consent === 'granted') {
      vm.moveToCurrentLocation(false)
    } else if (!consent) {
      setShowConsent(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const entryTimeLabel =
    vm.selectedDate && vm.selectedDurationId && vm.timeFilterOptions
      ? `${formatDateLabel(vm.selectedDate)} · ${vm.timeFilterOptions.durations.find((d) => d.id === vm.selectedDurationId)?.label ?? ''}`
      : null

  return (
    <div className="relative h-full w-full">
      {/* Search Bar + Filter Chips */}
      <div className="absolute top-0 left-0 z-[var(--z-map-ui)] flex w-full flex-col gap-2.5 px-4 pt-2">
        <Link href="/search" className="rounded-10 bg-bg-white shadow-02 flex h-12 w-full items-center gap-2.5 px-4">
          <IconSearchLine className="text-icon-soft size-5" />
          <span className="text-text-soft" style={{ fontSize: 'var(--font-size-b4)' }}>
            목적지 또는 주소 검색
          </span>
        </Link>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 px-1">
          {entryTimeLabel && (
            <button
              onClick={vm.openTimeFilter}
              className="border-primary bg-primary text-static-white inline-flex min-h-[34px] shrink-0 items-center justify-center rounded-full border px-3 py-1 text-[13px] font-medium whitespace-nowrap"
            >
              {entryTimeLabel}
            </button>
          )}
          <button
            onClick={vm.toggleBuyableOnly}
            className={`inline-flex min-h-[34px] shrink-0 items-center justify-center rounded-full border px-3 py-1 text-[13px] font-medium whitespace-nowrap ${
              vm.buyableOnly
                ? 'border-primary bg-primary text-static-white'
                : 'border-stroke-soft bg-bg-white text-text-strong'
            }`}
          >
            구매 가능
          </button>
        </div>
      </div>

      {/* Map */}
      <div id="map" className="size-full" />

      {/* Current Location */}
      <button
        onClick={() => vm.moveToCurrentLocation()}
        className="bg-bg-white shadow-02 absolute right-4 bottom-4 z-[var(--z-map-ui)] flex size-10 items-center justify-center rounded-full"
      >
        <IconLocateLine className="text-primary size-5" />
      </button>

      {/* Loading — 정중앙 Lottie 애니메이션 */}
      <MapPinLoader show={vm.isLoading} />

      {/* Time Filter Bottom Sheet */}
      {vm.timeFilterOptions && (
        <TimeFilterSheet
          isOpen={vm.isTimeFilterOpen}
          options={vm.timeFilterOptions}
          selectedDate={vm.selectedDate}
          selectedDurationId={vm.selectedDurationId}
          onDateChange={vm.setSelectedDate}
          onDurationChange={vm.setSelectedDurationId}
          onClose={vm.closeTimeFilter}
          onConfirm={vm.handleTimeFilterConfirm}
        />
      )}

      {/* Parking Detail Sheet */}
      <ParkingDetailSheet
        isOpen={detailOpen}
        snap={detailSnap}
        onSnapChange={setDetailSnap}
        onClose={handleCloseDetail}
        data={selectedParking}
        onLocationKnown={handleLocationKnown}
      />

      <Toast
        id={toast?.id}
        message={toast?.message ?? null}
        onDismiss={() => setToast(null)}
        duration={toast?.duration ?? 1000}
      />

      {showConsent && <LocationConsentSheet onAllow={handleConsentAllow} onDeny={handleConsentDeny} />}
    </div>
  )
}
