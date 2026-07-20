interface GoogleCampaignData {
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
    campaigns: GoogleCampaignData[]
  }
}

export default defineCachedEventHandler(async (event): Promise<AdsResponse> => {
  const config = useRuntimeConfig()
  const googleDevToken = config.googleAdsDevToken
  const accessToken = (config as any).googleAccessToken || ''
  
  // Karena saat ini akun Google Ads masih disiapkan oleh tim (termasuk OAuth),
  // jika OAuth Access Token belum ada, kita tampilkan data simulasi (Mock) agar UI tidak error.
  if (!googleDevToken || !accessToken || googleDevToken === 'your_google_dev_token') {
    return {
      success: true,
      source: 'mock',
      message: 'Menampilkan data simulasi (OAuth Access Token Google belum diatur)',
      data: {
        totalSpend: 8450000,
        currency: 'IDR',
        activeCampaigns: 2,
        campaigns: [
          { 
            id: 'gads_cmp_201', 
            name: 'Search - SaaS Keywords', 
            spend: 5200000, 
            impressions: 85000, 
            clicks: 4200,
            status: 'ENABLED' 
          },
          { 
            id: 'gads_cmp_202', 
            name: 'Performance Max - Retargeting', 
            spend: 3250000, 
            impressions: 210000, 
            clicks: 1800,
            status: 'ENABLED' 
          }
        ]
      }
    }
  }

  // JIKA TOKEN SUDAH ADA, EKSEKUSI KE GOOGLE ADS API
  try {
    const query = getQuery(event)
    const customerId = query.customer_id as string | undefined
    
    if (!customerId) {
      throw createError({ statusCode: 400, message: 'Parameter customer_id wajib disertakan' })
    }

    const googleResponse: any = await $fetch(`https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': googleDevToken,
        'login-customer-id': customerId
      },
      body: {
        query: `
          SELECT 
            campaign.id, 
            campaign.name, 
            metrics.cost_micros, 
            metrics.impressions, 
            metrics.clicks, 
            campaign.status 
          FROM campaign 
          WHERE segments.date DURING LAST_30_DAYS
        `
      }
    })

    let totalSpend = 0
    const campaigns: GoogleCampaignData[] = []
    
    // Parsing response array dari stream Google Ads
    if (Array.isArray(googleResponse)) {
      googleResponse.forEach((batch: any) => {
        if (batch.results) {
          batch.results.forEach((row: any) => {
            const cost = parseInt(row.metrics?.costMicros || '0') / 1000000 // Convert micros to standard
            totalSpend += cost
            campaigns.push({
              id: row.campaign?.id,
              name: row.campaign?.name,
              spend: cost,
              impressions: parseInt(row.metrics?.impressions || '0'),
              clicks: parseInt(row.metrics?.clicks || '0'),
              status: row.campaign?.status || 'UNKNOWN'
            })
          })
        }
      })
    }

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
    console.error('Google Ads API Proxy Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.error?.message || error.message || 'Gagal terhubung ke API Google Ads' 
    })
  }
}, {
  maxAge: 60 * 5, // Cache 5 Menit
  name: 'google-ad-campaigns',
  getKey: (event) => {
    const query = getQuery(event)
    return String(query.customer_id || 'unknown')
  }
})
