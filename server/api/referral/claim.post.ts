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

    // 3. Buat pengajuan pencairan di affiliate_withdrawals
    const { data: withdrawal, error: wdError } = await (supabase as any)
      .from('affiliate_withdrawals')
      .insert({
        user_id: uid,
        amount: totalClaimAmount,
        status: 'pending'
      })
      .select('id')
      .single()

    if (wdError) {
      console.error('Withdrawal Insert Error:', wdError)
      throw createError({ statusCode: 500, message: 'Gagal membuat pengajuan pencairan.' })
    }

    // 4. Tandai referral sebagai sudah diklaim dan tautkan ke pengajuan ini
    const referralIds = referrals.map((r: any) => r.id)
    await (supabase as any)
      .from('referrals')
      .update({ 
        is_claimed: true, 
        withdrawal_id: withdrawal.id,
        updated_at: new Date().toISOString() 
      })
      .in('id', referralIds)

    return {
      success: true,
      message: `Berhasil mengajukan pencairan komisi sebesar Rp ${totalClaimAmount.toLocaleString('id-ID')}. Tim Finance akan segera memprosesnya.`,
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
