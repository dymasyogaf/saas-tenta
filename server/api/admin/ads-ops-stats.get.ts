import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  
  try {
    // 1. Antrean Pekerjaan
    // a. Request Akun Baru
    const { count: pendingAdsAccount } = await supabase
      .from('ad_account_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_review', 'processing'])

    // b. Request Top Up Anggaran
    const { count: pendingBudget } = await supabase
      .from('ad_budget_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // 2. Kesehatan Akun
    // a. Akun Aktif
    const { count: activeAccounts } = await supabase
      .from('ad_accounts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'approved'])

    // b. Akun Bermasalah (Banned/Disabled)
    const { count: bannedAccounts } = await supabase
      .from('ad_accounts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['banned', 'disabled', 'error', 'restricted'])

    // c. Saldo Menipis (Karena limit ada di backend, kita query yang saldo < 500.000 atau saldo < limit * 0.2)
    // Supabase tidak bisa query (saldo < limit_amount * 0.2) langsung dengan PostgREST sederhana tanpa RPC.
    // Jadi kita fetch saldo dan limit dari akun aktif, lalu filter di JS.
    const { data: accountsData } = await supabase
      .from('ad_accounts')
      .select('saldo, limit_amount')
      .in('status', ['active', 'approved'])

    let lowBalanceAccounts = 0
    if (accountsData) {
      lowBalanceAccounts = accountsData.filter((acc: any) => {
        const saldo = Number(acc.saldo) || 0
        const limit = Number(acc.limit_amount) || 0
        if (limit > 0 && saldo <= (limit * 0.2)) return true
        if (limit === 0 && saldo <= 0) return true
        return false
      }).length
    }

    // 3. Aktivitas Terkini (Recent Activities)
    // Ambil 5 riwayat alokasi anggaran terakhir
    const { data: recentBudgets } = await supabase
      .from('ad_budget_requests')
      .select('id, amount, status, updated_at, ad_accounts(account_name, platform), users(full_name)')
      .neq('status', 'pending')
      .order('updated_at', { ascending: false })
      .limit(5)

    return {
      success: true,
      pendingAdsAccount: pendingAdsAccount || 0,
      pendingBudget: pendingBudget || 0,
      activeAccounts: activeAccounts || 0,
      bannedAccounts: bannedAccounts || 0,
      lowBalanceAccounts,
      recentBudgets: recentBudgets || []
    }

  } catch (error: any) {
    console.error('Error fetching ads ops stats:', error)
    return { 
      success: false, 
      message: error.message,
      pendingAdsAccount: 0,
      pendingBudget: 0,
      activeAccounts: 0,
      bannedAccounts: 0,
      lowBalanceAccounts: 0,
      recentBudgets: []
    }
  }
})
