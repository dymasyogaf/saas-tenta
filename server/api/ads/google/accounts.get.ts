interface GoogleAdAccountData {
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
    accounts: GoogleAdAccountData[]
  }
}

export default defineCachedEventHandler(async (event): Promise<AccountsResponse> => {
  const config = useRuntimeConfig()
  const googleDevToken = config.googleAdsDevToken
  const accessToken = (config as any).googleAccessToken || ''
  
  // Jika salah satu token (Developer Token atau OAuth Access Token) belum diset, tampilkan MOCK
  if (!googleDevToken || !accessToken || googleDevToken === 'your_google_dev_token') {
    return {
      success: true,
      source: 'mock',
      message: 'Menampilkan data simulasi (OAuth Access Token Google belum diatur)',
      data: {
        totalAccounts: 1,
        accounts: [
          { id: '123-456-7890', name: 'SaaS Google Account', status: 'ENABLED', currency: 'IDR' }
        ]
      }
    }
  }

  try {
    // Google Ads API (REST) - Membutuhkan OAuth2 Access Token (disimpan di config atau header)
    const gResponse: any = await $fetch(`https://googleads.googleapis.com/v16/customers:listAccessibleCustomers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': googleDevToken
      }
    })

    const accounts: GoogleAdAccountData[] = (gResponse.resourceNames || []).map((resourceName: string) => {
      const id = resourceName.split('/')[1]
      return {
        id,
        name: `Google Ad Account ${id}`,
        status: 'ENABLED',
        currency: 'IDR'
      }
    })

    return {
      success: true,
      source: 'live',
      data: {
        totalAccounts: accounts.length,
        accounts
      }
    }
  } catch (error: any) {
    console.error('Google Ads Accounts API Proxy Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.error?.message || error.message || 'Gagal terhubung ke API Google Ads' 
    })
  }
}, {
  maxAge: 60 * 5, // Cache 5 menit
  name: 'google-ad-accounts',
  getKey: (event) => 'all'
})
