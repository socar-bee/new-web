# 07 · 앱 웹뷰 겸용 구조 (웹브릿지)

> 상태: **1차 구현 반영** (2026-09-16). `src/shared/platform/` 골격 · 브릿지 설치/인증/상단바 · `/t/[id]` 플랫폼 전환(안드로이드 기준 재구성) · `/p/[id]` viewmodel 연결 · `/purchase/result` 스캐폴드 · E2E(`e2e/`)까지 반영. 남은 것: 실기기 검증(구현 순서 8), `/p/[id]` 시트 상단바 완전 전환, 내주차권, 서드파티 스크립트 제한.

## 한 줄 요약

주차장·주차권 상세처럼 **웹에도 있고 앱에도 있는 공개 화면은 이 웹 서비스 하나로 만든다.** 모두의주차장 앱은 이 페이지를 웹뷰로 열고, 앱 안일 때만 웹브릿지(`@socar-inc/modu-web-bridge`)로 네이티브 기능을 붙인다. 화면 코드는 한 벌이고, SEO도 이 서비스가 그대로 맡는다.

## 왜 이 구조인가

같은 화면을 웹(Next)과 웹뷰 전용 앱(`modu-webview-monorepo`의 별도 서브도메인 앱) 두 곳에 만드는 안을 검토했다가 버렸다.

| 검토한 안                                                     | 버린 이유                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 웹뷰 전용 앱을 따로 두고, 웹은 그 앱의 `/guest` 라우트로 보냄 | 웹에 상세 화면이 두 벌 생긴다. 웹뷰 앱은 정적 SPA라 SEO가 빠진다          |
| Next가 `<head>`만 만들고 화면은 웹뷰 앱 번들이 그림           | 흔한 구조가 아니다. 배포 결합(해시 파일), 정적 파일 경로, CORS가 따라온다 |
| 웹뷰 앱에 react-helmet으로 SEO 보강                           | JS 실행 뒤에야 메타가 바뀌어 공유 미리보기·네이버 색인에 효과가 없다      |

**대상이 아닌 것** — 앱 안에서만 도는 흐름(회원 결제 `pay`, 본인인증 `auth`, 이벤트, AI 예약)은 웹 서비스가 아니라 합칠 대상이 아니다. 계속 웹뷰 전용 앱이 맡는다.

## 대상 라우트

| 라우트                   | 앱 웹뷰 대상                        | 단계 |
| ------------------------ | ----------------------------------- | ---- |
| `/t/[id]` 주차권 상세    | ✅                                  | 1차  |
| `/p/[id]` 주차장 상세    | ✅                                  | 2차  |
| `(tabs)/*` 홈·지도·MY 등 | ❌ 앱은 네이티브 탭을 쓴다          | —    |
| `/login/*`               | ❌ 앱은 네이티브 로그인 시트를 쓴다 | —    |

앱 딥링크 예시 (앱팀 협의 필요): `parkingshare://open-url/internal?url=https%3A%2F%2F{웹 도메인}%2Ft%2F{couponSeq}%3FparkingDate%3D2026-09-15`

---

## 핵심 원칙

### 1. 환경은 User-Agent로 정한다

앱 웹뷰는 UA에 `ParkingShare/{버전}`을 붙인다. 판정은 이 한 가지로 한다.

```ts
export const isAppUserAgent = (ua: string) => /ParkingShare\/\d/i.test(ua)
```

- **브릿지 설치 여부로 판정하지 않는다.** 설치·초기화 타이밍에 따라 결과가 흔들린다 (webview 모노레포 pay 비회원 작업에서 결론낸 사항).
- `bridge.isAvailable()`은 판정이 아니라 **실제 호출 가능 여부 확인용**으로만 쓴다. UA는 앱인데 브릿지가 없으면 구버전 앱이다 → 웹 동작으로 폴백한다.
- 같은 판정을 쓰는 코드: `modu-webview-monorepo/apps/carwash/src/shared/lib/webview/isModuAppWebView.ts`

### 2. 서버 HTML은 환경과 무관하게 한 벌

