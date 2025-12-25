
// ✅ 功能说明
// 	1.	自动策略示例：
// 	•	价格 ≤ buyPrice → 买入
// 	•	价格 ≥ sellPrice → 卖出
// 	•	价格在区间 → 无操作
// 	2.	轮询间隔可自定义，单位秒
// 	3.	完全测试网模式，不会消耗真实资金
// 	4.	输出日志清晰：当前价格、账户余额、策略触发情况

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
const MODE = process.env.ORDER_MODE || 'testnet' // 默认测试网
const spotClient = MODE === 'testnet'
  ? new Spot(process.env.BINANCE_API_KEY, process.env.BINANCE_API_SECRET, { baseURL: 'https://testnet.binance.vision' })
  : null
// console.log('test mode:', binanceApi.getOption('test'));

// 自动策略：价格阈值触发买卖，固定轮询间隔，测试网模式
const STRATEGY = {
  symbol: 'BTCUSDT',
  buyPrice: 88000,
  sellPrice: 90000,
  intervalSec: 5,
  buyQuoteQty: 50,     // 买入使用报价币金额（USDT）
  sellBaseQty: 0.001,  // 卖出使用基础币数量（BTC）
}

async function runStrategy() {
  if (MODE !== 'testnet') {
    console.error('Strategy requires ORDER_MODE=testnet')
    return
  }
  let prevPrice = null
  const { data: exInfo } = await spotClient.exchangeInfo()
  const s = exInfo.symbols.find(x => x.symbol === STRATEGY.symbol)
  if (!s) throw new Error(`Invalid symbol: ${STRATEGY.symbol}`)

  const tick = async () => {
    try {
      // 追踪：价格变化方向
      const { data: tp } = await spotClient.tickerPrice(STRATEGY.symbol)
      const price = Number(tp.price)
      console.log(`[tick] ${STRATEGY.symbol} price=${price}`)

      // 追踪：账户余额
      const { data: acc } = await spotClient.account()
      const usdt = acc.balances.find(b=>b.asset==='USDT') || { free:'0', locked:'0'}
      const btc = acc.balances.find(b=>b.asset==='BTC') || { free:'0', locked:'0'}
      console.log(`[balance] USDT free=${usdt.free} locked=${usdt.locked} | BTC free=${btc.free} locked=${btc.locked}`)

      let triggered = 'none'
      // 追踪：价格变化方向 （价格增加时买入，价格减少时卖出）
      if (prevPrice !== null && prevPrice > STRATEGY.buyPrice && price <= STRATEGY.buyPrice) {
        const res = await spotClient.newOrder(STRATEGY.symbol,'BUY','MARKET',{ quoteOrderQty: String(STRATEGY.buyQuoteQty), newOrderRespType: 'FULL' })
        triggered = `BUY market quoteOrderQty=${STRATEGY.buyQuoteQty}`
        console.log('[order]', res.data)
      } else if (prevPrice !== null && prevPrice < STRATEGY.sellPrice && price >= STRATEGY.sellPrice) {
        const sellQty = Math.min(Number(btc.free), STRATEGY.sellBaseQty)
        if (sellQty > 0) {
          const res = await spotClient.newOrder(STRATEGY.symbol,'SELL','MARKET',{ quantity: String(sellQty), newOrderRespType: 'FULL' })
          triggered = `SELL market qty=${sellQty}`
          console.log('[order]', res.data)
        } else {
          triggered = 'SELL skipped (insufficient BTC)'
        }
      }
      console.log(`[trigger] ${triggered}`)

      prevPrice = price
    } catch (e) {
      console.error('strategy tick failed:', e?.response?.data || e?.message || e)
    }
  }
  await tick()
  setInterval(tick, STRATEGY.intervalSec * 1000)
}

async function main() {
  await runStrategy()
}

main()
