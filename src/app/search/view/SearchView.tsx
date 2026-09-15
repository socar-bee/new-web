'use client'

import { IconChevronLeftLine, IconXLine } from '@socar-inc/modu-ui/icons'

import { useSearchViewModel } from '../viewmodel'

export default function SearchView({ initialKeyword }: { initialKeyword?: string }) {
  const { searchText, results, isSearching, onChangeSearchText, goBack, selectPlace } =
    useSearchViewModel(initialKeyword)

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
          style={{ fontSize: 'var(--font-size-b3)' }}
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
          <div className="text-text-soft px-4 py-6 text-center" style={{ fontSize: 'var(--font-size-b4)' }}>
            검색 중...
          </div>
        )}

        {!isSearching && results && results.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-12">
            <span className="text-text-soft" style={{ fontSize: 'var(--font-size-b3)' }}>
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
                  <span className="text-text-strong" style={{ fontSize: 'var(--font-size-b4)' }}>
                    {place.name}
                  </span>
                  <span className="text-text-sub" style={{ fontSize: 'var(--font-size-c2)' }}>
                    {place.address}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!isSearching && !results && (
          <div className="flex flex-col items-center gap-1 px-4 py-12">
            <span className="text-text-soft" style={{ fontSize: 'var(--font-size-b4)' }}>
              목적지나 주소를 검색해 주세요
            </span>
            <span className="text-text-disabled" style={{ fontSize: 'var(--font-size-c3)' }}>
              예: 강남역, 서울시청, 종로구
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
