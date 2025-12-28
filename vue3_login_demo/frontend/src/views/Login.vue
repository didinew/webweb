<template>
  <div class="h-screen flex items-center justify-center bg-gray-900 text-white">
    <div class="bg-gray-800 p-6 rounded-xl w-96 text-center">
      <button @click="login" class="bg-blue-500 px-4 py-2 rounded">Web3 Login</button>
      <p v-if="user.address" class="mt-4 break-all">{{ user.address }}</p>
      <p v-if="error" class="mt-2 text-red-400 break-all">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ethers } from 'ethers'
import { useUserStore } from '../stores/user'

const user = useUserStore()
const error = ref('')

async function login() {
  error.value = ''
  try {
    // 正式的DApp 登录流程
    // 1. 必须安装metaMask, 
    if (!window.ethereum) {
      error.value = '请安装并启用 MetaMask 或其他 Web3 钱包，用于安全地验证你的身份。安装完成后刷新页面即可。'
      return
    }
    // 2. 请求用户授权
    // - 将浏览器注入的 EIP‑1193 提供者（钱包扩展）包装为 ethers 的 Provider
    const provider = new ethers.BrowserProvider(window.ethereum)
    // - 发起 eth_requestAccounts 请求，触发 MetaMask 弹窗，要求用户授权连接 DApp
    // 弹出钱包授权对话框，用户同意后返回可用账户列表
    await provider.send('eth_requestAccounts', [])
    // - 获取用户签名后的地址
    // 通过 Provider 获取 signer （当前选中的账户签名器），它能代表该账户发起签名操作
    const signer = await provider.getSigner()
    // 读取当前账户地址，用于后端关联 nonce 与生成登录态
    const address = await signer.getAddress()

    // 3. 与后端交互
    // - 向后端请求 nonce（随机数），绑定用户地址
    // 从后端获取当前账户对应的 nonce 值，用于后续签名验证
    // - 获取一次性随机串（登录挑战），用于后续签名
    const nonceRes = await fetch(`http://localhost:3000/nonce?address=${address}`)
    // 校验响应是否成功（HTTP 200）；失败则抛错，交由 catch 处理
    if (!nonceRes.ok) throw new Error('获取 nonce 失败')
    // 解析 JSON，并取出 nonce 字段（本次登录的待签名消息）
    const { nonce } = await nonceRes.json()
    // - 使用用户签名后的地址和 nonce 登录后端
    const signature = await signer.signMessage(nonce)
    // 向后端 POST /login 提交地址与签名，后端会用 verifyMessage(nonce, signature) 验证签名归属地址
    const loginRes = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature })
    })
    // 校验登录响应是否成功；失败抛错
    if (!loginRes.ok) throw new Error('登录失败')
    // - 后端验证签名，成功后返回 JWT 令牌
   // - 前端将令牌存储在 localStorage 中，后续请求通过 Authorization 头发送
   // 解析登录响应 JSON，获取后端签发的 token （JWT）
    const { token } = await loginRes.json()
    // 通过 Pinia 的 user.login(address, token) 记录登录态（地址与 token），供全局使用
    user.login(address, token)
  } catch (e) {
    // 捕获任意步骤的异常，将错误信息展示到页面（ error 响应式变量）
    error.value = e?.message || String(e)
  }
}
</script>