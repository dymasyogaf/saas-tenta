import { serverSupabaseUser } from '#supabase/server'
import { sendPushToUser } from '../../utils/webPush'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event).catch(() => ({}))

  const result = await sendPushToUser(event, user.id, {
    title: body?.title || 'Web Push Tentaklik Berhasil! 🎉',
    body: body?.body || 'Notifikasi ini berhasil masuk melalui background Service Worker.',
    url: body?.url || '/dashboard/notifikasi'
  })

  return {
    success: true,
    result,
    message: result.sent > 0 
      ? `Push notification berhasil dikirim ke ${result.sent} perangkat.` 
      : 'Belum ada perangkat yang terdaftar atau aktif untuk push notification.'
  }
})
