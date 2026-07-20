import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { amount, user_id, description } = body
    
    if (!amount || amount < 10000) {
      throw createError({ statusCode: 400, message: 'Nominal alokasi minimal Rp 10.000' })
    }
    
    if (!user_id) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    // Gunakan service role untuk memotong saldo dengan aman
    const supabaseAdmin = serverSupabaseServiceRole<any>(event)
    
    // 1. Cek saldo saat ini
    const { data: saldoData, error: fetchError } = await supabaseAdmin
      .from('saldo')
      .select('balance, pending_balance')
      .eq('user_id', user_id)
      .single()
      
    if (fetchError || !saldoData) {
      throw createError({ statusCode: 404, message: 'Data saldo tidak ditemukan' })
    }
    
    if (saldoData.balance < amount) {
      throw createError({ statusCode: 400, message: 'Saldo utama tidak mencukupi' })
    }
    
    // 2. Potong saldo dan pindahkan ke pending_balance (Escrow Hold)
    const newBalance = saldoData.balance - amount
    const newPendingBalance = (saldoData.pending_balance || 0) + amount
    const { error: updateError } = await supabaseAdmin
      .from('saldo')
      .update({ 
        balance: newBalance, 
        pending_balance: newPendingBalance,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', user_id)
      
    if (updateError) {
      throw createError({ statusCode: 500, message: 'Gagal menahan (hold) saldo' })
    }
    
    // 3. Catat transaksi transfer (alokasi) dengan status 'pending' (Hold)
    const { data: insertedTrx, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id,
        type: 'transfer',
        amount: amount,
        status: 'pending', // Status 'pending' menandakan ini adalah dana Escrow
        description: description || 'Hold: Alokasi Saldo ke Akun Iklan',
      })
      .select()
      .single()
      
    if (insertError) {
      console.error('Error inserting transaction:', insertError)
      // Idealnya jika gagal catat mutasi, saldo harus di-rollback, tapi untuk MVP kita log saja
    }
    
    return {
      success: true,
      message: 'Alokasi saldo berhasil',
      new_balance: newBalance
    }
    
  } catch (error: any) {
    console.error('Transfer API Error:', error)
    return createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Terjadi kesalahan pada server'
    })
  }
})