- **UA로 SSR 결과를 나누지 않는다.** 캐시(ISR/revalidate)가 UA별로 쪼개지고, 서버·클라이언트 판정이 어긋나면 hydration mismatch가 난다.
- 환경 차이는 **두 가지 방식으로만** 입힌다.
  - **보이는 차이** (웹 헤더·DockBar 숨김): 첫 페인트 전에 도는 인라인 스크립트로 `<html data-platform="app">`을 달고 CSS로 숨긴다. hydration 뒤에 숨기면 한 번 보였다 사라진다.
  - **동작 차이** (뒤로가기·결제·로그인·재조회): 클라이언트 어댑터(`usePlatform()`)가 누를 때 판정한다. 렌더 결과에 영향이 없어 깜빡임이 없다.
- 루트 `<html>`에 이미 `suppressHydrationWarning`이 있어 `data-platform` 속성 차이는 경고가 나지 않는다.

```tsx
// src/app/layout.tsx <head> 안 — 번들보다 먼저 실행된다
<script
  dangerouslySetInnerHTML={{
    __html: `if(/ParkingShare\\/\\d/i.test(navigator.userAgent))document.documentElement.dataset.platform='app'`
  }}
/>
```

```css
/* globals.css */
html[data-platform='app'] [data-web-only] {
  display: none;
}
```

### 3. 브릿지는 앱일 때만, 클라이언트에서만 싣는다

- `@socar-inc/modu-web-bridge`는 **앱 판정일 때 동적 import**한다. 웹 사용자 번들에 싣지 않는다.
- 토큰·Pref·`onResume`은 브라우저에서만 동작한다. 로그인 사용자 기준 데이터는 서버 렌더링하지 않고 hydration 뒤에 조회한다.
- 공개 상세 API(`/ticket/:couponSeq`, `/ticket/list`)는 토큰 없이 응답하므로 SSR에 영향이 없다.

### 4. 브릿지는 토큰 창구다 — 범위를 좁힌다

`bridge.peekTokens()`는 페이지에 **앱 액세스 토큰을 꺼내 준다.** 웹 서비스는 외부 스크립트(GA, 카카오 SDK, 광고·어트리뷰션)를 싣는 곳이라, 브릿지를 열면 그 스크립트들도 같은 창구에 닿는다.

- 브릿지를 설치하는 라우트를 **허용 목록으로 한정**한다 (`/t/[id]`, `/p/[id]`).
- 앱 판정일 때 해당 라우트에서는 **서드파티 스크립트를 싣지 않는다.** 앱 계측은 브릿지 `analyticsLog`로 보낸다.
- 적용 전에 앱팀·보안 담당과 범위를 합의한다.

---

## 파일 배치

기존 MVVM 규칙([01-architecture.md](./01-architecture.md))을 그대로 따른다. 환경 차이는 `shared/platform`에만 두고, 라우트의 viewmodel은 `usePlatform()`만 본다.

```
src/shared/platform/
  detect.ts             isAppUserAgent · 인라인 판정 스크립트 문자열
  types.ts              Platform 인터페이스
  web.ts                웹 구현
  app.ts                앱 구현 (브릿지 사용)
  PlatformProvider.tsx  환경별 구현을 1개만 골라 context 로 내린다
  usePlatform.ts
  bridge/
    installBridge.ts        createModuWebBridge → install / dispose
    attachBridgeAuth.ts     apiClient 토큰 인터셉터 (401 갱신 1회 재시도)
    topAppBar.ts            네이티브 상단바 구성
    closeWebview.ts         parkingshare-internal://close + Android 전역 함수
    appScheme.ts            parkingshare:// 딥링크 · open-url/internal
    paymentEntry.ts         pay 진입 계약 (Pref payment/PaymentEntry)
```

## Platform 인터페이스

```ts
// src/shared/platform/types.ts
export interface Platform {
  kind: 'web' | 'app'
  /** 앱이면 브릿지 설치·토큰 확인까지 끝났는지. 웹은 항상 true */
  ready: boolean

  /** 상단바 제목·뒤로가기. 웹은 화면 안 헤더가 맡으므로 no-op */
  useTopBar(options: { title: string; onBack: () => void }): void
  /** 뒤로가기. 웹은 fallbackHref 로 이동, 앱은 웹뷰 닫기 */
  back(fallbackHref: string): void
  /** 로그인 요구. 웹은 /login, 앱은 가입·로그인 시트 */
  requestLogin(): void
  /** 결제 시작 */
  startCheckout(ticket: { couponSeq: number; parkingDate: string }): Promise<void>
  /** 다른 화면·결제에서 돌아왔을 때. 해제 함수를 돌려준다 */
  onReturn(listener: () => void): () => void
}
```

