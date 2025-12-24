import crypto from 'crypto'
export class OderService {
    constructor(accountService) {
        this.accountService = accountService
        this.orders = new Map()
    }
    // 创建订单
    // symbol 标识 side BUY|SELL price quantity
    createOder({symbol, side, price, quantity}) {
        // 参数校验
        if (price < 0 || quantity < 0) throw new Error('Invalid price or quantity')
        const orderId = crypto.randomUUID()

        // 需要冻结的金额
        const freezeAmount =
            side === 'BUY' ?
                price * quantity // 买订单需要冻结的金额 = 价格 * 数量
                : quantity // 卖订单需要冻结的金额 = 数量
        
        // 冻结金额
        const asset = side === 'BUY' ? 'USDT' : symbol.replace('USDT', '')
        this.accountService.freeze(asset, freezeAmount)

        // 创建订单
        const order = {
            orderId,
            symbol,
            side,
            price,
            quantity,
            status: 'NEW',
            freezeAmount,
            filledQuantity: 0,
            avgPrice: 0,
            createTime: Date.now(),
        }
        this.orders.set(orderId, order)
        return {...order}
    }
    
    // 取消订单
    cancelOrder(orderId) {
        const order = this.orders.get(orderId)
        if (!order) throw new Error('Order not found')
        if (order.status !== 'NEW') throw new Error('Order status is not NEW')
        
        // 解冻订单
        const asset = order.side === 'BUY' ? 'USDT' : order.symbol.replace('USDT', '')
        this.accountService.release(asset, order.freezeAmount)

        // 订单状态修改
        order.status = 'CANCELED'
        return {...order}
    }

    getOrder(orderId) {
        const order = this.orders.get(orderId)
        if (!order) throw new Error('Order not found')
        return {...order}
    }
}