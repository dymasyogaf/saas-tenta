import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const { endpoint, keys } = body || {}

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid push subscription payload'
    })
  }

  const supabase = serverSupabaseServiceRole(event)
  const userAgent = getHeader(event, 'user-agent') || ''

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'endpoint'
    })
    .select()
    .single()

  if (error) {
    console.error('[WebPush] push-subscribe DB Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal menyimpan subscription push notification: ' + error.message
    })
  }

  return { success: true, data }
})
