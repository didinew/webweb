import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const nonceStore = new Map()

app.get('/nonce', (req, res) => {
  const { address } = req.query
  if (!address) return res.status(400).end()
  const nonce = `Login nonce: ${Date.now()}`
  nonceStore.set(address.toLowerCase(), nonce)
  res.json({ nonce })
})

app.post('/login', (req, res) => {
  const { address, signature } = req.body
  const nonce = nonceStore.get(address.toLowerCase())
  if (!nonce) return res.status(401).end()

  const recovered = ethers.verifyMessage(nonce, signature)
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  nonceStore.delete(address.toLowerCase())
  const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: '1d' })
  res.json({ token })
})

app.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).end()
  try {
    const user = jwt.verify(token, JWT_SECRET)
    res.json({ address: user.address })
  } catch {
    res.status(401).end()
  }
})

app.listen(3000, () => console.log('Backend http://localhost:3000'))