`useTopBar`만 훅인 이유 — 앱은 마운트·`pageshow`·`onResume`마다 상단바를 다시 걸어야 해서 effect 수명이 필요하다.

## 환경별 동작

| 관심사            | 웹 (`kind: 'web'`)                                        | 앱 (`kind: 'app'`)                                                          |
| ----------------- | --------------------------------------------------------- | --------------------------------------------------------------------------- |
| 헤더              | 화면 안 sticky 헤더                                       | 네이티브 TopAppBar (`bridge.topAppBar`) — 웹 헤더는 `data-web-only` 로 숨김 |
| 뒤로가기          | `/p/{seq}{carryQuery}#sheet=full` (지금 `goBack`)         | `parkingshare-internal://close`                                             |
| 로그인            | `/login`                                                  | `parkingshare://signup-sheet`                                               |
| 인증 헤더         | `authStore` 토큰                                          | `bridge.peekTokens` + 401 이면 `refreshTokens` 후 1회 재시도                |
| 결제              | `{PAY_HOST}/guest?couponSeq&parkingDate&guestSeq` 로 이동 | Pref `payment/PaymentEntry` 기록 → pay **새 웹뷰**                          |
| 결제 후           | pay 가 결과 페이지로 돌려보냄 (아래 미정 사항)            | 네이티브가 결과 화면을 띄움. 이 웹은 결과를 읽지 않음                       |
| 돌아왔을 때       | `pageshow` (`persisted`)                                  | `bridge.onResume` + `pageshow`                                              |
| 월정기권 구매     | 앱 유도                                                   | 결제 막음 (이름·차량 입력 화면이 웹에 없음)                                 |
| 계측              | 웹 계측 스크립트                                          | `bridge.analyticsLog`                                                       |
| 서드파티 스크립트 | 싣는다                                                    | 싣지 않는다                                                                 |

## 인증 — 인터셉터는 환경마다 하나만

- `PlatformProvider`가 환경을 정한 뒤 **한 가지 인터셉터만** `apiClient`(와 해당 라우트가 쓰는 `advanceApiClient`)에 붙인다. 웹용·앱용을 동시에 붙이면 같은 인스턴스에서 서로 덮어쓴다 (pay 비회원 작업에서 겪은 문제).
- 앱에서는 `authStore`(localStorage)를 쓰지 않는다. 토큰의 원본은 네이티브다.
- 앱 인터셉터 규칙:
  - 요청마다 `peekTokens({ names: ['accessToken'] })` → `Authorization: Bearer`. 조회 실패는 무토큰으로 보내고 401 흐름에 맡긴다.
  - 401 이면 `refreshTokens()` → 실패 요청 **1회만** 재시도. 동시 401 은 네이티브가 갱신을 1회로 합쳐 준다(스펙 보장)라 웹에 갱신 큐를 두지 않는다.
  - refresh 만료 시 세션 정리는 네이티브 책임 — 웹은 분기하지 않는다.
- 참고 구현: `modu-webview-monorepo/apps/benefit/src/shared/bridge/attachBridgeAuth.ts`

## 결제 연결

> **2026-09-16 갱신**: 결제는 **자체 결제 화면 `/payment`** 가 맡는다 — pay 서비스
> (`modu-webview-monorepo/apps/pay`)의 **회원 partner 플로우 로직을 그대로 이관**했다
> (`src/app/payment/model/{types,checkout,api}.ts`). 웹은 같은 탭 이동, 앱은 `open-url/internal` 새 웹뷰.
>
> - 진입: 쿼리 `couponSeq`·`parkingDate` (Pref 아님 — 우리 화면이 우리를 연다). 금액·상품명 원본은 상세 조회
> - 조회: `GET /user/payment-config?price&parkinglotSeq` (카드·쿠폰·차량·포인트 — **쌍 미완성 시 호출 금지, 400**),
>   `GET /ticket/{couponSeq}/daily-able-time` (requiresEntryTime 상품만)
> - 금액: 상품가 → 쿠폰 차감(그 값이 포인트 상한) → 포인트 차감 → 0 하한. **`price`=최종액 / `totalPrice`=원가** — 바꿔 넣으면 원가 승인
> - 실행: `POST /ticket/payment/{webview/{pgType}|billkey|point}` — 0원은 point, 카드는 billkey 즉시 승인,
>   토스페이·네이버페이·휴대폰(mobilians)은 PG `redirectUrl` 이동. 시각은 전부 `toServerTime`(ISO-UTC)
> - 결과: 즉시 승인도 `/payment/callback` 으로 합류. 앱은 Pref `payment/PaymentResult`(성공만, `{type:'p',seq}`) 기록
>   후 닫기, 웹은 `/purchase/result`. 실패는 sessionStorage 토스트로 복귀
> - 가드: 차량 확인 1회 되묻기, `uncertain`·`approved` 후 CTA 잠금 유지(더블탭=2차 결제), 프리셀렉트 1회 래치,
>   재조회로 사라진 카드·쿠폰·차량은 즉시 비움
> - 미이관: pay guest(전화인증) 플로우 — 웹 비로그인은 로그인 유도. 카드·차량 등록은 앱 딥링크(`cards/register` 등)
>
> 아래 외부 pay 연동 계약은 되돌아갈 때를 위해 보존한다.

