import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const metaToken = config.metaAccessToken
  
  if (!metaToken || metaToken === 'your_meta_token' || metaToken === '') {
    throw createError({ statusCode: 401, message: 'Meta Token belum diatur' })
  }

  const body = await readBody(event)
  const adAccountIdParam = body.adAccountId
  
  if (!adAccountIdParam) {
    throw createError({ statusCode: 400, message: 'Parameter adAccountId wajib disertakan' })
  }

  const adAccountId = adAccountIdParam.startsWith('act_') 
    ? adAccountIdParam 
    : `act_${adAccountIdParam}`

  try {
    // 1. Ambil semua kampanye yang aktif (ACTIVE)
    const campaignsRes: any = await $fetch(`https://graph.facebook.com/v19.0/${adAccountId}/campaigns`, {
      params: {
        fields: 'id,name,effective_status',
        filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]),
        access_token: metaToken
      }
    })

    const parsedRes = typeof campaignsRes === 'string' ? JSON.parse(campaignsRes) : campaignsRes
    const activeCampaigns = parsedRes.data || []

    const pausedCampaigns = []
    const errors = []

    // 2. Loop dan pause setiap kampanye yang aktif
    for (const campaign of activeCampaigns) {
      try {
        await $fetch(`https://graph.facebook.com/v19.0/${campaign.id}`, {
          method: 'POST',
          body: new URLSearchParams({
            status: 'PAUSED',
            access_token: metaToken
          }).toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        pausedCampaigns.push(campaign.id)
      } catch (err: any) {
        console.error(`Gagal pause kampanye Meta ${campaign.id}:`, err.message || err)
        errors.push({ id: campaign.id, error: err.message || String(err) })
      }
    }

    return {
      success: true,
      message: `Berhasil mem-pause ${pausedCampaigns.length} kampanye aktif di Meta.`,
      pausedCampaigns,
      errors: errors.length > 0 ? errors : undefined
    }

  } catch (error: any) {
    console.error('Meta API Pause Error:', error.message || error)
    throw createError({ 
      statusCode: error.response?.status || 500, 
      message: error.data?.error?.message || 'Gagal mengeksekusi pause kampanye ke API Meta' 
    })
  }
})
