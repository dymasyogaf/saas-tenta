import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<any>(event)
  
  // Proteksi endpoint dengan secret key
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    // 1 jam yang lalu
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Cari transaksi topup atau subscription yang masih pending dan lebih dari 1 jam
    const { data: pendingTxs, error: fetchErr } = await supabase
      .from('transactions')
      .select('id')
      .in('type', ['topup', 'subscription'])
      .eq('status', 'pending')
      .lt('created_at', oneHourAgo)

    if (fetchErr) {
      throw new Error(`Gagal mengambil transaksi pending: ${fetchErr.message}`)
    }

    if (!pendingTxs || pendingTxs.length === 0) {
      return { success: true, message: 'Tidak ada transaksi pending yang kedaluwarsa.' }
    }

    // Hapus transaksi yang kedaluwarsa
    const txIds = pendingTxs.map((tx: any) => tx.id)
    
    const { error: deleteErr } = await supabase
      .from('transactions')
      .delete()
      .in('id', txIds)

    if (deleteErr) {
      throw new Error(`Gagal menghapus transaksi: ${deleteErr.message}`)
    }

    return { 
      success: true, 
      message: `${pendingTxs.length} transaksi pending telah dihapus karena melebihi 1 jam.`,
      deletedIds: txIds
    }
  } catch (error: any) {
    console.error('Error in cleanup-pending-transactions cron:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
