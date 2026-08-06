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
    dataSource: 'live' as 'mock' | 'live'
  }),

  actions: {
    getEndpoint(platform: string, accountId: string, startDate?: string, endDate?: string, force = false) {
      const p = platform.toLowerCase()
      const baseParams: any = { start_date: startDate, end_date: endDate }
      if (force) baseParams.force = 'true'

      if (p.includes('meta')) return { endpoint: '/api/ads/meta/campaigns', params: { ...baseParams, ad_account_id: accountId }, platform: 'meta' }
      if (p.includes('google')) return { endpoint: '/api/ads/google/campaigns', params: { ...baseParams, customer_id: accountId }, platform: 'google' }
      if (p.includes('tiktok')) return { endpoint: '/api/ads/tiktok/campaigns', params: { ...baseParams, advertiser_id: accountId }, platform: 'tiktok' }
      return { endpoint: '', params: {}, platform: '' }
    },

    async fetchAllPerformance(startDate?: string, endDate?: string, force = false) {
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

           const { endpoint, params, platform: p } = this.getEndpoint(acc.platform, adAccountId, startDate, endDate, force)

           if (endpoint) {
              const res = await $fetch<any>(endpoint, { method: 'GET', params }).catch(() => null)
              if (res) res._platform = p
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
          const saldo = acc.saldo || 0 // Murni dari database lokal (alokasi klien)
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
          const { endpoint, params } = this.getEndpoint(acc.platform, acc.account_id)
          
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
                   
                   const api_account_name = res.data.api_account_name
                   
                   // Gunakan API balance (jika ada), jika tidak gunakan saldo lokal dari DB
                   const saldo = api_balance !== undefined ? api_balance : (this.adAccounts[index].saldo || 0)
                   
                   this.adAccounts[index].penggunaan = penggunaan
                   this.adAccounts[index].saldo = saldo
                   this.adAccounts[index].api_balance_active = api_balance !== undefined
                   this.adAccounts[index].api_budget_total = api_budget_total
                   this.adAccounts[index].api_amount_spent = api_amount_spent
                   this.adAccounts[index].alert_saldo = (saldo < limit * 0.1 && limit > 0) ? 'Segera Top Up' : null
                   this.adAccounts[index].updated_at = new Date().toISOString()
                   
                   // AUTO-HEALING: Update nama akun jika ditarik dari API dan belum diset (berawalan "Ad Account") atau berbeda
                   if (api_account_name && this.adAccounts[index].name !== api_account_name) {
                     // Update UI immediately (Backend will sync DB automatically)
                     this.adAccounts[index].name = api_account_name
                   }
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
          const { endpoint, params } = this.getEndpoint(acc.platform, acc.account_id, startDate, endDate)
          
          if (endpoint) {
             try {
                const res = await $fetch<any>(endpoint, { params })
                if (res && res.success && res.data) {
                   const penggunaan = res.data.totalSpend || 0
                   const limit = this.adAccounts[index].limit || 0
                   const api_balance = res.data.api_balance
                   const api_budget_total = res.data.api_budget_total
                   const api_amount_spent = res.data.api_amount_spent
                   
                   const api_account_name = res.data.api_account_name
                   
                   // Gunakan API balance (jika ada), jika tidak gunakan saldo lokal dari DB
                   const saldo = api_balance !== undefined ? api_balance : (this.adAccounts[index].saldo || 0)
                   
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
                   
                   // AUTO-HEALING: Update nama akun jika ditarik dari API dan belum diset (berawalan "Ad Account") atau berbeda
                   if (api_account_name && this.adAccounts[index].name !== api_account_name) {
                     this.adAccounts[index].name = api_account_name
                     const supabase = useSupabaseClient()
                     supabase.from('ad_accounts').update({ account_name: api_account_name }).eq('account_id', acc.account_id).then()
                   }
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
