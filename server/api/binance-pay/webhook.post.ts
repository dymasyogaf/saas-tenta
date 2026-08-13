import { serverSupabaseServiceRole } from '#supabase/server'
import crypto from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secretKey = config.binancePaySecretKey

  if (!secretKey) {
    throw createError({ statusCode: 500, statusMessage: 'Binance Pay Secret Key not configured' })
  }

  // Ambil Header Binance
  const timestamp = getHeader(event, 'binancepay-timestamp') || ''
  const nonce = getHeader(event, 'binancepay-nonce') || ''
  const signature = getHeader(event, 'binancepay-signature') || ''

  // Ambil Raw Body (Wajib untuk validasi signature)
  const rawBody = await readRawBody(event)
  
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }

  // Verifikasi Signature
  const payloadToSign = timestamp + '\n' + nonce + '\n' + rawBody + '\n'
  const expectedSignature = crypto.createHmac('sha512', secretKey).update(payloadToSign).digest('hex').toUpperCase()

  if (signature !== expectedSignature) {
    console.error('Binance Webhook: Invalid signature', { signature, expectedSignature })
    throw createError({ statusCode: 403, statusMessage: 'Invalid signature' })
  }

  // Parsing JSON Body
  let body;
  try {
    body = JSON.parse(rawBody)
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }

  if (body.bizType === 'PAY' && body.bizStatus === 'PAY_SUCCESS') {
    // Data transaksi biasanya berupa JSON string di dalam properti `data`
    let data;
    try {
      data = JSON.parse(body.data)
    } catch (e) {
      data = body.data || {}
    }

    const merchantOrderId = data.merchantTradeNo

    if (!merchantOrderId) {
      throw createError({ statusCode: 400, statusMessage: 'merchantTradeNo is missing' })
    }

    const supabase = serverSupabaseServiceRole<any>(event)

    // 1. Ambil transaksi dari DB
    const { data: trx, error: trxErr } = await supabase
      .from('transactions')
      .select('id, user_id, amount, status')
      .eq('payment_gateway_ref', merchantOrderId)
      .single()

    if (trxErr || !trx) {
      console.error('Binance Webhook: Transaction not found', merchantOrderId)
      return { returnCode: 'SUCCESS', returnMessage: 'Transaction not found, but acknowledged' } // Binance expects SUCCESS
    }

    if (trx.status === 'success' || trx.status === 'settled') {
      return { returnCode: 'SUCCESS', returnMessage: 'Already processed' }
    }

    // 2. Update status transaksi
    await supabase
      .from('transactions')
      .update({ status: 'success', updated_at: new Date().toISOString() })
      .eq('id', trx.id)

    // 3. Tambahkan saldo (usd_balance) ke user
    // Ambil saldo lama
    const { data: saldoData, error: saldoErr } = await supabase
      .from('saldo')
      .select('usd_balance')
      .eq('user_id', trx.user_id)
      .single()

    const oldBalance = saldoData ? Number(saldoData.usd_balance || 0) : 0
    const newBalance = oldBalance + Number(trx.amount) // Amount bersih yang dibeli user

    if (saldoErr && saldoErr.code === 'PGRST116') {
      // Buat row saldo baru jika belum ada
      await supabase
        .from('saldo')
        .insert({ user_id: trx.user_id, balance: 0, usd_balance: newBalance })
    } else {
      // Update row yang sudah ada
      await supabase
        .from('saldo')
        .update({ usd_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', trx.user_id)
    }

    console.log(`Binance Webhook: Successfully processed payment for ${merchantOrderId}. USD added: ${trx.amount}`)
  }

  // Binance Pay expects { returnCode: "SUCCESS", returnMessage: "..." }
  return {
    returnCode: 'SUCCESS',
    returnMessage: 'OK'
  }
})
