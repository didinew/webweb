import type { Order, OrderService } from '../order/orderService'
import type { AccountService } from '../account/accountService'

export type Trade = {
    tradeId: string,
    orderId: string,
    price: number,
    quantity: number,
    fee: number,
    feeAsset: string,
}
export class TradeService {
    private orderService: OrderService
    private accountService: AccountService
    private processedTradeIds: Set<string> = new Set()
    constructor(orderService: OrderService, accountService: AccountService) {
        this.orderService = orderService
        this.accountService = accountService
        this.processedTradeIds = new Set()
    }
    
    applyTrade(trade: Trade){
        const {
            tradeId,
            orderId,
            price,
            quantity,
            fee,
            feeAsset
        } = trade

         // 1️⃣ 幂等校验
         if (this.processedTradeIds.has(tradeId)){
            return
         }

        // 获取订单
       // console.log(this.orderService)
        const order = this.orderService.getOrder(orderId)
        if (!order){
           throw new Error(`Order not found: ${orderId}`)
        }
        
        // NEW PARTIALLY_FILLED 状态下才允许成交
        if (!['NEW', 'PARTIALLY_FILLED'].includes(order.status)){
            throw new Error(`Order status is not NEW or PARTIALLY_FILLED: ${order.status}`)
        }

        // 2️⃣ 核心结算逻辑
        this._settle(order, trade)

       // 3️⃣ 标记已处理
        this.processedTradeIds.add(tradeId)
    }

    _settle(order: Order, trade: Trade) {
       const {
        price,
        quantity,
        fee,
        feeAsset
       }  = trade
       const p = Number(price)
       const q = Number(quantity)
       if (!Number.isFinite(order.avgPrice)) order.avgPrice = 0
       if (!Number.isFinite(order.filledQuantity)) order.filledQuantity = 0
       const totalCostBefore = order.avgPrice * order.filledQuantity
       const totalCostAfter = totalCostBefore + p * q
       const newFilled = order.filledQuantity + q
       order.filledQuantity = newFilled
       order.avgPrice = newFilled > 0 ? totalCostAfter / newFilled : 0
       
         // 2️⃣ 更新订单状态
         if (order.filledQuantity >= order.quantity){
            order.status = 'FILLED'
         } else {
            order.status = 'PARTIALLY_FILLED'
         }

        // 3️⃣ 结算账户（买卖分开）
        if (order.side === 'BUY') {
            // 减少用户的USDT 余额
            this.accountService.release('USDT', p * q)
            // 增加 BTC
            this.accountService.increase('BTC', q)
        } else {
            // 卖单
        }
        // 4️⃣ 处理手续费
        this.accountService.decrease(feeAsset, Number(fee))
    }

}