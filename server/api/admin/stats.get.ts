import { serverSupabaseServiceRole } from '#supabase/server'

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

    // 2. Request Akun (Meta/Google/TikTok)
    const { count: adsCount } = await applyDateFilter(
      supabase.from('ad_account_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending_review')
    )

    // 3. Antrean Keuangan (Withdraw & Alokasi Transfer)
    const { count: withdrawCount } = await applyDateFilter(
      supabase.from('transactions').select('*', { count: 'exact', head: true }).in('type', ['withdraw', 'transfer']).eq('status', 'pending')
    )

    // 4. Total Users
    const { count: totalUsers } = await applyDateFilter(
      supabase.from('users').select('*', { count: 'exact', head: true })
    )

    // 5. Total Ad Accounts (Approved)
    const { count: totalAds } = await applyDateFilter(
      supabase.from('ad_account_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved')
    )

    // 6. Top Up Berdasarkan Filter Custom Date
    let topupQuery = supabase.from('transactions').select('amount, created_at').eq('type', 'topup').eq('status', 'success')
    topupQuery = applyDateFilter(topupQuery)
    
    const { data: topupData } = await topupQuery
    const topupTotal = topupData?.reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0) || 0

    // 7. Estimasi Management Fee (Semua Top Up sukses dikali rata-rata 3.5%)
    // Gunakan filter yang sama dengan Top Up
    const estimatedFee = topupTotal * 0.035

    // 8. Recent Transactions
    let recentTxsQuery = supabase
      .from('transactions')
      .select('id, type, amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(8)
    
    recentTxsQuery = applyDateFilter(recentTxsQuery)
    const { data: recentTxs } = await recentTxsQuery
      
    // Siapkan data chart (distribusi per hari selama 7 hari terakhir dari endDate)
    const chartData = [0, 0, 0, 0, 0, 0, 0]
    const chartLabels = ['', '', '', '', '', '', '']
    
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(end)
        d.setDate(d.getDate() - i)
        
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        chartLabels[6 - i] = i === 0 ? 'Hari Ini' : (dayNames[d.getDay()] || '')
        
        const dStart = new Date(d)
        dStart.setHours(0, 0, 0, 0)
        
        const dEnd = new Date(d)
        dEnd.setHours(23, 59, 59, 999)
        
        // Cari transaksi di hari tersebut
        const dayTotal = topupData?.filter((tx: any) => {
          const txDate = new Date(tx.created_at)
          return txDate >= dStart && txDate <= dEnd
        }).reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0) || 0
        
        chartData[6 - i] = dayTotal
      }
    }

    return {
      kyc: kycCount || 0,
      ads: adsCount || 0,
      topup: topupTotal,
      withdraw: withdrawCount || 0,
      totalUsers: totalUsers || 0,
      totalAds: totalAds || 0,
      totalFee: estimatedFee,
      recentTxs: recentTxs || [],
      chartSeries: [{ name: 'Top Up', data: chartData }],
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
