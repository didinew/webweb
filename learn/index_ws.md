功能概览

- 连接 Binance 测试网 USER_STREAM，实时监听账户与订单事件
- 自动创建与续期 listenKey ，心跳维持会话并在过期时自愈重连
- 演示一次带签名的现货下单（市价，按报价币金额 quoteOrderQty ）
- 完整的 WS 事件处理与日志输出，涵盖订单执行、余额变更与账户持仓更新



计算过程

- 请求金额
  - origQuoteOrderQty = 50.00000000 （按报价币 USDT 下单）
- 盘口价格
  - 最佳卖价 ask = 88125.83000000 （由撮合时实际成交的 fills[0].price 反推）
- 先算未对齐的基础币数量
  - q0 = 50 / 88125.83 ≈ 0.0005670
- 数量对齐（按 BTCUSDT 的 LOT_SIZE.stepSize 向下取整）
  - 若 stepSize = 0.00001000 ，则 qty = floor(q0 / 0.00001) * 0.00001 = 0.00056000
  - 所以 origQty = executedQty = 0.00056000 （一次性完全成交）
- 成交金额（报价币累计）
  - cummulativeQuoteQty = Σ(price_i × qty_i) = 88125.83 × 0.00056000 = 49.35046480
- 成交均价（VWAP）
  - avgPrice = cummulativeQuoteQty / executedQty = 49.35046480 / 0.00056000 = 88125.83
- 顶层 price: '0.00000000'
  - 市价单的顶层 price 通常显示为 0；实际成交价在 fills 中体现
- 手续费
  - fills[0].commission = '0.00000000' （测试网常为 0；实盘会是非零，资产可能是 BNB/USDT/BTC ）
为什么没有花满 50 USDT

- 由于“数量按 stepSize 向下对齐”， qty 比理想值略小，导致实际花费 49.35046480 USDT < 50 USDT ；“剩余几毛钱”不会消费，体现在 origQuoteOrderQty 与 cummulativeQuoteQty 的差额
多档成交时的公式

- executedQty = Σ qty_i
- cummulativeQuoteQty = Σ (price_i × qty_i)
- avgPrice = cummulativeQuoteQty / executedQty
- fee_total[asset] = Σ commission_i where commissionAsset_i = asset
验证建议

- 通过 exchangeInfo().symbols['BTCUSDT'].filters 查看 LOT_SIZE.stepSize 与 MIN_NOTIONAL
- 复算 floor((quoteOrderQty / ask) / stepSize) * stepSize ，应得到 0.00056000
- 用 fills 的 price × qty 求和，应与 cummulativeQuoteQty 精确匹配