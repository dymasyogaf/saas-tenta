import { serverSupabaseServiceRole } from '#supabase/server'
import { sendPushToUser } from '../../utils/webPush'

export default defineEventHandler(async (event) => {
  await requireAdmin(event, ['admin_finance', 'admin_compliance'])
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

    if (transaction.type !== 'withdraw' && transaction.type !== 'transfer') {
      throw new Error('Hanya transaksi pencairan (withdraw) dan alokasi iklan (transfer) yang dapat diproses')
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

    // Logika Escrow / Hold Saldo
    if (transaction.type === 'transfer') {
      // Ambil saldo user saat ini
      const { data: saldoData } = await supabase
        .from('saldo')
        .select('balance, pending_balance')
        .eq('user_id', transaction.user_id)
        .single()
        
      if (saldoData) {
        let newPending = (saldoData.pending_balance || 0) - transaction.amount
        if (newPending < 0) {
          console.warn(`[FINANCE WARNING] pending_balance negatif (${newPending}) untuk user ${transaction.user_id}. Kemungkinan inkonsistensi data.`)
          newPending = 0
        }
        
        if (action === 'approve') {
          // Approve: Uang sudah dipindah ke Meta, hold dihapus
          await supabase.from('saldo').update({ pending_balance: newPending }).eq('user_id', transaction.user_id)
        } else {
          // Reject: Kembalikan uang ke saldo utama
          const newBalance = (saldoData.balance || 0) + transaction.amount
          await supabase.from('saldo').update({ balance: newBalance, pending_balance: newPending }).eq('user_id', transaction.user_id)
        }
      }
    }

    // 3. Notifikasi real-time untuk user
    const formattedAmount = `Rp ${Number(transaction.amount).toLocaleString('id-ID')}`
    const notifTitle = action === 'approve' ? 'Transaksi Disetujui' : 'Transaksi Ditolak'
    const notifMessage = action === 'approve'
      ? `Transaksi Anda sebesar ${formattedAmount} telah disetujui dan berhasil diproses.`
      : `Transaksi Anda sebesar ${formattedAmount} ditolak. Dana telah dikembalikan ke saldo utama Anda.`

    await supabase.from('notifications').insert({
      user_id: transaction.user_id,
      type: action === 'approve' ? 'success' : 'error',
      title: notifTitle,
      message: notifMessage,
      created_at: new Date().toISOString()
    })

    sendPushToUser(event, transaction.user_id, {
      title: notifTitle,
      body: notifMessage,
      url: '/dashboard/saldo',
      tag: `finance-${action}-${transaction_id}`
    }).catch(() => {})

    return { 
      success: true, 
      message: action === 'approve' ? 'Transaksi disetujui dan dieksekusi' : 'Transaksi ditolak dan dana dikembalikan' 
    }

  } catch (error: any) {
    console.error('Error in finance ops update:', error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Gagal memproses transaksi'
    })
  }
})
