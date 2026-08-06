interface CampaignData {
  id: string
  name: string
  spend: number
  impressions: number  // selalu 0 — Meta query tidak request field ini (pakai reach/linkClicks)
  clicks: number       // selalu 0 — sama seperti impressions
  reach: number
  linkClicks: number
  cpcLink: number
  roas: number
  status: string
}

interface AdsResponse {
  success: boolean
  source?: string
  message?: string
  fetchedAt?: string
  debug_error?: string
  debug_info?: any
  data?: {
    totalSpend: number
    currency: string
    activeCampaigns: number
    campaigns: CampaignData[]
    api_balance?: number
    api_budget_total?: number
    api_amount_spent?: number
    debug_error?: string
    debug_info?: any
  }
}

export default defineCachedEventHandler(async (event): Promise<AdsResponse> => {
  const config = useRuntimeConfig(event) // event wajib dipass di Cloudflare Pages
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

    let timeRangeParam: any = {}
    if (startDate && endDate) {
      timeRangeParam = { time_range: JSON.stringify({ since: startDate, until: endDate }) }
    }

    // Untuk mendapatkan status campaign yang akurat, kita harus tembak endpoint /campaigns
    // dan mengambil data performa melalui field nested 'insights'
    // PENTING: $fetch akan URL-encode { dan } menjadi %7B %7D jika dipass lewat params object.
    // Meta API butuh kurung kurawal literal, jadi fields harus diembed langsung di URL string.
    let insightsField = 'insights'
    if (timeRangeParam.time_range) {
      insightsField = 'insights{spend,reach,inline_link_clicks,cost_per_inline_link_click,purchase_roas}'
    } else {
      insightsField = 'insights.date_preset(last_30d){spend,reach,inline_link_clicks,cost_per_inline_link_click,purchase_roas}'
    }

    const fieldsParam = `id,name,effective_status,${insightsField}`
    let queryString = `fields=${fieldsParam}&access_token=${metaToken}`
    if (timeRangeParam.time_range) {
      queryString += `&time_range=${encodeURIComponent(timeRangeParam.time_range)}`
    }

    const metaResponse: any = await $fetch(
      `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?${queryString}`
    )

    // Ambil info saldo akun (Prepaid / Spend Cap)
    let api_balance: number | undefined = undefined
    let api_budget_total: number | undefined = undefined
    let api_amount_spent: number | undefined = undefined
    let debug_error: string | undefined = undefined
    let debug_info: any = {}

    let parsedAccountInfo: any = {}
    try {
      const accountInfo: any = await $fetch(`https://graph.facebook.com/v19.0/${adAccountId}`, {
        params: {
          fields: 'balance,spend_cap,amount_spent',
          access_token: metaToken
        }
      })
      
      parsedAccountInfo = typeof accountInfo === 'string' ? JSON.parse(accountInfo) : accountInfo

      // Hitung sisa saldo (balance) dari spend_cap - amount_spent (Meniru cara kerja Google Ads)
      if (parsedAccountInfo.spend_cap !== undefined && parsedAccountInfo.amount_spent !== undefined) {
        const cap = parseFloat(parsedAccountInfo.spend_cap)
        const spent = parseFloat(parsedAccountInfo.amount_spent)
        
        // Meta mereturn mata uang (termasuk IDR) dalam satuan subunit (dibagi 100)
        api_amount_spent = spent / 100
        
        if (cap > 0) {
          api_budget_total = cap / 100
          api_balance = api_budget_total - api_amount_spent
        }
        // Jika cap == 0, berarti akun tersebut tidak dilimit dari FB (unlimited).
        // Biarkan api_budget_total dan api_balance undefined agar frontend fallback ke Saldo Lokal Tenta.
      }
    } catch (e: any) {
      console.warn('Gagal mengambil balance/spend_cap:', e)
      debug_error = e.message || String(e)
    }

    let totalSpend = 0
    const parsedMetaResponse = typeof metaResponse === 'string' ? JSON.parse(metaResponse) : metaResponse
    
    // Filter out campaigns that don't have insights (no delivery in the time range)
    const campaignsWithInsights = (parsedMetaResponse.data || []).filter((item: any) => item.insights && item.insights.data && item.insights.data.length > 0)

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
        debug_error,
        debug_info,
        currency: 'IDR',
        activeCampaigns: campaigns.length,
        campaigns
      }
    }

  } catch (error: any) {
    console.error('Meta API Proxy Error:', error.message || error)
    if (error.data) {
      console.error('Meta API Error Details:', JSON.stringify(error.data, null, 2))
    }
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
    const base = String(query.ad_account_id || 'unknown') + '_' + String(query.start_date || '') + '_' + String(query.end_date || '') + '_v5'
    // Jika force=true, gunakan timestamp sebagai key agar Nitro selalu fetch fresh dari Meta API
    if (query.force === 'true') return base + '_force_' + Math.floor(Date.now() / 1000)
    return base
  }
})
