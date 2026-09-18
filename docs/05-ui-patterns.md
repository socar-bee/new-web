# 05 · UI Patterns

재사용 패턴과 함정. 새 화면 만들 때 첫 번째로 살펴볼 곳.

## `AnimationSheet` (3-snap 바텀시트)

`src/shared/components/ui/AnimationSheet.tsx`. framer-motion 기반.

- snap: `peek` / `half` / `full`
- props: `isOpen`, `snap`, `onSnapChange`, `onClose`, `peek`(고정 노출 핸들), `navigationBar`(full에서만 노출), `children`(본문), `overlay`(full 전용 floating)
- iOS 느낌의 critical damping 스프링. 작은 offset/velocity에서도 인접 snap으로 commit.

### 본문 스크롤

- `full`에서만 `overflow-y: auto + touch-action: pan-y`
- `peek`/`half`에서는 `overflow: hidden + touch-action: none`. 본문 포인터다운은 시트 드래그로 연결.
- body에 `data-sheet-scroll-body` 속성 부여 → 자식 컴포넌트가 스크롤 컨테이너를 식별 가능.

### 새 시트 만들 때

- peek bar는 항상 고정 노출. 핸들/타이틀/액션 버튼 정도만.
- full 시 navigationBar로 뒤로가기/공유 같은 액션 노출.
- backdrop opacity는 `peek→half` 0→0.3, `half→full` 0.3→0.5로 자동 보간.

## 스크롤 스파이 (탭 ↔ 섹션)

`ParkingDetailSheet`이 표준 구현. 패턴:

1. 섹션별 `ref` + `activeSection` state
2. 탭 클릭: `scrollToSection(key)` → 컨테이너 `scrollTo({ top: target.offsetTop - tabsHeight, behavior: 'smooth' })`
3. 스크롤: `IntersectionObserver({ root, rootMargin: '-{tabsHeight}px 0px -80% 0px' })` → 진입한 섹션을 active로
4. **클릭 스크롤 중에는 `isScrollingByClickRef`로 observer 덮어쓰기 차단**, 스크롤 정지 후 해제

자세한 코드 흐름: [04-reservation-flow.md](./04-reservation-flow.md#parkingdetailsheet--탭--스크롤-스파이).

## `DockBar` (하단 탭)

`src/shared/components/layout/DockBar.tsx`.

- 5개 항목 (`홈`/`후기`/`내 주변`/`내 주차권`/`MY`) 모두 3D PNG → WebP(96px, q90).
- `pathname` 매칭으로 active 판단. active일 때 컬러 노출, 비활성은 `opacity-60 grayscale`.
- `--dock-height` CSS 변수를 ResizeObserver로 셋 → 시트/오버레이가 위치 보정에 사용.
- 후기 탭 첫 진입 시 Lottie 인트로 1회 노출 (`localStorage` flag).

## Hydration 안전 패턴

**`useState` 초기화에서 `localStorage`/`window`/`Date.now()` 등 클라이언트 전용 값을 읽지 않는다.** SSR/CSR 결과가 갈리면서 hydration mismatch가 난다.

❌ 안티패턴:

```tsx
const [seen, setSeen] = useState(() => localStorage.getItem('k') === '1')
```

✅ 권장:

```tsx
const [seen, setSeen] = useState(false) // SSR과 동일
useEffect(() => {
  if (localStorage.getItem('k') !== '1') setSeen(true)
  // 마운트 직후 1회 동기화 — 외부 의존성 없는 일회성 (eslint-disable react-hooks/set-state-in-effect)
}, [])
```

`react-hooks/set-state-in-effect` 룰이 effect 안 setState를 막는데, 이런 일회성 동기화는 의도된 예외이므로 줄 단위 disable + `Why:` 주석을 남긴다.

## Lottie 로딩 — `MapPinLoader`

`src/shared/components/map/MapPinLoader.tsx`.

- `pointer-events-none absolute inset-0 flex items-center justify-center` — 부모(상대 위치) 정중앙. 지도 인터랙션 안 막음.
- `z-[var(--z-map-ui)]` — 지도 위 UI와 같은 레이어.
- `show: boolean` prop만으로 토글. Lottie animationData는 `src/shared/assets/lottie/loadingAnimation.json`.

## 이미지 자산 정책

- 도크/내비 아이콘: 3D 렌더 PNG → **WebP로 변환해 사용**(96px 폭, q90 권장). `cwebp -q 90 -resize 96 0`.
- OG/배너: 그대로 PNG/WebP 혼용 가능.
- `next/image` 사용 시 dock 아이콘은 `priority`(첫 페인트에 즉시 노출).
- 외부 사진(주차장 photos.file_name)은 onError fallback으로 wrapper hide.

## 디자인 토큰

`src/app/globals.css`에 정의된 CSS variable 사용 (`text-text-strong`, `bg-bg-white`, `--font-size-b4` 등). 직접 hex/px 박지 말고 토큰 우선.

## 페이지 스크롤 소유 패턴

루트 레이아웃(`src/app/layout.tsx`)이 `h-dvh overflow-hidden` 컨테이너로 감싼다 — **문서(body) 스크롤이 없다.** 새 페이지는 스크롤을 자체 소유해야 한다:

```tsx
<div className="flex h-full flex-col">
  <header className="shrink-0">…</header> {/* sticky 불필요 — 스크롤 영역 밖 */}
  <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto">…</main>
</div>
```

- `min-h-full` 만 쓰면 콘텐츠가 잘리고 스크롤이 안 된다 (내주차권 상세에서 발생했던 버그).
- 기준 구현: `/t` 상세(`TicketDetailView`), `/my-ticket/[seq]` 상세.
- 하단 고정 버튼은 `fixed bottom-0` + 콘텐츠 `pb-[버튼높이]` 로 처리.
