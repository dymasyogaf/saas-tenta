/**
 * GET /api/ping
 * Keepalive endpoint untuk mencegah Supabase free tier auto-pause.
 *
 * Dipanggil oleh:
 * - cron-job.org sekali sehari (jam 14.00 WIB) — keepalive utama
 * - Client-side sekali per session saat app dibuka — backup tambahan
 *
 * Cara kerja:
 * - Upsert kolom `last_ping` pada tabel `system_health` (1 row permanen, tidak bertambah)
 * - Menggunakan serverSupabaseServiceRole agar bypass RLS (kompatibel Cloudflare Pages)
 */

import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Otorisasi: 
  // 1. Cek secret header dari cron-job.org
  // 2. ATAU cek apakah user sedang login (dari browser client)
  const reqSecret = getRequestHeader(event, 'x-ping-secret')
  const validSecret = process.env.NUXT_PING_SECRET
  
  let isAuthorized = false
  if (reqSecret && reqSecret === validSecret) {
    isAuthorized = true
  } else {
    // Coba cek auth token
    const user = await serverSupabaseUser(event).catch(() => null)
    if (user) isAuthorized = true
  }

  if (!isAuthorized) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const supabase = await serverSupabaseServiceRole(event)
  const now = new Date().toISOString()

  // Cast as any — tabel system_health tidak ada di generated types (types: false di nuxt.config.ts)
  const { error } = await (supabase as any)
    .from('system_health')
    .upsert(
      {
        id: 'keepalive',
        last_ping: now,
        description: 'Auto-ping untuk mencegah Supabase pause',
      },
      { onConflict: 'id' }
    )

  if (error) {
    console.warn('[Keepalive] Supabase ping warning:', error.message)
    return {
      ok: false,
      message: 'Ping gagal - pastikan tabel system_health sudah dibuat di Supabase',
      error: error.message,
      timestamp: now,
    }
  }

  return {
    ok: true,
    message: 'Ping berhasil',
    timestamp: now,
  }
})
