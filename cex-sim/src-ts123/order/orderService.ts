import crypto from 'crypto'
import type { AccountService } from '../account/accountService'

export type OrderSide = 'BUY' | 'SELL'
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED'

export type Order = {
    orderId: string,
    symbol: string,
    side: OrderSide,
    price: number,
    quantity: number,
    status: OrderStatus,
    freezeAmount: number,
    filledQuantity: number,
    avgPrice: number,
    createTime: number,
}

export class OrderService {
    private accountService: AccountService
    private orders: Map<string, Order> = new Map()
    constructor(accountService: AccountService) {
        this.accountService = accountService
        this.orders = new Map()
    }
    // 创建订单
    // symbol 标识 side BUY|SELL price quantity
    createOrder({symbol, side, price, quantity}: {symbol: string, side: OrderSide, price: number, quantity: number}) {
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
        const orderStatus: OrderStatus = 'NEW'
        const order = {
            orderId,
            symbol,
            side,
            price,
            quantity,
            status: orderStatus,
            freezeAmount,
            filledQuantity: 0,
            avgPrice: 0,
            createTime: Date.now(),
        }
        this.orders.set(orderId, order)
        return {...order}
    }
    
    // 取消订单
    cancelOrder(orderId: string) {
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

    getOrder(orderId: string) {
        const order = this.orders.get(orderId)
        if (!order) throw new Error('Order not found')
        return order
    }
}