import 'dotenv/config'
import crypto from 'node:crypto'

const merchantCode = process.env.NUXT_DUIDKU_MERCHANT_CODE
const apiKey = process.env.NUXT_DUIDKU_API_KEY

const amount = 50000
const datetime = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14) // yyyyMMddHHmmss
const signatureString = `${merchantCode}${amount}${datetime}${apiKey}`
const signature = crypto.createHash('sha256').update(signatureString).digest('hex')

const payload = {
  merchantcode: merchantCode,
  amount: amount,
  datetime: datetime,
  signature: signature
}

fetch('https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(console.log)
.catch(console.error)
