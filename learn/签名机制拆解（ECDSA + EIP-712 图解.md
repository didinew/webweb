# ECDSA 与 EIP-712 签名机制

## 1. ECDSA 基础
- 椭圆曲线数字签名算法，保证消息完整性与来源真实性
- 角色：私钥（签名）、公钥（验签）、消息（待签数据）

**签名流程**
- h = keccak256(m)
- signature = ECDSA_sign(h, sk) → (r, s, v)
- 验证：recover(signature, h) == publicKey

**要点**
- 签名证明的是“消息哈希”，私钥不泄露
- 验签只需签名 + 原消息即可判断来源

## 2. EIP-712 结构化签名
- 结构化数据签名，提升语义可读性与安全性
- 典型场景：授权、交易确认、DeFi permit

**Domain 示例**
```json
{
  "name": "MyDApp",
  "version": "1",
  "chainId": 1,
  "verifyingContract": "0xContract"
}
```

**TypedData 示例**
```txt
Transfer {
  from: address,
  to: address,
  amount: uint256
}
```

**Digest 计算**
```txt
structHash = keccak256(encode(Transfer, data))
domainSeparator = keccak256(encode(Domain, domain))
digest = keccak256("\x19\x01" || domainSeparator || structHash)
```

**签名**
- signature = ECDSA_sign(digest, sk)

## 3. 对比

| 特性     | ECDSA 普通签名 | EIP-712 签名 |
|----------|-----------------|--------------|
| 数据类型 | 字符串/哈希     | 结构化数据   |
| 可读性   | 低              | 高           |
| 防重放   | 需额外处理      | 内置域分隔   |
| 安全性   | 高              | 高           |
| 场景     | 登录/钱包验证   | 授权/交易确认 |

## 4. 完整流程
- 构造消息（字符串或结构化数据）
- 计算 digest（普通：hash；EIP-712：domain+struct）
- 私钥签名 (ECDSA)
- 发送签名 + 原数据
- DApp/合约验签与执行

