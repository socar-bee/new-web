// 팝업 "오늘 하루 보지 않기" — KST 날짜 키 기반 억제.
// 원본: modu-web-app src/shared/utils/todayDismissal.ts (2026-09-16 이관)
import { formatInTimeZone } from 'date-fns-tz'

const KST_TIME_ZONE = 'Asia/Seoul'
const DATE_KEY_FORMAT = 'yyyy-MM-dd'

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem'>

const getSessionDismissKey = (storageKey: string) => `${storageKey}:closed-for-session`

export const getKstDateKey = (now: Date = new Date()) => formatInTimeZone(now, KST_TIME_ZONE, DATE_KEY_FORMAT)

export const getMillisecondsUntilNextKstDay = (now: Date = new Date()) => {
  const [year, month, day] = getKstDateKey(now).split('-').map(Number)
  const nextKstMidnight = Date.UTC(year, month - 1, day + 1, -9)
  return Math.max(nextKstMidnight - now.getTime(), 0)
}

export const isDismissedToday = (storageKey: string, now: Date = new Date(), storage?: ReadableStorage) => {
  try {
    const targetStorage = storage ?? window.localStorage
    return targetStorage.getItem(storageKey) === getKstDateKey(now)
  } catch {
    return false
  }
}

export const saveDismissedToday = (storageKey: string, now: Date = new Date(), storage?: WritableStorage) => {
  try {
    const targetStorage = storage ?? window.localStorage
    targetStorage.setItem(storageKey, getKstDateKey(now))
  } catch {
    // 스토리지 접근이 제한된 환경에서도 현재 화면의 팝업은 닫을 수 있도록 무시한다.
  }
}

export const isDismissedForSession = (storageKey: string, storage?: ReadableStorage) => {
  try {
    const targetStorage = storage ?? window.sessionStorage
    return targetStorage.getItem(getSessionDismissKey(storageKey)) === 'true'
  } catch {
    return false
  }
}

export const saveDismissedForSession = (storageKey: string, storage?: WritableStorage) => {
  try {
    const targetStorage = storage ?? window.sessionStorage
    targetStorage.setItem(getSessionDismissKey(storageKey), 'true')
  } catch {
    // 세션 스토리지 접근이 제한되어도 현재 화면의 팝업은 닫는다.
  }
}
