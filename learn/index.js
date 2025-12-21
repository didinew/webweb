import WebSocket from 'ws'
import axios from 'axios'
import crypto from 'crypto'
import 'dotenv/config'

const isTestnet = true
const httpBase = isTestnet ? 'https://testnet.binance.vision' : 'https://api.binance.com'
const userWsBase = isTestnet ? 'wss://stream.testnet.binance.vision/ws' : 'wss://stream.binance.com:9443/ws'
const apiKey = process.env.API_KEY || ''
const apiSecret = process.env.API_SECRET || ''
const listenKeyEnv = process.env.LISTEN_KEY || ''

async function getListenKey() {
  const res = await axios.post(`${httpBase}/api/v3/userDataStream`, null, {
    headers: { 'X-MBX-APIKEY': apiKey },
    timeout: 5000,
  })
  return res.data.listenKey
}

async function keepaliveListenKey(listenKey) {
  await axios.put(`${httpBase}/api/v3/userDataStream?listenKey=${listenKey}`, null, {
    headers: { 'X-MBX-APIKEY': apiKey },
    timeout: 5000,
  })
}

async function getServerTime() {
  try {
    const res = await axios.get(`${httpBase}/api/v3/time`, { timeout: 5000 })
    return res.data.serverTime
  } catch {
    return Date.now()
  }
}

function encodeParams(params) {
  return Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
}

function signParams(params) {
  const qs = encodeParams(params)
  return crypto.createHmac('sha256', apiSecret).update(qs).digest('hex')
}

async function placeTestOrder() {
  try {
    const timestamp = await getServerTime()
    const base = { symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quoteOrderQty: '50', timestamp }
    const signature = signParams(base)
    const qs = encodeParams({ ...base, signature })
    const url = `${httpBase}/api/v3/order?${qs}`
    const res = await axios.post(url, null, { headers: { 'X-MBX-APIKEY': apiKey }, timeout: 5000 })
    console.log('Order placed:', res.data)
  } catch (e) {
    console.error('Place order failed:', e?.response?.data || e?.message || e)
  }
}

function normalizeEvent(data) {
  return data && data.event && data.event.e ? data.event : data
}

function handleUserEvent(payload) {
  const type = payload?.e
  if (type === 'executionReport') {
    console.log('executionReport', {
      s: payload.s, S: payload.S, X: payload.X, x: payload.x,
      l: payload.l, z: payload.z, L: payload.L, p: payload.p,
      n: payload.n, N: payload.N, i: payload.i, T: payload.T,
    })
  } else if (type === 'balanceUpdate') {
    console.log('balanceUpdate', { a: payload.a, d: payload.d, T: payload.T })
  } else if (type === 'outboundAccountPosition') {
    console.log('outboundAccountPosition', payload.B)
  } else if (type === 'listenKeyExpired') {
    console.warn('listenKeyExpired')
    return 'expired'
  } else {
    console.log(type || 'event', payload)
  }
}

async function connect(listenKey, { onExpired } = {}) {
  if (!listenKey) throw new Error('Empty listenKey')
  const url = `${userWsBase}/${listenKey}`
  console.log('Connecting to:', url)
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, undefined, { origin: isTestnet ? 'https://stream.testnet.binance.vision' : 'https://binance.com' })
    const onOpen = () => {
      console.log('WS onOpen...')
      ws.off('error', onError)
      ws.off('unexpected-response', onUnexpected)
      ws.on('error', (err) => { console.error('WS error:', err) })
      ws.on('close', (code, reason) => { console.warn('WS closed:', code, reason?.toString?.()) })
      ws.on('ping', (data) => {
        try {
          console.log('WS onPing...')
          ws.pong(data) 
        } catch {} })
      ws.on('message', (msg) => {
        console.log('WS message:')
        try {
          const raw = JSON.parse(msg)
          const payload = normalizeEvent(raw)
          const ret = handleUserEvent(payload)
          if (ret === 'expired' && typeof onExpired === 'function') onExpired()
        } catch {
          console.log(msg?.toString?.())
        }
      })
      resolve(ws)
    }
    const onError = (err) => { reject(err) }
    const onUnexpected = (_req, res) => { reject(new Error(`Unexpected response: ${res?.statusCode}`)) }
    ws.once('open', onOpen)
    ws.once('error', onError)
    ws.once('unexpected-response', onUnexpected)
  })
}

async function main() {
  if (!apiKey) throw new Error('Missing API_KEY env')
  let listenKey = listenKeyEnv || await getListenKey()
  console.log('listenKey', listenKey)

  const onExpired = async () => {
    try {
      console.warn('ListenKey expired, recreating...')
      listenKey = await getListenKey()
      console.log('new listenKey', listenKey)
      await connect(listenKey, { onExpired })
    } catch (e) {
      console.error('Recreate failed:', e?.message || e)
    }
  }

  try {
    const ws = await connect(listenKey)
    setInterval(async () => {
      try { await keepaliveListenKey(listenKey) }
      catch (e) { console.error('Keepalive failed:', e?.message || e) }
    }, 30 * 60 * 1000)
    setTimeout(placeTestOrder, 1000)
  } catch (err) {
    if ((err?.message || '').includes('404')) {
      console.warn('ListenKey invalid/expired, recreating...')
      listenKey = await getListenKey()
      console.log('new listenKey', listenKey)
      await connect(listenKey, { onExpired })
    } else {
      throw err
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})