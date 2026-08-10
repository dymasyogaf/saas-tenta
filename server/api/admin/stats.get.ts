import { serverSupabaseServiceRole } from '#supabase/server'
import { getChartDateLabel, getStartOfDay, getEndOfDay } from '../../utils/date'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole<any>(event)
  const query = getQuery(event)
  
  try {
    const startDate = query.startDate as string
    const endDate = query.endDate as string

    // Helper function for applying date filters
    const applyDateFilter = (queryObj: any) => {
      if (startDate && endDate) {
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        
        return queryObj.gte('created_at', start.toISOString()).lte('created_at', end.toISOString())
      }
      return queryObj
    }

    // 1. Antrean KYC
    const { count: kycCount } = await applyDateFilter(
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending')
    )

    // 2. Request Akun (Meta/Google/TikTok) & Top Up Anggaran
    const { count: adsAccountCount } = await applyDateFilter(
      supabase.from('ad_account_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_review')
    )
    
    const { count: adsBudgetCount } = await applyDateFilter(
      supabase.from('ad_budget_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    )

    const adsCount = (adsAccountCount || 0) + (adsBudgetCount || 0)

    // 3. Antrean Keuangan (Withdraw & Alokasi Transfer)
    const { count: withdrawCount } = await applyDateFilter(
      supabase.from('transactions').select('*', { count: 'exact', head: true }).in('type', ['withdraw', 'transfer']).eq('status', 'pending')
    )

    // 4. Total Users & Verified Users
    let usersQuery = supabase.from('users').select('created_at, verification_status')
    usersQuery = applyDateFilter(usersQuery)
    const { data: usersData } = await usersQuery
    const totalUsers = usersData?.length || 0
    const verifiedUsers = usersData?.filter((u: any) => u.verification_status === 'verified').length || 0

    // 5. Total Ad Accounts & Unique Advertising Clients
    let adsQuery = supabase.from('ad_accounts').select('user_id').eq('status', 'active')
    adsQuery = applyDateFilter(adsQuery)
    const { data: adsData } = await adsQuery
    const totalAds = adsData?.length || 0
    const uniqueClients = new Set(adsData?.map((a: any) => a.user_id)).size

    // 5.5 Expiring Rentals
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    
    let expiringQuery = supabase.from('ad_accounts').select('id').eq('status', 'active').not('subscription_expires_at', 'is', null).lte('subscription_expires_at', sevenDaysFromNow.toISOString())
    // Note: Do we apply date filter to expiring rentals? Probably not, since it's a current state alert.
    const { data: expiringData } = await expiringQuery
    const expiringRentals = expiringData?.length || 0

    // 5.6 Low Balance Rentals (< 300.000)
    let lowBalanceQuery = supabase.from('ad_accounts').select('saldo, limit_amount, weekly_spend').eq('status', 'active').gt('limit_amount', 0)
    const { data: lbData } = await lowBalanceQuery
    const lowBalanceRentals = (lbData || []).filter((acc: any) => {
      const saldo = Number(acc.saldo) || 0
      return saldo < 300000
    }).length

    // 5.7 Low Limit Rentals (limit_amount - weekly_spend < 300.000)
    const lowLimitRentals = (lbData || []).filter((acc: any) => {
      const limit = Number(acc.limit_amount) || 0
      const weeklySpend = Number(acc.weekly_spend) || 0
      return (limit - weeklySpend) < 300000
    }).length

    // 6. Top Up Berdasarkan Filter Custom Date
    let topupQuery = supabase.from('transactions').select('amount, fee_amount, created_at').eq('type', 'topup').eq('status', 'success')
    topupQuery = applyDateFilter(topupQuery)
    
    const { data: topupData } = await topupQuery
    const topupTotal = topupData?.reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0) || 0
    const totalActualFee = topupData?.reduce((sum: number, tx: any) => sum + (Number(tx.fee_amount) || 0), 0) || 0

    // 7. Recent Transactions
    let recentTxsQuery = supabase
      .from('transactions')
      .select('id, type, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(4)
    
    recentTxsQuery = applyDateFilter(recentTxsQuery)
    const { data: recentTxs } = await recentTxsQuery
      
    // Siapkan data chart (distribusi per hari sesuai rentang tanggal)
    const chartData: number[] = []
    const userChartData: number[] = []
    const chartLabels: string[] = []
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      
      const diffTime = end.getTime() - start.getTime()
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Limit to prevent massive arrays (max 31 days for month view)
      if (diffDays > 31) diffDays = 31
      if (diffDays <= 0) diffDays = 1
      
      for (let i = diffDays - 1; i >= 0; i--) {
        const d = new Date(end)
        d.setDate(d.getDate() - i)
        
        const label = getChartDateLabel(d)
        chartLabels.push(label)
        
        const dStart = getStartOfDay(d)
        const dEnd = getEndOfDay(d)
        
        // Cari transaksi di hari tersebut
        const dayTotal = topupData?.filter((tx: any) => {
          const txDate = new Date(tx.created_at)
          return txDate >= dStart && txDate <= dEnd
        }).reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0) || 0
        
        chartData.push(dayTotal)
        
        // Cari pendaftar baru di hari tersebut
        const newUsersDay = usersData?.filter((u: any) => {
          const uDate = new Date(u.created_at)
          return uDate >= dStart && uDate <= dEnd
        }).length || 0
        
        userChartData.push(newUsersDay)
      }
    }

    return {
      kyc: kycCount || 0,
      ads: adsCount || 0,
      topup: topupTotal,
      withdraw: withdrawCount || 0,
      totalUsers: totalUsers || 0,
      verifiedUsers: verifiedUsers || 0,
      uniqueClients: uniqueClients || 0,
      totalAds: totalAds || 0,
      totalFee: totalActualFee,
      expiringRentals: expiringRentals || 0,
      lowBalanceRentals: lowBalanceRentals || 0,
      lowLimitRentals: lowLimitRentals || 0,
      recentTxs: recentTxs || [],
      chartSeries: [
        { name: 'Total Top Up', data: chartData }
      ],
      userChartSeries: [
        { name: 'Pendaftar Baru', data: userChartData }
      ],
      chartLabels: chartLabels
    }

  } catch (error: any) {
    console.error('Error fetching admin stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Gagal mengambil data statistik'
    })
  }
})
