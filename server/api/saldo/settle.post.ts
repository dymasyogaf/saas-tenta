import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { transaction_id, actual_spent } = body
    
    if (!transaction_id || actual_spent === undefined || actual_spent < 0) {
      throw createError({ statusCode: 400, message: 'Parameter transaction_id dan actual_spent wajib disertakan' })
    }
    
    const supabaseAdmin = serverSupabaseServiceRole<any>(event)
    
    // 1. Ambil transaksi hold awal
    const { data: trx, error: trxError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .eq('status', 'pending')
      .eq('type', 'transfer')
      .single()
      
    if (trxError || !trx) {
      throw createError({ statusCode: 404, message: 'Transaksi Escrow tidak ditemukan atau sudah diselesaikan' })
    }

    if (actual_spent > trx.amount) {
      throw createError({ statusCode: 400, message: 'Pengeluaran aktual tidak boleh melebihi jumlah saldo yang ditahan (Hold)' })
    }

    const userId = trx.user_id
    const refundAmount = trx.amount - actual_spent

    // 2. Ambil saldo saat ini
    const { data: saldoData, error: saldoError } = await supabaseAdmin
      .from('saldo')
      .select('balance, pending_balance')
      .eq('user_id', userId)
      .single()

    if (saldoError || !saldoData) {
      throw createError({ statusCode: 404, message: 'Data saldo klien tidak ditemukan' })
    }

    // 3. Kalkulasi Saldo Baru (Release & Refund)
    const newPendingBalance = saldoData.pending_balance - trx.amount
    const newBalance = saldoData.balance + refundAmount

    // 4. Update Saldo
    const { error: updateSaldoError } = await supabaseAdmin
      .from('saldo')
      .update({ 
        balance: newBalance, 
        pending_balance: newPendingBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId)

    if (updateSaldoError) {
      throw createError({ statusCode: 500, message: 'Gagal me-release saldo' })
    }

    // 5. Update transaksi asli menjadi success
    await supabaseAdmin
      .from('transactions')
      .update({ status: 'success', updated_at: new Date().toISOString() })
      .eq('id', transaction_id)

    // 6. Buat record transaksi 'payment' (Expense aktual)
    if (actual_spent > 0) {
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        type: 'payment',
        amount: actual_spent,
        status: 'success',
        description: `Release: Tagihan Iklan dari Alokasi ${trx.amount}`,
      })
    }

    // 7. Buat record transaksi 'refund' jika ada kembalian
    if (refundAmount > 0) {
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        type: 'refund',
        amount: refundAmount,
        status: 'success',
        description: `Refund: Sisa Saldo Iklan yang tidak terpakai`,
      })
    }

    return {
      success: true,
      message: 'Settlement Escrow berhasil',
      details: {
        original_hold: trx.amount,
        actual_spent: actual_spent,
        refunded: refundAmount,
        new_balance: newBalance,
        new_pending_balance: newPendingBalance
      }
    }
    
  } catch (error: any) {
    console.error('Escrow Settlement Error:', error)
    return createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Terjadi kesalahan pada server'
    })
  }
})
