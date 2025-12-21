// Day 2：Node.js 调用 CEX 行情接口
import ccxt from 'ccxt';


const exchange = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
})

// ⭐ 开启测试环境 一定要开启 否则默认是真实环境
exchange.setSandboxMode(true)

// 获取 BTC 行情
const ticker = await exchange.fetchTicker('BTC/USDT')
console.log(ticker)

/****
{
  symbol: 'BTC/USDT', // 交易对
  timestamp: 1765985867013, // 时间戳
  datetime: '2025-12-17T15:37:47.013Z', // 时间
  high: 90365.85, // 最高价
  low: 86209.11, // 最低价
  bid: 89520, // 买价
  bidVolume: 0.39211, // 买量
  ask: 89520.01, // 卖价
  askVolume: 1.21026, // 卖量
  vwap: 87821.43880557, // vwap
  open: 87124.37, // 开盘价
  close: 89520.01, // 收盘价
  last: 89520.01, // 最新价
  previousClose: 87124.37, // 昨收盘价
  change: 2395.64, // 涨跌额
  percentage: 2.75, // 涨跌率
  average: 88322.19, // 平均价
  baseVolume: 17136.60286, // 基础成交量
  quoteVolume: 1504961119.404815, // 报价成交量
  markPrice: undefined, // 标记价格
  indexPrice: undefined, // 索引价格
  info: {
    symbol: 'BTCUSDT', // 交易对
    priceChange: '2395.64000000', // 价格变化
    priceChangePercent: '2.750', // 价格变化率
    weightedAvgPrice: '87821.43880557', // 加权平均价格
    prevClosePrice: '87124.37000000', // 昨收价格
    lastPrice: '89520.01000000', // 最新价格
    lastQty: '0.02133000', // 最新量
    bidPrice: '89520.00000000', // 买价
    bidQty: '0.39211000', // 买量
    askPrice: '89520.01000000', // 卖价
    askQty: '1.21026000', // 卖量
    openPrice: '87124.37000000', // 开盘价
    highPrice: '90365.85000000', // 最高价
    lowPrice: '86209.11000000', // 最低价
    volume: '17136.60286000', // 成交量
    quoteVolume: '1504961119.40481500', // 报价成交量
    openTime: '1765899467013', // 开盘时间
    closeTime: '1765985867013', // 收盘时间
    firstId: '5666766841', // 第一个订单ID
    lastId: '5672172822', // 最后一个订单ID
    count: '5405982' // 订单数量
  }
}

 */