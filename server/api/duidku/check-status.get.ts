import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import crypto from 'node:crypto'
import { syncUserHighestPackage } from '../../utils/packageSync'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const merchantOrderId = query.orderId as string

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

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
       console.error('Duitku Check Status Error:', result)
       throw createError({ 
         statusCode: 400, 
         statusMessage: `Respons tidak valid dari Duitku: ${result.statusMessage || JSON.stringify(result)}` 
       })
    }

    const reference = result.reference
    const resultCode = result.statusCode
    const amount = parseInt(result.amount)

    // 3. Sinkronisasi dengan Database kita
    const supabase = serverSupabaseServiceRole<any>(event)

    const { data: transaction, error: fetchTxError } = await supabase
      .from('transactions')
      .select('*, user_id')
      .or(`payment_gateway_ref.eq.${merchantOrderId},payment_gateway_ref.eq.${reference}`)
      .maybeSingle()

    if (fetchTxError || !transaction) {
      return { 
        statusCode: 404, 
        message: 'Transaksi ditemukan di Duitku, tapi tidak ada di sistem internal', 
        duitkuStatus: result 
      }
    }

    if (transaction.user_id !== user.id && user.user_metadata?.role === 'client') {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
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
      const netAmount = transaction.amount || 0
      const { data: rpcResult, error: rpcError } = await supabase.rpc('process_topup_success', {
        p_transaction_id: transaction.id,
        p_amount: netAmount
      })

      if (rpcError) throw rpcError

      // Ensure user's highest package tier remains active
      await syncUserHighestPackage(supabase, transaction.user_id)

      return {
        statusCode: 200,
        message: 'Transaksi berhasil disinkronisasi: SUKSES',
        status: 'success',
        duitkuStatus: result
      }

    } else if (resultCode === '01') {
      return {
        statusCode: 200,
        message: 'Transaksi masih menunggu pembayaran',
        status: 'pending',
        duitkuStatus: result
      }

    } else if (resultCode === '02') {
      const { error: rpcError } = await supabase.rpc('process_topup_failed', {
        p_transaction_id: transaction.id
      })

      if (rpcError) throw rpcError

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
