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
    // a. Request Akun Baru
    const { count: adsAccountCount } = await supabase
      .from('ad_account_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_review', 'processing'])

    // b. Request Top Up Anggaran
    const { count: adsBudgetCount } = await supabase
      .from('ad_budget_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const adsCount = (adsAccountCount || 0) + (adsBudgetCount || 0)

    // 3. Hitung antrean Keuangan (Finance)
    const { count: financeCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .in('type', ['withdraw', 'transfer'])
      .eq('status', 'pending')

    // 4. Hitung antrean Sewa Mau Habis (<= 7 Hari)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    const { count: expiringRentalsCount } = await supabase
      .from('ad_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .not('subscription_expires_at', 'is', null)
      .lte('subscription_expires_at', sevenDaysFromNow.toISOString())

    // 5. Hitung antrean Saldo Menipis (<= 15% dari limit)
    const { data: accountsData } = await supabase
      .from('ad_accounts')
      .select('saldo, limit_amount')
      .eq('status', 'active')
      .gt('limit_amount', 0)
      
    const lowBalanceRentalsCount = (accountsData || []).filter((acc: any) => {
      const saldo = Number(acc.saldo) || 0
      const limit = Number(acc.limit_amount) || 0
      return saldo <= (limit * 0.15)
    }).length

    // 6. Hitung antrean Tiket Bantuan (Belum diassign)
    const { count: supportCount } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .is('assigned_to_role', null)
      .neq('status', 'closed')

    return {
      kyc: kycCount || 0,
      ads: adsCount || 0,
      finance: financeCount || 0,
      expiringRentals: expiringRentalsCount || 0,
      lowBalanceRentals: lowBalanceRentalsCount || 0,
      support: supportCount || 0
    }
  } catch (error) {
    console.error('Error fetching admin badges:', error)
    return { kyc: 0, ads: 0, finance: 0, expiringRentals: 0, lowBalanceRentals: 0, support: 0 }
  }
})