### 앱 — Pref 기록 후 pay 를 새 웹뷰로

```ts
await bridge.putPrefValue({
  domainName: 'payment',
  itemName: 'PaymentEntry',
  serialized: { value: JSON.stringify({ flowType: 'partner', couponSeq, parkingDate }) }
})
location.href = `parkingshare://open-url/internal?url=${encodeURIComponent(PAY_ORIGIN)}`
```

- **같은 웹뷰에서 pay 로 이동하지 않는다.** pay 는 결제가 끝나면 웹뷰를 닫는데, 그러면 이 상세 화면까지 같이 닫힌다. 상단바 구성도 도메인이 바뀌면 파기된다.
- **`payment/PaymentResult` 는 읽지 않는다.** 네이티브가 읽고 지우기로 합의된 값이라, 여기서도 읽으면 결과 화면이 안 뜨거나 두 번 뜬다. 돌아오면 판매 상태만 다시 조회한다.
- **계약의 원본은 pay 다** — `modu-webview-monorepo/apps/pay/src/shared/bridge/entryParams.type.ts`. 문자열로 옮겨 적으면 pay 가 계약을 바꿀 때 조용히 어긋난다 (예: pay@v1.1.0 `requiresEntryTime`). 옮길 때는 원본 경로와 확인 날짜를 주석으로 남긴다.

### 웹 — pay 비회원 경로로 이동

- `{PAY_HOST}/guest?couponSeq={seq}&parkingDate={yyyy-MM-dd}&guestSeq={채널 코드}` 로 **같은 탭 이동**한다. 토큰은 넘기지 않는다 — 휴대폰 인증은 pay 가 한다.
- `PAY_HOST` 는 환경변수로 받는다. API 호스트 문자열로 운영 여부를 추정하지 않는다 — modu-web-app `payOrigin()` 이 `api.modu.kr` 로 판정하는데 운영 API 는 `api.modu.cloud` 라, 운영 사용자가 pay-dev 로 가는 버그가 있다.

### `parkingDate` 는 한 값으로

화면이 가진 `parkingDate` 하나를 **조회와 결제 진입값에 같이** 넘긴다. 조회 함수가 안에서 오늘 날짜를 다시 계산하면 자정 근처에 목록 기준일과 결제 날짜가 하루 어긋난다.

## `/t/[id]` 적용 예

View 는 그대로 두고 viewmodel 의 핸들러 속만 바꾼다.

```ts
// viewmodel/useTicketDetailViewModel.ts
const platform = usePlatform()

platform.useTopBar({ title: '이용권 상세', onBack: goBack })

const goBack = useCallback(() => {
  platform.back(pin ? `/p/${pin.seq}${carryQuery}#sheet=full` : '/')
}, [platform, pin, carryQuery])

const handleClickPurchase = useCallback(() => {
  if (!ticket || purchaseButton.disabled) return
  platform.startCheckout({ couponSeq: ticket.couponSeq, parkingDate })
}, [platform, ticket, purchaseButton, parkingDate])

// 결제·앱 화면에서 돌아오면 판매 상태를 다시 읽는다
useEffect(() => platform.onReturn(() => refetch()), [platform, refetch])
```

```tsx
// view/TicketDetailView.tsx — 웹 전용 헤더
<header data-web-only className="sticky top-0 ...">
  ...
