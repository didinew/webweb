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
// 帮助函数 打印行情
async function getTicker(symbol) {
  try {
    const price = await binanceApi.prices()
     console.log("=== 行情 ===");
     symbol.forEach(sym => {
        if (price[sym]) {
          console.log(`${sym}: ${price[sym]}`)
        }
     })
  } catch (e) {
    console.error('getTicker failed:', e?.message || e)
  }
}

// 帮助函数：打印账户余额
async function getAccountBalance() {
  try {
    const balance = await binanceApi.balance()
    console.log("=== 账户余额 ===");
    for(let asset in balance) {
        if (parseFloat(balance[asset].available) > 0) {
          console.log(`${asset}: ${balance[asset].available}`)
        }
    }
  } catch (e) {
    console.error('getAccountBalance failed:', e?.message || e)
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
        console.log('=== 下单 ===')
        console.log(res.data)
        return
      } else {
        qty = Math.max(qty, minQty)
        qty = roundTo(qty, stepSize)
        const res = await spotClient.newOrder(symbol, 'SELL', 'MARKET', { quantity: String(qty), newOrderRespType: 'FULL' })
        console.log('=== 下单 ===')
        console.log(res.data)
        return
      }
    }

    // LIMIT
    qty = Math.max(qty, minQty)
    qty = roundTo(qty, stepSize)
    px = roundTo(Number(px), tickSize)
    if (px && qty && px * qty < minNotional) qty = roundTo(minNotional / px, stepSize)
    const res = await spotClient.newOrder(symbol, side, 'LIMIT', { quantity: String(qty), price: String(px), timeInForce: 'GTC', newOrderRespType: 'FULL' })
    console.log('=== 下单 ===')
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
// 456: 100.00000000
// ETH: 0.99000000
// BTC: 1.00456000
// LTC: 5.00000000
// BNB: 1.00000000
// USDT: 9665.94589200
// TRX: 1744.00000000
// XRP: 222.00000000
    // const info = await binanceApi.exchangeInfo();
    // const s = info.symbols.find(x => x.symbol === 'BTCUSDT');
    // console.log('filters:', s?.filters);

    // 模拟下单
   // 限价买入（自动按过滤规则修正）
    await placeOrder('BTCUSDT', 'BUY', 0.001, 20000, 'LIMIT')

    // 市价卖出（price 可为 null）
    await placeOrder('ETHUSDT', 'SELL', 0.01, null, 'MARKET')
 // 查询账户余额
    await getAccountBalance()
// ETH: 0.98000000
// BTC: 1.00456000
// LTC: 5.00000000
// BNB: 1.00000000
// USDT: 9675.22949200
// TRX: 1744.00000000
// XRP: 222.00000000
}

main()
