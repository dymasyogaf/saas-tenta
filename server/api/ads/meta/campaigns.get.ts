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
  data?: {
    totalSpend: number
    currency: string
    activeCampaigns: number
    campaigns: CampaignData[]
  }
}

export default defineEventHandler(async (event): Promise<AdsResponse> => {
  const config = useRuntimeConfig()
  const metaToken = config.metaAccessToken
  
  // Karena saat ini akun developer Meta belum terhubung secara penuh,
  // kita menyediakan mekanisme Mock (dummy) agar frontend tetap bisa di-build & test.
  if (!metaToken || metaToken === 'your_meta_token' || metaToken === '') {
    return {
      success: true,
      source: 'mock',
      message: 'Menampilkan data simulasi (Token Meta belum diatur)',
      data: {
        totalSpend: 15850000,
        currency: 'IDR',
        activeCampaigns: 3,
        campaigns: [
          { 
            id: 'meta_cmp_101', 
            name: 'Promo Kemerdekaan - Broad Audience', 
            spend: 5500000, 
            impressions: 450000, 
            clicks: 12500,
            status: 'active' 
          },
          { 
            id: 'meta_cmp_102', 
            name: 'Retargeting - Add to Cart 30 Days', 
            spend: 3150000, 
            impressions: 120000, 
            clicks: 4500,
            status: 'active' 
          },
          { 
            id: 'meta_cmp_103', 
            name: 'Lookalike 1% - Top Spenders', 
            spend: 7200000, 
            impressions: 680000, 
            clicks: 21000,
            status: 'active' 
          }
        ]
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
})
