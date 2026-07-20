import { defineStore } from 'pinia'

export const useAdsStore = defineStore('ads', {
  state: () => ({
    isLoading: false,
    error: null as string | null,
    totalSpend: 0,
    activeCampaigns: 0,
    campaigns: [] as any[],
    dataSource: 'mock' // 'mock' | 'live'
  }),

  actions: {
    async fetchAllPerformance() {
      this.isLoading = true
      this.error = null
      this.totalSpend = 0
      this.activeCampaigns = 0
      this.campaigns = []
      
      const user = useSupabaseUser()
      if (!user.value) {
        this.isLoading = false
        return
      }

      const supabase = useSupabaseClient<any>()
      
      try {
        const uid = user.value.id || (user.value as any).sub
        const { data: accounts, error } = await supabase
          .from('ad_account_requests')
          .select('platform, details')
          .eq('user_id', uid)
          .eq('status', 'approved')

        if (error) throw error
        
        if (!accounts || accounts.length === 0) {
           this.isLoading = false
           return
        }

        const promises = accounts.map(async (acc: any) => {
           const adAccountId = acc.details?.ad_account_id
           if (!adAccountId) return null

           let endpoint = ''
           let params = {}
           if (acc.platform.includes('Meta')) {
              endpoint = '/api/ads/meta/campaigns'
              params = { ad_account_id: adAccountId }
           } else if (acc.platform.includes('Google')) {
              endpoint = '/api/ads/google/campaigns'
              params = { customer_id: adAccountId }
           } else if (acc.platform.includes('TikTok')) {
              endpoint = '/api/ads/tiktok/campaigns'
              params = { advertiser_id: adAccountId }
           }

           if (endpoint) {
              return $fetch<any>(endpoint, { method: 'GET', params }).catch(() => null)
           }
           return null
        })

        const results = await Promise.all(promises)
        
        let totalSpend = 0
        let activeCampaigns = 0
        let allCampaigns: any[] = []

        results.forEach(res => {
           if (res && res.success && res.data) {
              totalSpend += res.data.totalSpend || 0
              activeCampaigns += res.data.activeCampaigns || 0
              if (res.data.campaigns) {
                 allCampaigns = [...allCampaigns, ...res.data.campaigns]
              }
           }
        })

        this.totalSpend = totalSpend
        this.activeCampaigns = activeCampaigns
        
        // Sort campaigns by spend descending
        this.campaigns = allCampaigns.sort((a, b) => (b.spend || 0) - (a.spend || 0))

      } catch (e: any) {
         console.error('Failed to fetch all performance:', e)
         this.error = e.message
      } finally {
         this.isLoading = false
      }
    }
  }
})
