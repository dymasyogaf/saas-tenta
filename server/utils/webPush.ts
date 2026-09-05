import webpush from 'web-push'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

export interface WebPushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
  id?: string
}

let isVapidInitialized = false

export const initVapid = () => {
  if (isVapidInitialized) return
  const config = useRuntimeConfig()
  const publicKey = config.public.vapidPublicKey
  const privateKey = config.vapidPrivateKey
  const subject = config.vapidSubject || 'mailto:admin@tentaklik.com'

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    isVapidInitialized = true
  }
}

/**
 * Send Web Push notification to all active device subscriptions of a specific user.
 */
export const sendPushToUser = async (event: H3Event, userId: string, payload: WebPushPayload) => {
  try {
    initVapid()
    const supabase = serverSupabaseServiceRole(event)

    // Fetch all active subscriptions for this user
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (error || !subs || subs.length === 0) {
      return { sent: 0, failed: 0 }
    }

    const payloadString = JSON.stringify({
      title: payload.title || 'Tentaklik Notifikasi',
      body: payload.body || '',
      url: payload.url || '/dashboard/notifikasi',
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag || `notif-${Date.now()}`,
      id: payload.id
    })

    let sent = 0
    let failed = 0
    const expiredIds: string[] = []

    await Promise.all(
      subs.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        try {
          await webpush.sendNotification(pushSubscription, payloadString)
          sent++
        } catch (err: any) {
          failed++
          // If subscription is expired or unregistered (HTTP 404 or 410 Gone)
          if (err.statusCode === 404 || err.statusCode === 410) {
            expiredIds.push(sub.id)
          } else {
            console.warn('[WebPush] Error sending push to endpoint:', err.message || err)
          }
        }
      })
    )

    // Cleanup expired subscriptions
    if (expiredIds.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredIds)
    }

    return { sent, failed }
  } catch (err) {
    console.error('[WebPush] sendPushToUser Error:', err)
    return { sent: 0, failed: 0 }
  }
}
