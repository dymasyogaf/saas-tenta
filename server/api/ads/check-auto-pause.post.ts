import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

/**
 * Fungsi pembantu untuk memanggil API resmi Google / Meta / TikTok Ads
 * guna mengubah status kampanye aktif menjadi PAUSED saat menyentuh limit 100%.
 */
async function pausePlatformCampaigns(platform: string, accountId: string, event: any) {
  const p = (platform || '').toLowerCase()
  const config = useRuntimeConfig(event)

  try {
    if (p.includes('google')) {
      const googleDevToken = config.googleAdsDevToken
      const accessToken = await getValidGoogleAccessToken()
      if (googleDevToken && accessToken && googleDevToken !== 'your_google_dev_token') {
        // Ambil daftar kampanye aktif Google
        const searchRes: any = await $fetch(`https://googleads.googleapis.com/v24/customers/${accountId}/googleAds:searchStream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': googleDevToken,
            'login-customer-id': '6445325844'
          },
          body: {
            query: `SELECT campaign.id, campaign.status FROM campaign WHERE campaign.status = 'ENABLED'`
          }
        }).catch(() => null)

        if (searchRes && Array.isArray(searchRes)) {
          const activeCampaignIds: string[] = []
          searchRes.forEach((batch: any) => {
            if (batch.results) {
              batch.results.forEach((row: any) => {
                if (row.campaign?.id) activeCampaignIds.push(row.campaign.id)
              })
            }
          })

          // Pause setiap kampanye aktif
          for (const campaignId of activeCampaignIds) {
            await $fetch(`https://googleads.googleapis.com/v24/customers/${accountId}/campaigns:mutate`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': googleDevToken,
                'login-customer-id': '6445325844'
              },
              body: {
                operations: [{
                  updateMask: 'status',
                  update: {
                    resourceName: `customers/${accountId}/campaigns/${campaignId}`,
                    status: 'PAUSED'
                  }
                }]
              }
            }).catch(e => console.error(`Error pausing Google campaign ${campaignId}:`, e))
          }
        }
      }
    } else if (p.includes('meta')) {
      const metaAccessToken = config.metaAccessToken || process.env.META_ACCESS_TOKEN
      if (metaAccessToken) {
        // Pause akun / kampanye Meta Ads via Graph API
        await $fetch(`https://graph.facebook.com/v24.0/act_${accountId}/campaigns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          params: { access_token: metaAccessToken, status: 'PAUSED' }
        }).catch(e => console.error(`Error pausing Meta Ads account ${accountId}:`, e))
      }
    } else if (p.includes('tiktok')) {
      const tiktokAccessToken = config.tiktokAccessToken || process.env.TIKTOK_ACCESS_TOKEN
      if (tiktokAccessToken) {
        await $fetch(`https://business-api.tiktok.com/open_api/v1.3/campaign/status/update/`, {
          method: 'POST',
          headers: {
            'Access-Token': tiktokAccessToken,
            'Content-Type': 'application/json'
          },
          body: {
            advertiser_id: accountId,
            opt_status: 'DISABLE'
          }
        }).catch(e => console.error(`Error pausing TikTok Ads account ${accountId}:`, e))
      }
    }
  } catch (err) {
    console.error(`Failed to execute platform API pause for ${platform} (${accountId}):`, err)
  }
}

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const body = await readBody(event).catch(() => ({}))
    const accountId = body.account_id
    const weeklySpend = Number(body.weekly_spend || 0)
    const limit = Number(body.limit || 0)

    if (limit <= 0) {
      return { success: true, is_auto_paused: false }
    }

    const isLimitReached = weeklySpend >= limit
    const supabase = serverSupabaseServiceRole<any>(event)

    if (isLimitReached && accountId) {
      // 1. Ambil info akun iklan untuk platform
      const { data: adAcc } = await supabase
        .from('ad_accounts')
        .select('*')
        .eq('account_id', accountId)
        .single()

      const platform = adAcc?.platform || 'google'

      // 2. Eksekusi panggilan API resmi ke server platform iklan (Google, Meta, TikTok)
      await pausePlatformCampaigns(platform, accountId, event)

      // 3. Buat notifikasi peringatan jika belum ada notifikasi hari ini
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: existingNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .ilike('title', '%Auto-Pause%')
        .gte('created_at', todayStr)
        .limit(1)

      if (!existingNotif || existingNotif.length === 0) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: '🔒 Akun Iklan Di-pause Otomatis (Limit 100%)',
          message: `Pengeluaran minggu ini telah menyentuh limit paket (${limit.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}). Iklan di-pause sementara di server platform ${platform.toUpperCase()}. Silakan lakukan Update Paket untuk mengaktifkannya kembali.`,
          is_read: false,
          created_at: new Date().toISOString()
        })
      }

      return {
        success: true,
        is_auto_paused: true,
        platform,
        message: `Akun iklan ${accountId} terdeteksi 100% limit dan kampanye telah di-pause via API platform`
      }
    }

    return {
      success: true,
      is_auto_paused: false
    }
  } catch (err: any) {
    console.error('Error in check-auto-pause:', err)
    return {
      success: false,
      error: err.message
    }
  }
})
