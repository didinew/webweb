import crypto from 'crypto'


// 订单
interface Order {
    id: string
    symbol: string
    side: 'BUY' | 'SELL'
    price: number
    quantity: number
    status: 'NEW' | 'FILLED' | 'CANCELED' | 'PARTIALLY_FILLED'
    filledQuantity: number
    avgPrice: number
    totalAmount: number
    timestamp: number
}

// 订单薄
interface OrderBook {
    bids: Order[]
    asks: Order[]
}

// 资产账户（多资产）
interface AssetAccount {
    asset: string
    total: number
    free: number
    used: number
}

// 交易
interface Trade {
  buyOrderId: string
  sellOrderId: string
  price: number
  qty: number // 成交数量
  feeBuy: number // 购买方手续费
  feeSell: number // 出售方手续费
  timestamp: number
}

class TradingSystem {
    orderBooks: OrderBook = {
        bids: [],
        asks: [],
    }
    trades: Trade[] = []
    accounts: Map<string, AssetAccount> = new Map()
    
    constructor(initialUSDT: number) {
        this.createAccount('USDT', initialUSDT)
    }

    createAccount(asset: string, amount: number) {
    if (this.accounts.has(asset)) throw new Error(`Asset ${asset} already exists`)
    this.accounts.set(asset, { asset, total: amount, free: amount, used: 0 })
}

getAccount(asset: string): AssetAccount {
    const acc = this.accounts.get(asset)
    if (!acc) throw new Error(`Asset ${asset} not found`)
    return { ...acc }
}

freeze(asset: string, amount: number) {
    const acc = this.accounts.get(asset)
    if (!acc) throw new Error(`Asset ${asset} not found`)
    if (acc.free < amount) throw new Error('冻结金额大于未使用金额')
    acc.free -= amount
    acc.used += amount
    this.assertInvariant(acc)
}

release(asset: string, amount: number) {
    const acc = this.accounts.get(asset)
    if (!acc) throw new Error(`Asset ${asset} not found`)
    if (acc.used < amount) throw new Error('释放金额大于已用金额')
    acc.used -= amount
    acc.free += amount
    this.assertInvariant(acc)
}

increase(asset: string, amount: number) {
    const acc = this.accounts.get(asset)
    if (!acc) throw new Error(`Asset ${asset} not found`)
    acc.free += amount
    acc.total += amount
    this.assertInvariant(acc)
}

decrease(asset: string, amount: number) {
    const acc = this.accounts.get(asset)
    if (!acc) throw new Error(`Asset ${asset} not found`)
    if (acc.free < amount) throw new Error('余额不足')
    acc.free -= amount
    acc.total -= amount
    this.assertInvariant(acc)
}

private assertInvariant(acc: AssetAccount) {
    if (parseFloat((acc.free + acc.used).toFixed(8)) !== parseFloat(acc.total.toFixed(8))) {
        throw new Error(`Invariant violated: ${acc.free + acc.used} !== ${acc.total}`)
    }
}

    /** 更新订单状态和 avgPrice */
    private updateOrder(order: Order) {
        // 已成交数量为0时，订单状态为NEW
        if (order.filledQuantity === 0) order.status = 'NEW'
        else if (order.filledQuantity === order.quantity) order.status = 'FILLED'
        else order.status = 'PARTIALLY_FILLED'
       
        // 订单成交的均价
        order.avgPrice = 
            order.filledQuantity === 0 ?
                0 : parseFloat((order.totalAmount / order.filledQuantity).toFixed(8))

    }

     /** 计算手续费 */
    private calculateFee(price: number, qty: number, feeRate: number) {
        return parseFloat((price * qty * feeRate).toFixed(8))
    }

    private parseSymbol(symbol: string): { base: string; quote: string } {
        if (symbol.endsWith('USDT')) return { base: symbol.replace('USDT',''), quote: 'USDT' }
        throw new Error(`Unsupported symbol: ${symbol}`)
    }

