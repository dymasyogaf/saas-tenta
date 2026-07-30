import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { platform, accountName, targetUrl, details, subscriptionMonths, rentalFee } = body

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const userId = user.id || (user as any).sub

  if (!platform || !accountName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }

  const supabaseAdmin = serverSupabaseServiceRole<any>(event)

  // 1. Ambil data saldo user
  let { data: saldoData, error: saldoErr } = await supabaseAdmin
    .from('saldo')
    .select('balance, pending_balance')
    .eq('user_id', userId)
    .single()

  if (saldoErr && saldoErr.code === 'PGRST116') {
    const { data: newSaldo, error: insertErr } = await supabaseAdmin
      .from('saldo')
      .insert({ user_id: userId, balance: 0, pending_balance: 0 })
      .select('balance, pending_balance')
      .single()
      
    if (!insertErr && newSaldo) {
      saldoData = newSaldo
      saldoErr = null
    }
  }

  if (saldoErr || !saldoData) {
    throw createError({ statusCode: 400, statusMessage: 'Data saldo tidak ditemukan' })
  }

  const config = useRuntimeConfig()
  const pricing = {
    monthly: Number(config.public.pricingMonthly),
    quarterly: Number(config.public.pricingQuarterly),
    semiannual: Number(config.public.pricingSemiannual)
  }

  let expectedFee = pricing.monthly
  if (subscriptionMonths === 3) expectedFee = pricing.quarterly
  else if (subscriptionMonths === 6) expectedFee = pricing.semiannual

  const fee = Number(rentalFee || 0)
  if (fee < expectedFee) {
    throw createError({ statusCode: 400, statusMessage: 'Biaya sewa tidak valid / tidak sesuai paket' })
  }

  const netBalance = Number(saldoData.balance) - Number(saldoData.pending_balance)

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

  // --- NOTIFICATION LOGIC ---
  let platformLabel = platform === 'google' ? 'Google Ads' : platform === 'meta' ? 'Meta Ads' : platform === 'tiktok' ? 'TikTok Ads' : platform
  
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'system',
    title: 'Pengajuan Akun Sedang Direview',
    message: `Pengajuan sewa akun iklan ${platformLabel} Anda telah kami terima dan sedang dalam peninjauan.`
  })

  // --- AFFILIATE COMMISSION LOGIC ---
  const { data: referral } = await supabaseAdmin
    .from('referrals')
    .select('id')
    .eq('referee_id', userId)
    .eq('status', 'pending_reward')
    .single()

  if (referral) {
    const commission = fee * 0.20
    await supabaseAdmin
      .from('referrals')
      .update({
        status: 'reward_given',
        reward_amount: commission,
        updated_at: new Date().toISOString()
      })
      .eq('id', referral.id)
  }

  return { success: true, requestId: data.id }
})
