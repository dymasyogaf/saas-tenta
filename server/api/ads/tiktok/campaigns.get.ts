interface TikTokCampaignData {
  id: string
  name: string
  spend: number
  impressions: number
  clicks: number
  status: string
}

interface AdsResponse {
  success: boolean
  source?: string
  message?: string
  fetchedAt?: string
  data?: {
    totalSpend: number
    api_balance?: number
    currency: string
    activeCampaigns: number
    campaigns: TikTokCampaignData[]
  }
}

export default defineEventHandler(async (event): Promise<AdsResponse> => {
  const config = useRuntimeConfig()
  const tiktokToken = config.tiktokAccessToken
  
  // Jika Token TikTok belum diatur, JANGAN kembalikan data dummy.
  if (!tiktokToken || tiktokToken === 'your_tiktok_token' || tiktokToken === '') {
    return {
      success: true,
      source: 'live',
      message: 'Token TikTok belum diatur.',
      fetchedAt: new Date().toISOString(),
      data: {
        totalSpend: 0,
        currency: 'IDR',
        activeCampaigns: 0,
        campaigns: []
      }
    }
  }

  // EKSEKUSI KE TIKTOK MARKETING API
  try {
    const query = getQuery(event)
    const advertiserId = query.advertiser_id as string | undefined
    const startDate = query.start_date as string | undefined
    const endDate = query.end_date as string | undefined
    
    if (!advertiserId) {
      throw createError({ statusCode: 400, message: 'Parameter advertiser_id wajib disertakan' })
    }

    // Referensi MVP TikTok Business API v1.3:
    const ttResponse: any = await $fetch(`https://business-api.tiktok.com/open_api/v1.3/campaign/get/`, {
      method: 'GET',
      headers: {
        'Access-Token': tiktokToken
      },
      params: {
        advertiser_id: advertiserId,
        page_size: 100,
        ...(startDate && endDate ? { filtering: JSON.stringify({ stat_time_day: [startDate, endDate] }) } : {})
      }
    })

    if (ttResponse.code !== 0) {
      throw createError({ statusCode: 400, message: ttResponse.message || 'Error dari TikTok API' })
    }

    // TikTok API umumnya memisahkan endpoint reporting dan list campaign.
    // Di dunia nyata, Anda mungkin perlu hit /open_api/v1.3/report/integrated/get/ juga.
    // Asumsikan data gabungan untuk MVP ini:
    
    let totalSpend = 0
    const campaigns: TikTokCampaignData[] = (ttResponse.data?.list || []).map((item: any) => {
      // Mock logic calculation since we don't hit reporting API in this template
      totalSpend += parseFloat(item.spend || '0')
      return {
        id: item.campaign_id,
        name: item.campaign_name,
        spend: parseFloat(item.spend || '0'),
        impressions: parseInt(item.impressions || '0', 10),
        clicks: parseInt(item.clicks || '0', 10),
        status: item.status || 'unknown'
      }
    })

    // Ambil info saldo akun (Advertiser Balance)
    let api_balance: number | undefined = undefined
    try {
      const balanceResponse: any = await $fetch(`https://business-api.tiktok.com/open_api/v1.3/advertiser/balance/get/`, {
        method: 'GET',
        headers: {
          'Access-Token': tiktokToken
        },
        params: {
          advertiser_id: advertiserId
        }
      })
      
      if (balanceResponse.code === 0 && balanceResponse.data) {
        // Asumsi data.balance_list atau data.valid_balance (struktur standar TikTok API)
        const balanceInfo = balanceResponse.data.balance_list ? balanceResponse.data.balance_list[0] : balanceResponse.data
        if (balanceInfo && balanceInfo.valid_balance !== undefined) {
          api_balance = parseFloat(balanceInfo.valid_balance)
        }
      }
    } catch (e) {
      console.warn('Gagal mengambil balance TikTok:', e)
    }

    return {
      success: true,
      source: 'live',
      fetchedAt: new Date().toISOString(),
      data: {
        totalSpend,
        api_balance,
        currency: 'IDR',
        activeCampaigns: campaigns.length,
        campaigns
      }
    }

  } catch (error: any) {
    console.error('TikTok API Proxy Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.message || error.message || 'Gagal terhubung ke API TikTok Ads' 
    })
  }
})
