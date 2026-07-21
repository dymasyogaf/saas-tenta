import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { amount, user_id, ad_account_id, description } = body
    
    if (!amount || amount < 10000) {
      throw createError({ statusCode: 400, message: 'Nominal alokasi minimal Rp 10.000' })
    }
    
    if (!user_id) {
      throw createError({ statusCode: 401, message: 'Unauthorized' })
    }

    if (!ad_account_id) {
      throw createError({ statusCode: 400, message: 'Target Akun Iklan wajib dipilih' })
    }

    // Gunakan service role untuk bypass RLS (karena operasi cross-table)
    const supabaseAdmin = serverSupabaseServiceRole<any>(event)
    
    // 1. Cek saldo saat ini
    const { data: saldoData, error: fetchError } = await supabaseAdmin
      .from('saldo')
      .select('balance')
      .eq('user_id', user_id)
      .single()
      
    if (fetchError || !saldoData) {
      throw createError({ statusCode: 404, message: 'Data saldo tidak ditemukan' })
    }
    
    if (saldoData.balance < amount) {
      throw createError({ statusCode: 400, message: 'Saldo utama tidak mencukupi' })
    }

    // 2. Cek eksistensi Akun Iklan
    const { data: adAccount, error: accError } = await supabaseAdmin
      .from('ad_accounts')
      .select('id, limit_amount')
      .eq('account_id', ad_account_id)
      .eq('user_id', user_id)
      .single()

    if (accError || !adAccount) {
      throw createError({ statusCode: 404, message: 'Akun Iklan tidak ditemukan atau tidak valid' })
    }
    
    // 3. Potong saldo utama (Tanpa hold / pending_balance)
    const newBalance = saldoData.balance - amount
    const { error: updateError } = await supabaseAdmin
      .from('saldo')
      .update({ 
        balance: newBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', user_id)
      
    if (updateError) {
      throw createError({ statusCode: 500, message: 'Gagal memotong saldo' })
    }

    // 4. Tambahkan limit di Ad Account
    const newLimit = (adAccount.limit_amount || 0) + amount
    const { error: limitError } = await supabaseAdmin
      .from('ad_accounts')
      .update({ limit_amount: newLimit })
      .eq('id', adAccount.id)

    if (limitError) {
      // IDEALNYA ROLLBACK SALDO DISINI JIKA GAGAL
      console.error('Gagal menambah limit iklan:', limitError)
    }
    
    // 5. Catat transaksi transfer (alokasi) dengan status 'success'
    const { error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id,
        type: 'transfer',
        amount: amount,
        status: 'success', // Langsung sukses (Otomatisasi Opsi 2)
        description: description || `Alokasi Saldo ke Akun Iklan ${ad_account_id}`,
      })
      
    if (insertError) {
      console.error('Error inserting transaction:', insertError)
    }
    
    return {
      success: true,
      message: 'Alokasi saldo otomatis berhasil',
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
