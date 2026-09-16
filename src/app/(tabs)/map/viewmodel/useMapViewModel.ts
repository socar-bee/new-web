'use client'

import ngeohash from 'ngeohash'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOMServer from 'react-dom/server'

import CurrentPositionMarker from '@/shared/components/map/CurrentPositionMarker'
import ParkingCluster from '@/shared/components/map/ParkingCluster'
import PoiIcon from '@/shared/components/map/PoiIcon'
import ShareCluster from '@/shared/components/map/ShareCluster'
import { useFavorites } from '@/shared/hooks/useFavorites'

import { createClustering, type ClusteringInstance } from '@/shared/lib/clustering'

import type { Bounds, TicketGroupPin, TimeFilterDefaults } from '../model/types'
import type { ParkingDetailData } from '../view/ParkingDetailSheet'

import { trimPinCache } from '../model/pinCache'
import { usePins, useTimeFilterOptions } from '../model/queries'
import { createPinFromV2, MarkerType, PinV2Type } from '@/shared/types/map'
import type { Pin, PinsGroupV2 } from '@/shared/types/map'
import { ParkingLotType } from '@/shared/types/parking'

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_ZOOM = 16
const MAX_CLUSTER_ZOOM = 15
const CLUSTER_GRID_SIZE = 180

interface CachedPinEntry {
  timestamp: number
  pins: Pin[]
}

export interface UseMapViewModelOptions {
  /** 지도 여백 클릭 시 호출 (핀/클러스터가 아닌 빈 영역). 시트 close 등에 사용. */
  onMapClick?: () => void
  /** 검색으로 진입 시 이동할 좌표 */
  searchCoords?: { lat: number; lng: number } | null
  /** 핀 클릭 시 호출 */
  onPinClick?: (data: ParkingDetailData) => void
  /** URL ?buyable=1 진입 시 구매가능 필터 초기 활성화 */
  initialBuyableOnly?: boolean
  /** URL ?timefilter=1 진입 시 시간필터 시트 자동 오픈 */
  initialTimeFilterOpen?: boolean
}

