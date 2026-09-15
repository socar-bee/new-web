/**
 * E2E mock API 서버 — MODU API 호스트를 흉내낸다 (pay 결제 계약 포함).
 * SSR(next dev 서버)과 브라우저(클라이언트 axios) 둘 다 여기로 붙는다 → CORS 허용 필수.
 */
import { createServer } from 'node:http'

import { paymentConfigFixture, pinFixture, ticketFixtures, ticketListFixture } from './fixtures/tickets.mjs'

const PORT = Number(process.env.MOCK_PORT ?? 4010)

const json = (res, body, status = 200) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*'
  })
  res.end(JSON.stringify(body))
}

const readBody = (req) =>
  new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
  })

const server = createServer(async (req, res) => {
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

  // ── 결제 진입 통합 조회 — price·parkinglotSeq 쌍 검증 (하나만 오면 400: pay 계약)
  if (pathname === '/user/payment-config') {
    const price = url.searchParams.get('price')
    const parkinglotSeq = url.searchParams.get('parkinglotSeq')
    if (!price || !parkinglotSeq) {
      json(res, { error: { message: 'price 와 parkinglotSeq 는 쌍입니다' } }, 400)
      return
    }
    json(res, { data: paymentConfigFixture })
    return
  }

  // ── partner 입차 예정시간 슬롯
  const ableTimeMatch = pathname.match(/^\/ticket\/(\d+)\/daily-able-time$/)
  if (ableTimeMatch) {
    json(res, {
      data: {
        times: [
          { title: '10:00 ~ 10:30', predictBeginTime: '2026-09-16T01:00:00.000Z', predictEndTime: '2026-09-16T01:30:00.000Z' },
          { title: '10:30 ~ 11:00', predictBeginTime: '2026-09-16T01:30:00.000Z', predictEndTime: '2026-09-16T02:00:00.000Z' },
          { title: '11:00 ~ 11:30', predictBeginTime: '2026-09-16T02:00:00.000Z', predictEndTime: '2026-09-16T02:30:00.000Z' }
        ]
      }
    })
    return
  }

  // ── 결제 실행 — 즉시 승인(billkey/point)은 couSeq, PG(webview)는 redirectUrl
  if (req.method === 'POST' && pathname === '/ticket/payment/billkey') {
    const body = await readBody(req)
    if (!body.billSeq || !body.carNum) {
      json(res, { error: { message: '필수 결제 정보가 없습니다' } }, 400)
      return
    }
    json(res, { data: { couSeq: 90001 } })
    return
  }

  if (req.method === 'POST' && pathname === '/ticket/payment/point') {
    json(res, { data: { couSeq: 90002 } })
    return
  }

  const webviewMatch = pathname.match(/^\/ticket\/payment\/webview\/(naverpay|mobilians|nicepay|tosspay)$/)
  if (req.method === 'POST' && webviewMatch) {
    const body = await readBody(req)
    if (!body.returnUrl || !body.carNum || body.platform !== 'web') {
      json(res, { error: { message: '필수 결제 정보가 없습니다' } }, 400)
      return
    }
    // PG·BE 302 를 생략하고 returnUrl 로 바로 성공 복귀시킨다 (returnUrl 에 이미 쿼리가 있음)
    const separator = body.returnUrl.includes('?') ? '&' : '?'
    json(res, {
      data: {
        redirectUrl: `${body.returnUrl}${separator}status=success&couSeq=90003`,
        successUrl: `${body.returnUrl}`
      }
    })
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

  json(res, { message: `no mock for ${pathname}` }, 404)
})

server.listen(PORT, () => {
  console.log(`[e2e] mock api listening on http://127.0.0.1:${PORT}`)
})
