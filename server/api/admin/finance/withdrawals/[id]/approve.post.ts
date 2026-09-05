import { serverSupabaseServiceRole } from '#supabase/server'
import { sendPushToUser } from '../../../../../utils/webPush'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance', 'admin_compliance', 'super_admin'])
  const supabase = serverSupabaseServiceRole<any>(event)
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID pengajuan tidak ditemukan' })
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
      throw createError({ statusCode: 400, message: 'Hanya pengajuan dengan status pending yang dapat disetujui' })
    }

    const userObj = Array.isArray((withdrawal as any).users) ? (withdrawal as any).users[0] : (withdrawal as any).users
    let profile = userObj?.affiliate_profiles
    if (Array.isArray(profile)) profile = profile[0]
    const isCrypto = profile?.bank_name?.includes('USDT') || profile?.bank_name?.includes('TRC') || Number(withdrawal.amount) < 1000

    // 1. Update status menjadi approved
    const { error: updateError } = await supabase
      .from('affiliate_withdrawals')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) throw updateError

    // 2. Buat notifikasi untuk user
    const notifTitle = isCrypto ? 'Affiliate Payout Completed' : 'Pencairan Komisi Berhasil'
    const notifMessage = isCrypto
      ? `Your affiliate commission payout of ${Number(withdrawal.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT has been approved and sent to your TRC-20 wallet.`
      : `Pencairan komisi afiliasi Anda sebesar Rp ${Number(withdrawal.amount).toLocaleString('id-ID')} telah disetujui dan ditransfer ke rekening Anda.`

    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      title: notifTitle,
      message: notifMessage,
      type: 'payout_approved',
      is_read: false
    })

    // Web Push
    sendPushToUser(event, withdrawal.user_id, {
      title: notifTitle,
      body: notifMessage,
      url: '/dashboard/affiliate',
      tag: `payout-approved-${id}`
    }).catch(() => {})

    // 3. Catat di tabel transactions
    await supabase.from('transactions').insert({
      user_id: withdrawal.user_id,
      amount: withdrawal.amount,
      type: 'affiliate_commission',
      status: 'success',
      currency: isCrypto ? 'USD' : 'IDR',
      payment_method: isCrypto ? 'usdt_trc20' : 'finance_transfer',
      description: isCrypto ? 'Affiliate commission payout to USDT TRC-20 wallet' : 'Pencairan komisi afiliasi ke rekening bank',
      reference_id: `WD-${id.split('-')[0]}`
    })

    return { success: true, message: isCrypto ? 'Payout approved and marked as sent.' : 'Pengajuan pencairan berhasil disetujui.' }
  } catch (error: any) {
    console.error('Error approving withdrawal:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Gagal menyetujui pengajuan pencairan'
    })
  }
})