    private settleBuy(base: string, quote: string, price: number, qty: number, fee: number) {
        const qa = this.accounts.get(quote)
        const ba = this.accounts.get(base)
        if (!qa || !ba) throw new Error('Asset not found')
        const cost = parseFloat((price * qty).toFixed(8))
        qa.used = parseFloat((qa.used - cost).toFixed(8))
        qa.total = parseFloat((qa.total - cost).toFixed(8))
        ba.free = parseFloat((ba.free + qty).toFixed(8))
        ba.total = parseFloat((ba.total + qty).toFixed(8))
        if (qa.free >= fee) {
            qa.free = parseFloat((qa.free - fee).toFixed(8))
            qa.total = parseFloat((qa.total - fee).toFixed(8))
        } else if (qa.used >= fee) {
            qa.used = parseFloat((qa.used - fee).toFixed(8))
            qa.total = parseFloat((qa.total - fee).toFixed(8))
        } else {
            throw new Error('Insufficient funds for fee (BUY)')
        }
        this.assertInvariant(qa)
        this.assertInvariant(ba)
    }

    private settleSell(base: string, quote: string, price: number, qty: number, fee: number) {
        const qa = this.accounts.get(quote)
        const ba = this.accounts.get(base)
        if (!qa || !ba) throw new Error('Asset not found')
        const proceeds = parseFloat((price * qty).toFixed(8))
        ba.used = parseFloat((ba.used - qty).toFixed(8))
        ba.total = parseFloat((ba.total - qty).toFixed(8))
        qa.free = parseFloat((qa.free + proceeds).toFixed(8))
        qa.total = parseFloat((qa.total + proceeds).toFixed(8))
        if (qa.free >= fee) {
            qa.free = parseFloat((qa.free - fee).toFixed(8))
            qa.total = parseFloat((qa.total - fee).toFixed(8))
        } else {
            throw new Error('Insufficient funds for fee (SELL)')
        }
        this.assertInvariant(qa)
        this.assertInvariant(ba)
    }
    
    /** Step 3：撮合成交 */
    //   1. 遍历对手方订单簿
    //   2. 判断价格是否匹配
    //   3. 计算成交数量 (matchedQty)
    //   4. 更新买卖双方 filledQty / totalAmount
    //   5. 更新 avgPrice = totalAmount / filledQty
    //   6. 更新订单状态
    //   7. 移除已成交的订单
    private matchOrder(order:Order) {
        const oppositeSide = order.side === 'BUY' ?  this.orderBooks.asks : this.orderBooks.bids
        let i = 0

        while( i < oppositeSide.length && order.filledQuantity < order.quantity) {
           const oppOrder = oppositeSide[i]

           // 判断价格是否合适
           // 买方的话 出的价格大于对手的价格 可购买
           // 卖方的话 出的价格小于对手的价格 可卖出
           if (order.side === 'BUY' && order.price >= oppOrder.price
            || order.side === 'SELL' && order.price <= oppOrder.price
           ) {
                // 计算剩余的数量
                const remainQt = order.quantity - order.filledQuantity
                // 匹配剩余的数量
                const matchQt = Math.min(remainQt, oppOrder.quantity - oppOrder.filledQuantity)
                // 匹配到对手的价格
                const matchPrice = oppOrder.price
                //  更新双方成交数量和金额
                order.filledQuantity += matchQt
                order.totalAmount += matchQt * matchPrice
                oppOrder.filledQuantity += matchQt
                oppOrder.totalAmount += matchQt * matchPrice

                // 更新状态和平均成交价
                this.updateOrder(order)
                this.updateOrder(oppOrder)
            
                // 计算手续费
                const feeBuy = this.calculateFee(matchPrice, matchQt, 0.001)
                const feeSell = this.calculateFee(matchPrice, matchQt, 0.001)

                // 资金结算
                const { base, quote } = this.parseSymbol(order.symbol)
                if (order.side === 'BUY') {
                    this.settleBuy(base, quote, matchPrice, matchQt, feeBuy)
                } else {
                    this.settleSell(base, quote, matchPrice, matchQt, feeSell)
                }

                // 保存成交记录
                this.trades.push({
                    buyOrderId: order.side === 'BUY' ? order.id : oppOrder.id,
                    sellOrderId: order.side === 'SELL' ? order.id : oppOrder.id,
                    price: matchPrice,
                    qty: matchQt,
                    feeBuy,
                    feeSell,
                    timestamp: Date.now(),
                })

                //  // 移除完全成交的对手订单
                if (oppOrder.filledQuantity === oppOrder.quantity) {
                    oppositeSide.splice(i, 1)
                } else {
                    i++
                }
           } else {
            break
           }
        }
    }

