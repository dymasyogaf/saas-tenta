import { serverSupabaseServiceRole } from '#supabase/server'
import { sendPushToUser } from '../../../../../utils/webPush'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance', 'admin_compliance', 'super_admin'])
  const supabase = serverSupabaseServiceRole<any>(event)
  const id = getRouterParam(event, 'id')
  
  const body = await readBody(event)
  const reason = body?.reason

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID pengajuan tidak ditemukan' })
  }
  
  if (!reason) {
    throw createError({ statusCode: 400, message: 'Alasan penolakan wajib diisi' })
  }

  try {
    // Ambil data withdrawal
    const { data: withdrawal, error: fetchError } = await supabase
      .from('affiliate_withdrawals')
      .select(`
        user_id, 
        amount, 
        status,
        users (
          affiliate_profiles (bank_name, bank_account)
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !withdrawal) {
      throw createError({ statusCode: 404, message: 'Pengajuan tidak ditemukan' })
    }

    if (withdrawal.status !== 'pending') {
      throw createError({ statusCode: 400, message: 'Hanya pengajuan dengan status pending yang dapat ditolak' })
    }

    const userObj = Array.isArray((withdrawal as any).users) ? (withdrawal as any).users[0] : (withdrawal as any).users
    let profile = userObj?.affiliate_profiles
    if (Array.isArray(profile)) profile = profile[0]
    const isCrypto = profile?.bank_name?.includes('USDT') || profile?.bank_name?.includes('TRC') || Number(withdrawal.amount) < 1000

    // 1. Update status menjadi rejected
    const { error: updateError } = await supabase
      .from('affiliate_withdrawals')
      .update({ 
        status: 'rejected', 
        rejection_reason: reason,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (updateError) throw updateError

    // 2. Kembalikan status referrals menjadi belum diklaim
    await supabase
      .from('referrals')
      .update({ 
        is_claimed: false, 
        withdrawal_id: null,
        updated_at: new Date().toISOString() 
      })
      .eq('withdrawal_id', id)

    // 3. Buat notifikasi untuk user
    const notifTitle = isCrypto ? 'Affiliate Payout Rejected' : 'Pencairan Komisi Ditolak'
    const notifMessage = isCrypto
      ? `Your affiliate commission payout of ${Number(withdrawal.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT was rejected. Reason: ${reason}`
      : `Pencairan komisi afiliasi Anda sebesar Rp ${Number(withdrawal.amount).toLocaleString('id-ID')} ditolak. Alasan: ${reason}`

    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      title: notifTitle,
      message: notifMessage,
      type: 'payout_rejected',
      is_read: false
    })

    // Web Push
    sendPushToUser(event, withdrawal.user_id, {
      title: notifTitle,
      body: notifMessage,
      url: '/dashboard/affiliate',
      tag: `payout-rejected-${id}`
    }).catch(() => {})

    return { success: true, message: isCrypto ? 'Payout request rejected and commission restored.' : 'Pengajuan pencairan berhasil ditolak.' }
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Gagal menolak pengajuan pencairan'
    })
  }
})
