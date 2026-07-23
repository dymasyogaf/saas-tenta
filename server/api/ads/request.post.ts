import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, platform, accountName, targetUrl, details, subscriptionMonths, rentalFee } = body

  if (!userId || !platform || !accountName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }

  const supabase = await serverSupabaseClient<any>(event)

  const { data, error } = await supabase
    .from('ad_account_requests')
    .insert({
      user_id: userId,
      platform,
      account_name: accountName,
      target_url: targetUrl || '',
      status: 'payment_pending',
      details,
      subscription_months: subscriptionMonths || 1,
      rental_fee: rentalFee || 0
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to create ad account request:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create request'
    })
  }

  return { success: true, requestId: data.id }
})