     /** Step 4：下单 */
    placeOrder(order: Order): Order {
        // 1️⃣ 冻结资金（BUY 冻结价格×数量；SELL 冻结数量）
        const { base, quote } = this.parseSymbol(order.symbol)
        const reserved = order.side === 'BUY' ? order.price * order.quantity : order.quantity
        const freezeAsset = order.side === 'BUY' ? quote : base
        this.freeze(freezeAsset, reserved)
        // 2️⃣ 初始化订单状态
        order.filledQuantity = 0
        order.avgPrice = 0
        order.status = 'NEW'
        order.totalAmount = 0

        // 3️⃣ 撮合
        this.matchOrder(order)
   
        // 4️⃣ 剩余未成交加入订单簿
        if(order.filledQuantity < order.quantity) {
            // 买方加入bids
            if(order.side === 'BUY') {
                this.orderBooks.bids.push(order)
                // 对asks排序
                this.orderBooks.bids.sort((a, b) => b.price - a.price)
            }
            // 卖方加入asks
            else {
                this.orderBooks.asks.push(order)
                // 对asks排序
                this.orderBooks.asks.sort((a, b) => a.price - b.price)
            }
        } else {
            const { base, quote } = this.parseSymbol(order.symbol)
            const reservedFull = order.side === 'BUY' ? order.price * order.quantity : order.quantity
            const leftover = order.side === 'BUY'
                ? Math.max(reservedFull - order.totalAmount, 0)
                : Math.max(reservedFull - order.filledQuantity, 0)
            if (leftover > 0) {
                const asset = order.side === 'BUY' ? quote : base
                this.release(asset, leftover)
            }
        }
        return order

    }

    /** Step 4：撤单 */
    cancelOrder(orderId: string): Order {
        // 1. 复制订单薄
        const books = [...this.orderBooks.bids, ...this.orderBooks.asks]
        // 2. 查找订单
        const order = books.find(order => order.id === orderId)
        if (!order) {
            throw new Error(`Order not found`)
        }
        // 3. 释放剩余的资金或者数量
        const { base, quote } = this.parseSymbol(order.symbol)
        const reservedFull = order.side === 'BUY' ? order.price * order.quantity : order.quantity
        const remain = order.side === 'BUY'
            ? Math.max(reservedFull - order.totalAmount, 0)
            : Math.max(reservedFull - order.filledQuantity, 0)
        const asset = order.side === 'BUY' ? quote : base
        this.release(asset, remain)

        // 4. 更新订单状态
        order.status = 'CANCELED'

        // 5. 移除订单薄
        // 更新订单薄
        if (order.side === 'BUY') {
             const index = this.orderBooks.bids.indexOf(order)
            if (index !== -1) {
                this.orderBooks.bids.splice(index, 1)
            }
        } else {
            const index = this.orderBooks.asks.indexOf(order)
            if (index !== -1) {
                this.orderBooks.asks.splice(index, 1)
            }
        }


        return order
    }

     /** Step 4/5：对账 */
     reconcile() : boolean {
        const ok = this.accounts?.get('USDT')?.free + this.accounts?.get('USDT')?.used === this.accounts?.get('USDT')?.total &&
        this.accounts?.get('BTC')?.free + this.accounts?.get('BTC')?.used === this.accounts?.get('BTC')?.total
        if (!ok) throw new Error('对账异常：free + used !== total')
        return true
     }
}

export default TradingSystem
