import { serverSupabaseServiceRole } from '#supabase/server'
import { serverSupabaseUser } from '#supabase/server'
import { sendPushToUser } from '../../utils/webPush'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const user = await serverSupabaseUser(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { accountId, subscriptionMonths, rentalFee } = body

  if (!accountId || !subscriptionMonths || !rentalFee) {
    throw createError({ statusCode: 400, statusMessage: 'Data tidak lengkap' })
  }

  if (Number(subscriptionMonths) <= 0 || Number(subscriptionMonths) > 12) {
    throw createError({ statusCode: 400, statusMessage: 'Durasi sewa harus antara 1-12 bulan' })
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

  if (Number(rentalFee) < expectedFee) {
    throw createError({ statusCode: 400, statusMessage: 'Biaya sewa tidak valid / tidak sesuai paket' })
  }

  try {
    const uid = user.id || (user as any).sub
    
    // 1. Dapatkan informasi Ad Account
    const { data: account, error: accErr } = await supabase
      .from('ad_accounts')
      .select('id, account_id, platform, account_name, subscription_expires_at')
      .eq('id', accountId)
      .eq('user_id', uid)
      .single()

    if (accErr || !account) {
      throw createError({
        statusCode: 400,
        statusMessage: `Gagal mencari akun: ${accErr?.message || 'Tidak ada di database'} (ID: ${accountId}, UID: ${uid})`
      })
    }

    // 2. Dapatkan saldo user
    let { data: saldoData, error: saldoErr } = await supabase
      .from('saldo')
      .select('balance, pending_balance')
      .eq('user_id', uid)
      .single()

    if (saldoErr && saldoErr.code === 'PGRST116') {
      const { data: newSaldo, error: insertErr } = await supabase
        .from('saldo')
        .insert({ user_id: uid, balance: 0, pending_balance: 0 })
        .select('balance, pending_balance')
        .single()
        
      if (!insertErr && newSaldo) {
        saldoData = newSaldo
        saldoErr = null
      }
    }

    if (saldoErr || !saldoData) {
      throw new Error('Data saldo tidak ditemukan')
    }

    const balance = Math.round(Number(saldoData.balance))
    const pending = Math.round(Number(saldoData.pending_balance))
    const fee = Math.round(Number(rentalFee))
    const netBalance = balance - pending

    if (netBalance < fee) {
      throw new Error('Saldo tidak mencukupi untuk perpanjangan')
    }

    // 3. Potong Saldo
    const newBalance = balance - fee
    const { error: updateSaldoErr } = await supabase
      .from('saldo')
      .update({ balance: newBalance })
      .eq('user_id', uid)

    if (updateSaldoErr) {
      throw new Error('Gagal memotong saldo')
    }

    // 4. Catat transaksi
    const { error: trxErr } = await supabase
      .from('transactions')
      .insert({
        user_id: uid,
        amount: Number(rentalFee),
        type: 'payment',
        status: 'success',
        description: `Perpanjangan Sewa Akun Iklan ${account.account_id} (${subscriptionMonths} Bulan)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (trxErr) {
      console.error('Gagal mencatat transaksi:', trxErr)
      // Lanjut saja, tidak usah rollback karena ini MVP
    }

    // 5. Update masa aktif (akumulatif)
    let currentExpiresAt = new Date()
    if (account.subscription_expires_at) {
      const expiresAt = new Date(account.subscription_expires_at)
      if (expiresAt > currentExpiresAt) {
        currentExpiresAt = expiresAt // Akumulasi dari sisa waktu jika masih aktif
      }
    }
    
    // Tambahkan jumlah bulan (1 bulan = 4 minggu = 28 hari, agar siklus limit mingguan pas)
    const addedDays = Number(subscriptionMonths) * 28
    currentExpiresAt.setDate(currentExpiresAt.getDate() + addedDays)

    const { error: updateAccErr } = await supabase
      .from('ad_accounts')
      .update({
        subscription_expires_at: currentExpiresAt.toISOString(),
        status: 'active' // Pastikan status menjadi aktif lagi jika sebelumnya inactive
      })
      .eq('id', accountId)

    if (updateAccErr) {
      throw new Error('Gagal memperbarui masa aktif akun')
    }

    // 6. Notifikasi real-time untuk user
    const notifTitle = 'Perpanjangan Sewa Berhasil'
    const notifMessage = `Masa sewa akun iklan ${account.account_name || account.account_id} (${account.platform}) berhasil diperpanjang selama ${subscriptionMonths} bulan.`

    await supabase.from('notifications').insert({
      user_id: uid,
      type: 'ad_rent_extended',
      title: notifTitle,
      message: notifMessage,
      created_at: new Date().toISOString()
    })

    // Web Push
    sendPushToUser(event, uid, {
      title: notifTitle,
      body: notifMessage,
      url: '/dashboard/platform',
      tag: `ad-rent-extended-${accountId}`
    }).catch(() => {})

    return {
      success: true,
      message: 'Perpanjangan masa sewa berhasil dilakukan.',
      newExpiresAt: currentExpiresAt.toISOString()
    }

  } catch (error: any) {
    if (error.statusCode) throw error; // Re-throw Nuxt errors directly to preserve statusMessage
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Terjadi kesalahan saat memproses perpanjangan.'
    })
  }
})
