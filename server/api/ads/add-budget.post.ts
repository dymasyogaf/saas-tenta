import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import { requireUser } from '../../utils/requireUser'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const body = await readBody(event)
  const { accountId, amount } = body

  if (!accountId || !amount || amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Account ID dan Nominal Anggaran (minimal Rp1) wajib diisi',
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
      statusMessage: 'Akun iklan tidak ditemukan',
    })
  }

  if (String(account.user_id) !== String(userId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Akses ditolak: Anda bukan pemilik akun iklan ini',
    })
  }

  // 2. Cek Saldo Utama (Ad Balance) klien
  const { data: saldoData, error: saldoErr } = await supabase
    .from('saldo')
    .select('balance, pending_balance')
    .eq('user_id', userId)
    .single()

  if (saldoErr || !saldoData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Data Saldo Utama tidak ditemukan',
    })
  }

  const currentBalance = Number(saldoData.balance)
  const addAmount = Number(amount)

  if (currentBalance < addAmount) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sisa Saldo Utama tidak mencukupi untuk alokasi ini',
    })
  }

  // 3. Potong Saldo Utama (balance)
  const newBalance = currentBalance - addAmount
  const { error: updateSaldoErr } = await supabase
    .from('saldo')
    .update({ balance: newBalance })
    .eq('user_id', userId)

  if (updateSaldoErr) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal memotong Saldo Utama',
    })
  }

  // 4. Catat ke tabel transactions
  const { error: trxErr } = await supabase.from('transactions').insert({
    user_id: userId,
    amount: addAmount,
    type: 'payment',
    status: 'success',
    description: `Alokasi Anggaran Iklan - ${account.account_name || account.account_id} (${account.platform})`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  if (trxErr) {
    console.error('Gagal mencatat histori transaksi alokasi:', trxErr)
  }

  // 5. Tambahkan anggaran ke kolom 'saldo' di tabel ad_accounts (lokal DB)
  const newAdBalance = Number(account.saldo || 0) + addAmount
  const { error: updateAccErr } = await supabase
    .from('ad_accounts')
    .update({ saldo: newAdBalance })
    .eq('id', accountId)

  if (updateAccErr) {
    console.error('Gagal menambah saldo di tabel ad_accounts:', updateAccErr)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal mengalokasikan anggaran ke tabel akun iklan',
    })
  }

  // 6. Selesai (Tidak menembak API eksternal secara langsung)
  return {
    success: true,
    message: 'Anggaran berhasil dialokasikan secara aman',
    new_balance: newBalance,
    new_ad_balance: newAdBalance
  }
})
