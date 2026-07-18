import { serverSupabaseServiceRole } from '#supabase/server'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  // 1. Ambil body dari request frontend
  const body = await readBody(event)
  const { amount, method } = body

  if (!amount || amount < 10000) {
    throw createError({ statusCode: 400, statusMessage: 'Minimal top-up Rp 10.000' })
  }

  // 2. Autentikasi User (Ambil dari Supabase session/token yang aktif di headers)
  // Catatan: Karena ini di backend Nuxt (Nitro), kita bisa baca headers token
  // Namun untuk keamanan penuh, kita gunakan service_role untuk menulis ke tabel transactions
  const supabase = serverSupabaseServiceRole<any>(event)
  
  // Karena Nuxt Auth Supabase Module menaruh token di cookie
  // Kita bisa mendapatkan user dari event context (membutuhkan helper serverSupabaseUser)
  // Untuk kesederhanaan sementara, kita minta frontend mengirimkan userId di body
  const { userId, userEmail, userName, userPhone } = body
  
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // 3. Konfigurasi Duitku
  const config = useRuntimeConfig()
  const merchantCode = config.duidkuMerchantCode || process.env.DUIDKU_MERCHANT_CODE
  const apiKey = config.duidkuApiKey || process.env.DUIDKU_API_KEY
  const isProduction = process.env.DUIDKU_IS_PRODUCTION === 'true'
  
  // 4. Siapkan Data Transaksi
  const merchantOrderId = `TP-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  const paymentAmount = parseInt(amount)
  
  // Signature = MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
  const signatureString = `${merchantCode}${merchantOrderId}${paymentAmount}${apiKey}`
  const signature = crypto.createHash('md5').update(signatureString).digest('hex')

  const baseUrlDuitku = isProduction ? 'https://passport.duitku.com' : 'https://sandbox.duitku.com'
  const endpoint = `${baseUrlDuitku}/webapi/api/merchant/v2/inquiry`

  // Buat URL secara dinamis sesuai lingkungan aplikasi saat ini (localhost atau domain live)
  const appProtocol = getRequestProtocol(event) || 'https'
  const appHost = getRequestHost(event)
  const appBaseUrl = `${appProtocol}://${appHost}`

  const callbackUrl = `${appBaseUrl}/api/duidku/callback`
  const returnUrl = `${appBaseUrl}/dashboard/topup`

  const payload: any = {
    merchantCode,
    paymentAmount,
    merchantOrderId,
    productDetails: 'Top Up Saldo Iklan Tentaklik',
    additionalParam: '',
    merchantUserInfo: userId,
    customerVaName: userName || 'Member Tentaklik',
    email: userEmail,
    phoneNumber: userPhone || '081234567890',
    itemDetails: [
      {
        name: 'Top Up Saldo Iklan',
        price: paymentAmount,
        quantity: 1
      }
    ],
    customerDetail: {
      firstName: userName || 'Member',
      lastName: 'Tentaklik',
      email: userEmail,
      phoneNumber: userPhone || '081234567890',
    },
    callbackUrl,
    returnUrl,
    signature,
    expiryPeriod: 60 // 60 menit
  }

  payload.paymentMethod = method || 'OV' // 'OV' adalah kode untuk OVO

  // 5. Kirim Request ke Duitku
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (result.statusCode === '00') {
      // 6. Simpan transaksi berstatus 'pending' ke Supabase
      const methodNames: Record<string, string> = {
        'BC': 'BCA Virtual Account',
        'BM': 'Mandiri Virtual Account',
        'BR': 'BRI Virtual Account',
        'OV': 'OVO',
        'SA': 'ShopeePay',
        'DA': 'DANA',
        'SP': 'QRIS',
      }
      const paymentName = methodNames[method] || 'Payment Gateway'

      const { error: dbError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'topup',
          amount: paymentAmount,
          status: 'pending',
          payment_gateway_ref: result.reference,
          description: `Top Up Saldo via ${paymentName}`
        })

      if (dbError) {
        console.error('Error insert transaction:', dbError)
        throw createError({ statusCode: 500, statusMessage: 'Gagal mencatat transaksi di database internal' })
      }

      // Berhasil
      return {
        success: true,
        paymentUrl: result.paymentUrl,
        reference: result.reference,
        merchantOrderId
      }
    } else {
      console.error('Duitku Error:', result)
      throw createError({ statusCode: 400, statusMessage: `Duitku: ${result.statusMessage || result.Message || 'Gagal dari payment gateway'}` })
    }

  } catch (error: any) {
    console.error('Error create payment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Terjadi kesalahan saat memproses pembayaran'
    })
  }
})
