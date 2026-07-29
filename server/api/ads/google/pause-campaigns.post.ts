import { defineEventHandler, readBody, createError } from 'h3'

const GOOGLE_LOGIN_CUSTOMER_ID = '6445325844'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const googleDevToken = config.googleAdsDevToken
  const accessToken = await getValidGoogleAccessToken()
  
  if (!googleDevToken || !accessToken || googleDevToken === 'your_google_dev_token') {
    throw createError({ statusCode: 401, message: 'Google Ads Token belum diatur' })
  }

  const body = await readBody(event)
  const rawCustomerId = body.customerId
  
  if (!rawCustomerId) {
    throw createError({ statusCode: 400, message: 'Parameter customerId wajib disertakan' })
  }

  const customerId = rawCustomerId.replace(/-/g, '')

  try {
    // 1. Ambil semua kampanye yang aktif (ENABLED)
    const googleResponse: any = await $fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:searchStream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': googleDevToken,
        'login-customer-id': GOOGLE_LOGIN_CUSTOMER_ID
      },
      body: {
        query: `
          SELECT campaign.id, campaign.resource_name, campaign.status
          FROM campaign 
          WHERE campaign.status = 'ENABLED'
        `
      }
    })

    const campaignsToPause: string[] = []

    if (Array.isArray(googleResponse)) {
      googleResponse.forEach((batch: any) => {
        if (batch.results) {
          batch.results.forEach((row: any) => {
            if (row.campaign?.resourceName) {
              campaignsToPause.push(row.campaign.resourceName)
            }
          })
        }
      })
    }

    if (campaignsToPause.length === 0) {
      return {
        success: true,
        message: 'Tidak ada kampanye aktif yang perlu dipause di Google Ads.',
        pausedCampaigns: []
      }
    }

    // 2. Siapkan payload mutasi massal
    const operations = campaignsToPause.map(resourceName => ({
      updateMask: 'status',
      update: {
        resourceName: resourceName,
        status: 'PAUSED'
      }
    }))

    // 3. Eksekusi mutasi untuk pause kampanye
    const mutateResponse: any = await $fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/campaigns:mutate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': googleDevToken,
        'login-customer-id': GOOGLE_LOGIN_CUSTOMER_ID
      },
      body: {
        operations
      }
    })

    return {
      success: true,
      message: `Berhasil mem-pause ${campaignsToPause.length} kampanye aktif di Google Ads.`,
      pausedCampaigns: campaignsToPause,
      details: mutateResponse
    }

  } catch (error: any) {
    console.error('Google Ads API Pause Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.error?.message || error.message || 'Gagal mengeksekusi pause kampanye ke API Google Ads' 
    })
  }
})
