import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<any>(event)
  
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const now = new Date().toISOString()

    // Cari semua akun yang masa aktifnya sudah lewat (kedaluwarsa) tapi statusnya masih active
    const { data: expiredAccounts, error: fetchErr } = await supabase
      .from('ad_accounts')
      .select('id, account_id, platform, user_id')
      .eq('status', 'active')
      .lt('subscription_expires_at', now)

    if (fetchErr) {
      throw new Error(`Gagal mengambil data akun kedaluwarsa: ${fetchErr.message}`)
    }

    if (!expiredAccounts || expiredAccounts.length === 0) {
      return { success: true, message: 'Tidak ada akun yang kedaluwarsa.' }
    }

    // Update status menjadi inactive untuk semua akun yang kedaluwarsa
    const expiredIds = expiredAccounts.map((acc: any) => acc.id)
    
    const { error: updateErr } = await supabase
      .from('ad_accounts')
      .update({ status: 'inactive' })
      .in('id', expiredIds)

    if (updateErr) {
      throw new Error(`Gagal mengubah status akun: ${updateErr.message}`)
    }

    // Mengeksekusi request Pause API ke platform masing-masing
    const apiLogs = []
    
    for (const account of expiredAccounts) {
      const platformStr = (account.platform || '').toLowerCase()
      try {
        if (platformStr.includes('meta')) {
          const res = await $fetch('/api/ads/meta/pause-campaigns', {
            method: 'POST',
            body: { adAccountId: account.account_id }
          })
          apiLogs.push({ id: account.id, platform: account.platform, result: res })
        } else if (platformStr.includes('google')) {
          const res = await $fetch('/api/ads/google/pause-campaigns', {
            method: 'POST',
            body: { customerId: account.account_id }
          })
          apiLogs.push({ id: account.id, platform: account.platform, result: res })
        }
      } catch (apiErr: any) {
        console.error(`Gagal pause API untuk akun ${account.account_id} (${account.platform}):`, apiErr.message || apiErr)
        apiLogs.push({ id: account.id, platform: account.platform, error: apiErr.message || String(apiErr) })
      }
    }

    return { 
      success: true, 
      message: `${expiredAccounts.length} akun iklan telah di-nonaktifkan karena masa sewa kedaluwarsa.`,
      processedAccounts: expiredAccounts,
      apiLogs
    }
  } catch (error: any) {
    console.error('Error in check-expired-accounts cron:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal Server Error'
    })
  }
})
