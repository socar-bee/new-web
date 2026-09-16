/**
 * 핀 캐시 LRU 정리 — modu-web-app `pinCache.ts` 이식.
 * geohash 단위로 TTL 만료 + 용량 초과 시 "화면 밖에서 가장 오래 사용하지 않은 영역"부터 내보낸다.
 */
export const PIN_CACHE_TTL_MS = 60_000
export const PIN_CACHE_MAX_GEOHASHES = 256
const EMPTY_ACTIVE_GEOHASHES: ReadonlySet<string> = new Set()

type PinCacheOptions = {
  // 캐시 ref가 소유하며, 이 함수에서 사용 순서만 직접 갱신한다.
  recentGeohashes: Set<string>
  activeGeohashes?: ReadonlySet<string>
  now?: number
  maxGeohashes?: number
}

export const trimPinCache = <T extends { timestamp: number }>(
  pins: Record<string, T>,
  {
    recentGeohashes,
    activeGeohashes = EMPTY_ACTIVE_GEOHASHES,
    now = Date.now(),
    maxGeohashes = PIN_CACHE_MAX_GEOHASHES
  }: PinCacheOptions
) => {
  if (activeGeohashes === recentGeohashes) {
    throw new Error('캐시 사용 순서와 지도 영역은 서로 다른 Set이어야 합니다.')
  }

  let nextPins = pins
  recentGeohashes.forEach((geohash) => {
    if (!Object.prototype.hasOwnProperty.call(pins, geohash)) recentGeohashes.delete(geohash)
  })

  for (const geohash in pins) {
    if (!Object.prototype.hasOwnProperty.call(pins, geohash)) continue
    const isValid = now - pins[geohash].timestamp <= PIN_CACHE_TTL_MS
    if (!isValid) {
      if (nextPins === pins) nextPins = { ...pins }
      delete nextPins[geohash]
      recentGeohashes.delete(geohash)
    } else {
      recentGeohashes.add(geohash)
    }
  }

  let protectedGeohashCount = 0
  activeGeohashes.forEach((geohash) => {
    if (!recentGeohashes.has(geohash)) return
    protectedGeohashCount += 1
    recentGeohashes.delete(geohash)
    recentGeohashes.add(geohash)
  })

  // 현재 화면의 핀은 유지하고, 화면 밖에서 가장 오래 사용하지 않은 영역부터 정리한다.
  const capacity = Math.max(maxGeohashes, protectedGeohashCount)
  let capacityEvicted = false
  const oldestGeohashes = recentGeohashes.values()
  while (recentGeohashes.size > capacity) {
    const oldest = oldestGeohashes.next()
    if (oldest.done) break
    if (activeGeohashes.has(oldest.value)) continue
    if (nextPins === pins) nextPins = { ...pins }
    delete nextPins[oldest.value]
    recentGeohashes.delete(oldest.value)
    capacityEvicted = true
  }

  return { pins: nextPins, recentGeohashes, capacityEvicted }
}
