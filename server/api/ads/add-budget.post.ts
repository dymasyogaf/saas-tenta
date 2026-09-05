import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { requireUser } from '../../utils/requireUser'
import { sendPushToUser } from '../../utils/webPush'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody(event)
  const { accountId, amount, isGlobal: explicitGlobal } = body

  const host = getRequestHost(event) || ''
  const isGlobal = explicitGlobal === true || host.startsWith('area.')

  if (!accountId || !amount || Number(amount) <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: isGlobal ? 'Account ID and budget amount are required' : 'Account ID dan Nominal Anggaran (minimal Rp1) wajib diisi',
    })
  }
  
  // Use service role to bypass RLS on transactions and balance updates
  const supabase = await serverSupabaseServiceRole<any>(event)
  const userId = user.id || (user as any).sub

  // 1. Verifikasi kepemilikan ad account
  const { data: account, error: accError } = await supabase
    .from('ad_accounts')
    .select('id, user_id, saldo, platform, account_name, account_id')
    .eq('id', accountId)
    .single()

  if (accError || !account) {
    throw createError({
      statusCode: 404,
      statusMessage: isGlobal ? 'Ad account not found' : 'Akun iklan tidak ditemukan',
    })
  }

  if (String(account.user_id) !== String(userId)) {
    throw createError({
      statusCode: 403,
      statusMessage: isGlobal ? 'Access denied: You do not own this ad account' : 'Akses ditolak: Anda bukan pemilik akun iklan ini',
    })
  }

  // 2. Cek Saldo Utama (Ad Balance) klien
  let { data: saldoData, error: saldoErr } = await supabase
    .from('saldo')
    .select('balance, pending_balance, usd_balance, usd_pending_balance')
    .eq('user_id', userId)
    .single()

  if (saldoErr && saldoErr.code === 'PGRST116') {
    const { data: newSaldo, error: insertErr } = await supabase
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
    throw createError({
      statusCode: 404,
      statusMessage: isGlobal ? 'Main balance data not found' : 'Data Saldo Utama tidak ditemukan',
    })
  }

  const addAmount = Number(amount)
  let availableBalance = 0
  let newPendingBalance = 0

  if (isGlobal) {
    const currentUsdBalance = Number(saldoData.usd_balance || 0)
    const currentUsdPending = Number(saldoData.usd_pending_balance || 0)
    availableBalance = currentUsdBalance - currentUsdPending

    if (availableBalance < addAmount) {
      throw createError({
        statusCode: 400,
        statusMessage: isGlobal ? 'Insufficient available USD balance for this allocation' : 'Sisa Saldo USD tidak mencukupi untuk alokasi ini',
      })
    }

    newPendingBalance = currentUsdPending + addAmount
    const { error: updateSaldoErr } = await supabase
      .from('saldo')
      .update({ usd_pending_balance: newPendingBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (updateSaldoErr) {
      throw createError({
        statusCode: 500,
        statusMessage: isGlobal ? 'Failed to hold USD balance' : 'Gagal membekukan Saldo USD',
      })
    }
  } else {
    const currentBalance = Number(saldoData.balance || 0)
    const currentPending = Number(saldoData.pending_balance || 0)
    availableBalance = currentBalance - currentPending

    if (availableBalance < addAmount) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Sisa Saldo Utama tidak mencukupi untuk alokasi ini',
      })
    }

    newPendingBalance = currentPending + addAmount
    const { error: updateSaldoErr } = await supabase
      .from('saldo')
      .update({ pending_balance: newPendingBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (updateSaldoErr) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Gagal membekukan Saldo Utama',
      })
    }
  }

  // 4. Catat ke tabel transactions (status: pending)
  const trxDescription = isGlobal
    ? `Budget Allocation Request - ${account.account_name || account.account_id} (${account.platform})`
    : `Request Alokasi Anggaran Iklan - ${account.account_name || account.account_id} (${account.platform})`

  const { data: trxData, error: trxErr } = await supabase.from('transactions').insert({
    user_id: userId,
    amount: addAmount,
    type: 'payment',
    status: 'pending',
    currency: isGlobal ? 'USD' : 'IDR',
    description: trxDescription,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).select('id').single()

  if (trxErr) {
    console.error('Gagal mencatat histori transaksi alokasi:', trxErr)
  }

  // 5. Buat pengajuan ke tabel ad_budget_requests
  const { error: requestErr } = await supabase.from('ad_budget_requests').insert({
    user_id: userId,
    ad_account_id: accountId,
    amount: addAmount,
    status: 'pending',
    transaction_id: trxData?.id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  if (requestErr) {
    console.error('Gagal membuat request alokasi:', requestErr)
    // Rollback pending balance
    if (isGlobal) {
      await supabase
        .from('saldo')
        .update({ usd_pending_balance: Number(saldoData.usd_pending_balance || 0), updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    } else {
      await supabase
        .from('saldo')
        .update({ pending_balance: Number(saldoData.pending_balance || 0), updated_at: new Date().toISOString() })
        .eq('user_id', userId)
    }

    throw createError({
      statusCode: 500,
      statusMessage: isGlobal ? 'Failed to submit budget request' : 'Gagal membuat pengajuan anggaran',
    })
  }

  // 6. Buat notifikasi real-time untuk user
  const notifTitle = isGlobal ? 'Budget Top Up Submitted' : 'Pengajuan Top Up Anggaran Terkirim'
  const notifMessage = isGlobal
    ? `Your budget allocation request of $${addAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} for ${account.account_name || account.account_id} (${account.platform}) has been submitted and is awaiting review.`
    : `Permintaan alokasi anggaran sebesar Rp ${addAmount.toLocaleString('id-ID')} pada akun ${account.account_name || account.account_id} (${account.platform}) telah dikirim dan sedang menunggu persetujuan Tim Ads Ops.`

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'budget_pending',
    title: notifTitle,
    message: notifMessage,
    created_at: new Date().toISOString()
  })

  // Web Push (background / minimized browser)
  const cleanMessage = notifMessage.replace(/<[^>]*>/g, '')
  sendPushToUser(event, userId, {
    title: notifTitle,
    body: cleanMessage,
    url: '/dashboard/saldo',
    tag: `budget-pending-${trxData?.id || Date.now()}`
  }).catch(() => {})

  // 7. Selesai (Menunggu persetujuan Admin Ads Ops)
  return {
    success: true,
    message: isGlobal 
      ? 'Budget allocation request successfully submitted and awaiting review.'
      : 'Permintaan penambahan anggaran berhasil dikirim dan sedang menunggu persetujuan tim iklan.',
    new_pending_balance: newPendingBalance
  }
})
