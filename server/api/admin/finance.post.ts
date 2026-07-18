import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { transaction_id, action } = body // action: 'approve' | 'reject'

    if (!transaction_id || !action) {
      throw new Error('ID Transaksi dan Aksi wajib dikirim')
    }

    // 1. Ambil data transaksi
    const { data: transaction, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single()

    if (fetchErr || !transaction) throw new Error('Data transaksi tidak ditemukan')

    if (transaction.type !== 'withdraw') {
      throw new Error('Hanya transaksi pencairan (withdraw) yang dapat diproses melalui panel ini')
    }

    if (transaction.status !== 'pending') {
      throw new Error('Transaksi ini sudah diproses sebelumnya')
    }

    // 2. Update status transaksi
    const newStatus = action === 'approve' ? 'success' : 'failed'
    
    const { error: updateErr } = await supabase
      .from('transactions')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction_id)

    if (updateErr) throw updateErr

    // Catatan: Jika rejected, idealnya kita mengembalikan saldo ke balance. 
    // Karena MVP withdraw di frontend belum ada, kita asumsikan untuk sekarang 
    // hanya merubah status transaksi.

    return { 
      success: true, 
      message: action === 'approve' ? 'Pencairan berhasil disetujui' : 'Pencairan ditolak' 
    }

  } catch (error: any) {
    console.error('Error in finance ops update:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal memproses transaksi'
    })
  }
})
