import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // 1. Hitung antrean KYC
    const { count: kycCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending')

    // 2. Hitung antrean Ads Ops
    const { count: adsCount } = await supabase
      .from('ad_account_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_review', 'processing'])

    // 3. Hitung antrean Keuangan (Finance)
    const { count: financeCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .in('type', ['withdraw', 'transfer'])
      .eq('status', 'pending')

    return {
      kyc: kycCount || 0,
      ads: adsCount || 0,
      finance: financeCount || 0
    }
  } catch (error) {
    console.error('Error fetching admin badges:', error)
    return { kyc: 0, ads: 0, finance: 0 }
  }
})
