import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers'
import dotenv from 'dotenv'
import { SiweMessage } from 'siwe'
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'


app.get('/siwe/nonce', (req, res) => {
  const nonce = crypto.randomUUID()
  res.json({ nonce })
})

app.post('/siwe/login', async (req, res) => {
  const { message, signature } = req.body
  const siwe = new SiweMessage(message)
  const fields = await siwe.verify({ signature })

  const token = jwt.sign({ address: fields.address }, JWT_SECRET)
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