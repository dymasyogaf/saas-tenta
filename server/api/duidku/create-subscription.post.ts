import { serverSupabaseServiceRole } from '#supabase/server'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { requestId, amount, method, userId, userEmail, userName, userPhone } = body

  if (!amount || amount < 150000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid subscription amount' })
  }
  if (!requestId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing request ID' })
  }
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)
  const paymentAmount = parseInt(amount)

  const config = useRuntimeConfig()
  const merchantCode = config.duidkuMerchantCode || process.env.DUIDKU_MERCHANT_CODE
  const apiKey = config.duidkuApiKey || process.env.DUIDKU_API_KEY
  const isProduction = process.env.DUIDKU_IS_PRODUCTION === 'true'
  
  // Format: SUB-{requestId}
  const merchantOrderId = `SUB-${requestId}`
  const signatureString = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`
  const signature = crypto.createHash('md5').update(signatureString).digest('hex')

  const callbackUrl = process.env.DUIDKU_CALLBACK_URL || 'http://localhost:3000/api/duidku/callback'
  const returnUrl = process.env.DUIDKU_RETURN_URL || 'http://localhost:3000/dashboard/platform'

  const payload = {
    merchantCode,
    paymentAmount,
    paymentMethod: method || 'M2',
    merchantOrderId,
    productDetails: `Pembayaran Sewa Akun Iklan`,
    additionalParam: '',
    merchantUserInfo: userId,
    customerVaName: userName || 'Member',
    email: userEmail || 'member@tentaklik.com',
    phoneNumber: userPhone || '',
    itemDetails: [{
      name: 'Sewa Akun Iklan',
      price: paymentAmount,
      quantity: 1
    }],
    customerDetail: {
      firstName: userName || 'Member',
      lastName: '',
      email: userEmail || 'member@tentaklik.com',
      phoneNumber: userPhone || '',
    },
    callbackUrl,
    returnUrl,
    signature,
    expiryPeriod: 60 // 1 jam
  }

  const apiUrl = isProduction 
    ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry'
    : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry'

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const result = await response.json()

  if (result.statusCode === '00' && result.paymentUrl) {
    // Record to transactions table just in case
    await supabase.from('transactions').insert({
      user_id: userId,
      amount: paymentAmount,
      type: 'subscription',
      status: 'pending',
      reference_id: merchantOrderId,
      payment_url: result.paymentUrl
    })

    return {
      success: true,
      paymentUrl: result.paymentUrl,
      reference: result.reference
    }
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: result.statusMessage || 'Gagal memproses pembayaran Duitku'
    })
  }
})
