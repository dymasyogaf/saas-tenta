import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Hanya super_admin yang bisa mereset data
  await requireAdmin(event, ['super_admin'])
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID Klien tidak valid' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)

  try {
    // 1. Hapus transaksi keuangan
    await supabase.from('transactions').delete().eq('user_id', id)
    
    // 2. Hapus permintaan akun iklan dan akun iklannya sendiri
    await supabase.from('ad_account_requests').delete().eq('user_id', id)
    await supabase.from('ad_accounts').delete().eq('user_id', id)
    
    // 3. Hapus data dukungan dan notifikasi
    await supabase.from('support_tickets').delete().eq('user_id', id)
    await supabase.from('notifications').delete().eq('user_id', id)
    
    // 4. Hapus data afiliasi/referral (opsional, tapi aman jika ada)
    await supabase.from('referral_withdrawals').delete().eq('user_id', id)
    await supabase.from('affiliate_profiles').delete().eq('user_id', id)
    
    // 5. Reset saldo menjadi 0
    await supabase.from('saldo').update({ balance: 0 }).eq('user_id', id)
    
    // 6. Reset status KYC user menjadi belum verifikasi (unverified)
    await supabase.from('users').update({ 
      verification_status: 'unverified',
      verification_details: null
    }).eq('id', id)

    return { success: true, message: 'Data Klien berhasil direset kembali seperti semula' }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err.message || 'Gagal mereset data klien' })
  }
})
