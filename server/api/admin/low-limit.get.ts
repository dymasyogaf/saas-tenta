import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const supabase = await serverSupabaseServiceRole<any>(event)

  try {
    const { data, error } = await supabase
      .from('ad_accounts')
      .select('*, users(full_name, email, phone, active_package, package_weekly_limit)')
      .eq('status', 'active')

    if (error) throw error

    // Filter secara in-memory untuk kondisi Sisa Limit < 300.000
    const lowLimitData = (data || []).filter((acc: any) => {
      const activePkg = (acc.users?.active_package || '').toLowerCase()
      const userLimit = Number(acc.users?.package_weekly_limit) || Number(acc.limit_amount) || 5000000

      // Paket Scale / Unlimited Limit (>= 999.000.000) tidak pernah dianggap menipis
      if (activePkg === 'scale' || userLimit >= 999000000) {
        return false
      }

      const weeklySpend = Number(acc.weekly_spend) || 0
      const sisaLimit = userLimit - weeklySpend
      
      // Kriteria Sisa Limit Menipis: Sisa limit di bawah Rp 300.000
      return sisaLimit < 300000
    })

    // Sort by limit tersisa (terendah = paling kritis)
    lowLimitData.sort((a, b) => {
      const aLimit = Number(a.users?.package_weekly_limit) || Number(a.limit_amount) || 5000000
      const bLimit = Number(b.users?.package_weekly_limit) || Number(b.limit_amount) || 5000000
      const aRemaining = aLimit - (Number(a.weekly_spend) || 0)
      const bRemaining = bLimit - (Number(b.weekly_spend) || 0)
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
