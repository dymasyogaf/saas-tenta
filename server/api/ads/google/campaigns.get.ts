interface GoogleCampaignData {
  id: string
  name: string
  spend: number
  impressions: number
  clicks: number
  ctr: number
  averageCpc: number
  conversions: number
  conversionsValue: number
  costPerConversion: number
  status: string
  campaignType: string
  biddingStrategy: string
  dailyBudget: number
}

interface AdsResponse {
  success: boolean
  source?: string
  message?: string
  fetchedAt?: string
  data?: {
    totalSpend: number
    totalConversions: number
    totalConversionsValue: number
    averageCtr: number
    currency: string
    activeCampaigns: number
    campaigns: GoogleCampaignData[]
  }
}

export default defineCachedEventHandler(async (event): Promise<AdsResponse> => {
  const config = useRuntimeConfig()
  const googleDevToken = config.googleAdsDevToken
  const accessToken = await getValidGoogleAccessToken()
  
  // Jika token belum diset, JANGAN kembalikan data dummy. Kembalikan 0 (Kosong).
  if (!googleDevToken || !accessToken || googleDevToken === 'your_google_dev_token') {
    return {
      success: true,
      source: 'empty',
      message: 'OAuth Access Token Google belum diatur',
      fetchedAt: new Date().toISOString(),
      data: {
        totalSpend: 0,
        totalConversions: 0,
        totalConversionsValue: 0,
        averageCtr: 0,
        currency: 'IDR',
        activeCampaigns: 0,
        campaigns: []
      }
    }
  }

  // JIKA TOKEN SUDAH ADA, EKSEKUSI KE GOOGLE ADS API
  try {
    const query = getQuery(event)
    const customerId = query.customer_id as string | undefined
    const startDate = query.start_date as string | undefined
    const endDate = query.end_date as string | undefined
    
    if (!customerId) {
      throw createError({ statusCode: 400, message: 'Parameter customer_id wajib disertakan' })
    }

    const googleResponse: any = await $fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:searchStream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': googleDevToken,
        'login-customer-id': '6445325844'
      },
      body: {
        query: `
          SELECT 
            campaign.id, 
            campaign.name, 
            campaign.status,
            campaign.advertising_channel_type,
            campaign.bidding_strategy_type,
            campaign_budget.amount_micros,
            metrics.cost_micros, 
            metrics.impressions, 
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.conversions,
            metrics.conversions_value,
            metrics.cost_per_conversion
          FROM campaign 
          WHERE ${startDate && endDate ? `segments.date BETWEEN '${startDate}' AND '${endDate}'` : 'segments.date DURING LAST_30_DAYS'}
        `
      }
    })

    let totalSpend = 0
    let totalConversions = 0
    let totalConversionsValue = 0
    let totalImpressions = 0
    let totalClicks = 0
    const campaigns: GoogleCampaignData[] = []
    
    // Parsing response array dari stream Google Ads
    if (Array.isArray(googleResponse)) {
      googleResponse.forEach((batch: any) => {
        if (batch.results) {
          batch.results.forEach((row: any) => {
            const cost = parseInt(row.metrics?.costMicros || '0') / 1000000
            const impressions = parseInt(row.metrics?.impressions || '0')
            const clicks = parseInt(row.metrics?.clicks || '0')
            const conversions = parseFloat(row.metrics?.conversions || '0')
            const conversionsValue = parseFloat(row.metrics?.conversionsValue || '0')
            const ctr = parseFloat(row.metrics?.ctr || '0')
            const averageCpc = parseInt(row.metrics?.averageCpc || '0') / 1000000
            const costPerConversion = parseFloat(row.metrics?.costPerConversion || '0') / 1000000
            const dailyBudget = parseInt(row.campaignBudget?.amountMicros || '0') / 1000000

            totalSpend += cost
            totalConversions += conversions
            totalConversionsValue += conversionsValue
            totalImpressions += impressions
            totalClicks += clicks

            campaigns.push({
              id: row.campaign?.id,
              name: row.campaign?.name,
              spend: cost,
              impressions,
              clicks,
              ctr: ctr * 100, // API returns decimal (0.05 = 5%), convert to percentage
              averageCpc,
              conversions,
              conversionsValue,
              costPerConversion,
              status: row.campaign?.status || 'UNKNOWN',
              campaignType: row.campaign?.advertisingChannelType || 'UNKNOWN',
              biddingStrategy: row.campaign?.biddingStrategyType || 'UNKNOWN',
              dailyBudget
            })
          })
        }
      })
    }

    // Hitung rata-rata CTR keseluruhan
    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    // Ambil info saldo akun (Account Budget)
    let api_balance: number | undefined = undefined
    let api_budget_total: number | undefined = undefined
    let api_amount_spent: number | undefined = undefined
    try {
      const budgetResponse: any = await $fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:searchStream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': googleDevToken,
          'login-customer-id': '6445325844' // Ganti jika berbeda
        },
        body: {
          query: `
            SELECT 
              account_budget.approved_spending_limit_micros, 
              account_budget.amount_served_micros 
            FROM account_budget 
            WHERE account_budget.status = 'APPROVED'
          `
        }
      })
      
      if (Array.isArray(budgetResponse) && budgetResponse[0]?.results) {
        let totalBudget = 0
        let totalServed = 0
        budgetResponse[0].results.forEach((row: any) => {
          totalBudget += parseInt(row.accountBudget?.approvedSpendingLimitMicros || '0') / 1000000
          totalServed += parseInt(row.accountBudget?.amountServedMicros || '0') / 1000000
        })
        if (totalBudget > 0) {
          api_balance = totalBudget - totalServed
          api_budget_total = totalBudget
          api_amount_spent = totalServed
        }
      }
    } catch (e) {
      console.warn('Gagal mengambil account budget Google:', e)
    }

    return {
      success: true,
      source: 'live',
      fetchedAt: new Date().toISOString(),
      data: {
        totalSpend,
        api_balance,
        api_budget_total,
        api_amount_spent,
        totalConversions,
        totalConversionsValue,
        averageCtr,
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
    return String(query.customer_id || 'unknown') + '_' + String(query.start_date || '') + '_' + String(query.end_date || '')
  }
})

