/**
 * E2E mock API 서버 — MODU API 호스트와 pay 호스트(guest 진입)를 동시에 흉내낸다.
 * SSR(next dev 서버)과 브라우저(클라이언트 axios) 둘 다 여기로 붙는다 → CORS 허용 필수.
 */
import { createServer } from 'node:http'

import { pinFixture, ticketFixtures, ticketListFixture } from './fixtures/tickets.mjs'

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
