/**
 * useSupabaseKeepalive
 * Ping endpoint /api/ping SEKALI SAJA saat app pertama dibuka.
 *
 * Keepalive harian ditangani oleh cron-job.org (jam 14.00 WIB / 07.00 UTC),
 * sehingga tidak perlu polling dari client. Ping 1x per session ini hanya
 * sebagai backup tambahan saat user aktif membuka app.
 */
export const useSupabaseKeepalive = () => {
  if (import.meta.server) return

  onMounted(async () => {
    try {
      const res = await $fetch<{ ok: boolean; message: string; timestamp: string }>('/api/ping')
      if (res.ok) {
        console.debug(`[Keepalive] ✓ Supabase ping — ${res.timestamp}`)
      }
    } catch {
      // Ping gagal tidak kritis, abaikan
    }
  })
}
