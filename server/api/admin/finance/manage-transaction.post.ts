import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Hanya super_admin yang boleh akses
  await requireAdmin(event, ['super_admin'])
  const supabase = serverSupabaseServiceRole<any>(event)
  const body = await readBody(event)
  const { transaction_id, action } = body

  if (!transaction_id || !action) {
    throw createError({ statusCode: 400, statusMessage: 'transaction_id dan action wajib diisi' })
  }

  try {
    if (action === 'delete') {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction_id)

      if (error) throw error
      return { success: true, message: 'Transaksi berhasil dihapus' }
    }

    if (action === 'to_sandbox') {
      const { error } = await supabase
        .from('transactions')
        .update({ is_sandbox: true })
        .eq('id', transaction_id)

      if (error) throw error
      return { success: true, message: 'Transaksi dipindahkan ke Sandbox' }
    }

    if (action === 'to_production') {
      const { error } = await supabase
        .from('transactions')
        .update({ is_sandbox: false })
        .eq('id', transaction_id)

      if (error) throw error
      return { success: true, message: 'Transaksi dipindahkan ke Produksi' }
    }

    throw createError({ statusCode: 400, statusMessage: 'Action tidak valid. Gunakan: delete, to_sandbox, to_production' })
  } catch (error: any) {
    console.error('Error manage transaction:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Gagal memproses transaksi'
    })
  }
})
