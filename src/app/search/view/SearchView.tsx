'use client'

import { IconChevronLeftLine, IconUsageHistoryLine, IconXLine } from '@socar-inc/modu-ui/icons'

import { useSearchViewModel } from '../viewmodel'

export default function SearchView({ initialKeyword }: { initialKeyword?: string }) {
  const {
    searchText,
    results,
    isSearching,
    onChangeSearchText,
    showRecentSearches,
    recentSearches,
    selectRecentKeyword,
    removeRecentSearch,
    clearRecentSearches,
    goBack,
    selectPlace
  } = useSearchViewModel(initialKeyword)

  return (
    <div className="bg-bg-white flex min-h-dvh flex-col">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 px-4">
        <button onClick={goBack} className="flex size-8 items-center justify-center">
          <IconChevronLeftLine className="size-5" />
        </button>
        <input
          type="text"
          value={searchText}
          onChange={onChangeSearchText}
          placeholder="목적지 또는 주소 검색"
          autoFocus
          className="text-text-strong placeholder:text-text-soft flex-1 bg-transparent outline-none"
          style={{ fontSize: 'var(--text-b3)' }}
        />
        {searchText && (
          <button
            onClick={() => onChangeSearchText({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
            className="bg-bg-soft flex size-6 items-center justify-center rounded-full"
          >
            <IconXLine className="size-3" />
          </button>
        )}
      </div>

      <div className="bg-stroke-soft h-px" />

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isSearching && searchText.length >= 2 && (
          <div className="text-text-soft px-4 py-6 text-center" style={{ fontSize: 'var(--text-b4)' }}>
            검색 중...
          </div>
        )}

        {!isSearching && results && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12">
            <span className="text-text-soft" style={{ fontSize: 'var(--text-b3)' }}>
              검색 결과를 찾을 수 없습니다
            </span>
          </div>
        )}

        {!isSearching && results && results.length > 0 && (
          <ul>
            {results.map((place, i) => (
              <li key={`${place.latitude}-${place.longitude}-${i}`}>
                <button
                  onClick={() => selectPlace(place)}
                  className="active:bg-bg-weak flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors"
                >
                  <span className="text-text-strong" style={{ fontSize: 'var(--text-b4)' }}>
                    {place.name}
                  </span>
                  <span className="text-text-sub" style={{ fontSize: 'var(--text-c2)' }}>
                    {place.address}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 최근 검색어 — 빈 입력 상태에서만, 타이핑 시작하면 숨김 */}
        {!isSearching && !results && showRecentSearches && (
          <div className="flex flex-col pt-2">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-text-strong font-semibold" style={{ fontSize: 'var(--text-t5)' }}>
                최근 검색어
              </span>
              <button
                onClick={clearRecentSearches}
                className="text-text-soft cursor-pointer"
                style={{ fontSize: 'var(--text-c3)' }}
              >
                전체삭제
              </button>
            </div>
            <ul>
              {recentSearches.map((keyword) => (
                <li key={keyword} className="active:bg-bg-weak flex items-center px-4 transition-colors">
                  <button
                    onClick={() => selectRecentKeyword(keyword)}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-3 text-left"
                  >
                    <IconUsageHistoryLine className="text-icon-soft size-4 shrink-0" />
                    <span className="text-text-strong truncate" style={{ fontSize: 'var(--text-b4)' }}>
                      {keyword}
                    </span>
                  </button>
                  <button
                    onClick={() => removeRecentSearch(keyword)}
                    aria-label={`${keyword} 삭제`}
                    className="text-icon-soft flex size-8 shrink-0 cursor-pointer items-center justify-center"
                  >
                    <IconXLine className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isSearching && !results && !showRecentSearches && (
          <div className="flex flex-col items-center gap-1 px-4 py-12">
            <span className="text-text-soft" style={{ fontSize: 'var(--text-b4)' }}>
              목적지나 주소를 검색해 주세요
            </span>
            <span className="text-text-disabled" style={{ fontSize: 'var(--text-c3)' }}>
              예: 강남역, 서울시청, 종로구
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
