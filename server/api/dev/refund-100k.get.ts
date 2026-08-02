import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseServiceRole<any>(event)
  
  // Ambil user yang sedang login (untuk tahu siapa yang minta refund)
  const userClient = await serverSupabaseClient(event)
  const { data: { user } } = await userClient.auth.getUser()
  
  if (!user) {
    return { success: false, message: 'Harus login dulu' }
  }

  const userId = user.id

  // 1. Tambahkan saldo sebesar 100.000 ke balance utama
  const { data: saldoData } = await supabase.from('saldo').select('balance').eq('user_id', userId).single()
  
  if (!saldoData) {
    return { success: false, message: 'Saldo tidak ditemukan' }
  }

  const newBalance = Number(saldoData.balance) + 100000
  
  await supabase.from('saldo').update({ balance: newBalance }).eq('user_id', userId)

  // 2. Buat mutasi Refund Pembatalan
  await supabase.from('transactions').insert({
    user_id: userId,
    amount: 100000,
    type: 'deposit', // deposit agar warnanya hijau / nambah saldo
    status: 'success',
    description: 'Refund Manual - Penyesuaian Saldo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  return {
    success: true,
    message: `Refund berhasil. Saldo dikembalikan 100.000. Saldo saat ini: ${newBalance}`
  }
})
