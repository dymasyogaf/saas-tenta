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
  debug_error?: string
  data?: {
    totalSpend: number
    currency: string
    activeCampaigns: number
    campaigns: CampaignData[]
    api_balance?: number
    api_budget_total?: number
    api_amount_spent?: number
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
    const adAccountIdParam = query.ad_account_id as string | undefined
    const startDate = query.start_date as string | undefined
    const endDate = query.end_date as string | undefined
    
    if (!adAccountIdParam) {
      throw createError({ statusCode: 400, message: 'Parameter ad_account_id wajib disertakan' })
    }

    // Pastikan ID memiliki prefix 'act_' saat melakukan request ke Facebook API
    // Hal ini memungkinkan frontend hanya mengirimkan angka (number only)
    const adAccountId = adAccountIdParam.startsWith('act_') 
      ? adAccountIdParam 
      : `act_${adAccountIdParam}`

    let timeRangeParam: any = { date_preset: 'last_30d' }
    if (startDate && endDate) {
      timeRangeParam = { time_range: JSON.stringify({ since: startDate, until: endDate }) }
    }

    // Untuk mendapatkan status campaign yang akurat, kita harus tembak endpoint /campaigns
    // dan mengambil data performa melalui field nested 'insights'
    let insightsField = 'insights'
    if (timeRangeParam.time_range) {
      // time_range is an object {since, until} as JSON string. URL encode it for the nested field.
      // Alternatively, pass it in the main params, but for nested insights we can pass it as a field param: insights.time_range({'since':'...','until':'...'})
      // To keep it simple, we use the global time_range param which Meta will apply to nested insights if we don't specify date_preset.
      insightsField = 'insights{spend,reach,inline_link_clicks,cost_per_inline_link_click,purchase_roas}'
    } else {
      // Default fallback
      insightsField = 'insights.date_preset(last_30d){spend,reach,inline_link_clicks,cost_per_inline_link_click,purchase_roas}'
    }

    const metaResponse: any = await $fetch(`https://graph.facebook.com/v19.0/${adAccountId}/campaigns`, {
      params: {
        fields: `id,name,effective_status,${insightsField}`,
        ...timeRangeParam,
        access_token: metaToken
      }
    })

    // Ambil info saldo akun (Prepaid / Spend Cap)
    let api_balance: number | undefined = undefined
    let api_budget_total: number | undefined = undefined
    let api_amount_spent: number | undefined = undefined
    let debug_error: string | undefined = undefined

    try {
      const accountInfo: any = await $fetch(`https://graph.facebook.com/v19.0/${adAccountId}`, {
        params: {
          fields: 'balance,spend_cap,amount_spent',
          access_token: metaToken
        }
      })
      
      // Hitung dari spend_cap jika balance tidak ada
      if (accountInfo.balance !== undefined && accountInfo.balance !== '0') {
        api_balance = parseFloat(accountInfo.balance) / 100
        // Jika spend_cap tersedia, hitung total budget & spent
        if (accountInfo.spend_cap !== undefined && accountInfo.amount_spent !== undefined) {
          const cap = parseFloat(accountInfo.spend_cap)
          const spent = parseFloat(accountInfo.amount_spent)
          if (cap > 0) {
            api_budget_total = cap / 100
            api_amount_spent = spent / 100
          }
        }
      } else if (accountInfo.spend_cap !== undefined && accountInfo.amount_spent !== undefined) {
        const cap = parseFloat(accountInfo.spend_cap)
        const spent = parseFloat(accountInfo.amount_spent)
        if (cap > 0) {
          api_balance = (cap - spent) / 100
          api_budget_total = cap / 100
          api_amount_spent = spent / 100
        }
      }
    } catch (e: any) {
      console.warn('Gagal mengambil balance/spend_cap:', e)
      debug_error = e.message || String(e)
    }

    let totalSpend = 0
    // Filter out campaigns that don't have insights (no delivery in the time range)
    const campaignsWithInsights = (metaResponse.data || []).filter((item: any) => item.insights && item.insights.data && item.insights.data.length > 0)

    const campaigns: CampaignData[] = campaignsWithInsights.map((item: any) => {
      const insight = item.insights.data[0]
      totalSpend += parseFloat(insight.spend || '0')
      
      return {
        id: item.id,
        name: item.name || 'Unknown Campaign',
        spend: parseFloat(insight.spend || '0'),
        impressions: 0,
        clicks: 0,
        reach: parseInt(insight.reach || '0', 10),
        linkClicks: parseInt(insight.inline_link_clicks || '0', 10),
        cpcLink: parseFloat(insight.cost_per_inline_link_click || '0'),
        roas: insight.purchase_roas && insight.purchase_roas.length > 0 ? parseFloat(insight.purchase_roas[0].value || '0') : 0,
        status: item.effective_status || 'unknown'
      }
    })

    return {
      success: true,
      source: 'live',
      fetchedAt: new Date().toISOString(),
      data: {
        totalSpend,
        api_balance,
        api_budget_total,
        api_amount_spent,
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
    return String(query.ad_account_id || 'unknown') + '_' + String(query.start_date || '') + '_' + String(query.end_date || '') + '_v3'
  }
})
