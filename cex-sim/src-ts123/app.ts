import { AccountService } from './account/accountService'
import { OrderService } from './order/orderService'
import { TradeService } from './trade/tradeService'
import type { Order } from './order/orderService'
import type { AssetAccount } from './account/accountService'
const accountService = new AccountService()
const orderService = new OrderService(accountService)

accountService.createAccount('USDT', 1000)
accountService.createAccount('BTC', 1)


// 下买单
const order = orderService.createOrder({
  symbol: 'BTCUSDT',
  side: 'BUY',
  price: 200,
  quantity: 2,
})

console.log('Order:', order)
console.log('Account after order:', accountService.getAccount('USDT'))

// 撤单
// orderService.cancelOrder(order.orderId)
// console.log('Account after cancel:', accountService.getAccount('USDT'))


const tradeService = new TradeService(orderService, accountService)

tradeService.applyTrade({
  tradeId: 't1',
  orderId: order.orderId,
  price: 90,
  quantity: 1,
  fee: 0.001,
  feeAsset: 'BTC',
})
const afterT1 = orderService.getOrder(order.orderId)
console.log('After t1 -> status:', afterT1.status, 'filled:', afterT1.filledQuantity, 'avgPrice:', afterT1.avgPrice)

tradeService.applyTrade({
  tradeId: 't2',
  orderId: order.orderId,
  price: 120,
  quantity: 2,
  fee: 0.001,
  feeAsset: 'BTC',
})
const afterT2 = orderService.getOrder(order.orderId)
console.log('After t2 -> status:', afterT2.status, 'filled:', afterT2.filledQuantity, 'avgPrice:', afterT2.avgPrice)

console.log('USDT:', accountService.getAccount('USDT'))
console.log('BTC:', accountService.getAccount('BTC'))
const orderAfterTrade = orderService.getOrder(order.orderId)
console.log('Final order -> status:', orderAfterTrade.status, 'filled:', orderAfterTrade.filledQuantity, 'avgPrice:', orderAfterTrade.avgPrice)
