import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*, users!inner(full_name, phone)')
      .eq('status', 'active')
      .gt('limit_amount', 0)

    if (error) throw error

    // Filter secara in-memory untuk kondisi saldo < 300.000
    const lowBalanceData = (data || []).filter((acc: any) => {
      const saldo = Number(acc.saldo) || 0
      
      // Kriteria Sisa Anggaran Menipis: Saldo di bawah Rp 300.000
      if (saldo < 300000) return true
        
      return false
    })

    // Sort by terendah saldonya
    lowBalanceData.sort((a, b) => Number(a.saldo) - Number(b.saldo))

    return lowBalanceData
  } catch (error: any) {
    console.error('Error fetching low balance accounts:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data saldo menipis'
    })
  }
})
