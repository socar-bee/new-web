'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { addRecentSearch, useRecentSearches } from '@/shared/hooks/useRecentSearches'

import { fetchSearchPlace, type SearchPlace } from '../model'

export function useSearchViewModel(initialKeyword?: string) {
  const router = useRouter()
  const [searchText, setSearchText] = useState(initialKeyword ?? '')
  const [results, setResults] = useState<SearchPlace[] | null>(null)
  const [isSearching, setIsSearching] = useState(!!initialKeyword)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(false)

  // ── 최근 검색어 — 빈 입력 상태에서만 노출, 타이핑 시작하면 숨긴다
  const {
    searches: recentSearches,
    refresh,
    remove: removeRecentSearch,
    clear: clearRecentSearches
  } = useRecentSearches()
  const [isRecentReady, setIsRecentReady] = useState(false)

  useEffect(() => {
    // localStorage 는 마운트 후에만 읽는다 (hydration 안전 패턴) — 1회성 동기화라 의도적 예외
    refresh()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRecentReady(true)
  }, [refresh])

  const doSearch = useCallback(async (query: string) => {
    abortRef.current = false
    try {
      const places = await fetchSearchPlace(query)
      if (!abortRef.current) {
        setResults(places)
        setIsSearching(false)
      }
    } catch {
      if (!abortRef.current) setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (initialKeyword && initialKeyword.length >= 2) {
      addRecentSearch(initialKeyword)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      doSearch(initialKeyword)
    }
  }, [initialKeyword, doSearch])

  const onChangeSearchText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setSearchText(value)

      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current = true

      if (value.length < 2) {
        setResults(null)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      timerRef.current = setTimeout(() => doSearch(value), 500)
    },
    [doSearch]
  )

  /** 최근 검색어 탭 — 입력을 채우고 디바운스 없이 즉시 검색 */
  const selectRecentKeyword = useCallback(
    (keyword: string) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current = true
      setSearchText(keyword)
      addRecentSearch(keyword)
      refresh()
      setIsSearching(true)
      doSearch(keyword)
    },
    [doSearch, refresh]
  )

  const goBack = () => router.back()

  const selectPlace = (place: SearchPlace) => {
    if (searchText.trim().length >= 2) addRecentSearch(searchText.trim())
    router.push(`/map?lat=${place.latitude}&lng=${place.longitude}`)
  }

  return {
    searchText,
    results,
    isSearching,
    onChangeSearchText,
    // 타이핑 중(입력값 존재)이면 숨김 — 입력을 지우면 다시 보인다
    showRecentSearches: isRecentReady && searchText.trim() === '' && recentSearches.length > 0,
    recentSearches,
    selectRecentKeyword,
    removeRecentSearch,
    clearRecentSearches,
    goBack,
    selectPlace
  }
}
