import binance from 'node-binance-api';
import { Spot } from '@binance/connector';
import 'dotenv/config'

const binanceApi = new binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET,
  test: true, // 测试网
  useServerTime: true, // 使用服务器时间
  recvWindow: 60000,
  verbose: true,
});
const MODE = process.env.ORDER_MODE || 'mock' // 'mock' | 'testnet'
const spotClient = MODE === 'testnet'
  ? new Spot(process.env.BINANCE_API_KEY, process.env.BINANCE_API_SECRET, { baseURL: 'https://testnet.binance.vision' })
  : null
// console.log('test mode:', binanceApi.getOption('test'));
// 帮助函数 打印行情（支持 mock/testnet）
async function getTicker(symbols) {
  try {
    if (MODE === 'testnet') {
      const { data } = await spotClient.tickerPrice()
      const mp = new Map(data.map(d => [d.symbol, d.price]))
      console.log("=== 行情 ===")
      symbols.forEach(sym => { if (mp.has(sym)) console.log(`${sym}: ${mp.get(sym)}`) })
    } else {
      const price = await binanceApi.prices()
      console.log("=== 行情 ===")
      symbols.forEach(sym => { if (price[sym]) console.log(`${sym}: ${price[sym]}`) })
    }
  } catch (e) {
    console.error('getTicker failed:', e?.response?.data || e?.message || e)
  }
}

// 帮助函数：打印账户余额（支持 mock/testnet）
async function getAccountBalance() {
  try {
    if (MODE === 'testnet') {
      const { data } = await spotClient.account()
      console.log("=== 账户余额 ===")
      data.balances.forEach(b => {
        const free = parseFloat(b.free)
        if (free > 0 && ['USDT','ETH','BTC'].includes(b.asset)) {
          console.log(`${b.asset}}`, { available: b.free, locked: b.locked })
        }
      })
    } else {
      const balance = await binanceApi.balance()
      console.log("=== 账户余额 ===");
      for(let asset in balance) {
          if (parseFloat(balance[asset].available) > 0 && ['USDT','ETH','BTC'].includes(asset)) {
            console.log(`${asset}}`, balance[asset])
          }
      }
    }
  } catch (e) {
    console.error('getAccountBalance failed:', e?.response?.data || e?.message || e)
  }
}

// 帮助函数：模拟下单（买/卖、限价/市价）并自动满足交易过滤；支持 testnet 真回包
async function placeOrder(symbol, side, quantity, price, type = 'LIMIT') {
  try {
    // testnet: 使用官方 SDK，返回完整 JSON
    const info = await spotClient.exchangeInfo()
    const s = info.data.symbols.find(x => x.symbol === symbol)
    if (!s) throw new Error(`Invalid symbol: ${symbol}`)
    const filters = Object.fromEntries(s.filters.map(f => [f.filterType, f]))
    console.log('filters:', filters)
    const stepSize = parseFloat(filters.LOT_SIZE?.stepSize ?? '0.00000001')
    const minQty = parseFloat(filters.LOT_SIZE?.minQty ?? '0')
    const tickSize = parseFloat(filters.PRICE_FILTER?.tickSize ?? '0.00000001')
    const minNotional = parseFloat(filters.MIN_NOTIONAL?.minNotional ?? '0')
    const roundTo = (v, step) => Math.floor(Number(v) / step) * step
    let qty = Number(quantity)
    let px = price != null ? Number(price) : undefined

    if (type === 'MARKET') {
      if (side === 'BUY') {
        // 解释：此处将 quantity 作为报价币金额使用（quoteOrderQty）
        const res = await spotClient.newOrder(symbol, 'BUY', 'MARKET', { quoteOrderQty: String(qty), newOrderRespType: 'FULL' })
        console.log('=== 下单 ===', side)
        console.log(res.data)
        return
      } else {
        qty = Math.max(qty, minQty)
        qty = roundTo(qty, stepSize)
        const res = await spotClient.newOrder(symbol, 'SELL', 'MARKET', { quantity: String(qty), newOrderRespType: 'FULL' })
        console.log('=== 下单 ===', side)
        console.log(res.data)
        return
      }
    }

    // LIMIT
    qty = Math.max(qty, minQty)
    qty = roundTo(qty, stepSize)
    px = roundTo(Number(px), tickSize)
    if (px && qty && px * qty < minNotional) qty = roundTo(minNotional / px, stepSize)
    const pre = (await spotClient.account()).data
    const res = await spotClient.newOrder(symbol, side, 'LIMIT', { quantity: String(qty), price: String(px), timeInForce: 'GTC', newOrderRespType: 'FULL' })
    const post = (await spotClient.account()).data
    const exQty = Number(res.data.executedQty || 0)
    const cumQuote = Number(res.data.cummulativeQuoteQty || 0)
    const fees = (res.data.fills || []).reduce((acc, f) => { const a = f.commissionAsset; const v = Number(f.commission); acc[a] = (acc[a] || 0) + v; return acc }, {})
    const avgPrice = exQty ? parseFloat((cumQuote / exQty).toFixed(8)) : 0
    const usdtPre = pre.balances.find(b => b.asset === 'USDT') || { free: '0', locked: '0' }
    const usdtPost = post.balances.find(b => b.asset === 'USDT') || { free: '0', locked: '0' }
    const btcPre = pre.balances.find(b => b.asset === 'BTC') || { free: '0', locked: '0' }
    const btcPost = post.balances.find(b => b.asset === 'BTC') || { free: '0', locked: '0' }
    const usdtDeltaFree = parseFloat((Number(usdtPost.free) - Number(usdtPre.free)).toFixed(8))
    const usdtDeltaLocked = parseFloat((Number(usdtPost.locked) - Number(usdtPre.locked)).toFixed(8))
    const btcDeltaFree = parseFloat((Number(btcPost.free) - Number(btcPre.free)).toFixed(8))
    console.log({ executedQty: exQty, cummulativeQuoteQty: cumQuote, avgPrice, fees, usdtDeltaFree, usdtDeltaLocked, btcDeltaFree })
    console.log(res.data)
  } catch (e) {
    const msg = e?.response?.data || e?.body || e?.message || String(e)
    console.error('placeOrder failed:', msg)
  }
}

// 主函数
async function main() {
    // 查询行情
    await getTicker(['BTCUSDT','ETHUSDT','BNBUSDT']);
    // 查询账户余额
    await getAccountBalance()

    // 模拟下单
   // 限价买入（自动按过滤规则修正）
   
    await placeOrder('BTCUSDT', 'BUY', 0.001, 90000, 'LIMIT')

    // 市价卖出（price 可为 null）
    await placeOrder('ETHUSDT', 'SELL', 0.01, null, 'MARKET')
 // 查询账户余额
    await getAccountBalance()

}

main()
