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
  data?: {
    totalSpend: number
    currency: string
    activeCampaigns: number
    campaigns: TikTokCampaignData[]
  }
}

export default defineEventHandler(async (event): Promise<AdsResponse> => {
  const config = useRuntimeConfig()
  const tiktokToken = config.tiktokAccessToken
  
  // Jika Token TikTok belum diatur, gunakan Mock (dummy data) agar tidak error di dashboard
  if (!tiktokToken || tiktokToken === 'your_tiktok_token' || tiktokToken === '') {
    return {
      success: true,
      source: 'mock',
      message: 'Menampilkan data simulasi (Token TikTok belum diatur)',
      data: {
        totalSpend: 4200000,
        currency: 'IDR',
        activeCampaigns: 2,
        campaigns: [
          { 
            id: 'tt_cmp_301', 
            name: 'UGC Campaign - Gen Z', 
            spend: 2500000, 
            impressions: 550000, 
            clicks: 18000,
            status: 'active' 
          },
          { 
            id: 'tt_cmp_302', 
            name: 'Spark Ads - Product Review', 
            spend: 1700000, 
            impressions: 320000, 
            clicks: 9500,
            status: 'active' 
          }
        ]
      }
    }
  }

  // EKSEKUSI KE TIKTOK MARKETING API
  try {
    const query = getQuery(event)
    const advertiserId = query.advertiser_id as string | undefined
    
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
        page_size: 100
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

    return {
      success: true,
      source: 'live',
      data: {
        totalSpend,
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
