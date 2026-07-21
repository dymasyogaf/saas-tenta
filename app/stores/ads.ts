import { defineStore } from 'pinia'

export const useAdsStore = defineStore('ads', {
  state: () => ({
    isLoading: false,
    error: null as string | null,
    totalSpend: 0,
    activeCampaigns: 0,
    campaigns: [] as any[],
    adAccounts: [] as any[],
    isFetchingAccounts: false,
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
    },

    async fetchAdAccounts() {
      this.isFetchingAccounts = true
      
      const user = useSupabaseUser()
      if (!user.value) {
        this.isFetchingAccounts = false
        return
      }

      try {
        const uid = user.value.id || (user.value as any).sub
        const supabase = useSupabaseClient<any>()
        const { data: accounts, error } = await supabase
          .from('ad_accounts')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (!accounts) return
        
        this.adAccounts = accounts.map(acc => {
          const limit = acc.limit_amount || 0
          const penggunaan = 0 // Akan di-update via live fetch
          const saldo = limit - penggunaan
          return {
            ...acc,
            platform: acc.platform.charAt(0).toUpperCase() + acc.platform.slice(1),
            name: acc.account_name || acc.account_id,
            limit,
            penggunaan,
            saldo,
            alert_saldo: (saldo < limit * 0.1 && limit > 0) ? 'Segera Top Up' : null
          }
        })

        // Fetch live spend from Meta/Google proxy endpoints for each account
        const promises = this.adAccounts.map(async (acc, index) => {
          let endpoint = ''
          let params = {}
          if (acc.platform.toLowerCase() === 'meta') {
             endpoint = '/api/ads/meta/campaigns'
             params = { ad_account_id: acc.account_id }
          } else if (acc.platform.toLowerCase() === 'google') {
             endpoint = '/api/ads/google/campaigns'
             params = { customer_id: acc.account_id }
          } else if (acc.platform.toLowerCase() === 'tiktok') {
             endpoint = '/api/ads/tiktok/campaigns'
             params = { advertiser_id: acc.account_id }
          }
          
          if (endpoint) {
             try {
                const res = await $fetch<any>(endpoint, { params })
                if (res && res.success && res.data) {
                   const penggunaan = res.data.totalSpend || 0
                   const limit = this.adAccounts[index].limit || 0
                   const saldo = limit - penggunaan
                   
                   this.adAccounts[index].penggunaan = penggunaan
                   this.adAccounts[index].saldo = saldo
                   this.adAccounts[index].alert_saldo = (saldo < limit * 0.1 && limit > 0) ? 'Segera Top Up' : null
                   this.adAccounts[index].updated_at = new Date().toISOString()
                }
             } catch (e) {
                // Ignore if fetch fails for one account
             }
          }
        })
        
        await Promise.all(promises)

      } catch (e: any) {
        console.error('Failed to fetch ad accounts:', e)
      } finally {
        this.isFetchingAccounts = false
      }
    },

    async fetchLiveSpendOnly() {
      this.isFetchingAccounts = true
      
      try {
        const promises = this.adAccounts.map(async (acc, index) => {
          let endpoint = ''
          let params = {}
          if (acc.platform.toLowerCase() === 'meta') {
             endpoint = '/api/ads/meta/campaigns'
             params = { ad_account_id: acc.account_id }
          } else if (acc.platform.toLowerCase() === 'google') {
             endpoint = '/api/ads/google/campaigns'
             params = { customer_id: acc.account_id }
          } else if (acc.platform.toLowerCase() === 'tiktok') {
             endpoint = '/api/ads/tiktok/campaigns'
             params = { advertiser_id: acc.account_id }
          }
          
          if (endpoint) {
             try {
                const res = await $fetch<any>(endpoint, { params })
                if (res && res.success && res.data) {
                   const penggunaan = res.data.totalSpend || 0
                   const limit = this.adAccounts[index].limit || 0
                   const saldo = limit - penggunaan
                   
                   this.adAccounts[index].penggunaan = penggunaan
                   this.adAccounts[index].saldo = saldo
                   this.adAccounts[index].alert_saldo = (saldo < limit * 0.1 && limit > 0) ? 'Segera Top Up' : null
                   this.adAccounts[index].updated_at = new Date().toISOString() // Real-time UX
                }
             } catch (e) {
                // Ignore if fetch fails for one account
             }
          }
        })
        
        await Promise.all(promises)

      } catch (e: any) {
        console.error('Failed to sync live spend:', e)
      } finally {
        this.isFetchingAccounts = false
      }
    }
  }
})
