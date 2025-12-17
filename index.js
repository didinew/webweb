import ccxt from 'ccxt'
import 'dotenv/config'

const exchange = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
})

// const ticker = await exchange.fetchTicker('BTC/USDT')
// console.log(ticker)

// ⭐ 开启测试环境
exchange.setSandboxMode(true)

const balance = await exchange.fetchBalance()
console.log('USDT-free:', balance.free.USDT)
console.log('USDT-used:', balance.used.USDT)
console.log('USDT-total:', balance.total.USDT)
console.log('BTC:', balance.free.BTC)
// for (const coin in balance.total) {
//   if (balance.total[coin] > 0) {
//     console.log(coin, balance.total[coin])
//   }
// // }

// const order = await exchange.createOrder(
//   'BTC/USDT',
//   'limit',
//   'buy',
//   0.001,
//   30000
// )

//  订单簿里的价格
const order = await exchange.createOrder(
  'BTC/USDT',
  'market',
  'buy',
  0.001
)

 console.log(order.status)

const balance2 = await exchange.fetchBalance()
console.log('USDT-free:', balance2.free.USDT)
console.log('USDT-used:', balance2.used.USDT)
console.log('USDT-total:', balance2.total.USDT)
console.log('BTC:', balance2.free.BTC)
console.log('BTC-used:', balance2.used.BTC)
console.log('BTC-total:', balance2.total.BTC)

// await exchange.cancelOrder(order.id, 'BTC/USDT')

// const balance3 = await exchange.fetchBalance()
// console.log('USDT-free:', balance3.free.USDT)
// console.log('USDT-used:', balance3.used.USDT)
// console.log('USDT-total:', balance3.total.USDT)
// console.log('BTC:', balance3.free.BTC)

// 查看未成交的订单
const openOrders = await exchange.fetchOpenOrders('BTC/USDT')
console.log(openOrders)


// const orderBook = await exchange.fetchOrderBook('BTC/USDT')
// console.log(orderBook)