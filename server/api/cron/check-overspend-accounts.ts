import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<any>(event)
  
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    // 1. Get all active ad accounts with their user's weekly limit
    const { data: activeAccounts, error: fetchErr } = await supabase
      .from('ad_accounts')
      .select('id, account_id, platform, user_id, users(package_weekly_limit)')
      .eq('status', 'active')

    if (fetchErr) {
      throw new Error(`Gagal mengambil data akun aktif: ${fetchErr.message}`)
    }

    if (!activeAccounts || activeAccounts.length === 0) {
      return { success: true, message: 'Tidak ada akun yang aktif.' }
    }

    const pausedLogs = []
    const apiLogs = []

    // 2. Loop and check spend vs limit
    for (const account of activeAccounts) {
      const platformStr = (account.platform || '').toLowerCase()
      const limit = account.users?.package_weekly_limit || 0
      
      let isOverspend = false
      let liveSpend = 0
      
      try {
        let res: any = null
        if (platformStr.includes('meta')) {
          res = await $fetch('/api/ads/meta/campaigns', { params: { ad_account_id: account.account_id } })
        } else if (platformStr.includes('google')) {
          res = await $fetch('/api/ads/google/campaigns', { params: { customer_id: account.account_id } })
        }
        
        if (res && res.success && res.data) {
          liveSpend = res.data.totalSpend || 0
          const api_balance = res.data.api_balance
          
          if (api_balance !== undefined) {
             // Jika platform mendukung prepaid api balance
             if (api_balance <= 0) isOverspend = true
          } else {
             // Jika menggunakan weekly limit dari aplikasi
             if (limit > 0 && liveSpend >= limit) isOverspend = true
          }
        }
      } catch (apiErr: any) {
        console.error(`Gagal cek spend akun ${account.account_id}:`, apiErr.message || apiErr)
        apiLogs.push({ id: account.id, error: apiErr.message || String(apiErr) })
        continue // Skip pausing if we can't fetch the spend safely
      }

      // 3. Pause if overspend
      if (isOverspend) {
        try {
          if (platformStr.includes('meta')) {
            await $fetch('/api/ads/meta/pause-campaigns', {
              method: 'POST',
              body: { adAccountId: account.account_id }
            })
            pausedLogs.push({ id: account.id, platform: account.platform, reason: 'Overspend' })
          } else if (platformStr.includes('google')) {
            await $fetch('/api/ads/google/pause-campaigns', {
              method: 'POST',
              body: { customerId: account.account_id }
            })
            pausedLogs.push({ id: account.id, platform: account.platform, reason: 'Overspend' })
          }
          
          // Optionally update status in database to 'paused' or add a notification
        } catch (pauseErr: any) {
           console.error(`Gagal pause API untuk akun ${account.account_id}:`, pauseErr.message || pauseErr)
           apiLogs.push({ id: account.id, action: 'pause', error: pauseErr.message || String(pauseErr) })
        }
      }
    }

    return { 
      success: true, 
      message: `Berhasil mengecek ${activeAccounts.length} akun. ${pausedLogs.length} akun di-pause karena overspend.`,
      pausedLogs,
      apiLogs
    }
  } catch (error: any) {
    console.error('Error in check-overspend-accounts cron:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
