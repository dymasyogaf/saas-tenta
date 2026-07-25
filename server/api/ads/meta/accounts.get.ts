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

export default defineEventHandler(async (event): Promise<AccountsResponse> => {
  const config = useRuntimeConfig()
  const metaToken = config.metaAccessToken
  
  // Jika token belum diset, JANGAN kembalikan data dummy.
  if (!metaToken || metaToken === 'your_meta_token' || metaToken === '') {
    return {
      success: true,
      source: 'live',
      message: 'Token Meta belum diatur.',
      data: {
        totalAccounts: 0,
        accounts: []
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

    const parsedMetaResponse = typeof metaResponse === 'string' ? JSON.parse(metaResponse) : metaResponse

    let accounts: AdAccountData[] = (parsedMetaResponse.data || []).map((item: any) => ({
      id: item.account_id,
      name: item.name || `Account ${item.account_id}`,
      status: item.account_status === 1 ? 'ACTIVE' : 'DISABLED', // 1 = ACTIVE in Meta
      currency: item.currency || 'IDR'
    }))

    // Filter secara paksa ke MP - PENDIDIKAN (3351307381691170)
    // Coba ambil dari process.env atau langsung gunakan ID-nya
    const targetAccountId = process.env.NUXT_META_TARGET_ACCOUNT_ID || '3351307381691170'
    const cleanTargetId = targetAccountId.replace('act_', '')
    
    // Lakukan filter
    accounts = accounts.filter(acc => acc.id.includes(cleanTargetId))

    // JIKA hasilnya 0 (berarti API Facebook tidak me-return ID ini di endpoint /me/adaccounts)
    // Kita tambahkan secara manual agar tetap muncul di UI Anda dan bisa di-klik untuk cek campaign-nya
    if (accounts.length === 0) {
      accounts.push({
        id: cleanTargetId,
        name: 'MP - PENDIDIKAN',
        status: 'ACTIVE',
        currency: 'IDR'
      })
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
    console.error('Meta Accounts API Proxy Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.error?.message || 'Gagal terhubung ke API Meta Ads' 
    })
  }
})
