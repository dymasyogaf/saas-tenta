import { ref, readonly } from 'vue'
import { useAdsStore } from '~/stores/ads'

// ─────────────────────────────────────────────────────────────
// Module-level singleton state (shared across all components)
// Aman dipakai di banyak tempat sekaligus — tidak akan double-fetch
// ─────────────────────────────────────────────────────────────
const lastRefreshed = ref<Date | null>(null)
const isSyncing = ref(false)
let _autoRefreshTimer: ReturnType<typeof setInterval> | null = null
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 menit

export function useAdsLive() {
  const adsStore = useAdsStore()

  // Internal fetch — bisa dengan atau tanpa force cache-bypass
  async function _doFetch(startDate?: string, endDate?: string, force = false) {
    await adsStore.fetchAllPerformance(startDate, endDate, force)
    lastRefreshed.value = new Date()
  }

  /**
   * Mulai auto-refresh setiap 5 menit.
   * Aman dipanggil berkali-kali — hanya satu timer yang berjalan.
   */
  function startAutoRefresh() {
    if (!import.meta.client) return // Prevent running on the server during SSR
    if (_autoRefreshTimer) return // Already running, skip
    _autoRefreshTimer = setInterval(() => {
      if (!isSyncing.value) _doFetch()
    }, AUTO_REFRESH_INTERVAL_MS)
  }

  /**
   * Hentikan auto-refresh (panggil di onUnmounted).
   */
  function stopAutoRefresh() {
    if (_autoRefreshTimer) {
      clearInterval(_autoRefreshTimer)
      _autoRefreshTimer = null
    }
  }

  /**
   * Fetch normal (gunakan Nitro cache jika masih segar).
   */
  async function fetch(startDate?: string, endDate?: string) {
    if (isSyncing.value) return
    isSyncing.value = true
    try {
      await _doFetch(startDate, endDate, false)
    } finally {
      isSyncing.value = false
    }
  }

  /**
   * Force sync — bypass Nitro cache, selalu ambil data fresh dari platform API.
   * Hubungkan ke tombol "Sync Sekarang" di UI.
   */
  async function syncNow(startDate?: string, endDate?: string) {
    if (isSyncing.value) return
    isSyncing.value = true
    try {
      await _doFetch(startDate, endDate, true)
    } finally {
      isSyncing.value = false
    }
  }

  return {
    /** Timestamp terakhir data di-refresh (null = belum pernah) */
    lastRefreshed: readonly(lastRefreshed),
    /** true selama sedang fetch/sync */
    isSyncing: readonly(isSyncing),
    startAutoRefresh,
    stopAutoRefresh,
    fetch,
    syncNow,
  }
}
