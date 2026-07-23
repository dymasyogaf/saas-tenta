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
        
        console.log(`[DUITKU SUCCESS] Subscription paid for request ${requestId}`)
      } else {
        // Failed
        await supabase
          .from('ad_account_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', requestId)
        
        console.log(`[DUITKU FAILED] Subscription failed for request ${requestId}`)
      }
      
      // Update transaction log if it exists
      await supabase
        .from('transactions')
        .update({ status: resultCode === '00' ? 'success' : 'failed', updated_at: new Date().toISOString() })
        .eq('reference_id', merchantOrderId)

      return { statusCode: 200, message: 'OK' }
    }

    // Alur Top Up Biasa
    // Ambil data transaksi dari database
    const { data: transaction, error: fetchTxError } = await supabase
      .from('transactions')
      .select('*, user_id')
      .eq('payment_gateway_ref', reference)
      .single()

    if (fetchTxError || !transaction) {
      console.error('Transaction not found:', reference)
      return { statusCode: 404, message: 'Transaction not found' }
    }

    // Jika transaksi sudah success/failed, jangan proses dua kali (Idempotency)
    if (transaction.status === 'success' || transaction.status === 'failed') {
      return { statusCode: 200, message: 'Transaction already processed' }
    }

    if (resultCode === '00') {
      // PEMBAYARAN SUKSES

      // A. Update status transaksi menjadi success
      const { error: updateTxError } = await supabase
        .from('transactions')
        .update({ status: 'success', updated_at: new Date().toISOString() })
        .eq('id', transaction.id)

      if (updateTxError) throw updateTxError

      // B. Tambahkan saldo user
      // Karena Duitku callback bisa asinkron/paralel, memanggil RPC function lebih aman daripada fetch + update
      // Jika RPC belum ada, kita bisa manual ambil saldo lama -> tambah saldo baru -> update
      
      const { data: saldoData, error: fetchSaldoError } = await supabase
        .from('saldo')
        .select('balance')
        .eq('user_id', transaction.user_id)
        .single()
        
      if (fetchSaldoError) throw fetchSaldoError

      // Gunakan transaction.amount (saldo bersih) BUKAN amount (total bayar + fee)
      const netAmount = transaction.amount || 0;
      const newBalance = Number(saldoData.balance) + Number(netAmount)
      
      const { error: updateSaldoError } = await supabase
        .from('saldo')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', transaction.user_id)

      if (updateSaldoError) throw updateSaldoError

      // C. Update Paket User
      if (transaction.package_selected) {
        let weeklyLimit = 0;
        if (transaction.package_selected === 'starter') weeklyLimit = 5000000;
        else if (transaction.package_selected === 'growth') weeklyLimit = 15000000;
        else if (transaction.package_selected === 'scale') weeklyLimit = 999999999; // Unlimited/High limit

        const { error: updateUserError } = await supabase
          .from('users')
          .update({
            active_package: transaction.package_selected,
            package_weekly_limit: weeklyLimit,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.user_id)

        if (updateUserError) console.error('Failed to update user package:', updateUserError)
      }

      console.log(`[DUITKU SUCCESS] Topup Rp${netAmount} applied to user ${transaction.user_id} (Package: ${transaction.package_selected})`)
      
    } else {
      // PEMBAYARAN GAGAL / EXPIRED
      const { error: updateTxError } = await supabase
        .from('transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', transaction.id)
        
      if (updateTxError) throw updateTxError
      console.log(`[DUITKU FAILED] Transaction ${reference} marked as failed.`)
    }

    return { statusCode: 200, message: 'OK' }

  } catch (error) {
    console.error('Webhook processing error:', error)
    return { statusCode: 500, message: 'Internal Server Error' }
  }
})
