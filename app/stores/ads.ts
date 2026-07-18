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
    async fetchMetaPerformance(adAccountId: string = 'act_dummy123') {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<any>('/api/ads/meta/campaigns', {
          method: 'GET',
          params: { ad_account_id: adAccountId }
        })

        if (response && response.success) {
          this.totalSpend = response.data.totalSpend || 0
          this.activeCampaigns = response.data.activeCampaigns || 0
          this.campaigns = response.data.campaigns || []
          this.dataSource = response.source || 'mock'
        }
      } catch (e: any) {
        this.error = e.data?.message || e.statusMessage || e.message || 'Gagal mengambil data performa Meta Ads'
        console.error('Failed to fetch ads performance:', this.error)
      } finally {
        this.isLoading = false
      }
    },
    async fetchGooglePerformance(customerId: string = 'dummy_cust_123') {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<any>('/api/ads/google/campaigns', {
          method: 'GET',
          params: { customer_id: customerId }
        })

        if (response && response.success) {
          // Asumsi MVP: Kita tambahkan data Google ke state yang sudah ada
          this.totalSpend += response.data.totalSpend || 0
          this.activeCampaigns += response.data.activeCampaigns || 0
          this.campaigns = [...this.campaigns, ...(response.data.campaigns || [])]
          this.dataSource = response.source || 'mock'
        }
      } catch (e: any) {
        this.error = e.data?.message || e.statusMessage || e.message || 'Gagal mengambil data performa Google Ads'
        console.error('Failed to fetch Google ads performance:', this.error)
      } finally {
        this.isLoading = false
      }
    },
    async fetchTikTokPerformance(advertiserId: string = 'dummy_tt_123') {
      this.isLoading = true
      this.error = null

      try {
        const response = await $fetch<any>('/api/ads/tiktok/campaigns', {
          method: 'GET',
          params: { advertiser_id: advertiserId }
        })

        if (response && response.success) {
          this.totalSpend += response.data.totalSpend || 0
          this.activeCampaigns += response.data.activeCampaigns || 0
          this.campaigns = [...this.campaigns, ...(response.data.campaigns || [])]
          this.dataSource = response.source || 'mock'
        }
      } catch (e: any) {
        this.error = e.data?.message || e.statusMessage || e.message || 'Gagal mengambil data performa TikTok Ads'
        console.error('Failed to fetch TikTok ads performance:', this.error)
      } finally {
        this.isLoading = false
      }
    }
  }
})
