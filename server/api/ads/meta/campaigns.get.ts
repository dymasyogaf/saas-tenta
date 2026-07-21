interface CampaignData {
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
    currency: string
    activeCampaigns: number
    campaigns: CampaignData[]
  }
}

export default defineCachedEventHandler(async (event): Promise<AdsResponse> => {
  const config = useRuntimeConfig()
  const metaToken = config.metaAccessToken
  
  // Jika token belum diset, JANGAN kembalikan data dummy. Kembalikan 0 (Kosong).
  if (!metaToken || metaToken === 'your_meta_token' || metaToken === '') {
    return {
      success: true,
      source: 'live',
      message: 'Token Meta belum diatur.',
      fetchedAt: new Date().toISOString(),
      data: {
        totalSpend: 0,
        currency: 'IDR',
        activeCampaigns: 0,
        campaigns: []
      }
    }
  }

  // JIKA TOKEN SUDAH ADA, EKSEKUSI KE GRAPH API META
  try {
    const query = getQuery(event)
    const adAccountId = query.ad_account_id as string | undefined
    
    if (!adAccountId) {
      throw createError({ statusCode: 400, message: 'Parameter ad_account_id wajib disertakan' })
    }

    const metaResponse: any = await $fetch(`https://graph.facebook.com/v19.0/${adAccountId}/insights`, {
      params: {
        fields: 'campaign_id,campaign_name,spend,impressions,clicks',
        level: 'campaign',
        date_preset: 'last_30d',
        access_token: metaToken
      }
    })

    let totalSpend = 0
    const campaigns: CampaignData[] = (metaResponse.data || []).map((item: any) => {
      totalSpend += parseFloat(item.spend || '0')
      return {
        id: item.campaign_id,
        name: item.campaign_name,
        spend: parseFloat(item.spend || '0'),
        impressions: parseInt(item.impressions || '0', 10),
        clicks: parseInt(item.clicks || '0', 10),
        status: 'unknown'
      }
    })

    return {
      success: true,
      source: 'live',
      fetchedAt: new Date().toISOString(),
      data: {
        totalSpend,
        currency: 'IDR',
        activeCampaigns: campaigns.length,
        campaigns
      }
    }

  } catch (error: any) {
    console.error('Meta API Proxy Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.error?.message || 'Gagal terhubung ke API Meta Ads' 
    })
  }
}, {
  maxAge: 60 * 5, // Cache selama 5 menit
  name: 'meta-ad-campaigns',
  getKey: (event) => {
    const query = getQuery(event)
    return String(query.ad_account_id || 'unknown')
  }
})