</header>
```

---

## 함정

**환경 판정**

- **`useState` 초기값에서 `navigator.userAgent` 를 읽지 않는다.** 서버에는 없는 값이라 hydration mismatch 가 난다 ([05-ui-patterns.md](./05-ui-patterns.md#hydration-안전-패턴)). 인라인 스크립트가 단 `data-platform` 을 마운트 후 읽는다.
- **UA 는 앱인데 브릿지가 없을 수 있다** (구버전 앱). 이때는 웹 동작으로 폴백하고, 결제 버튼에서만 "앱 업데이트" 안내가 필요한지 기획과 정한다.

**브릿지 수명**

- 설치 전(최초 렌더)에는 클라이언트가 `null` 이다. 소비처가 가드한다.
- `dispose` 는 최종 상태라 **effect setup 마다 새 인스턴스를 만든다** (SDK README 권장). StrictMode 가 setup·cleanup 을 두 번 돌려도 재설치가 아니다.
- 설치 결과는 ref 가 아니라 **state** 로 내린다. ref 에 담으면 설치가 끝나도 소비처가 다시 그려지지 않는다.

**네이티브 상단바**

- `navigationIcon` 에 **action 을 반드시 넘긴다.** 앱이 띄운 첫 화면은 `canGoBack` 이 false 라 action 이 없으면 아이콘이 사라진다.
- **Android 상단바는 `actionUrl` 을 무시한다.** Android 는 `jsFunction`(window 전역 함수 이름), iOS 는 `actionUrl` 로 분기한다. 전역 함수는 브릿지 설치 여부와 무관하게 먼저 등록한다 — 등록이 풀린 틈에 탭이 삼켜진다.
- **앱 기본 아이콘 위임은 간헐적으로만 그려진다.** `iconUrl` 로 72px(24pt @3x) PNG 를 넘긴다.
- 상단바 구성은 `retentionSite` 밖 도메인으로 나갔다 오면 파기된다. `pageshow`(`persisted`)·`onResume` 에서 다시 건다.

**E2E · 로컬 검증**

- **`127.0.0.1` 로 dev 서버에 접근하면 hydration 이 통째로 죽는다.** Next 16 dev 가 `/_next/*` 요청을 cross-origin 으로 차단(`allowedDevOrigins`)하는데, HTML 은 200 으로 내려와서 **화면은 멀쩡히 보이고 에러도 없다** — React 만 조용히 부팅 실패해 모든 클릭이 무반응. 반드시 `localhost` 로 접근한다 (`playwright.config.ts`).
- E2E 는 SSR 도 mock 을 타야 해서 `page.route` 가 아니라 **mock API 서버**(`e2e/mock-server.mjs`) 위에 dev 서버를 띄운다. `NEXT_PUBLIC_*` 는 webServer env 로 주입.
- SSR HTML 은 hydration 전에도 보여서 바로 클릭하면 이벤트가 유실된다 — `PlatformProvider` 가 다는 `html[data-hydrated]` 를 기다린다 (`e2e/utils.ts` `gotoHydrated`).

**웹뷰 제약**

- `window.open` 을 쓰지 않는다. 지금 `handleClickPurchase` 의 월정기 분기(`window.open(..., '_blank')`)는 앱에서 동작하지 않는다.
- 앱 스킴은 두 종류다 — **이동** `parkingshare://{경로}`, **닫기** `parkingshare-internal://close`. prefix 가 달라 섞으면 무반응이다.
- iOS 는 다른 웹뷰에서 돌아오면 bfcache 로 복원돼 마운트가 다시 일어나지 않는다. 재조회·상단바는 `pageshow` 로도 건다. (`(tabs)/layout.tsx` 는 `persisted` 면 reload 하는데, 대상 라우트에서는 상태 보존을 위해 reload 대신 재조회한다.)
- 클립보드 쓰기는 사용자 제스처 직후에만 허용된다. 응답을 기다렸다 쓰면 iOS 웹뷰가 거부한다 — `ClipboardItem` 에 Promise 를 넘겨 쓰기를 먼저 건다.

## 의존성 · 환경변수

| 항목                               | 내용                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@socar-inc/modu-web-bridge@1.0.0` | GitHub Packages 사설 레지스트리(`npm.pkg.github.com`). 설치에 인증이 필요하다                                                                                        |
| `.npmrc`                           | **지금 `.gitignore` 에 없다.** 레지스트리 토큰이 커밋되지 않도록 의존성을 추가하기 전에 먼저 `.gitignore` 에 넣는다. 토큰은 로컬 `~/.npmrc`, CI 는 워크플로가 만든다 |
| `NEXT_PUBLIC_PAY_HOST`             | pay 원점 (`https://pay.modu.kr` / `https://pay-dev.modudev.cloud`)                                                                                                   |
| `NEXT_PUBLIC_MODU_API_HOST`        | 기존 값 그대로                                                                                                                                                       |

## 앱팀 협의 항목

| #   | 항목               | 질문                                                                                                     |
| --- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| 1   | 진입 딥링크        | 네이티브 주차권 상세 진입점을 이 웹 `/t/{couponSeq}?parkingDate=` 웹뷰로 바꾸는 방식과 적용 최소 앱 버전 |
| 2   | 브릿지 허용 호스트 | 이 웹의 운영·개발 도메인이 브릿지 허용 목록에 들어 있는지                                                |
| 3   | UA 마커            | iOS·Android 모두 `ParkingShare/{버전}` 을 보장하는지                                                     |
| 4   | 결제 후 웹뷰       | pay 성공 → 네이티브 결과 화면이 뜰 때 아래에 남은 이 웹뷰를 둘지 닫을지                                  |
| 5   | 토큰 노출 범위     | 브릿지 허용 라우트 한정 + 서드파티 스크립트 제한으로 충분한지 (보안 담당 포함)                           |
| 6   | 폴백               | 구버전 앱은 기존 네이티브 화면을 계속 쓰는지                                                             |

## 미정 사항

- **웹 결제 결과 페이지** — pay 비회원 결제는 성공하면 `app.modu.kr/purchase/result` 로 돌려보낸다. 이 저장소에는 해당 라우트가 없다. 결과 페이지를 여기서 만들지, 반환 주소를 바꿀지 pay 와 정한다.
- **화면 스펙 기준** — 지금 `/t/[id]` 는 안드로이드 화면과 다르다 (버튼 문구 「구매하기」 vs 「N원 결제하기」, 판매 예정 문구, 다른 주차권 탭 vs 가로 카드). 앱 웹뷰로 쓰려면 어느 쪽을 기준으로 맞출지 기획에서 정한다.
- **주차장 상세의 날짜 목록** — 앱 주차권 상세는 메인 필터의 선택 가능 날짜(`availableDates`)로 날짜 셀을 그린다. 웹 진입값에는 이 목록이 없다.

## 구현 순서

1. `.gitignore` 에 `.npmrc` 추가 → 브릿지 의존성 추가
2. `shared/platform` 골격 — `detect` · 인라인 판정 스크립트 · `data-web-only` CSS · `web` 구현
3. `app` 구현 — 브릿지 설치, 토큰 인터셉터, `onReturn`, 닫기·로그인 스킴
4. `/t/[id]` viewmodel 전환 — `back` · `startCheckout` · `onReturn`, 웹 헤더에 `data-web-only`
5. 네이티브 상단바 (`useTopBar`) — 아이콘 PNG 를 `public/icons/` 에 추가
6. 결제 연결 — 앱: Pref + pay 새 웹뷰 / 웹: pay 비회원 경로
7. 서드파티 스크립트 제한 (앱 판정 + 대상 라우트)
8. 실기기 검증 — 진입, 상단바 뒤로가기(Android·iOS), 결제 왕복 후 재조회, 로그아웃 상태 결제, 구버전 앱 폴백
9. `/p/[id]` 로 확장

## 참고 코드

| 무엇                                        | 경로                                                                                         |
| ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 브릿지 설치 · 토큰 인터셉터 · 상단바 · 닫기 | `~/Desktop/modu/modu-webview-monorepo/apps/benefit/src/shared/bridge/`                       |
| pay 진입 계약 (원본)                        | `~/Desktop/modu/modu-webview-monorepo/apps/pay/src/shared/bridge/entryParams.type.ts`        |
| pay 비회원 진입 파라미터                    | `apps/pay/src/shared/guest/guestEntry.ts` (`milestone/guest-pay` 브랜치)                     |
| 안드로이드 원본                             | `socar-inc/modu-android` `ParkingShare/src/main/java/com/parkingshare/mobile/ticket/detail/` |
| 앱 웹뷰 UA 판정                             | `apps/carwash/src/shared/lib/webview/isModuAppWebView.ts`                                    |
