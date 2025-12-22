export class AccountService {
    // 构造一个新的对象
    constructor () {
        // 内存账户（后面可换 DB）
        this.accounts = new Map()
    }

    // 创建用户
    createAccount(asset, amount) {
        if (this.accounts.has(asset)) {
            throw new Error(`Asset ${asset} already exists`)
        }
        this.accounts.set(asset, {
            asset,
            free: amount,
            used: 0,
            total: amount
        })
    }

    // 获取账户
    getAccount(asset) {
        const account = this.accounts.get(asset)
        if (!account) {
            throw new Error(`Account not found`)
        }
        
        return {...account}
    }
    
    //  冻结资金
    freeze(asset, amount) {
        const acc = this.accounts.get(asset)
        if (!acc) {
            throw new Error(`Asset ${asset} not found`)
        }

        if (acc.free < amount) {
            throw new Error(`Insufficient fee`)
        }

        acc.free -= amount
        acc.used += amount

        this._assertInvariant(acc)
    }

    // 释放金额
    release(asset, amount) {
        const acc = this.accounts.get(asset)
        if (!acc) {
            throw new Error(`Asset ${asset} not found`)
        }

        if (acc.used < amount) {
            throw new Error(`Insufficient used`)
        }

        acc.free += amount
        acc.used -= amount

        this._assertInvariant(acc)
    }

    // 增加资金
    increase(asset, amount) {
        const acc = this.accounts.get(asset)
        if (!acc) {
            throw new Error(`Asset ${asset} not found`)
        }

        acc.free += amount
        acc.total += amount

        this._assertInvariant(acc)
    }

    // 内部验证
    _assertInvariant(acc) {
        if (acc.free + acc.used !== acc.total) {
            throw new Error(`Invariant violated: ${acc.free + acc.used} !== ${acc.total}`)
        }
    }
}