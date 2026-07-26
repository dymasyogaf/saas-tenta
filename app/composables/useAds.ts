/**
 * useAdsLive
 * Composable stateful singleton untuk data iklan live (Meta & Google).
 *
 * Fitur:
 * - State di-share antar semua komponen (module-level) → tidak ada double fetch
 * - Auto-refresh setiap 5 menit via setInterval (pakai Nitro server cache)
 * - syncNow() → force bypass cache, fetch fresh langsung dari Meta/Google API
 * - lastRefreshed → timestamp update terakhir, bisa ditampilkan di UI
 *
 * Data iklan TIDAK disimpan ke Supabase — Supabase hanya untuk user auth & settings.
 * Supabase keepalive ditangani oleh cron-job.org (1x sehari jam 14.00 WIB).
 */

// ─── Singleton State (module-level, shared across all component instances) ────
const _meta = {
  data: ref<any>(null),
  loading: ref(false),
  error: ref<string | null>(null),
  lastRefreshed: ref<Date | null>(null),
  timer: null as ReturnType<typeof setInterval> | null,
}

const _google = {
  data: ref<any>(null),
  loading: ref(false),
  error: ref<string | null>(null),
  lastRefreshed: ref<Date | null>(null),
  timer: null as ReturnType<typeof setInterval> | null,
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5 menit

// ─── Internal fetch helpers ───────────────────────────────────────────────────

async function _fetchMeta(accountId: string, force = false, startDate?: string, endDate?: string) {
  if (_meta.loading.value) return
  _meta.loading.value = true
  _meta.error.value = null
  try {
    const query: Record<string, string> = { ad_account_id: accountId }
    if (startDate) query.start_date = startDate
    if (endDate) query.end_date = endDate
    if (force) query.force = 'true'

    const res = await $fetch<any>('/api/ads/meta/campaigns', { query })
    if (!res.success) throw new Error(res.message || 'Gagal memuat data Meta')
    _meta.data.value = res.data
    _meta.lastRefreshed.value = new Date()
  } catch (e: any) {
    _meta.error.value = e.data?.message || e.message || 'Error tidak diketahui'
  } finally {
    _meta.loading.value = false
  }
}

async function _fetchGoogle(customerId: string, force = false, startDate?: string, endDate?: string) {
  if (_google.loading.value) return
  _google.loading.value = true
  _google.error.value = null
  try {
    const query: Record<string, string> = { customer_id: customerId }
    if (startDate) query.start_date = startDate
    if (endDate) query.end_date = endDate
    if (force) query.force = 'true'

    const res = await $fetch<any>('/api/ads/google/campaigns', { query })
    if (!res.success) throw new Error(res.message || 'Gagal memuat data Google')
    _google.data.value = res.data
    _google.lastRefreshed.value = new Date()
  } catch (e: any) {
    _google.error.value = e.data?.message || e.message || 'Error tidak diketahui'
  } finally {
    _google.loading.value = false
  }
}

// ─── Public Composable ────────────────────────────────────────────────────────

export const useAdsLive = () => {
  /**
   * Mulai auto-refresh data iklan setiap 5 menit.
   * Aman dipanggil berkali-kali — hanya 1 interval yang berjalan per platform.
   */
  function startMetaAutoRefresh(accountId: string, startDate?: string, endDate?: string) {
    if (import.meta.server) return
    // Fetch segera saat pertama dipanggil
    _fetchMeta(accountId, false, startDate, endDate)
    // Hindari duplikasi interval
    if (_meta.timer) return
    _meta.timer = setInterval(() => {
      _fetchMeta(accountId, false, startDate, endDate)
    }, REFRESH_INTERVAL_MS)
  }

  function startGoogleAutoRefresh(customerId: string, startDate?: string, endDate?: string) {
    if (import.meta.server) return
    _fetchGoogle(customerId, false, startDate, endDate)
    if (_google.timer) return
    _google.timer = setInterval(() => {
      _fetchGoogle(customerId, false, startDate, endDate)
    }, REFRESH_INTERVAL_MS)
  }

  /**
   * Hentikan auto-refresh (panggil saat komponen unmount jika perlu).
   * Biasanya tidak perlu dipanggil jika data dipakai di seluruh app.
   */
  function stopMetaAutoRefresh() {
    if (_meta.timer) { clearInterval(_meta.timer); _meta.timer = null }
  }

  function stopGoogleAutoRefresh() {
    if (_google.timer) { clearInterval(_google.timer); _google.timer = null }
  }

  /**
   * Force sync — bypass Nitro cache, fetch langsung dari Meta/Google API.
   * Dipanggil saat user klik tombol "Sync Sekarang".
   */
  async function syncMetaNow(accountId: string, startDate?: string, endDate?: string) {
    await _fetchMeta(accountId, true, startDate, endDate)
  }

  async function syncGoogleNow(customerId: string, startDate?: string, endDate?: string) {
    await _fetchGoogle(customerId, true, startDate, endDate)
  }

  return {
    // Meta
    metaData: _meta.data,
    metaLoading: _meta.loading,
    metaError: _meta.error,
    metaLastRefreshed: _meta.lastRefreshed,
    startMetaAutoRefresh,
    stopMetaAutoRefresh,
    syncMetaNow,

    // Google
    googleData: _google.data,
    googleLoading: _google.loading,
    googleError: _google.error,
    googleLastRefreshed: _google.lastRefreshed,
    startGoogleAutoRefresh,
    stopGoogleAutoRefresh,
    syncGoogleNow,
  }
}

// ─── Legacy useAds (backward compat) ─────────────────────────────────────────
// Tetap ada agar kode lama tidak rusak

export const useAds = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchAccounts = async (platform: 'meta' | 'tiktok' | 'google') => {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<any>(`/api/ads/${platform}/accounts`)
      if (!res.success) throw new Error(res.message || 'Gagal memuat akun')
      return res.data
    } catch (e: any) {
      error.value = e.data?.message || e.message
      return null
    } finally {
      loading.value = false
    }
  }

  const fetchCampaigns = async (platform: 'meta' | 'tiktok' | 'google', accountId: string) => {
    loading.value = true
    error.value = null
    try {
      const queryKey = platform === 'meta' ? 'ad_account_id' : platform === 'tiktok' ? 'advertiser_id' : 'customer_id'
      const res = await $fetch<any>(`/api/ads/${platform}/campaigns`, {
        query: { [queryKey]: accountId }
      })
      if (!res.success) throw new Error(res.message || 'Gagal memuat kampanye')
      return res.data
    } catch (e: any) {
      error.value = e.data?.message || e.message
      return null
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchAccounts, fetchCampaigns }
}