export function useMapViewModel(options: UseMapViewModelOptions = {}) {
  // onMapClick 최신값을 ref로 유지 → initMap 안 이벤트 리스너가 stale closure로 묶이지 않도록
  const onMapClickRef = useRef(options.onMapClick)
  useEffect(() => {
    onMapClickRef.current = options.onMapClick
  })

  // searchCoords 최신값을 ref로 유지
  const searchCoordsRef = useRef(options.searchCoords)
  useEffect(() => {
    searchCoordsRef.current = options.searchCoords
  })

  // onPinClick 최신값을 ref로 유지
  const onPinClickRef = useRef(options.onPinClick)
  useEffect(() => {
    onPinClickRef.current = options.onPinClick
  })

  const mapRef = useRef<naver.maps.Map | null>(null)
  const cachedMarkers = useRef<Record<string, naver.maps.Marker>>({})
  const cachedPinsMap = useRef<Record<string, CachedPinEntry>>({})
  // LRU 사용 순서 (오래된 것 → 최신 순). trimPinCache 가 직접 갱신한다.
  const recentGeohashesRef = useRef<Set<string>>(new Set())
  // 현재 뷰포트 geohash — LRU 정리에서 화면 내 영역 보호용
  const activeGeohashesRef = useRef<ReadonlySet<string>>(new Set())
  const cachedPinsBySeq = useRef<Record<number, Pin>>({})
  const selectedSeqRef = useRef<number | null>(null)
  const clusteringRef = useRef<ClusteringInstance | null>(null)
  const shareClusteringRef = useRef<ClusteringInstance | null>(null)
  const clusterIconCache = useRef<Map<number, { content: string; size: naver.maps.Size; anchor: naver.maps.Point }>>(
    new Map()
  )
  const shareClusterIconCache = useRef<
    Map<number, { content: string; size: naver.maps.Size; anchor: naver.maps.Point }>
  >(new Map())
  // 마커 아이콘 캐시: 핀 시각 fingerprint → {content, size, anchor}
  const markerIconCache = useRef<Map<string, { content: string; size: naver.maps.Size; anchor: naver.maps.Point }>>(
    new Map()
  )
  // 마커별 핀 fingerprint: key → fingerprint (데이터 변경 감지)
  const pinFingerprints = useRef<Record<string, string>>({})
  // 즐겨찾기 seq Set — 마커 아이콘 fingerprint 분기에 사용. useFavorites 변경 시 동기화.
  const favoriteSeqsRef = useRef<Set<number>>(new Set())
  const currentPositionMarkerRef = useRef<naver.maps.Marker | null>(null)
  const cachedTicketGroupMarkers = useRef<naver.maps.Marker[]>([])
  // 지도 초기화 전 moveToCurrentLocation 호출 시 보류: { showPin }
  const pendingLocationMoveRef = useRef<{ showPin: boolean } | null>(null)

  // ─── Map Bounds State (TanStack Query 트리거용) ───
  const [mapBounds, setMapBounds] = useState<Bounds | null>(null)
  const [geohashes, setGeohashes] = useState<string>('')

  // ─── Time Filter State ───
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDurationId, setSelectedDurationId] = useState('')
  const [isTimeFilterOpen, setIsTimeFilterOpen] = useState(false)
  const [timeFilter, setTimeFilter] = useState<TimeFilterDefaults | null>(null)

  // ─── 구매가능 필터 토글 ───
  const [buyableOnly, setBuyableOnly] = useState(() => options.initialBuyableOnly ?? false)
  const buyableOnlyRef = useRef(options.initialBuyableOnly ?? false)
  const [buyableEmpty, setBuyableEmpty] = useState(false)

  // ─── TanStack Query ───
  const { data: timeFilterOptions } = useTimeFilterOptions()

  const pinsQueryParams = mapBounds && geohashes && timeFilter ? { bounds: mapBounds, geohashes, timeFilter } : null

  const { data: pinsData, isFetching: isLoading } = usePins(pinsQueryParams)
  const pinsGroups = pinsData?.pinsGroups
  const ticketGroupPins = pinsData?.ticketGroupPins

  // timeFilterOptions 로드 후 timeFilter 초기화
  useEffect(() => {
    if (timeFilterOptions && !timeFilter) {
      setTimeFilter(timeFilterOptions.defaults)
      setSelectedDate(timeFilterOptions.defaults.date)
      setSelectedDurationId(timeFilterOptions.defaults.durationId)
    }
  }, [timeFilterOptions, timeFilter])

  // ─── Render Helpers ───

  /**
   * 마커를 최상단으로 올림.
   * setZIndex만으로는 네이버 맵 DOM 순서가 갱신되지 않는 경우가 있어
   * setMap(null) → setMap(map) 으로 DOM에 재삽입해 확실히 최상위로 올림.
   */
  const bringToFront = useCallback((marker: naver.maps.Marker, zIndex: number) => {
    marker.setZIndex(zIndex)
    const map = marker.getMap() as naver.maps.Map | null
    if (map) {
      marker.setMap(null)
      marker.setMap(map)
    }
  }, [])

  const measureHtml = useCallback((html: string) => {
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.left = '-9999px'
    el.innerHTML = html
    document.body.appendChild(el)
    const size = { width: el.offsetWidth, height: el.offsetHeight }
    document.body.removeChild(el)
    return size
  }, [])

  /** 핀 fingerprint 생성 — 동일한 비주얼 → 같은 키 → 캐시 히트. isFavorite도 비주얼 분기이므로 포함. */
  const buildIconKey = useCallback(
    (pin: Pin, isOn: boolean, isFavorite: boolean) =>
      `${pin.markerType}|${pin.label}|${pin.ticketName ?? ''}|${pin.ticketPrice ?? ''}|${isOn}|${isFavorite ? 'F' : ''}`,
    []
  )

  // renderToString + measureHtml 결과를 시각 fingerprint로 캐싱
  const getMarkerIcon = useCallback(
    (pin: Pin, isOn = false) => {
      const isFavorite = favoriteSeqsRef.current.has(pin.seq)
      const key = buildIconKey(pin, isOn, isFavorite)
      const cached = markerIconCache.current.get(key)
      if (cached) return cached

      const content = ReactDOMServer.renderToString(PoiIcon({ pin, isOn, isFavorite }))
      const { width, height } = measureHtml(content)
      const icon = {
        content,
        size: new naver.maps.Size(width, height),
        anchor: new naver.maps.Point(width / 2, height)
      }
      markerIconCache.current.set(key, icon)
      return icon
    },
    [measureHtml, buildIconKey]
  )

  // 즐겨찾기 변경 → 영향 받는 마커만 아이콘 재발급
  const { favorites: favoriteList } = useFavorites()
  useEffect(() => {
    const newSet = new Set(favoriteList.map((f) => f.seq))
    const prev = favoriteSeqsRef.current
    const changed = new Set<number>()
    newSet.forEach((s) => {
      if (!prev.has(s)) changed.add(s)
    })
    prev.forEach((s) => {
      if (!newSet.has(s)) changed.add(s)
    })
    favoriteSeqsRef.current = newSet
    if (changed.size === 0) return

    Object.entries(cachedMarkers.current).forEach(([k, m]) => {
      const seq = m.get('seq') as number | undefined
      if (seq == null || !changed.has(seq)) return
      const pin = cachedPinsBySeq.current[seq]
      if (!pin) return
      const isOn = seq === selectedSeqRef.current
      const icon = getMarkerIcon(pin, isOn)
      m.setIcon(icon)
      pinFingerprints.current[k] = buildIconKey(pin, isOn, newSet.has(seq))
    })
  }, [favoriteList, getMarkerIcon, buildIconKey])

  const generateMarker = useCallback(
    (pin: Pin, isOn = false) => {
      if (!mapRef.current) return null
      const icon = getMarkerIcon(pin, isOn)

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(pin.lat, pin.lng),
        map: mapRef.current,
        icon,
        zIndex: isOn ? 200 : pin.zIndex
      })

      marker.set('seq', pin.seq)
      marker.set('markerType', pin.markerType)
      marker.set('isPartner', pin.isPartner)
      marker.set('hasActivePrimaryTicket', pin.hasActivePrimaryTicket)
      marker.set('zIndex', pin.zIndex)

      naver.maps.Event.addListener(marker, 'click', () => {
        const seq = pin.seq
        const parkingType = pin.pinType === PinV2Type.SHARE ? ParkingLotType.SHARE : ParkingLotType.PARKINGLOT

        // 이전 선택 마커 비활성화
        const prevSeq = selectedSeqRef.current
        if (prevSeq !== null && prevSeq !== seq) {
          const prevPin = cachedPinsBySeq.current[prevSeq]
          if (prevPin) {
            const prevIcon = getMarkerIcon(prevPin, false)
            const prevFp = buildIconKey(prevPin, false, favoriteSeqsRef.current.has(prevPin.seq))
            Object.entries(cachedMarkers.current).forEach(([k, m]) => {
              if (m.get('seq') === prevSeq) {
                m.setIcon(prevIcon)
                m.setZIndex(prevPin.zIndex)
                pinFingerprints.current[k] = prevFp
              }
            })
          }
        }

        // 새 마커 활성화
        const onIcon = getMarkerIcon(pin, true)
        const onFp = buildIconKey(pin, true, favoriteSeqsRef.current.has(pin.seq))
        Object.entries(cachedMarkers.current).forEach(([k, m]) => {
          if (m.get('seq') === seq) {
            m.setIcon(onIcon)
            bringToFront(m, 200)
            pinFingerprints.current[k] = onFp
          }
        })
        selectedSeqRef.current = seq

        onPinClickRef.current?.({ seq, name: pin.label, isPartner: pin.isPartner, parkingType })
      })

      return marker
    },
    [getMarkerIcon, bringToFront, buildIconKey]
  )

  // ─── Cluster Icon ───

  const getClusterIcon = useCallback(
    (count: number) => {
      const cached = clusterIconCache.current.get(count)
      if (cached) return cached
      const content = ReactDOMServer.renderToString(ParkingCluster({ count }))
      const { width, height } = measureHtml(content)
      const icon = {
        content,
        size: new naver.maps.Size(width, height),
        // 꼬리 없는 원형이라 중심 앵커 — 클러스터는 영역 대표점이다
        anchor: new naver.maps.Point(width / 2, height / 2)
      }
      clusterIconCache.current.set(count, icon)
      return icon
    },
    [measureHtml]
  )

  const getShareClusterIcon = useCallback(
    (count: number) => {
      const cached = shareClusterIconCache.current.get(count)
      if (cached) return cached
      const content = ReactDOMServer.renderToString(ShareCluster({ count }))
      const { width, height } = measureHtml(content)
      const icon = {
        content,
        size: new naver.maps.Size(width, height),
        anchor: new naver.maps.Point(width / 2, height / 2)
      }
      shareClusterIconCache.current.set(count, icon)
      return icon
    },
    [measureHtml]
  )

  const collectVisiblePins = useCallback((): {
    regular: { lat: number; lng: number }[]
    share: { lat: number; lng: number }[]
  } => {
    if (!mapRef.current) return { regular: [], share: [] }
    const bounds = mapRef.current.getBounds() as naver.maps.LatLngBounds
    const regular: { lat: number; lng: number }[] = []
    const share: { lat: number; lng: number }[] = []
    Object.values(cachedMarkers.current).forEach((m) => {
      const pos = m.getPosition()
      if (!bounds.hasLatLng(pos)) return
      const markerType = m.get('markerType') as MarkerType | undefined
      const item = { lat: pos.y, lng: pos.x }
      if (markerType === MarkerType.NormalShare) share.push(item)
      else regular.push(item)
    })
    return { regular, share }
  }, [])

  const clearClusters = useCallback(() => {
    if (clusteringRef.current) {
      clusteringRef.current.destroy()
      clusteringRef.current = null
    }
    if (shareClusteringRef.current) {
      shareClusteringRef.current.destroy()
      shareClusteringRef.current = null
    }
  }, [])

  const createClusters = useCallback(() => {
    if (!mapRef.current) return
    const { regular, share } = collectVisiblePins()

    if (regular.length === 0 && share.length === 0) {
      clearClusters()
      return
    }

    // ── 일반 클러스터 ──
    if (regular.length === 0) {
      if (clusteringRef.current) {
        clusteringRef.current.destroy()
        clusteringRef.current = null
      }
    } else if (clusteringRef.current) {
      clusteringRef.current.updateItems(regular)
    } else {
      clusteringRef.current = createClustering({
        map: mapRef.current,
        items: regular,
        gridSize: CLUSTER_GRID_SIZE,
        minClusterSize: 2,
        getClusterIcon,
        onClusterClick: (cluster) => {
          if (!mapRef.current) return
          mapRef.current.setCenter(cluster.center)
          mapRef.current.setZoom(MAX_CLUSTER_ZOOM + 1)
        }
      })
    }

    // ── SHARE 전용 클러스터 ──
    if (share.length === 0) {
      if (shareClusteringRef.current) {
        shareClusteringRef.current.destroy()
        shareClusteringRef.current = null
      }
    } else if (shareClusteringRef.current) {
      shareClusteringRef.current.updateItems(share)
    } else {
      shareClusteringRef.current = createClustering({
        map: mapRef.current,
        items: share,
        gridSize: CLUSTER_GRID_SIZE,
        minClusterSize: 2,
        getClusterIcon: getShareClusterIcon,
        onClusterClick: (cluster) => {
          if (!mapRef.current) return
          mapRef.current.setCenter(cluster.center)
          mapRef.current.setZoom(MAX_CLUSTER_ZOOM + 1)
        }
      })
    }
  }, [collectVisiblePins, getClusterIcon, getShareClusterIcon, clearClusters])

  // ─── Marker Overlay (줌/바운드 기반 표시/숨김) ───

  // 지도 bounds → React state 갱신 헬퍼. initMap에서 정의되며, setCenter 등 프로그램적 이동 후 수동 호출용.
  const updateBoundsRef = useRef<(() => void) | null>(null)

  const handleMarkerOverlay = useCallback((marker: naver.maps.Marker) => {
    if (!mapRef.current) return
    const zoom = mapRef.current.getZoom()

    // 줌 레벨 ≤ 15 → 개별 마커 숨김 (클러스터만 표시)
    if (zoom <= MAX_CLUSTER_ZOOM) {
      marker.setMap(null)
      return
    }

    const mapBounds = mapRef.current.getBounds() as naver.maps.LatLngBounds
    if (!mapBounds.hasLatLng(marker.getPosition())) {
      marker.setMap(null)
      return
    }

    // 구매가능 필터: ON이면 hasActivePrimaryTicket=false인 마커 숨김
    if (buyableOnlyRef.current && !marker.get('hasActivePrimaryTicket')) {
      marker.setMap(null)
      return
    }

    marker.setMap(mapRef.current)
  }, [])

  const handleAllMarkersOverlay = useCallback(() => {
    Object.values(cachedMarkers.current).forEach(handleMarkerOverlay)
  }, [handleMarkerOverlay])

  // ─── Clear ───

  const clearAllMarkers = useCallback(() => {
    Object.values(cachedMarkers.current).forEach((m) => m.setMap(null))
    cachedMarkers.current = {}
    cachedPinsMap.current = {}
    cachedPinsBySeq.current = {}
    pinFingerprints.current = {}
    recentGeohashesRef.current.clear()
    cachedTicketGroupMarkers.current.forEach((m) => m.setMap(null))
    cachedTicketGroupMarkers.current = []
    clearClusters()
  }, [clearClusters])

  /** 선택된 마커를 비활성 상태로 되돌림 (sheet 닫힐 때 호출) */
  const clearSelectedPin = useCallback(() => {
    const prevSeq = selectedSeqRef.current
    if (prevSeq === null) return
    const prevPin = cachedPinsBySeq.current[prevSeq]
    if (prevPin) {
      const icon = getMarkerIcon(prevPin, false)
      const prevKey = buildIconKey(prevPin, false, favoriteSeqsRef.current.has(prevPin.seq))
      Object.entries(cachedMarkers.current).forEach(([key, m]) => {
        if (m.get('seq') === prevSeq) {
          m.setIcon(icon)
          m.setZIndex(prevPin.zIndex)
          pinFingerprints.current[key] = prevKey
        }
      })
    }
    selectedSeqRef.current = null
  }, [getMarkerIcon, buildIconKey])

  /**
   * URL 직접 진입 등 외부에서 핀 선택 상태를 주입할 때 사용.
   * - selectedSeqRef를 갱신하고, 이미 캐시된 마커가 있으면 즉시 isOn 스타일로 교체.
   * - 아직 pins가 로드되지 않았다면 drawPins 시점에 isOn=true로 그려짐.
   */
  const selectPin = useCallback(
    (seq: number) => {
      if (selectedSeqRef.current === seq) return

      // 이전 마커 비활성화
      const prevSeq = selectedSeqRef.current
      if (prevSeq !== null) {
        const prevPin = cachedPinsBySeq.current[prevSeq]
        if (prevPin) {
          const icon = getMarkerIcon(prevPin, false)
          const fp = buildIconKey(prevPin, false, favoriteSeqsRef.current.has(prevPin.seq))
          Object.entries(cachedMarkers.current).forEach(([k, m]) => {
            if (m.get('seq') === prevSeq) {
              m.setIcon(icon)
              m.setZIndex(prevPin.zIndex)
              pinFingerprints.current[k] = fp
            }
          })
        }
      }

      selectedSeqRef.current = seq

      // 이미 캐시된 마커 즉시 활성화
      const pin = cachedPinsBySeq.current[seq]
      if (pin) {
        const icon = getMarkerIcon(pin, true)
        const fp = buildIconKey(pin, true, favoriteSeqsRef.current.has(pin.seq))
        Object.entries(cachedMarkers.current).forEach(([k, m]) => {
          if (m.get('seq') === seq) {
            m.setIcon(icon)
            bringToFront(m, 200)
            pinFingerprints.current[k] = fp
          }
        })
      }
    },
    [getMarkerIcon, bringToFront, buildIconKey]
  )

  /** 지도 중심을 지정 좌표로 이동 */
  const centerOnLatLng = useCallback((lat: number, lng: number) => {
    if (!mapRef.current) return
    mapRef.current.setCenter(new naver.maps.LatLng(lat, lng))
    updateBoundsRef.current?.()
  }, [])

  // ─── Ticket Group Pins ───

  const drawTicketGroupPins = useCallback((pins: TicketGroupPin[]) => {
    if (!mapRef.current) return
    // 기존 ticket-group 마커 제거
    cachedTicketGroupMarkers.current.forEach((m) => m.setMap(null))
    cachedTicketGroupMarkers.current = []

    pins.forEach((pin) => {
      const { width, height, pinIconUrl } = pin.pinIcon
      const content = `<img src="${pinIconUrl}" width="${width}" height="${height}" style="display:block" />`
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(pin.latitude, pin.longitude),
        map: mapRef.current!,
        icon: {
          content,
          size: new naver.maps.Size(width, height),
          anchor: new naver.maps.Point(width / 2, height)
        },
        zIndex: 50
      })

      naver.maps.Event.addListener(marker, 'click', () => {
        // ticket-group 핀 클릭 시 deepLink 처리 (추후 확장)
      })

      cachedTicketGroupMarkers.current.push(marker)
    })
  }, [])

  // ─── Bounds 유틸 ───

  const getBoundsFromMap = useCallback((): Bounds | null => {
    if (!mapRef.current) return null
    const b = mapRef.current.getBounds() as naver.maps.LatLngBounds
    const sw = b.getSW()
    const ne = b.getNE()
    return { sw: { lat: sw.y, lng: sw.x }, ne: { lat: ne.y, lng: ne.x } }
  }, [])

  // ─── Pin Cache LRU 정리 ───

  /**
   * TTL 만료 + 용량 초과 geohash 를 내보내고, 해당 영역의 마커·fingerprint·seq 인덱스도 함께 정리한다.
   * 현재 뷰포트(activeGeohashes) 영역은 용량 정리에서 보호된다.
   */
  const prunePinCache = useCallback(() => {
    const before = cachedPinsMap.current
    const { pins: trimmed } = trimPinCache(before, {
      recentGeohashes: recentGeohashesRef.current,
      activeGeohashes: activeGeohashesRef.current
    })
    if (trimmed === before) return

    for (const geohash in before) {
      if (Object.prototype.hasOwnProperty.call(trimmed, geohash)) continue
      before[geohash].pins.forEach((pin) => {
        const key = `${geohash}/${pin.seq}`
        cachedMarkers.current[key]?.setMap(null)
        delete cachedMarkers.current[key]
        delete pinFingerprints.current[key]
        // 다른 geohash 소속으로 갱신된 seq 는 남긴다
        if (cachedPinsBySeq.current[pin.seq]?.geohash === geohash) {
          delete cachedPinsBySeq.current[pin.seq]
        }
      })
    }
    cachedPinsMap.current = trimmed
  }, [])

  // ─── Data → Markers ───

  const drawPins = useCallback(
    (groups: PinsGroupV2[]) => {
      const now = Date.now()
      groups.forEach((group) => {
        const pins = group.pins.filter((p) => p.type !== PinV2Type.EV).map((p) => createPinFromV2(p, group.geohash))

        cachedPinsMap.current[group.geohash] = { timestamp: now, pins }

        pins.forEach((pin) => {
          cachedPinsBySeq.current[pin.seq] = pin

          const key = `${group.geohash}/${pin.seq}`
          const isOn = pin.seq === selectedSeqRef.current
          const isFav = favoriteSeqsRef.current.has(pin.seq)
          const fingerprint = buildIconKey(pin, isOn, isFav)

          // 데이터가 바뀌지 않은 마커 → visibility만 갱신, 재생성 건너뜀
          if (cachedMarkers.current[key] && pinFingerprints.current[key] === fingerprint) {
            handleMarkerOverlay(cachedMarkers.current[key])
            return
          }

          // 기존 마커 제거
          if (cachedMarkers.current[key]) {
            cachedMarkers.current[key].setMap(null)
          }

          const marker = generateMarker(pin, isOn)
          if (marker) {
            handleMarkerOverlay(marker)
            cachedMarkers.current[key] = marker
            pinFingerprints.current[key] = fingerprint
          }
        })
      })

      // 새 응답으로 active 영역 timestamp 가 갱신된 뒤 오래된 영역을 LRU 로 정리
      prunePinCache()

      // 모든 마커 생성 완료 후 selected 마커를 DOM 맨 끝으로 재삽입
      // (drawPins 내 생성 순서상 selected가 다른 핀보다 먼저 추가될 수 있어 DOM 순서가 밀릴 수 있음)
      const selectedSeq = selectedSeqRef.current
      if (selectedSeq !== null) {
        Object.values(cachedMarkers.current).forEach((m) => {
          if (m.get('seq') === selectedSeq) bringToFront(m, 200)
        })
      }
    },
    [generateMarker, handleMarkerOverlay, bringToFront, buildIconKey, prunePinCache]
  )

  // pinsGroups / ticketGroupPins 변경 시 마커 그리기
  useEffect(() => {
    if (pinsGroups) {
      drawPins(pinsGroups)
      if ((mapRef.current?.getZoom() ?? DEFAULT_ZOOM) <= MAX_CLUSTER_ZOOM) {
        createClusters()
      }
      // 구매가능 필터 ON일 때 visible 마커 0개면 토스트
      if (buyableOnlyRef.current) {
        const visible = Object.values(cachedMarkers.current).filter((m) => m.getMap() !== null).length
        setBuyableEmpty(visible === 0)
      }
    }
  }, [pinsGroups, drawPins, createClusters])

  useEffect(() => {
    if (ticketGroupPins) {
      drawTicketGroupPins(ticketGroupPins)
    }
  }, [ticketGroupPins, drawTicketGroupPins])

  // searchCoords 변경 시 이미 초기화된 지도 이동 (재검색 케이스)
  useEffect(() => {
    if (options.searchCoords && mapRef.current) {
      moveToSearchCoords(options.searchCoords)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.searchCoords?.lat, options.searchCoords?.lng])

  // ─── 구매가능 필터 토글 → 기존 마커에 즉시 반영 ───

  const toggleBuyableOnly = useCallback(() => {
    const next = !buyableOnlyRef.current
    buyableOnlyRef.current = next
    setBuyableOnly(next)
    // 모든 마커에 대해 overlay 재계산 (필터 적용/해제)
    Object.values(cachedMarkers.current).forEach(handleMarkerOverlay)
    if (!next) {
      setBuyableEmpty(false)
    } else {
      const visible = Object.values(cachedMarkers.current).filter((m) => m.getMap() !== null).length
      setBuyableEmpty(visible === 0)
    }
  }, [handleMarkerOverlay])

  // ─── Time Filter Handlers ───

  const handleTimeFilterConfirm = useCallback(() => {
    setIsTimeFilterOpen(false)
    const newFilter = { date: selectedDate, durationId: selectedDurationId }
    setTimeFilter(newFilter)
    clearAllMarkers()
  }, [selectedDate, selectedDurationId, clearAllMarkers])

  // ─── Map Init ───

  const moveToSearchCoords = useCallback(
    (coords: { lat: number; lng: number }) => {
      if (!mapRef.current) return
      const position = new naver.maps.LatLng(coords.lat, coords.lng)
      mapRef.current.setCenter(position)
      mapRef.current.setZoom(DEFAULT_ZOOM)
      updateBoundsRef.current?.()

      // 이전 현재위치 핀 제거 후 검색 위치에 핀 표시
      if (currentPositionMarkerRef.current) {
        currentPositionMarkerRef.current.setMap(null)
        currentPositionMarkerRef.current = null
      }

      const html = ReactDOMServer.renderToString(CurrentPositionMarker())
      const { width, height } = measureHtml(html)
      currentPositionMarkerRef.current = new naver.maps.Marker({
        position,
        map: mapRef.current,
        icon: {
          content: html,
          size: new naver.maps.Size(width, height),
          anchor: new naver.maps.Point(width / 2, height)
        },
        zIndex: 99
      })
    },
    [measureHtml]
  )

  const initMap = useCallback(() => {
    if (!window.naver || mapRef.current) return

    const coords = searchCoordsRef.current
    const initialCenter = coords
      ? new naver.maps.LatLng(coords.lat, coords.lng)
      : new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)

    const container = document.getElementById('map') as HTMLDivElement
    const map = new naver.maps.Map(container, {
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      minZoom: 10,
      maxZoom: 21,
      logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
      mapDataControl: false,
      scaleControl: false
    })

    mapRef.current = map

    // 검색 좌표로 진입한 경우 핀 표시
    if (coords) {
      moveToSearchCoords(coords)
    }

    // ── bounds 갱신 헬퍼 (init + idle + 프로그램적 setCenter 공용) ──
    const updateBounds = () => {
      const bounds = getBoundsFromMap()
      if (bounds) {
        setMapBounds(bounds)
        const hashArr = ngeohash.bboxes(bounds.sw.lat, bounds.sw.lng, bounds.ne.lat, bounds.ne.lng, 6)
        activeGeohashesRef.current = new Set(hashArr)
        setGeohashes(hashArr.join(','))
      }
    }
    updateBoundsRef.current = updateBounds

    // 최초 렌더링 시 idle 이벤트가 발생하지 않으므로 수동으로 한 번 실행
    updateBounds()

    // idle → bounds/geohashes state 업데이트 → TanStack Query 트리거
    naver.maps.Event.addListener(map, 'idle', updateBounds)

    // zoom 변경 → 마커 overlay + 클러스터링 갱신
    naver.maps.Event.addListener(map, 'zoom_changed', () => {
      handleAllMarkersOverlay()
      const zoom = map.getZoom()
      if (zoom <= MAX_CLUSTER_ZOOM) {
        createClusters()
      } else {
        clearClusters()
      }
    })

    // 지도 여백 클릭 (핀/클러스터 click과 별개) → 외부에서 주입한 핸들러 호출
    naver.maps.Event.addListener(map, 'click', () => {
      onMapClickRef.current?.()
    })

    // 지도 초기화 전 보류된 현재 위치 이동 요청 처리
    if (pendingLocationMoveRef.current) {
      const { showPin } = pendingLocationMoveRef.current
      pendingLocationMoveRef.current = null
      // moveToCurrentLocation은 mapRef.current가 있으므로 정상 실행
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          if (!mapRef.current) return
          const position = new naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
          mapRef.current.setCenter(position)
          updateBoundsRef.current?.()
          if (!showPin) return
          if (currentPositionMarkerRef.current) {
            currentPositionMarkerRef.current.setMap(null)
            currentPositionMarkerRef.current = null
          }
          const html = ReactDOMServer.renderToString(CurrentPositionMarker())
          const { width: w, height: h } = measureHtml(html)
          currentPositionMarkerRef.current = new naver.maps.Marker({
            position,
            map: mapRef.current,
            icon: {
              content: html,
              size: new naver.maps.Size(w, h),
              anchor: new naver.maps.Point(w / 2, h)
            },
            zIndex: 99
          })
        },
        () => {}
      )
    }
    // ?timefilter=1 진입 시 지도 초기화 완료 후 시간필터 시트 오픈
    if (options.initialTimeFilterOpen) {
      setIsTimeFilterOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moveToCurrentLocation = useCallback(
    (showPin = true) => {
      if (!navigator.geolocation) return

      // 지도가 아직 초기화되지 않은 경우 → 보류 후 initMap 완료 시 재시도
      if (!mapRef.current) {
        pendingLocationMoveRef.current = { showPin }
        return
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!mapRef.current) return
          const position = new naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
          mapRef.current.setCenter(position)
          updateBoundsRef.current?.()

          if (!showPin) return

          // 이전 현재위치 핀 제거
          if (currentPositionMarkerRef.current) {
            currentPositionMarkerRef.current.setMap(null)
            currentPositionMarkerRef.current = null
          }

          const html = ReactDOMServer.renderToString(CurrentPositionMarker())
          const { width, height } = measureHtml(html)
          currentPositionMarkerRef.current = new naver.maps.Marker({
            position,
            map: mapRef.current,
            icon: {
              content: html,
              size: new naver.maps.Size(width, height),
              anchor: new naver.maps.Point(width / 2, height)
            },
            zIndex: 99
          })
        },
        () => {}
      )
    },
    [measureHtml]
  )

  return {
    mapRef,
    isLoading,
    initMap,
    moveToCurrentLocation,
    moveToSearchCoords,
    timeFilterOptions,
    selectedDate,
    selectedDurationId,
    isTimeFilterOpen,
    setSelectedDate,
    setSelectedDurationId,
    openTimeFilter: useCallback(() => setIsTimeFilterOpen(true), []),
    closeTimeFilter: useCallback(() => setIsTimeFilterOpen(false), []),
    handleTimeFilterConfirm,
    buyableOnly,
    buyableEmpty,
    toggleBuyableOnly,
    clearSelectedPin,
    selectPin,
    centerOnLatLng
  }
}
