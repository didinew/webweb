import { AccountService } from './account/accountService.js'

const accountService = new AccountService()

accountService.createAccount('USDT', 1000000)

// 查询usdt
const usdtAccount = accountService.getAccount('USDT')
console.log(usdtAccount)

// 冻结金额
const frozen = accountService.freeze('USDT', 800)
console.log(accountService.getAccount('USDT'))

// 解冻
const release = accountService.release('USDT', 500)
console.log(accountService.getAccount('USDT'))
