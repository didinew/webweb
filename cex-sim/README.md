## Day 7：阶段实战项目（CEX 模拟交易系统）

🎯 项目目标（一句话）

用 Node.js 写一个「安全的 CEX 模拟交易账户系统」
支持下单、成交、冻结、手续费、幂等、异常恢复

---

## 最小可上线系统

### 今天不做的事
- UI
- 策略
- 高频
- 性能优化

### 今天必须做到
- 钱算得清
- 状态不乱
- 重启不炸

⸻

## 系统整体架构

```
┌────────────┐
│ REST 下单  │
└─────┬──────┘
      ↓
┌────────────┐
│ 风控 / 冻结 │
└─────┬──────┘
      ↓
┌────────────┐
│ CEX / 模拟撮合 │
└─────┬──────┘
      ↓
┌────────────┐
│ USER_STREAM │  ← 成交 / 余额事件
└─────┬──────┘
      ↓
┌────────────┐
│ 幂等处理 / 对账 │
└────────────┘
```


⸻

三、项目功能拆解（严格按这个来）

## 账户模块（Account）

### 数据结构

```js
Account {
  asset: 'USDT',
  free: 1000,
  used: 0,
  total: 1000
}
```

### 核心规则
- free + used = total（永远成立）


⸻

## 下单 & 冻结模块（Risk Control）

### 下单流程
- 请求下单
- 校验 free 是否充足
- 冻结资金（free ↓ used ↑）
- 生成 orderId

### 需要实现的方法
- `freezeBalance(asset, amount)`
- `releaseBalance(asset, amount)`


⸻

## 订单模块（Order）

### 状态机（必须严格）
- NEW
- PARTIALLY_FILLED
- FILLED
- CANCELED

> 禁止状态跳跃


⸻

## 成交模块（Trade）

### 成交流水结构
```js
Trade {
  tradeId,   // 唯一
  orderId,
  price,
  amount,
  fee,
  feeAsset
}
```

> tradeId 是幂等生命线

⸻

## USER_STREAM 监听（事件驱动）

### 必须处理的事件
- executionReport（订单）
- trade（成交）
- balanceUpdate（余额）

### 幂等处理模板
```js
if (!processedTradeIds.has(tradeId)) {
  applyTrade(trade)
  processedTradeIds.add(tradeId)
}
```


⸻

⑥ 手续费结算（Day 5 落地）

买单
成交 BTC ↓ 手续费

卖单
USDT ↓ 手续费


⸻

⑦ 异常恢复（这是分水岭）

系统启动必须做：

1️⃣ 拉账户余额（REST）
2️⃣ 拉未完成订单
3️⃣ 拉历史成交
4️⃣ 重建本地状态
5️⃣ 再启动 USER_STREAM

📌 WS 永远不是唯一真相

四、你今天的「验收标准」（非常重要）

你要能做到这 5 点：

✅ 同一个成交事件来 2 次，余额不变
✅ WS 断线 → 重连 → 余额正确
✅ 部分成交后撤单，冻结资金正确释放
✅ 成交价 = VWAP
✅ free + used 永远等于 total

## 项目目录建议（可直接使用）
```
src/
├─ account/
│  └─ accountService.js
├─ order/
│  └─ orderService.js
├─ trade/
│  └─ tradeService.js
├─ risk/
│  └─ freezeService.js
├─ stream/
│  └─ userStream.js
├─ reconcile/
│  └─ reconcileService.js
└─ app.js
```


⸻

六、如果你完成了这个项目，意味着什么？

你已经能：
	•	✅ 读懂交易所账户逻辑
	•	✅ 写不炸钱的交易系统
	•	✅ 做量化 / CEX 后端 / Web3 工程
	•	✅ 面试讲清「冻结 / 幂等 / 对账」

👉 这是 Web3 / 交易系统真正的“入门完成线”