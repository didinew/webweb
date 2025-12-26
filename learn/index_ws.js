import WebSocket from 'ws'
import axios from 'axios'
import crypto from 'crypto'
import 'dotenv/config'

const isTestnet = process.env.BINANCE_TESTNET === 'true'
const httpBase = isTestnet ? 'https://testnet.binance.vision' : 'https://api.binance.com'
const userWsBase = isTestnet ? 'wss://stream.testnet.binance.vision/ws' : 'wss://stream.binance.com:9443/ws'
const apiKey = process.env.API_KEY || ''
const apiSecret = process.env.API_SECRET || ''
const listenKeyEnv = process.env.LISTEN_KEY || ''
// 获取账户余额
async function getAccountBalance() {
  const timestamp = await getServerTime()
  const base = { timestamp }
  const signature = signParams(base)
  const qs = encodeParams({ ...base, signature })
  const url = `${httpBase}/api/v3/account?${qs}`
  const res = await axios.get(url, { headers: { 'X-MBX-APIKEY': apiKey }, timeout: 5000 })
  return res.data.balances
}

// 获取与续期监听密钥
async function getListenKey() {
  const res = await axios.post(`${httpBase}/api/v3/userDataStream`, null, {
    headers: { 'X-MBX-APIKEY': apiKey },
    timeout: 5000,
  })
  return res.data.listenKey
}

// 保活ws
async function keepaliveListenKey(listenKey) {
  await axios.put(`${httpBase}/api/v3/userDataStream?listenKey=${listenKey}`, null, {
    headers: { 'X-MBX-APIKEY': apiKey },
    timeout: 5000,
  })
}
// 获取服务器时间
async function getServerTime() {
  try {
    const res = await axios.get(`${httpBase}/api/v3/time`, { timeout: 5000 })
    return res.data.serverTime
  } catch {
    return Date.now()
  }
}

// 编码参数
function encodeParams(params) {
  return Object.keys(params)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&')
}

// 签名参数
function signParams(params) {
  const qs = encodeParams(params)
  return crypto.createHmac('sha256', apiSecret).update(qs).digest('hex')
}

// 模拟下单（市价）
async function placeTestOrder() {
  try {
    const timestamp = await getServerTime()
    // 模拟下单（市价），需要 quoteOrderQty 参数
    // 市价订单需要 quoteOrderQty 参数，指定要购买的资产数量（以USDT为单位）
    // 市价订单会立即执行，不依赖于价格，而是根据当前市场价格执行
    const base = { symbol: 'BTCUSDT', side: 'BUY', type: 'MARKET', quoteOrderQty: '50', timestamp }
   
    // 签名参数
    const signature = signParams(base)
    // 构建请求参数
    const qs = encodeParams({ ...base, signature })
    const url = `${httpBase}/api/v3/order?${qs}`
    // 发送请求
    const res = await axios.post(url, null, { headers: { 'X-MBX-APIKEY': apiKey }, timeout: 5000 })
    // 打印订单信息
    console.log('Order placed:', res.data)
    const balance2 = await getAccountBalance()
   console.log('Account balance after maintain:', balance2)
  } catch (e) {
    console.error('Place order failed:', e?.response?.data || e?.message || e)
  }
}

// 归一化ws事件
function normalizeEvent(data) {
  return data && data.event && data.event.e ? data.event : data
}

// 处理用户事件
function handleUserEvent(payload) {
  const type = payload?.e
  // 处理executionReport事件 处理订单执行事件
  if (type === 'executionReport') {
    console.log('executionReport', {
      s: payload.s, S: payload.S, X: payload.X, x: payload.x,
      l: payload.l, z: payload.z, L: payload.L, p: payload.p,
      n: payload.n, N: payload.N, i: payload.i, T: payload.T,
    })
  } else if (type === 'balanceUpdate') {
    // 处理balanceUpdate事件 处理账户余额更新事件
    console.log('balanceUpdate', { a: payload.a, d: payload.d, T: payload.T })
  } else if (type === 'outboundAccountPosition') {
    // 处理outboundAccountPosition事件 处理账户持仓更新事件
    console.log('outboundAccountPosition', payload.B)
  } else if (type === 'listenKeyExpired') {
    // 处理listenKeyExpired事件 处理监听密钥过期事件
    console.warn('listenKeyExpired')
    return 'expired'
  } else {
    console.log(type || 'event', payload)
  }
}
// 连接ws
async function connect(listenKey, { onExpired } = {}) {
  // 连接ws时，检查监听密钥是否为空
  if (!listenKey) throw new Error('Empty listenKey')
  const url = `${userWsBase}/${listenKey}`
  console.log('Connecting to:', url)
  // 连接ws时，设置origin，避免跨域问题
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, undefined, { origin: isTestnet ? 'https://stream.testnet.binance.vision' : 'https://binance.com' })
    // 连接ws成功后，设置事件监听
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
      // 连接ws成功后，设置消息监听
      ws.on('message', (msg) => {
        console.log('WS message:')
        try {
          const raw = JSON.parse(msg)
          // 解析ws消息，检查是否为用户事件
          const payload = normalizeEvent(raw)
          // 处理用户事件
          const ret = handleUserEvent(payload)
          // 处理用户事件返回值，检查是否为过期事件
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

// 连接并保活监听密钥
async function connectAndMaintain() {
  if (!apiKey) throw new Error('Missing API_KEY env')
  let listenKey = listenKeyEnv || await getListenKey()
  console.log('listenKey', listenKey)

  let keepTimer
  // 定时保活监听密钥
  const scheduleKeepalive = () => {
    if (keepTimer) clearInterval(keepTimer)
    keepTimer = setInterval(async () => {
      try { await keepaliveListenKey(listenKey) }
      catch (e) { console.error('Keepalive failed:', e?.message || e) }
    }, 30 * 60 * 1000) // 30分钟保活 心跳
  }

  // 监听密钥过期时重新获取
  const onExpired = async () => {
    try { await reconnect('listenKey expired') }
    catch (e) { console.error('Recreate failed:', e?.message || e) }
  }

  // 重新连接并保活
  const reconnect = async (reason) => {
    console.warn('Reconnecting...', reason || '')
    let delay = 1000
    // 遇到网络异常或 404 时，指数退避重试，最多 5 次，日志可视化重连过程
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        listenKey = await getListenKey()
        console.log('new listenKey', listenKey)
        const ws2 = await connect(listenKey, { onExpired })
        scheduleKeepalive()
        return ws2
      } catch (e) {
        console.error(`Reconnect attempt ${attempt} failed:`, e?.message || e)
        await new Promise(r => setTimeout(r, delay))
        delay = Math.min(delay * 2, 30000)
      }
    }
    throw new Error('Reconnect exhausted')
  }

  try {
    const ws = await connect(listenKey, { onExpired })
    scheduleKeepalive()
    // 连接成功后，1秒后下单测试
    setTimeout(placeTestOrder, 1000)
    // 监听连接关闭，重新连接
    ws.on('close', async (code, reason) => {
      clearInterval(keepTimer)
      try { await reconnect(`closed ${code} ${reason?.toString?.() || ''}`) }
      catch (e) { console.error('Reconnect failed:', e?.message || e) }
    })
    return ws
  } catch (err) {
    // 连接失败时，处理 404 错误，重新获取监听密钥
    if ((err?.message || '').includes('404')) {
      console.warn('ListenKey invalid/expired, recreating...')
      await reconnect('404 on connect')
    } else {
      throw err
    }
  }
}

async function main() {
  const balance = await getAccountBalance()
  console.log('Account balance:', balance)
  await connectAndMaintain()

}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})