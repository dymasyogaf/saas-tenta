import { serverSupabaseServiceRole } from '#supabase/server'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  // 1. Ambil data dari webhook Duitku
  // Duitku callback umumnya dikirim sebagai x-www-form-urlencoded
  // Tapi Nitro readBody bisa menghandle form data / json
  const body = await readBody(event)
  
  if (!body || !body.merchantOrderId) {
    return { statusCode: 400, message: 'Invalid payload' }
  }

  const merchantCode = body.merchantCode
  const amount = body.amount
  const merchantOrderId = body.merchantOrderId
  const signature = body.signature
  const reference = body.reference
  const resultCode = body.resultCode // '00' = Success, '01' = Failed

  // 2. Validasi Signature
  const config = useRuntimeConfig()
  const apiKey = config.duidkuApiKey || process.env.DUIDKU_API_KEY
  const expectedMerchantCode = config.duidkuMerchantCode || process.env.DUIDKU_MERCHANT_CODE

  if (merchantCode !== expectedMerchantCode) {
    return { statusCode: 403, message: 'Invalid Merchant Code' }
  }

  // Signature Callback Duitku = MD5(merchantCode + amount + merchantOrderId + apiKey)
  const signatureString = `${merchantCode}${amount}${merchantOrderId}${apiKey}`
  const expectedSignature = crypto.createHash('md5').update(signatureString).digest('hex')

  if (signature !== expectedSignature) {
    console.error('Invalid Callback Signature!', { received: signature, expected: expectedSignature })
    return { statusCode: 403, message: 'Invalid Signature' }
  }

  // 3. Update Database via Supabase Service Role (Admin)
  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    // Cek apakah ini transaksi Subscription (Sewa Akun)
    if (merchantOrderId.startsWith('SUB-')) {
      const requestId = merchantOrderId.replace('SUB-', '')
      
      if (resultCode === '00') {
        // Success
        await supabase
          .from('ad_account_requests')
          .update({ status: 'pending_review', updated_at: new Date().toISOString() })
          .eq('id', requestId)
        
      } else {
        await supabase
          .from('ad_account_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', requestId)
      }
      
      // Update transaction log if it exists
      await supabase
        .from('transactions')
        .update({ status: resultCode === '00' ? 'success' : 'failed', updated_at: new Date().toISOString() })
        .eq('reference_id', merchantOrderId)

      return { statusCode: 200, message: 'OK' }
    }

    // Alur Top Up Biasa
    const { data: transaction, error: fetchTxError } = await supabase
      .from('transactions')
      .select('*, user_id')
      .eq('payment_gateway_ref', reference)
      .single()

    if (fetchTxError || !transaction) {
      return { statusCode: 404, message: 'Transaction not found' }
    }

    if (transaction.status === 'success' || transaction.status === 'failed') {
      return { statusCode: 200, message: 'Transaction already processed' }
    }

    if (resultCode === '00') {
      const netAmount = transaction.amount || 0
      const { data: rpcResult, error: rpcError } = await supabase.rpc('process_topup_success', {
        p_transaction_id: transaction.id,
        p_amount: netAmount
      })

      if (rpcError) throw rpcError
    } else {
      const { error: rpcError } = await supabase.rpc('process_topup_failed', {
        p_transaction_id: transaction.id
      })

      if (rpcError) throw rpcError
    }

    return { statusCode: 200, message: 'OK' }

  } catch (error) {
    console.error('Webhook processing error:', error)
    return { statusCode: 500, message: 'Internal Server Error' }
  }
})
