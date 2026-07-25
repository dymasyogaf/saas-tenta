import { defineStore } from 'pinia'
import { useSaldoStore } from './saldo'

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
    async fetchAllPerformance(startDate?: string, endDate?: string) {
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
           let platform = ''
           if (acc.platform.includes('Meta')) {
              endpoint = '/api/ads/meta/campaigns'
              params = { ad_account_id: adAccountId, start_date: startDate, end_date: endDate }
              platform = 'meta'
           } else if (acc.platform.includes('Google')) {
              endpoint = '/api/ads/google/campaigns'
              params = { customer_id: adAccountId, start_date: startDate, end_date: endDate }
              platform = 'google'
           } else if (acc.platform.includes('TikTok')) {
              endpoint = '/api/ads/tiktok/campaigns'
              params = { advertiser_id: adAccountId, start_date: startDate, end_date: endDate }
              platform = 'tiktok'
           }

           if (endpoint) {
              const res = await $fetch<any>(endpoint, { method: 'GET', params }).catch(() => null)
              if (res) res._platform = platform
              return res
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
                 const tagged = res.data.campaigns.map((c: any) => ({ ...c, platform: res._platform || 'meta' }))
                 allCampaigns = [...allCampaigns, ...tagged]
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
        
        const saldoStore = useSaldoStore()
        if (!saldoStore.weeklyLimit && !saldoStore.activePackage) {
           await saldoStore.fetchSaldo()
        }
        
        this.adAccounts = accounts.map(acc => {
          const limit = saldoStore.weeklyLimit || 0
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
                   const saldoStore = useSaldoStore()
                   const limit = saldoStore.weeklyLimit || 0
                   const api_balance = res.data.api_balance
                   const api_budget_total = res.data.api_budget_total
                   const api_amount_spent = res.data.api_amount_spent
                   
                   // Gunakan API balance (jika ada), jika tidak gunakan Limit - Penggunaan
                   const saldo = api_balance !== undefined ? api_balance : (limit - penggunaan)
                   
                   this.adAccounts[index].penggunaan = penggunaan
                   this.adAccounts[index].saldo = saldo
                   this.adAccounts[index].api_balance_active = api_balance !== undefined
                   this.adAccounts[index].api_budget_total = api_budget_total
                   this.adAccounts[index].api_amount_spent = api_amount_spent
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

    async fetchLiveSpendOnly(startDate?: string, endDate?: string) {
      this.isFetchingAccounts = true
      
      try {
        const promises = this.adAccounts.map(async (acc, index) => {
          let endpoint = ''
          let params: any = {}
          if (acc.platform.toLowerCase() === 'meta') {
             endpoint = '/api/ads/meta/campaigns'
             params = { ad_account_id: acc.account_id, start_date: startDate, end_date: endDate }
          } else if (acc.platform.toLowerCase() === 'google') {
             endpoint = '/api/ads/google/campaigns'
             params = { customer_id: acc.account_id, start_date: startDate, end_date: endDate }
          } else if (acc.platform.toLowerCase() === 'tiktok') {
             endpoint = '/api/ads/tiktok/campaigns'
             params = { advertiser_id: acc.account_id, start_date: startDate, end_date: endDate }
          }
          
          if (endpoint) {
             try {
                const res = await $fetch<any>(endpoint, { params })
                if (res && res.success && res.data) {
                   const penggunaan = res.data.totalSpend || 0
                   const limit = this.adAccounts[index].limit || 0
                   const api_balance = res.data.api_balance
                   const api_budget_total = res.data.api_budget_total
                   const api_amount_spent = res.data.api_amount_spent
                   
                   // Gunakan API balance (jika ada), jika tidak gunakan Limit - Penggunaan
                   const saldo = api_balance !== undefined ? api_balance : (limit - penggunaan)
                   
                   this.adAccounts[index].penggunaan = penggunaan
                   
                   // Jika sedang difilter tanggalnya, JANGAN ubah saldo (biarkan sisa keseluruhan)
                   // kecuali ada api_balance yang memang akurat secara lifetime
                   if (!startDate || api_balance !== undefined) {
                     this.adAccounts[index].saldo = saldo
                   }
                   
                   this.adAccounts[index].api_balance_active = api_balance !== undefined // Tandai UI
                   this.adAccounts[index].api_budget_total = api_budget_total
                   this.adAccounts[index].api_amount_spent = api_amount_spent
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
