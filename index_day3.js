// Day 3：账户接口（只用测试环境）
	// •	CEX 余额 ≠ 链上余额
	// •	是数据库余额
import ccxt from 'ccxt'
import 'dotenv/config'

const exchange = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
})

// ⭐ 开启测试环境
exchange.setSandboxMode(true)

const balance = await exchange.fetchBalance()
console.log('USDT-free:', balance.free.USDT)
console.log('USDT-used:', balance.used.USDT)
console.log('USDT-total:', balance.total.USDT)
console.log('BTC:', balance.free.BTC)
