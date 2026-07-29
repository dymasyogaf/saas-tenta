import { serverSupabaseServiceRole } from '#supabase/server'
import { serverSupabaseUser } from '#supabase/server'

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

  if (Number(rentalFee) <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Biaya sewa tidak valid' })
  }

  try {
    // 1. Dapatkan informasi Ad Account
    const { data: account, error: accErr } = await supabase
      .from('ad_accounts')
      .select('id, account_id, platform, account_name, subscription_expires_at')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (accErr || !account) {
      throw new Error('Akun Iklan tidak ditemukan')
    }

    // 2. Dapatkan saldo user
    const { data: saldoData, error: saldoErr } = await supabase
      .from('saldo')
      .select('balance, pending_balance')
      .eq('user_id', user.id)
      .single()

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
      .eq('user_id', user.id)

    if (updateSaldoErr) {
      throw new Error('Gagal memotong saldo')
    }

    // 4. Catat transaksi
    const { error: trxErr } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
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
    
    // Tambahkan jumlah bulan (diasumsikan 1 bulan = 30 hari untuk konsistensi di file ops.post.ts)
    const addedDays = Number(subscriptionMonths) * 30
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

    return {
      success: true,
      message: 'Perpanjangan masa sewa berhasil dilakukan.',
      newExpiresAt: currentExpiresAt.toISOString()
    }

  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Terjadi kesalahan saat memproses perpanjangan.'
    })
  }
})
