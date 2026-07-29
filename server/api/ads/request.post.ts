import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { platform, accountName, targetUrl, details, subscriptionMonths, rentalFee } = body

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const userId = user.id

  if (!platform || !accountName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }

  const supabaseAdmin = serverSupabaseServiceRole<any>(event)

  // 1. Ambil data saldo user
  const { data: saldoData, error: saldoErr } = await supabaseAdmin
    .from('saldo')
    .select('balance, pending_balance')
    .eq('user_id', userId)
    .single()

  if (saldoErr || !saldoData) {
    throw createError({ statusCode: 400, statusMessage: 'Data saldo tidak ditemukan' })
  }

  const netBalance = Number(saldoData.balance) - Number(saldoData.pending_balance)
  const fee = Number(rentalFee || 0)

  if (netBalance < fee) {
    throw createError({ statusCode: 400, statusMessage: 'Saldo bersih Anda tidak mencukupi' })
  }

  // 2. Tahan saldo (Hold / Masukkan ke pending_balance)
  const newPending = Number(saldoData.pending_balance) + fee
  const { error: holdErr } = await supabaseAdmin
    .from('saldo')
    .update({ pending_balance: newPending, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (holdErr) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menahan saldo (hold balance)' })
  }

  // 3. Simpan pengajuan dengan status pending_review
  const { data, error } = await supabaseAdmin
    .from('ad_account_requests')
    .insert({
      user_id: userId,
      platform,
      account_name: accountName,
      target_url: targetUrl || '',
      status: 'pending_review',
      details,
      subscription_months: subscriptionMonths || 1,
      rental_fee: fee
    })
    .select('id')
    .single()

  if (error) {
    // Rollback saldo jika gagal insert
    await supabaseAdmin
      .from('saldo')
      .update({ pending_balance: Number(saldoData.pending_balance), updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      
    console.error('Failed to create ad account request:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat pengajuan' })
  }

  return { success: true, requestId: data.id }
})
