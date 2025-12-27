import { Wallet, verifyMessage, verifyTypedData } from 'ethers'

const wallet = Wallet.createRandom()
// const message = 'Login at 2025-01-01'

// // 签名消息
// const sig = await wallet.signMessage(message)
// const recovered = verifyMessage(message, sig)

// console.log(recovered === wallet.address) // true

console.log(wallet.address)
// domain
const domain = {
    name: 'My App',
    version: '1.0.0',
    chainId: 1,
    verifyingContract: wallet.address,
}

// types 
const types = {
    Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ],
}

// 签
const spender = Wallet.createRandom().address
const message = {
  owner: wallet.address,
  spender: spender,
  value: 1000n,
  nonce: 1n,
  deadline: 9999999999n
}

const sig = await wallet.signTypedData(domain, types, message)

console.log('EIP-712 signature:', sig)
const recovered = verifyTypedData(domain, types, message, sig)
console.log('recovered === wallet.address:', recovered === wallet.address)

// message 签名/验签示例
// const msg = 'Login at 2025-01-01'
// const sigMsg = await wallet.signMessage(msg)
// const recoveredMsg = verifyMessage(msg, sigMsg)
// console.log('message recovered === wallet.address:', recoveredMsg === wallet.address)
