import TradingSystem from './TradingSystem/TradingSystem'

const system = new TradingSystem(1000)

// 买单入
system.placeOrder({
  id: 'B1',
  side: 'BUY',
  price: 102,
  quantity: 5,
  filledQuantity: 0,
  totalAmount: 0,
  avgPrice: 0,
  status: 'NEW',
  timestamp: Date.now()
})

// 卖单入簿
system.placeOrder({
  id: 'S1',
  side: 'SELL',
  price: 101,
  quantity: 3,
  filledQuantity: 0,
  totalAmount: 0,
  avgPrice: 0,
  status: 'NEW',
  timestamp: Date.now()
})

// 查看成交记录和订单簿
console.log('成交记录:', system.trades)
console.log('订单簿:', system.orderBooks)
console.log('账户操作:', system.account)
// 撤单示例
const canceled = system.cancelOrder('B1')
console.log('撤单结果:', canceled)

// 对账
console.log('对账结果:', system.reconcile())