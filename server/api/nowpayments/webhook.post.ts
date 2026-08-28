import { serverSupabaseServiceRole } from '#supabase/server'
import crypto from 'node:crypto'
import { syncUserHighestPackage } from '../../utils/packageSync'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const ipnSecret = config.nowpaymentsIpnSecret

  if (!ipnSecret) {
    throw createError({ statusCode: 500, statusMessage: 'NOWPayments IPN Secret not configured' })
  }

  // Get signature from header
  const signature = getHeader(event, 'x-nowpayments-sig') || ''

  // Read raw body for signature verification
  const rawBody = await readRawBody(event)

  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty body' })
  }

  // Parse JSON body
  let body: Record<string, any>
  try {
    body = JSON.parse(rawBody)
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }

  // Verify HMAC-SHA512 signature
  // NOWPayments requires keys sorted alphabetically
  const sortedPayload = JSON.stringify(body, Object.keys(body).sort())
  const expectedSignature = crypto
    .createHmac('sha512', ipnSecret)
    .update(sortedPayload)
    .digest('hex')

  if (signature !== expectedSignature) {
    console.error('NOWPayments Webhook: Invalid signature', {
      received: signature,
      expected: expectedSignature
    })
    throw createError({ statusCode: 403, statusMessage: 'Invalid signature' })
  }

  const paymentStatus = body.payment_status
  const orderId = body.order_id

  // Only process finished/confirmed payments
  if (paymentStatus !== 'finished' && paymentStatus !== 'confirmed') {
    // Acknowledge receipt but don't process
    console.log(`NOWPayments Webhook: Received status '${paymentStatus}' for order ${orderId}, skipping processing.`)
    return { status: 'ok' }
  }

  if (!orderId) {
    console.error('NOWPayments Webhook: order_id is missing')
    throw createError({ statusCode: 400, statusMessage: 'order_id is missing' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)

  // 1. Find transaction in DB
  const { data: trx, error: trxErr } = await supabase
    .from('transactions')
    .select('id, user_id, amount, package_selected, status')
    .eq('payment_gateway_ref', orderId)
    .single()

  if (trxErr || !trx) {
    console.error('NOWPayments Webhook: Transaction not found', orderId)
    return { status: 'ok' } // Acknowledge to prevent retries
  }

  // Guard: skip if already processed
  if (trx.status === 'success' || trx.status === 'settled') {
    console.log(`NOWPayments Webhook: Transaction ${orderId} already processed, skipping.`)
    return { status: 'ok' }
  }

  // 2. Atomically update transaction status — only if still pending (prevents double-credit race condition)
  const { data: updatedRows, error: updateErr } = await supabase
    .from('transactions')
    .update({ status: 'success', currency: 'USD', updated_at: new Date().toISOString() })
    .eq('id', trx.id)
    .eq('status', 'pending')
    .select('id')

  // If no rows were updated, another webhook call already processed this transaction
  if (updateErr || !updatedRows || updatedRows.length === 0) {
    console.log(`NOWPayments Webhook: Transaction ${orderId} was already processed by another call, skipping.`)
    return { status: 'ok' }
  }

  // 3. Add balance (usd_balance) to user's saldo
  const { data: saldoData, error: saldoErr } = await supabase
    .from('saldo')
    .select('usd_balance')
    .eq('user_id', trx.user_id)
    .single()

  const oldBalance = saldoData ? Number(saldoData.usd_balance || 0) : 0
  const newBalance = oldBalance + Number(trx.amount) // Net amount (without fee)

  if (saldoErr && saldoErr.code === 'PGRST116') {
    // Create new saldo row if it doesn't exist
    await supabase
      .from('saldo')
      .insert({ user_id: trx.user_id, balance: 0, usd_balance: newBalance })
  } else {
    // Update existing row
    await supabase
      .from('saldo')
      .update({ usd_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', trx.user_id)
  }

  // 4. Record USD Package Subscription if package selected
  if (trx.package_selected) {
    const expiresAt = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString() // +28 days
    try {
      await supabase
        .from('user_package_subscriptions')
        .insert({
          user_id: trx.user_id,
          package_type: trx.package_selected,
          expires_at: expiresAt,
          is_active: true,
          currency: 'USD'
        })
    } catch (err) {
      console.error('Error inserting USD package subscription:', err)
    }

    // Sync USD package on users table
    await syncUserHighestPackage(supabase, trx.user_id, 'USD')
  }

  console.log(`NOWPayments Webhook: Successfully processed payment for ${orderId}. USD added: ${trx.amount}`)

  // NOWPayments expects HTTP 200
  return { status: 'ok' }
})

