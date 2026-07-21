interface TikTokAdAccountData {
  id: string
  name: string
  status: string
  currency: string
}

interface AccountsResponse {
  success: boolean
  source?: string
  message?: string
  data?: {
    totalAccounts: number
    accounts: TikTokAdAccountData[]
  }
}

export default defineEventHandler(async (event): Promise<AccountsResponse> => {
  const config = useRuntimeConfig()
  const tiktokToken = config.tiktokAccessToken
  
  if (!tiktokToken || tiktokToken === 'your_tiktok_token' || tiktokToken === '') {
    return {
      success: true,
      source: 'live',
      message: 'Token TikTok belum diatur.',
      data: {
        totalAccounts: 0,
        accounts: []
      }
    }
  }

  try {
    const ttResponse: any = await $fetch(`https://business-api.tiktok.com/open_api/v1.3/oauth2/advertiser/get/`, {
      method: 'GET',
      headers: {
        'Access-Token': tiktokToken
      },
      params: {
        app_id: config.tiktokAppSecret || '', // as placeholder
        secret: config.tiktokAppSecret || ''
      }
    })

    if (ttResponse.code !== 0) {
      throw createError({ statusCode: 400, message: ttResponse.message || 'Error dari TikTok API' })
    }

    const accounts: TikTokAdAccountData[] = (ttResponse.data?.list || []).map((item: any) => ({
      id: item.advertiser_id,
      name: item.advertiser_name,
      status: item.status || 'ACTIVE',
      currency: item.currency || 'IDR'
    }))

    return {
      success: true,
      source: 'live',
      data: {
        totalAccounts: accounts.length,
        accounts
      }
    }

  } catch (error: any) {
    console.error('TikTok Accounts API Proxy Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.message || error.message || 'Gagal terhubung ke API TikTok Ads' 
    })
  }
})
