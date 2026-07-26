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
 * - Menggunakan service role key agar tidak terblokir RLS
 */

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  // Gunakan service role untuk bypass RLS
  const supabaseAdmin = createClient(
    // process.env tidak tersedia di Cloudflare Pages — gunakan runtimeConfig saja
    config.supabaseUrl || 'https://pjmsnphhnporuownasxe.supabase.co',
    config.supabaseServiceKey || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
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
    // Jika tabel belum ada, return info tanpa error fatal
    console.warn('[Keepalive] Supabase ping warning:', error.message)
    return {
      ok: false,
      message: 'Ping gagal - pastikan tabel system_health sudah dibuat',
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
