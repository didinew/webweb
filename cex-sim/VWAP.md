
---

## VWAP 是什么？（一句话）

- VWAP = Volume Weighted Average Price
- 成交量加权平均价
- 不是平均“价格”，而是按“成交量”加权的平均成本

## 最重要的公式

VWAP = (Σ 成交价 × 成交量) / Σ 成交量

## 为什么不能用“普通平均价”？

- 错误示例：成交 1 BTC @ 90；成交 9 BTC @ 110
- 普通平均价： (90 + 110) / 2 = 100
- VWAP： (1×90 + 9×110) / 10 = 108

> 差 8 USDT / BTC，在真实交易中这是致命错误

## VWAP 的用途

- 账户真实成本价：账户 BTC 的买入成本 = VWAP
- 盈亏（PnL）计算：未实现盈亏 = (最新价 - VWAP) × 持仓量
- 风控 / 强平：保证金率 = (资产价值 - 成本) / 成本

> VWAP 错 → 强平全错

⸻

## Step 3 中的 VWAP 计算

```js
const totalCostBefore = order.avgPrice * order.filledQuantity
const totalCostAfter = totalCostBefore + price * quantity

order.filledQuantity += quantity
order.avgPrice = totalCostAfter / order.filledQuantity
```

> 这段代码就是 VWAP 的工程实现，且为正确写法

## 增量计算原则

- 错误：`order.avgPrice = (order.avgPrice + price) / 2`
- 正确：`avg = (历史总成本 + 本次成交成本) / 总成交量`

## VWAP 层级对比

| 层级 | 定义 |
| --- | --- |
| 单个订单 | 订单的成交均价 |
| 多订单 | 账户持仓的加权成本 |
| 整个市场 | 市场 VWAP（指标） |


## 为什么 VWAP 是“炸钱高发点”？

- 多次成交
- 不同价格
- 不同数量
- 撤单 + 再下单
- WS 重放

> 只要有一步算错，钱就开始“慢慢不对”。不会立刻炸，而是越跑越偏

⸻

八、你必须能手算的 1 道题（自检）

买入 BTC：
1 BTC @ 100
2 BTC @ 110
1 BTC @ 90


VWAP（成交量加权平均价）计算公式：

VWAP = ∑(价格 × 数量) / ∑数量

⸻

你的买入记录

| 数量(BTC) | 价格 |
| --- | --- |
| 1 | 100 |
| 2 | 110 |
| 1 | 90 |


计算过程

总成交金额：
	•	1 × 100 = 100
	•	2 × 110 = 220
	•	1 × 90 = 90

👉 合计 = 410

总成交数量：
	•	1 + 2 + 1 = 4 BTC

⸻

✅ VWAP

VWAP = 410 / 4 = 102.5

⸻

结论

你的 BTC 持仓 VWAP = 102.5




请你算：
	•	总成交量？
	•	VWAP？
	•	总成本？

（你可以回我答案，我帮你核）

⸻

🧠 一句话总结（请记住）

VWAP 是交易系统的“数学脊椎”
算错一次，系统终身驼背

⸻

如果你愿意，我可以下一步带你：
	•	👉 VWAP + 手续费后的真实成本
	•	👉 VWAP 在部分卖出后的更新
	•	👉 VWAP vs FIFO / LIFO
	•	👉 把 VWAP 抽成一个独立可测试模块

