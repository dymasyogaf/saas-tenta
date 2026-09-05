import { buildPushPayload } from '@block65/webcrypto-web-push'
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

/**
 * Send Web Push notification to all active device subscriptions of a specific user.
 * 100% Edge & Cloudflare Workers compatible using Web Crypto API.
 */
export const sendPushToUser = async (event: H3Event, userId: string, payload: WebPushPayload) => {
  try {
    const config = useRuntimeConfig()
    const publicKey = config.public.vapidPublicKey
    const privateKey = config.vapidPrivateKey
    const subject = config.vapidSubject || 'mailto:admin@tentaklik.com'

    if (!publicKey || !privateKey) {
      console.warn('[WebPush] VAPID keys not configured')
      return { sent: 0, failed: 0 }
    }

    const vapid = {
      subject,
      publicKey,
      privateKey
    }

    const supabase = serverSupabaseServiceRole(event)

    // Fetch all active subscriptions for this user
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (error || !subs || subs.length === 0) {
      return { sent: 0, failed: 0 }
    }

    const messageData = JSON.stringify({
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
        try {
          const subscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }

          const pushPayload = await buildPushPayload({ data: messageData }, subscription, vapid)

          const res = await fetch(sub.endpoint, {
            method: pushPayload.method,
            headers: pushPayload.headers,
            body: pushPayload.body
          })

          if (res.ok || res.status === 201) {
            sent++
          } else {
            failed++
            if (res.status === 404 || res.status === 410) {
              expiredIds.push(sub.id)
            } else {
              console.warn('[WebPush] Push endpoint returned status:', res.status)
            }
          }
        } catch (err: any) {
          failed++
          console.warn('[WebPush] Error sending push to endpoint:', err.message || err)
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
