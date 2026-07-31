import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance', 'super_admin'])
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
      .select('user_id, amount, status')
      .eq('id', id)
      .single()

    if (fetchError || !withdrawal) {
      throw createError({ statusCode: 404, message: 'Pengajuan tidak ditemukan' })
    }

    if (withdrawal.status !== 'pending') {
      throw createError({ statusCode: 400, message: 'Hanya pengajuan dengan status pending yang dapat ditolak' })
    }

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
    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      title: 'Pencairan Komisi Ditolak',
      message: `Pencairan komisi afiliasi Anda sebesar Rp ${withdrawal.amount.toLocaleString('id-ID')} ditolak. Alasan: ${reason}`,
      type: 'system',
      is_read: false
    })

    return { success: true, message: 'Pengajuan pencairan berhasil ditolak.' }
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Gagal menolak pengajuan pencairan'
    })
  }
})
