import { Wallet } from 'ethers'

// 创建随机钱包
// const wallet = Wallet.createRandom()

// console.log('address:', wallet.address)
// console.log('privateKey:', wallet.privateKey)
// console.log('mnemonic:', wallet.mnemonic.phrase)

import { HDNodeWallet } from 'ethers'

const mnemonic = 'test test test test test test test test test test test junk'

const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, 'm')

console.log(wallet.address)
console.log(wallet.path)

for (let i = 0; i < 3; i++) {
  const child = wallet.derivePath(`m/44'/60'/0'/0/${i}`)
  console.log(i, child.address)
}