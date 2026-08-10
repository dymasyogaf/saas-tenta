import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)

  try {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*, users(full_name, email, phone)')
      .eq('status', 'active')
      .gt('limit_amount', 0)

    if (error) throw error

    // Filter secara in-memory untuk kondisi Sisa Limit < 300.000
    const lowLimitData = (data || []).filter((acc: any) => {
      const limit = Number(acc.limit_amount) || 0
      const weeklySpend = Number(acc.weekly_spend) || 0
      
      const sisaLimit = limit - weeklySpend
      
      // Kriteria Sisa Limit Menipis: Sisa limit di bawah Rp 300.000
      if (sisaLimit < 300000) return true
        
      return false
    })

    // Sort by limit tersisa (terendah = paling kritis)
    lowLimitData.sort((a, b) => {
      const aRemaining = (Number(a.limit_amount) || 0) - (Number(a.weekly_spend) || 0)
      const bRemaining = (Number(b.limit_amount) || 0) - (Number(b.weekly_spend) || 0)
      return aRemaining - bRemaining
    })

    return {
      success: true,
      data: lowLimitData
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data Sisa Limit',
    })
  }
})
