import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const uid = user.id || (user as any).sub
  if (!uid) {
    throw createError({ statusCode: 401, message: 'User ID not found' })
  }

  const supabase = await serverSupabaseServiceRole(event)

  try {
    // 1. Ambil data referral yang siap diklaim
    const { data: referrals, error: refError } = await (supabase as any)
      .from('referrals')
      .select('id, reward_amount')
      .eq('referrer_id', uid)
      .eq('status', 'reward_given')
      .eq('is_claimed', false)

    if (refError) throw refError

    if (!referrals || referrals.length === 0) {
      throw createError({ statusCode: 400, message: 'Tidak ada komisi yang bisa diklaim saat ini.' })
    }

    // 2. Hitung total yang akan diklaim
    const totalClaimAmount = referrals.reduce((sum: number, r: any) => sum + (Number(r.reward_amount) || 0), 0)

    if (totalClaimAmount < 100000) {
      throw createError({ statusCode: 400, message: `Minimal pencairan komisi adalah Rp 100.000. Saldo Anda: Rp ${totalClaimAmount.toLocaleString('id-ID')}` })
    }

    // 3. Tambahkan saldo ke ad balance pengguna
    const { data: currentSaldo, error: saldoError } = await (supabase as any)
      .from('saldo')
      .select('id, balance')
      .eq('user_id', uid)
      .single()

    if (saldoError) {
      // Jika belum punya saldo, kita insert saja
      await (supabase as any).from('saldo').insert({ user_id: uid, balance: totalClaimAmount, pending_balance: 0 })
    } else {
      const newBalance = (Number(currentSaldo.balance) || 0) + totalClaimAmount
      await (supabase as any).from('saldo').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', currentSaldo.id)
    }

    // 4. Catat di tabel transactions (Opsional tapi direkomendasikan untuk tracking)
    await (supabase as any).from('transactions').insert({
      user_id: uid,
      amount: totalClaimAmount,
      type: 'affiliate_commission',
      status: 'success',
      payment_method: 'system',
      description: 'Pencairan komisi afiliasi ke saldo iklan',
      reference_id: `AF-${Date.now()}`
    })

    // 5. Tandai referral sebagai sudah diklaim
    const referralIds = referrals.map((r: any) => r.id)
    await (supabase as any)
      .from('referrals')
      .update({ is_claimed: true, updated_at: new Date().toISOString() })
      .in('id', referralIds)

    return {
      success: true,
      message: `Berhasil mencairkan komisi sebesar Rp ${totalClaimAmount.toLocaleString('id-ID')} ke saldo iklan Anda.`,
      amount: totalClaimAmount
    }

  } catch (error: any) {
    console.error('Affiliate Claim Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Terjadi kesalahan pada server saat memproses pencairan komisi.'
    })
  }
})
