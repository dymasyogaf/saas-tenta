import { serverSupabaseServiceRole } from '#supabase/server'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  const uid = user.id || (user as any).sub
  if (!uid) {
    throw createError({ statusCode: 401, message: 'User ID not found' })
  }

  try {
    const today = new Date()
    
    // Akun 1: Kedaluwarsa besok lusa (Sisa 2 Hari) -> Memunculkan peringatan kuning
    const expires2Days = new Date(today)
    expires2Days.setDate(today.getDate() + 2)
    
    // Akun 2: Sudah Kedaluwarsa 1 hari yang lalu (Sisa -1 Hari) -> Memunculkan peringatan merah
    const expiredYesterday = new Date(today)
    expiredYesterday.setDate(today.getDate() - 1)

    // 1. Tambahkan saldo demo agar bisa test perpanjang
    const { data: saldoData } = await supabase.from('saldo').select('*').eq('user_id', uid).single()
    if (saldoData) {
      await supabase.from('saldo').update({ balance: Number(saldoData.balance) + 5000000 }).eq('user_id', uid)
    }

    // 2. Buat akun demo 1
    const { error: err1 } = await supabase.from('ad_accounts').insert({
      user_id: uid,
      platform: 'meta', // HARUS 'meta', 'google', atau 'tiktok' sesuai schema database
      account_id: '10000100001',
      account_name: 'Demo Akun - Sisa 2 Hari',
      status: 'active',
      subscription_expires_at: expires2Days.toISOString()
    })

    if (err1) throw new Error(err1.message)

    // 3. Buat akun demo 2
    const { error: err2 } = await supabase.from('ad_accounts').insert({
      user_id: uid,
      platform: 'google', // HARUS 'google'
      account_id: '9998887771',
      account_name: 'Demo Akun - Kedaluwarsa',
      status: 'active',
      subscription_expires_at: expiredYesterday.toISOString()
    })
    
    if (err2) throw new Error(err2.message)

    return { success: true, message: 'Data demo berhasil dibuat! Saldo ditambah 5 Juta. Silakan refresh halaman Saldo atau Profile.' }
  } catch (err: any) {
    return { success: false, message: `Gagal membuat akun demo: ${err.message}` }
  }
})
