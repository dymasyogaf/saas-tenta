import { serverSupabaseServiceRole } from '#supabase/server'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const merchantOrderId = query.orderId as string

  if (!merchantOrderId) {
    throw createError({ statusCode: 400, statusMessage: 'Parameter orderId diperlukan' })
  }

  // 1. Konfigurasi Duitku
  const config = useRuntimeConfig()
  const merchantCode = config.duidkuMerchantCode || process.env.DUIDKU_MERCHANT_CODE
  const apiKey = config.duidkuApiKey || process.env.DUIDKU_API_KEY
  const isProduction = process.env.DUIDKU_IS_PRODUCTION === 'true'

  // 2. Generate Signature untuk Transaction Status Duitku
  // Signature = MD5(merchantCode + merchantOrderId + apiKey)
  const signatureString = `${merchantCode}${merchantOrderId}${apiKey}`
  const signature = crypto.createHash('md5').update(signatureString).digest('hex')

  const baseUrlDuitku = isProduction ? 'https://passport.duitku.com' : 'https://sandbox.duitku.com'
  const endpoint = `${baseUrlDuitku}/webapi/api/merchant/transactionStatus`

  const payload = {
    merchantCode,
    merchantOrderId,
    signature
  }

  try {
    // Request ke Duitku
    const response = await fetch(endpoint, {
      method: 'POST', // Duitku Check Status menggunakan metode POST
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!result.reference) {
       throw createError({ statusCode: 400, statusMessage: 'Respons tidak valid dari Duitku' })
    }

    const reference = result.reference
    const resultCode = result.statusCode
    const amount = parseInt(result.amount)

    // 3. Sinkronisasi dengan Database kita
    const supabase = serverSupabaseServiceRole<any>(event)

    const { data: transaction, error: fetchTxError } = await supabase
      .from('transactions')
      .select('*, user_id')
      .eq('payment_gateway_ref', reference)
      .single()

    if (fetchTxError || !transaction) {
      return { 
        statusCode: 404, 
        message: 'Transaksi ditemukan di Duitku, tapi tidak ada di sistem internal', 
        duitkuStatus: result 
      }
    }

    // Pengecekan Idempotency (Hindari proses ganda jika sudah beres)
    if (transaction.status === 'success' || transaction.status === 'failed') {
      return { 
        statusCode: 200, 
        message: 'Status transaksi sudah tersinkronisasi (Idempotent)', 
        status: transaction.status, 
        duitkuStatus: result 
      }
    }

    // 4. Update status berdasarkan respons Duitku
    if (resultCode === '00') {
      // PEMBAYARAN SUKSES
      const { error: updateTxError } = await supabase
        .from('transactions')
        .update({ status: 'success', updated_at: new Date().toISOString() })
        .eq('id', transaction.id)

      if (updateTxError) throw updateTxError

      // Tambahkan Saldo User
      const { data: saldoData, error: fetchSaldoError } = await supabase
        .from('saldo')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .single()
        
      if (fetchSaldoError) throw fetchSaldoError

      const newBalance = Number(saldoData.balance) + Number(amount)
      
      const { error: updateSaldoError } = await supabase
        .from('saldo')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', transaction.user_id)

      if (updateSaldoError) throw updateSaldoError

      return { 
        statusCode: 200, 
        message: 'Transaksi berhasil disinkronisasi: SUKSES', 
        status: 'success', 
        duitkuStatus: result 
      }

    } else if (resultCode === '01') {
      // MASIH PENDING (Menunggu Pembayaran)
      return { 
        statusCode: 200, 
        message: 'Transaksi masih menunggu pembayaran', 
        status: 'pending', 
        duitkuStatus: result 
      }

    } else if (resultCode === '02') {
      // GAGAL / KADALUARSA
      const { error: updateTxError } = await supabase
        .from('transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', transaction.id)
        
      if (updateTxError) throw updateTxError

      return { 
        statusCode: 200, 
        message: 'Transaksi disinkronisasi: GAGAL', 
        status: 'failed', 
        duitkuStatus: result 
      }
    }

    return { statusCode: 200, message: 'Status tidak dikenali', duitkuStatus: result }

  } catch (error: any) {
    console.error('Error check status:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Terjadi kesalahan sistem'
    })
  }
})
