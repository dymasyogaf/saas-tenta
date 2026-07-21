import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Keamanan: Pastikan ini hanya bisa dijalankan di mode development
  if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 403, statusMessage: 'Fitur Reset Dev dinonaktifkan di Production' })
  }

  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // Ambil ID dan hapus ad_accounts
    const { data: accs } = await supabase.from('ad_accounts').select('id')
    if (accs && accs.length > 0) {
      for (const a of accs) {
        await supabase.from('ad_accounts').delete().eq('id', a.id)
      }
    }

    // Ambil ID dan hapus ad_account_requests
    const { data: reqs } = await supabase.from('ad_account_requests').select('id')
    if (reqs && reqs.length > 0) {
      for (const r of reqs) {
        await supabase.from('ad_account_requests').delete().eq('id', r.id)
      }
    }

    return { success: true, message: 'Semua data akun iklan berhasil di-reset (Dibersihkan)!' }
  } catch (error: any) {
    console.error('Gagal reset dev:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
