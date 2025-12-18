# 学习web3 
## 学习路径目标

- 理解中心化交易所（CEX）原理与接口使用
- 掌握去中心化应用（DApp）开发：钱包、合约交互、交易生命周期
- 独立完成一个可上线 DApp 或 DeFi/NFT 项目

## [第一阶段：区块链基础 + CEX 基础（1 周）](./1.md)

### ### ### ### ### 学习目标
	•	了解区块链基础概念：公链 / 私钥 / 钱包 / 交易 / Gas
	•	理解中心化交易所（CEX）工作原理
	•	学会使用 CEX API 查询行情、下单

### ### ### ### 技术 / 工具
	•	Python / Node.js
	•	Binance / OKX / Huobi API
	•	Postman 或 curl 调试接口

### ### ### ### ### 实战任务
	1.	通过 CEX API 获取币种行情
	2.	模拟账户获取余额
	3.	模拟下单（测试环境 / 测试网）

### 输出成果
	•	Python/Node 脚本能查询 CEX 余额、行情
	•	能发起测试下单

⸻

## 第二阶段：Web3 & 钱包基础（1 周）

学习目标
	•	了解 Web3 基础：钱包、签名、Provider / Signer
	•	理解 ETH / BSC / Polygon 等公链
	•	能用 Web3 读取账户信息和余额

技术 / 工具
	•	React 或 Vue + ethers.js / web3.js
	•	MetaMask / WalletConnect

实战任务
	1.	前端连接钱包
	2.	显示账户地址、余额
	3.	显示当前链信息

### 输出成果
	•	钱包连接组件
	•	显示链上账户余额和链信息

⸻

## 第三阶段：合约交互 + DApp 核心（1-2 周）

学习目标
	•	学会读写智能合约（ERC20 / ERC721）
	•	理解交易生命周期（Pending → Success → Fail）
	•	学会监听链上事件

技术 / 工具
	•	React / Vue + wagmi / viem / ethers.js
	•	Solidity 合约基础（可用现成 ERC20/ERC721）
	•	测试网（Sepolia / Mumbai）

实战任务
	1.	读取合约数据（Token 名称、余额）
	2.	发起交易（transfer / mint）
	3.	监听事件更新前端 UI

### 输出成果
	•	DApp 可读合约数据并发交易
	•	页面显示交易状态

⸻

## 第四阶段：DApp 高级工程化（1 周）

学习目标
	•	封装 Hook / Store 管理钱包、合约状态
	•	多链支持与错误处理
	•	UI/UX 优化（Loading / Toast / 错误提示）

实战任务
	1.	封装 useWallet / useContract
	2.	支持多链切换
	3.	封装交易状态提示组件

### 输出成果
	•	工程化 DApp 框架
	•	可复用 Wallet + Contract Hook

⸻

## 第五阶段：完整 DApp 项目（1-2 周）

学习目标
	•	完成 NFT / DeFi / Swap DApp
	•	支持链上读写、事件监听
	•	可上线部署

实战任务
	•	NFT Mint DApp：查看我的 NFT / Mint / 列表展示
	•	DeFi Staking DApp：质押 / 收益计算 / 提现
	•	可部署到 Vercel / Netlify

### 输出成果
	•	可访问 Web3 DApp
	•	可展示 NFT 或 DeFi 功能
	•	项目可写入简历

⸻

## 拓展方向：CEX + DEX 结合

学习完 DApp 和 CEX 后，可以做 CEX + DEX 结合的策略：
	•	使用 CEX API 自动套利
	•	将 DApp 交易数据与 CEX 订单同步
	•	做一个前端监控交易系统

| 阶段 | 内容 | 周数 | 输出成果 |
| --- | --- | --- | --- |
| 1 | 区块链 + CEX API | 1 | 查询余额、行情，模拟下单 |
| 2 | Web3 钱包基础 | 1 | 钱包连接组件，显示地址/余额 |
| 3 | 合约交互 | 1-2 | DApp 可读写合约，发交易，监听事件 |
| 4 | DApp 工程化 | 1 | 封装 Hook/Store，多链支持，UX 完善 |
| 5 | 完整项目实战 | 1-2 | NFT / DeFi DApp，可部署上线 |
