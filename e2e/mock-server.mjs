/**
 * E2E mock API 서버 — MODU API 호스트와 pay 호스트(guest 진입)를 동시에 흉내낸다.
 * SSR(next dev 서버)과 브라우저(클라이언트 axios) 둘 다 여기로 붙는다 → CORS 허용 필수.
 */
import { createServer } from 'node:http'

import {
  myTicketActiveFixture,
  myTicketDetailFixture,
  pinFixture,
  sharedPinFixture,
  ticketFixtures,
  ticketListFixture
} from './fixtures/tickets.mjs'

const PORT = Number(process.env.MOCK_PORT ?? 4010)

const json = (res, body, status = 200) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
  })
  res.end(JSON.stringify(body))
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)
  const { pathname } = url

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    })
    res.end()
    return
  }

  // pay 비회원(guest-pay) 진입 목적지 (PAY_HOST mock) — 결제 진입 URL 검증용
  if (pathname === '/guest') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<!doctype html><html><body><h1>pay guest</h1></body></html>')
    return
  }

  // 메인 공지 — /user/config 의 mainNotice (modu-android Config 계약)
  if (pathname === '/user/config') {
    json(res, {
      data: {
        mainNotice: {
          isActive: true,
          mainNoticeSeq: 42,
          url: `http://127.0.0.1:${PORT}/notice-content`
        }
      }
    })
    return
  }

  // 메인 공지 팝업이 iframe 으로 띄우는 콘텐츠
  if (pathname === '/notice-content') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(
      '<!doctype html><html><body style="margin:0;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#e6f5ff"><h2 style="color:#003d66">시스템 점검 안내</h2><p style="color:#5c5c5c">9/20(일) 02:00~04:00 서비스 점검이 진행됩니다.</p></body></html>'
    )
    return
  }

  // 홈 배너 목록 — modu-android /user/config/banner 계약 (type: 클릭 랜딩 종류)
  if (pathname === '/user/config/banner') {
    json(res, {
      data: {
        banners: [
          { bannerSeq: 701, type: 3, filePath: '/images/banner_event.png', width: 656, height: 160, url: 'https://blog.modu.kr/event' },
          { bannerSeq: 702, type: 2, filePath: '/images/banner_monthly.png', width: 656, height: 160, parkinglotSeq: 501, lat: 37.5444, lng: 127.0374 }
        ]
      }
    })
    return
  }

  if (pathname === '/ticket/my-ticket/active') {
    json(res, { data: myTicketActiveFixture })
    return
  }

  // 내주차권 상세 — 비회원은 guestCode(뒷 4자리) '3456' 만 통과시켜 인증 실패 케이스를 재현한다
  const myTicketDetailMatch = pathname.match(/^\/ticket\/my-ticket\/p\/(\d+)$/)
  if (myTicketDetailMatch) {
    const guestCode = url.searchParams.get('guestCode') ?? ''
    const auth = req.headers.authorization ?? ''
    if (auth.includes('GUEST_AT') && guestCode !== '3456') {
      return json(res, { message: 'guest code mismatch' }, 401)
    }
    json(res, { data: myTicketDetailFixture })
    return
  }

  if (pathname === '/user/login/guest') {
    json(res, { data: { accessToken: 'GUEST_AT' } })
    return
  }

  if (pathname === '/ticket/list') {
    json(res, { data: { tickets: ticketListFixture } })
    return
  }

  const userInputMatch = pathname.match(/^\/ticket\/(\d+)\/user-input-template$/)
  if (userInputMatch) {
    json(res, { data: { userInputTemplate: null } })
    return
  }

  const ticketMatch = pathname.match(/^\/ticket\/(\d+)$/)
  if (ticketMatch) {
    const ticket = ticketFixtures[Number(ticketMatch[1])]
    if (!ticket) return json(res, { message: 'not found' }, 404)
    json(res, { data: ticket })
    return
  }

  const pinMatch = pathname.match(/^\/poi\/pins\/P\/(\d+)$/)
  if (pinMatch) {
    json(res, { data: pinFixture })
    return
  }

  const sharedPinMatch = pathname.match(/^\/poi\/pins\/S\/(\d+)$/)
  if (sharedPinMatch) {
    json(res, { data: sharedPinFixture })
    return
  }

  json(res, { message: `no mock for ${pathname}` }, 404)
})

server.listen(PORT, () => {
  console.log(`[e2e] mock api listening on http://127.0.0.1:${PORT}`)
})
