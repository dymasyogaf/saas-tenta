interface AdAccountData {
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
    accounts: AdAccountData[]
  }
}

export default defineCachedEventHandler(async (event): Promise<AccountsResponse> => {
  const config = useRuntimeConfig()
  const metaToken = config.metaAccessToken
  
  if (!metaToken || metaToken === 'your_meta_token' || metaToken === '') {
    return {
      success: true,
      source: 'mock',
      message: 'Menampilkan data simulasi (Token Meta belum diatur)',
      data: {
        totalAccounts: 2,
        accounts: [
          { id: 'act_1122334455', name: 'Tentaklik Internal', status: 'ACTIVE', currency: 'IDR' },
          { id: 'act_9988776655', name: 'Client A - E-commerce', status: 'ACTIVE', currency: 'IDR' }
        ]
      }
    }
  }

  try {
    const metaResponse: any = await $fetch(`https://graph.facebook.com/v19.0/me/adaccounts`, {
      params: {
        fields: 'account_id,name,account_status,currency',
        access_token: metaToken
      }
    })

    const accounts: AdAccountData[] = (metaResponse.data || []).map((item: any) => ({
      id: item.account_id,
      name: item.name || `Account ${item.account_id}`,
      status: item.account_status === 1 ? 'ACTIVE' : 'DISABLED', // 1 = ACTIVE in Meta
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
    console.error('Meta Accounts API Proxy Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.error?.message || 'Gagal terhubung ke API Meta Ads' 
    })
  }
}, {
  maxAge: 60 * 5, // Cache selama 5 menit
  name: 'meta-ad-accounts',
  getKey: (event) => 'all'
})
