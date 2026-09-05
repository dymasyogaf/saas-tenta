import { serverSupabaseServiceRole } from '#supabase/server'
import crypto from 'node:crypto'
import { sendPaymentSuccessEmail } from '../../utils/email'
import { syncUserHighestPackage } from '../../utils/packageSync'
import { sendPushToUser } from '../../utils/webPush'

// Memory lock untuk mencegah Race Condition (Double Credit)
// saat Duitku mengirim webhook berbarengan dalam milidetik yang sama.
const processingLocks = new Set<string>()

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
    // 4. Cari Transaksi
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

    // Cek Memory Lock
    if (processingLocks.has(transaction.id)) {
      console.warn('Idempotency lock triggered for transaction:', transaction.id)
      return { statusCode: 200, message: 'Transaction is already being processed' }
    }
    
    // Kunci transaksi
    processingLocks.add(transaction.id)

    try {
      if (resultCode === '00') {
        const netAmount = transaction.amount || 0
        const { data: rpcResult, error: rpcError } = await supabase.rpc('process_topup_success', {
          p_transaction_id: transaction.id,
          p_amount: netAmount
        })

        if (rpcError) throw rpcError

        // Ensure user's highest package tier remains active
        await syncUserHighestPackage(supabase, transaction.user_id)

        // Notifikasi real-time: Top Up Berhasil
        const formattedAmount = `Rp ${Number(netAmount).toLocaleString('id-ID')}`
        const notifTitle = 'Top Up Saldo Berhasil'
        const notifMessage = `Deposit saldo sebesar ${formattedAmount} telah berhasil diproses dan masuk ke akun Anda.`

        await supabase.from('notifications').insert({
          user_id: transaction.user_id,
          type: 'topup_approved',
          title: notifTitle,
          message: notifMessage,
          created_at: new Date().toISOString()
        })

        sendPushToUser(event, transaction.user_id, {
          title: notifTitle,
          body: notifMessage,
          url: '/dashboard/saldo',
          tag: `topup-success-${transaction.id}`
        }).catch(() => {})

        // Kirim email pembayaran berhasil ke customer
        // Ambil data user untuk email
        const { data: userData } = await supabase.auth.admin.getUserById(transaction.user_id)
        if (userData?.user?.email) {
          sendPaymentSuccessEmail({
            to: userData.user.email,
            customerName: userData.user.user_metadata?.full_name || 'Member Tentaklik',
            productDetails: transaction.description || 'Layanan Manajemen Iklan Digital',
            paymentAmount: parseInt(amount),
            merchantOrderId,
          }).catch((err: Error) => console.error('[Email] Error kirim email sukses:', err))
        }
      } else {
        const { error: rpcError } = await supabase.rpc('process_topup_failed', {
          p_transaction_id: transaction.id
        })

        if (rpcError) throw rpcError

        // Notifikasi real-time: Top Up Gagal
        await supabase.from('notifications').insert({
          user_id: transaction.user_id,
          type: 'error',
          title: 'Pembayaran Top Up Gagal',
          message: `Pembayaran deposit Anda tidak berhasil diproses. Silakan coba kembali atau hubungi tim bantuan.`,
          created_at: new Date().toISOString()
        })

        sendPushToUser(event, transaction.user_id, {
          title: 'Pembayaran Top Up Gagal',
          body: 'Pembayaran deposit Anda tidak berhasil diproses. Silakan coba kembali.',
          url: '/dashboard/saldo',
          tag: `topup-failed-${transaction.id}`
        }).catch(() => {})
      }
    } finally {
      // Lepaskan kunci setelah selesai (berhasil/gagal)
      processingLocks.delete(transaction.id)
    }

    return { statusCode: 200, message: 'OK' }

  } catch (error) {
    console.error('Webhook processing error:', error)
    return { statusCode: 500, message: 'Internal Server Error' }
  }
})
