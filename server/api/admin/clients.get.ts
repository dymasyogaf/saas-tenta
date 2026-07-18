import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Gunakan Service Role untuk menembus RLS (Row Level Security)
  // Agar Admin bisa melihat Saldo milik user lain
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // 1. Ambil data semua user
    const { data: usersData, error: usersErr } = await supabase
      .from('users')
      .select('id, email, full_name, created_at, verification_status')
      .order('created_at', { ascending: false })

    if (usersErr) throw usersErr
    if (!usersData) return []

    // 2. Ambil data saldo semua user
    const { data: saldoData } = await supabase
      .from('saldo')
      .select('user_id, balance')

    // 3. Ambil data jumlah akun iklan (Hanya yang Approved)
    const { data: adsData } = await supabase
      .from('ad_account_requests')
      .select('user_id')
      .eq('status', 'approved')

    // Gabungkan semua data
    const merged = usersData.map((user: any) => {
      const userSaldo = saldoData?.find((s: any) => s.user_id === user.id)
      const userAdsCount = adsData?.filter((a: any) => a.user_id === user.id).length || 0

      return {
        ...user,
        balance: userSaldo?.balance || 0,
        ad_accounts_count: userAdsCount
      }
    })
    
    return merged
  } catch (error: any) {
    console.error('Error fetching admin clients:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data klien'
    })
  }
})
