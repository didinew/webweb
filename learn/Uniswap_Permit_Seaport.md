一句话先区分（先立认知）

名词
本质
解决什么问题
Uniswap
去中心化交易所（DEX）
怎么换币
Permit
授权签名机制（EIP-2612）
怎么免 approve 上链
Seaport
NFT 交易协议（OpenSea 核心）
怎么撮合 NFT 交易

👉 关系不是“并列产品”，而是：

Uniswap / Seaport 是「应用 & 协议」
Permit 是「底层授权能力」

⸻

一、Uniswap 是什么？（DEX 的代名词）

本质

自动做市商（AMM）去中心化交易所

你不是在跟人交易，而是在跟 合约里的资金池 交易。

⸻

Uniswap 解决了什么？
	•	不需要订单簿
	•	不需要撮合引擎
	•	不需要中心化托管

你 ↔ Uniswap 合约 ↔ 流动性池


⸻

核心模型（面试必会）

AMM 公式（v2）
x * y = k

Uniswap v3
	•	集中流动性
	•	NFT 形式的 LP
	•	更高资金效率

⸻

和钱包 / 签名的关系

在 Uniswap 里你通常需要：
	1.	approve(token)
	2.	swap()

👉 问题：
approve 要单独发一笔交易（费 gas）

⸻

二、Permit 是什么？（重点 ⚠️）

本质

用“签名”代替“approve 交易”

Permit ≠ 应用
Permit = ERC20 扩展授权能力

⸻

没有 Permit 的世界（传统）

① approve（上链，花 gas）
② swap（再上链，花 gas）

两次交互
两次 gas
一次风险暴露

⸻

有 Permit 的世界（现代 DeFi）

① 本地签名（不花 gas）
② swap + permit 一次上链


⸻

Permit 基于什么？
	•	EIP-2612
	•	EIP-712 结构化签名

签名内容：
owner
spender
value
nonce
deadline

为什么 Permit 很重要？（工程视角）

安全
	•	有 nonce
	•	有 deadline
	•	防重放

体验
	•	少一次弹钱包
	•	少一次 gas

⸻

面试标准回答

Permit 通过 EIP-712 结构化签名，
允许用户在不发送 approve 交易的情况下完成授权，
常用于 Uniswap、Aave 等 DeFi 协议以提升体验和安全性。

三、Seaport 是什么？（NFT 世界的 Uniswap）

本质

NFT 交易撮合协议

由 OpenSea 推出，用来：
	•	买卖 NFT
	•	支持复杂订单
	•	支持多资产交换

⸻

Seaport 解决了什么？

传统 NFT 交易的问题：
	•	只能「1 NFT ↔ 1 Token」
	•	手续费高
	•	订单灵活性差

⸻

Seaport 的能力

能力
说明
多资产
NFT ↔ NFT ↔ ERC20
批量
一次成交多个 NFT
离线签名
挂单不花 gas
部分成交
高级撮合

⸻

Seaport 的核心机制

1️⃣ 卖家先做什么？
签名一个订单（EIP-712）

2️⃣ 买家做什么？

提交订单 + 资产

3️⃣ Seaport 合约？

验签 → 转资产 → 成交

👉 挂单不花 gas，成交才花 gas

⸻

四、三者放在同一张图里（非常重要）

           ┌──────── Permit (能力) ────────┐
           │  用签名做授权                  │
           │  不上链 approve               │
           └──────────┬───────────────────┘
                      │
        ┌─────────────▼─────────────┐
        │        Uniswap             │
        │   ERC20 Token Swap         │
        └───────────────────────────┘

        ┌───────────────────────────┐
        │          Seaport           │
        │   NFT / 多资产撮合         │
        └───────────────────────────┘

    
👉 Permit 是“通用能力”
👉 Uniswap / Seaport 是“具体协议”

⸻

五、面试官最爱追问（直接给你答案）

Q1：Uniswap 和 Seaport 的核心差别？

答：

Uniswap 解决的是 ERC20 的自动化交易问题，
Seaport 解决的是 NFT 和多资产的复杂撮合问题，
二者都大量依赖 EIP-712 签名体系。

⸻

Q2：为什么 Seaport 不需要一直 approve？

答：

因为 Seaport 使用签名订单模型，
用户只需离线签名，
合约在成交时统一验签和转移资产。

⸻

Q3：Permit 和 approve 的本质差别？

答：

approve 是链上状态修改，
Permit 是链下签名授权，
前者耗 gas、后者不耗 gas。

⸻

六、你现在的「正确心智模型」
	•	Uniswap：换币机器
	•	Permit：授权加速器
	•	Seaport：NFT 撮合引擎

