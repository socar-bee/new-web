# CLAUDE.md

이 파일은 매 세션 자동 로딩되는 **프로젝트 컨텍스트 인덱스**입니다. 짧게 유지하고, 자세한 내용은 `docs/` 하위 문서를 참고하세요.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind · TanStack Query v5 · Zustand v5 · framer-motion · Naver Maps · pnpm · Node ^24.12.0.

## Commands

```bash
pnpm dev          # Turbopack, APP_ENV=local, 포트 5173
pnpm build        # type-check + next build
pnpm type-check   # tsc --noEmit
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm test:e2e     # Playwright E2E (mock API 4010 + dev 4300 자동 기동)
```

커밋 전 lint-staged hook이 `eslint --fix` + `prettier --write` 자동 실행. TypeScript 편집 후 `pnpm eslint src --ext .ts,.tsx --fix`로 import 순서 정리.

## 라우트 구조 (MVVM)

```
src/app/<route>/
  model/{types,api,queries,index}.ts
  view/{<Name>View.tsx,index.ts}
  viewmodel/{use<Name>ViewModel.ts,index.ts}
  routes.ts
  page.tsx     // thin shell
```

새 라우트도 이 구조로 정렬한다. View는 viewmodel만 import.

## 도메인별 상세 가이드 (`docs/`)

| #   | 파일                                                         | 다루는 영역                                                                                    |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 01  | [docs/01-architecture.md](./docs/01-architecture.md)         | MVVM, 상태(Query/Zustand), 프로바이더, path alias                                              |
| 02  | [docs/02-api-layer.md](./docs/02-api-layer.md)               | `apiClient` vs `advanceApiClient`, preview baseUrl 정책, `parkingDate`/`durationId` query 규칙 |
| 03  | [docs/03-map-system.md](./docs/03-map-system.md)             | 네이버 지도 init/bounds, 마커 캐싱·클러스터, **"setCenter ≠ idle" 함정**                       |
| 04  | [docs/04-reservation-flow.md](./docs/04-reservation-flow.md) | 제휴주차장 예매 플로우, ticket list/detail, ParkingDetailSheet 스크롤-스파이                   |
| 05  | [docs/05-ui-patterns.md](./docs/05-ui-patterns.md)           | AnimationSheet 3-snap, DockBar/아이콘, **hydration 안전 패턴**, Lottie 로더                    |
| 06  | [docs/06-conventions.md](./docs/06-conventions.md)           | 네이밍/import 순서/커밋 스타일/ESLint·Prettier                                                 |
| 07  | [docs/07-app-webview.md](./docs/07-app-webview.md)           | 앱 웹뷰 겸용 구조 — UA 판정, `usePlatform` 어댑터, 웹브릿지, 결제 연결 (설계)                  |

## 핵심 함정 모음 (긴급 참고)

- **지도 핀 미표시**: programmatic `setCenter` 후 Naver `idle`이 발화하지 않을 수 있음 → `updateBoundsRef.current?.()`로 수동 동기화. ([03-map-system.md](./docs/03-map-system.md#함정-setcenter--idle))
- **Hydration mismatch**: `useState` 초기값에서 `localStorage`/`window` 읽지 말 것 → `useEffect` 마운트 후 동기화. ([05-ui-patterns.md](./docs/05-ui-patterns.md#hydration-안전-패턴))
- **시간필터 누락**: 사전예약 endpoint는 `parkingDate`/`durationId` 필수 — query string으로 carry, queryKey에 포함. ([02-api-layer.md](./docs/02-api-layer.md#parkingdate--durationid-query-규칙))
- **잘못된 axios client**: 사전예약(advance purchase) preview는 반드시 `advanceApiClient` 사용. ([02-api-layer.md](./docs/02-api-layer.md))
- **dev 서버는 `localhost` 로만 접근**: `127.0.0.1` 은 Next dev 가 `/_next` 를 cross-origin 차단 → 에러 없이 hydration 만 죽어 모든 클릭 무반응. ([07-app-webview.md](./docs/07-app-webview.md#함정))
- **앱 웹뷰 판정은 UA 한 가지로**: `ParkingShare/\d` → `<html data-platform="app">`. 웹 전용 크롬은 `data-web-only`. ([07-app-webview.md](./docs/07-app-webview.md))
- **새 페이지 스크롤 안 됨**: 루트 레이아웃이 `h-dvh overflow-hidden` — 페이지가 `h-full` + 내부 `main.min-h-0 flex-1 overflow-y-auto` 로 스크롤을 자체 소유해야 함 (`/t` 상세 패턴). `min-h-full` 만 쓰면 잘림. ([05-ui-patterns.md](./docs/05-ui-patterns.md))

## 패키지 매니저 / Node

`pnpm` · Node `^24.12.0` (`.nvmrc`: `24`). Husky + lint-staged 사전 커밋 hook 사용. `--no-verify` 사용 금지.

## 문서 갱신

새 함정/패턴이 생기면 해당 `docs/0X-*.md`에 등재 + (필요시) 이 파일의 "핵심 함정 모음"에 한 줄 추가.
