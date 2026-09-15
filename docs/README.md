# modu-web docs

이 디렉터리는 **`CLAUDE.md`(root)에서 참조하는 도메인별 상세 가이드** 모음입니다. Claude/사람 모두 읽기 위한 문서이며, 코드 그 자체로 자명한 사실은 적지 않습니다. 함정·규칙·의도가 우선입니다.

## 읽는 순서

| #   | 파일                                            | 다루는 내용                                                                                                           |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 01  | [architecture.md](./01-architecture.md)         | MVVM 라우트 구조, 상태(TanStack Query/Zustand), 글로벌 프로바이더                                                     |
| 02  | [api-layer.md](./02-api-layer.md)               | `apiClient` vs `advanceApiClient`, preview baseUrl 정책, `parkingDate`/`durationId` query 규칙                        |
| 03  | [map-system.md](./03-map-system.md)             | 네이버 지도 init 흐름, bounds/idle 동기화, 마커 캐싱·클러스터링, "setCenter ≠ idle" 함정                              |
| 04  | [reservation-flow.md](./04-reservation-flow.md) | 제휴주차장 예매 플로우 (`/p/[id]`, `/parking/[id]`, `/payment`), 티켓 list/detail, `ParkingDetailSheet` 스크롤-스파이 |
| 05  | [ui-patterns.md](./05-ui-patterns.md)           | `AnimationSheet`(3-snap), `DockBar`/아이콘, hydration 안전 패턴, Lottie 로더                                          |
| 06  | [conventions.md](./06-conventions.md)           | 네이밍, import 순서, 커밋 스타일, ESLint/Prettier 규칙                                                                |
| 07  | [app-webview.md](./07-app-webview.md)           | 앱 웹뷰 겸용 구조 — UA 환경 판정, `usePlatform` 어댑터, 웹브릿지 인증·상단바, 결제 연결 (구현 전 설계)                |

## 문서 갱신 원칙

1. **함정을 기록하라.** "한 번 데었던" 케이스(예: setCenter↔idle race)는 반드시 등재.
2. **WHY 위주.** WHAT은 코드/타입을 보면 알 수 있다.
3. **수명 짧은 정보는 안 적는다.** in-flight 작업 상태, 임시 PR 번호 등은 PR description에.
4. **CLAUDE.md(root)에 큰 변화가 생기면 여기 인덱스도 갱신.**
