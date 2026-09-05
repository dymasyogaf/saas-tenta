import { serverSupabaseServiceRole } from '#supabase/server'
import { requireUser } from '../../utils/requireUser'
import { sendPushToUser } from '../../utils/webPush'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  const uid = user.id || (user as any).sub
  if (!uid) {
    throw createError({ statusCode: 401, message: 'User ID not found' })
  }

  const host = getRequestHost(event) || ''
  const isGlobal = host.startsWith('area.')

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
      throw createError({
        statusCode: 400,
        message: isGlobal ? 'No commission available to withdraw right now.' : 'Tidak ada komisi yang bisa diklaim saat ini.'
      })
    }

    // 2. Hitung total yang akan diklaim
    const totalClaimAmount = referrals.reduce((sum: number, r: any) => sum + (Number(r.reward_amount) || 0), 0)

    const minAmount = isGlobal ? 10 : 100000
    if (totalClaimAmount < minAmount) {
      const minText = isGlobal ? '10.00 USDT' : 'Rp 100.000'
      const curText = isGlobal ? `${totalClaimAmount.toFixed(2)} USDT` : `Rp ${totalClaimAmount.toLocaleString('id-ID')}`
      throw createError({
        statusCode: 400,
        message: isGlobal
          ? `Minimum commission payout is ${minText}. Your balance: ${curText}`
          : `Minimal pencairan komisi adalah ${minText}. Saldo Anda: ${curText}`
      })
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
      throw createError({
        statusCode: 500,
        message: isGlobal ? 'Failed to submit withdrawal request.' : 'Gagal membuat pengajuan pencairan.'
      })
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

    const formattedAmount = isGlobal
      ? `${totalClaimAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
      : `Rp ${totalClaimAmount.toLocaleString('id-ID')}`

    // Notifikasi real-time: Pengajuan Pencairan Dikirim
    const notifTitle = isGlobal ? 'Payout Request Submitted' : 'Pengajuan Pencairan Komisi Dikirim'
    const notifMessage = isGlobal
      ? `Your commission payout request of ${formattedAmount} has been submitted. Finance team will process it shortly.`
      : `Pengajuan pencairan komisi sebesar ${formattedAmount} telah dikirim. Tim Finance akan segera memprosesnya.`

    await (supabase as any).from('notifications').insert({
      user_id: uid,
      type: 'payout_pending',
      title: notifTitle,
      message: notifMessage,
      created_at: new Date().toISOString()
    })

    sendPushToUser(event, uid, {
      title: notifTitle,
      body: notifMessage,
      url: '/dashboard/affiliate',
      tag: `payout-pending-${withdrawal.id}`
    }).catch(() => {})

    return {
      success: true,
      message: isGlobal
        ? `Successfully requested commission payout of ${formattedAmount}. Finance team will process it shortly.`
        : `Berhasil mengajukan pencairan komisi sebesar ${formattedAmount}. Tim Finance akan segera memprosesnya.`,
      amount: totalClaimAmount
    }

  } catch (error: any) {
    console.error('Affiliate Claim Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || (isGlobal ? 'Server error processing withdrawal.' : 'Terjadi kesalahan pada server saat memproses pencairan komisi.')
    })
  }
})
