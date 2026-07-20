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
