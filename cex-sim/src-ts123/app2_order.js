import { AccountService } from './account/accountService.js'
import { OderService } from './order/orderService.js'
import { TradeService } from './trade/tradeService.js'

const accountService = new AccountService()
const orderService = new OderService(accountService)

accountService.createAccount('USDT', 1000000)
accountService.createAccount('BTC', 0)

// 查询usdt
// const usdtAccount = accountService.getAccount('USDT')
// console.log(usdtAccount)

// // 冻结金额
// const frozen = accountService.freeze('USDT', 800)
// console.log(accountService.getAccount('USDT'))

// // 解冻
// const release = accountService.release('USDT', 500)
// console.log(accountService.getAccount('USDT'))

// 创建订单
const order = orderService.createOder({symbol: 'BTCUSDT', side: 'BUY', price: 50000, quantity: 0.1})
// console.log(order)

// console.log(accountService.getAccount('USDT'))

// 取消订单
// const canceledOrder = orderService.cancelOrder(order.orderId)
// console.log(canceledOrder)
// console.log(accountService.getAccount('USDT'))

// 关于交易

const tradeService = new TradeService( orderService, accountService)

tradeService.applyTrade({
  tradeId: 't1',
  orderId: order.orderId,
  price: 90,
  quantity: 1,
  fee: 0,
  feeAsset: 'USDT',
})

tradeService.applyTrade({
  tradeId: 't2',
  orderId: order.orderId,
  price: 110,
  quantity: 1,
  fee: 0,
  feeAsset: 'USDT',
})
// console.log(orderService.getOrder(order.orderId))
console.log(accountService.getAccount('USDT'))
console.log(accountService.getAccount('BTC'))