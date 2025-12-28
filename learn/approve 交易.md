
⸻

approve 交易是什么意思？

一句话定义：
approve 是 你在链上明确授权某个合约，可以动用你多少 ERC20 代币。

⸻

一、为什么需要 approve？（根本原因）

ERC20 的一个铁律

合约不能随便动你的 Token

即使：
	•	Token 在你地址下
	•	合约逻辑是“帮你换币”

也不行，除非你提前授权。

⸻

二、没有 approve 会发生什么？

假设你在 Uniswap 换 USDT → ETH：

Uniswap 合约：帮我拿 100 USDT 去换 ETH

链上的回答是：

❌ 抱歉，你没授权我动你的 USDT

⸻

三、approve 到底干了什么？（链上视角）

approve 是一笔 交易

USDT.approve(uniswapRouter, 1000)

执行后，链上状态变成：

allowance[user][uniswapRouter] = 1000

👉 只是写了一行“授权额度”

⸻

四、approve ≠ 转账（90%的人混了）

操作
是否转币
是否改余额
approve
❌
❌
transfer
✅
✅
transferFrom
✅
✅


👉 approve 只授权，不动钱

⸻

五、真正转你币的是谁？

是合约调用：
transferFrom(user, to, amount)

前提是：
allowance[user][contract] >= amount


⸻

六、approve 的完整流程图（非常重要）

你
│
│ ① approve（授权）
▼
Token 合约
│
│ allowance[user][Uniswap] = 1000
│
▼
Uniswap 合约
│
│ ② swap → transferFrom
▼
Token 合约
│
│ 扣你 100 USDT


⸻

七、为什么很多 DApp 让你 approve 无限额度？⚠️
approve(router, MaxUint256)

原因（对开发者友好）
	•	不用每次都 approve
	•	少一次交易
	•	少一次 gas

风险（对用户不友好）
	•	合约 随时可以把你 Token 转光
	•	合约被升级 / 被黑 → 全部资产风险

⸻

八、真实攻击场景（你必须知道）

无限 approve + 恶意合约 = 直接被掏空

你 → approve(∞)
      ↓
合约升级 / 被劫持
      ↓
transferFrom(全部)
👉 钱包不会再弹窗
👉 你也不会再确认

⸻

九、为什么 Permit 出现了？（顺理成章）

approve 的两个问题
	1.	需要一笔链上交易（花 gas）
	2.	容易给无限授权


⸻

Permit 的解决方案
approve（上链） ❌
permit（签名） ✅

	•	本地签名
	•	有 nonce
	•	有 deadline
	•	可控、一次性

⸻

十、工程 & 面试标准回答（直接背）

Q：approve 是什么意思？

标准回答：

approve 是 ERC20 里的授权操作，
用来允许某个合约在指定额度内，
通过 transferFrom 操作我的代币，
它本身不转币，只修改授权额度。

⸻

Q：为什么 approve 有安全风险？

标准回答：

因为授权是长期有效的，
一旦合约被攻击或升级，
就可能在无需用户确认的情况下转走资产。

⸻

十一、你现在必须形成的正确心智模型
	•	approve = 给钥匙
	•	transferFrom = 开门拿钱
	•	无限 approve = 把钥匙永久交出去

⸻

十二、实战建议（非常重要）

用户侧
	•	定期 revoke 授权
	•	不给无限额度

开发侧
	•	支持 Permit
	•	默认最小授权
	•	明确提示授权内容





