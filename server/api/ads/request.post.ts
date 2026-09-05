import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { sendPushToUser } from '../../utils/webPush'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { platform, accountName, targetUrl, details, subscriptionMonths, rentalFee, isGlobal } = body

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
    .select('balance, pending_balance, usd_balance, usd_pending_balance')
    .eq('user_id', userId)
    .single()

  if (saldoErr && saldoErr.code === 'PGRST116') {
    const { data: newSaldo, error: insertErr } = await supabaseAdmin
      .from('saldo')
      .insert({ user_id: userId, balance: 0, pending_balance: 0, usd_balance: 0, usd_pending_balance: 0 })
      .select('balance, pending_balance, usd_balance, usd_pending_balance')
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
  const pricing = isGlobal ? {
    monthly: Number(config.public.pricingMonthlyUsd),
    quarterly: Number(config.public.pricingQuarterlyUsd),
    semiannual: Number(config.public.pricingSemiannualUsd)
  } : {
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

  const netBalance = isGlobal ? 
    (Number(saldoData.usd_balance || 0) - Number(saldoData.usd_pending_balance || 0)) :
    (Number(saldoData.balance || 0) - Number(saldoData.pending_balance || 0));

  if (netBalance < fee) {
    throw createError({ statusCode: 400, statusMessage: 'Saldo bersih Anda tidak mencukupi' })
  }

  // 2. Tahan saldo (Hold / Masukkan ke pending_balance)
  let holdErr = null;
  if (isGlobal) {
    const newPending = Number(saldoData.usd_pending_balance || 0) + fee
    const { error } = await supabaseAdmin
      .from('saldo')
      .update({ usd_pending_balance: newPending, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    holdErr = error
  } else {
    const newPending = Number(saldoData.pending_balance || 0) + fee
    const { error } = await supabaseAdmin
      .from('saldo')
      .update({ pending_balance: newPending, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    holdErr = error
  }

  if (holdErr) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal menahan saldo (hold balance)' })
  }

  // 3. Simpan pengajuan dengan status pending_review
  const finalDetails = { ...details, currency: isGlobal ? 'USD' : 'IDR' }
  const { data, error } = await supabaseAdmin
    .from('ad_account_requests')
    .insert({
      user_id: userId,
      platform,
      account_name: accountName,
      target_url: targetUrl || '',
      status: 'pending_review',
      details: finalDetails,
      subscription_months: subscriptionMonths || 1,
      rental_fee: fee
    })
    .select('id')
    .single()

  if (error) {
    // Rollback saldo jika gagal insert
    if (isGlobal) {
      await supabaseAdmin
        .from('saldo')
        .update({ usd_pending_balance: Number(saldoData.usd_pending_balance || 0), updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    } else {
      await supabaseAdmin
        .from('saldo')
        .update({ pending_balance: Number(saldoData.pending_balance || 0), updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    }
      
    console.error('Failed to create ad account request:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat pengajuan' })
  }

  // --- NOTIFICATION LOGIC ---
  let platformLabel = platform === 'google' ? 'Google Ads' : platform === 'meta' ? 'Meta Ads' : platform === 'tiktok' ? 'TikTok Ads' : platform
  
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'ad_request_pending',
    title: 'Pengajuan Akun Sedang Direview',
    message: `Pengajuan sewa akun iklan ${platformLabel} Anda telah kami terima dan sedang dalam peninjauan.`
  })

  // Web Push
  sendPushToUser(event, userId, {
    title: 'Pengajuan Akun Sedang Direview',
    body: `Pengajuan sewa akun iklan ${platformLabel} Anda telah kami terima dan sedang dalam peninjauan.`,
    url: '/dashboard/platform',
    tag: `ad-request-pending-${Date.now()}`
  }).catch(() => {})

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
