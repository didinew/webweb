import ccxt from 'ccxt'

const exchange = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
})

exchange.setSandboxMode(true)

