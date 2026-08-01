import { serverSupabaseServiceRole } from '#supabase/server'

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
      .select('user_id, amount, status')
      .eq('id', id)
      .single()

    if (fetchError || !withdrawal) {
      throw createError({ statusCode: 404, message: 'Pengajuan tidak ditemukan' })
    }

    if (withdrawal.status !== 'pending') {
      throw createError({ statusCode: 400, message: 'Hanya pengajuan dengan status pending yang dapat disetujui' })
    }

    // 1. Update status menjadi approved
    const { error: updateError } = await supabase
      .from('affiliate_withdrawals')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (updateError) throw updateError

    // 2. Buat notifikasi untuk user
    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      title: 'Pencairan Komisi Berhasil',
      message: `Pencairan komisi afiliasi Anda sebesar Rp ${withdrawal.amount.toLocaleString('id-ID')} telah disetujui dan ditransfer ke rekening Anda.`,
      type: 'system',
      is_read: false
    })

    // 3. Catat di tabel transactions
    await supabase.from('transactions').insert({
      user_id: withdrawal.user_id,
      amount: withdrawal.amount,
      type: 'affiliate_commission',
      status: 'success',
      payment_method: 'finance_transfer',
      description: 'Pencairan komisi afiliasi ke rekening bank',
      reference_id: `WD-${id.split('-')[0]}`
    })

    return { success: true, message: 'Pengajuan pencairan berhasil disetujui.' }
  } catch (error: any) {
    console.error('Error approving withdrawal:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Gagal menyetujui pengajuan pencairan'
    })
  }
})
