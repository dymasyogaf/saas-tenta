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
  const accessToken = await getValidGoogleAccessToken()
  
  // Jika token belum diset, JANGAN kembalikan data dummy. Kembalikan array kosong.
  if (!googleDevToken || !accessToken || googleDevToken === 'your_google_dev_token') {
    return {
      success: true,
      source: 'empty',
      message: 'OAuth Access Token Google belum diatur',
      data: {
        totalAccounts: 0,
        accounts: []
      }
    }
  }

  try {
    // ID MCC Target (MPC - TENTAKLIK)
    const targetMccId = '7556022654'
    // ID Root MCC (Media Pro Creative) yang memiliki otorisasi email
    const loginCustomerId = '6445325844'

    // GAQL Query untuk mengambil Akun Anak (Client Accounts)
    const query = `
      SELECT 
        customer_client.id, 
        customer_client.descriptive_name, 
        customer_client.status, 
        customer_client.currency_code 
      FROM customer_client 
      WHERE customer_client.level = 1 
        AND customer_client.manager = false 
        AND customer_client.status = 'ENABLED'
    `

    // Google Ads API (REST) - Menggunakan searchStream
    const gResponse: any = await $fetch(`https://googleads.googleapis.com/v24/customers/${targetMccId}/googleAds:searchStream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': googleDevToken,
        'login-customer-id': loginCustomerId,
        'Content-Type': 'application/json'
      },
      body: {
        query
      }
    })

    const accounts: GoogleAdAccountData[] = []
    
    // searchStream mengembalikan array of batch objects
    if (Array.isArray(gResponse)) {
      for (const batch of gResponse) {
        if (batch.results) {
          for (const row of batch.results) {
            if (row.customerClient) {
              const client = row.customerClient
              accounts.push({
                id: client.id.toString(),
                name: client.descriptiveName || `Google Ad Account ${client.id}`,
                status: client.status,
                currency: client.currencyCode
              })
            }
          }
        }
      }
    }

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
  name: 'google-ad-clients',
  getKey: (event) => 'all'
})
