<template>
  <div class="space-y-6 max-w-6xl mx-auto">

    <!-- Stats Cards Row 1 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Total Saldo Aktif</p>
        <template v-if="saldoStore.isFetchingSaldo">
          <div class="h-9 w-32 bg-ink-200 rounded-md animate-pulse mb-3 mt-1"></div>
          <div class="h-4 w-24 bg-ink-200 rounded-md animate-pulse mt-4"></div>
        </template>
        <template v-else>
          <h3 class="text-2xl xl:text-3xl font-display font-bold text-ink-900">{{ formatCurrency(saldoStore.balance) }}</h3>
          <p class="text-sm text-green-600 mt-3 flex items-center gap-1 font-medium">
            <TrendingUp class="w-4 h-4" /> +0% dari bulan lalu
          </p>
        </template>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Total Ad Spend</p>
        <template v-if="adsStore.isLoading">
          <div class="h-9 w-32 bg-ink-200 rounded-md animate-pulse mb-3 mt-1"></div>
          <div class="h-4 w-24 bg-ink-200 rounded-md animate-pulse mt-4"></div>
        </template>
        <template v-else>
          <h3 class="text-2xl xl:text-3xl font-display font-bold text-ink-900">{{ formatCurrency(adsStore.totalSpend) }}</h3>
          <p class="text-sm text-ink-500 mt-3 flex items-center gap-1">
            <Activity class="w-4 h-4 text-orange-500" /> 30 hari terakhir
          </p>
        </template>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Akun Iklan Berjalan</p>
        <template v-if="adsStore.isLoading">
          <div class="h-9 w-16 bg-ink-200 rounded-md animate-pulse mb-3 mt-1"></div>
          <div class="h-4 w-40 bg-ink-200 rounded-md animate-pulse mt-4"></div>
        </template>
        <template v-else>
          <h3 class="text-2xl xl:text-3xl font-display font-bold text-ink-900">{{ adsStore.activeCampaigns }}</h3>
          <p class="text-sm text-ink-500 mt-3">Kampanye aktif (30 hari)</p>
        </template>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Konversi</p>
        <template v-if="adsStore.isLoading">
          <div class="h-9 w-16 bg-ink-200 rounded-md animate-pulse mb-3 mt-1"></div>
          <div class="h-4 w-24 bg-ink-200 rounded-md animate-pulse mt-4"></div>
        </template>
        <template v-else>
          <h3 class="text-2xl xl:text-3xl font-display font-bold text-ink-900">{{ totalConversions }}</h3>
          <p v-if="totalConversions > 0" class="text-sm text-green-600 mt-3 flex items-center gap-1 font-medium">
            <Target class="w-4 h-4" /> Cost/Conv: {{ formatCurrency(adsStore.totalSpend / totalConversions) }}
          </p>
          <p v-else class="text-sm text-ink-400 mt-3 flex items-center gap-1">
            <Target class="w-4 h-4" /> Belum ada konversi
          </p>
        </template>
      </div>
    </div>

    <!-- Campaign Performance Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden">
      <div class="px-6 py-5 border-b border-ink-100 flex justify-between items-center">
        <h4 class="font-display font-bold text-lg text-ink-900">Performa Kampanye Teratas</h4>
        <button class="text-sm text-orange-500 font-bold hover:text-orange-600">Lihat Semua</button>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div v-if="adsStore.isLoading" class="space-y-4">
            <!-- Skeleton items -->
            <div v-for="i in 3" :key="i" class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-ink-50 rounded-xl gap-4 animate-pulse">
              <div class="flex items-center gap-4 w-full sm:w-1/2">
                <div class="w-12 h-12 bg-ink-200 rounded-xl shrink-0"></div>
                <div class="w-full space-y-2">
                  <div class="h-5 bg-ink-200 rounded w-1/2"></div>
                  <div class="h-4 bg-ink-200 rounded w-2/3"></div>
                </div>
              </div>
              <div class="w-full sm:w-1/2 grid grid-cols-3 gap-3">
                <div class="h-10 bg-ink-200 rounded"></div>
                <div class="h-10 bg-ink-200 rounded"></div>
                <div class="h-10 bg-ink-200 rounded"></div>
              </div>
            </div>
          </div>
          <div v-else-if="adsStore.campaigns.length === 0" class="p-6 text-center">
            <p class="text-ink-500">Tidak ada kampanye aktif yang ditemukan.</p>
          </div>
          
          <template v-else>
            <div v-for="cmp in adsStore.campaigns" :key="cmp.id" class="p-4 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors">
              <!-- Top: Campaign Info -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                  <img :src="cmp.platform === 'google' ? '/icon-google-ads.png' : (cmp.platform === 'tiktok' ? '/tiktok.svg' : '/icon-meta-ads.png')" alt="Ads" class="w-12 h-12 rounded-xl shadow-sm border border-ink-100 object-contain bg-white p-2" />
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <p class="font-bold text-ink-900 text-base">{{ cmp.name }}</p>
                      <span :class="statusBadge(cmp.status).class" class="text-xs font-semibold px-2 py-0.5 rounded-full">
                        {{ statusBadge(cmp.status).label }}
                      </span>
                      <span v-if="cmp.campaignType && cmp.campaignType !== 'UNKNOWN'" class="text-xs font-medium px-2 py-0.5 rounded-full bg-ink-200 text-ink-600">
                        {{ formatCampaignType(cmp.campaignType) }}
                      </span>
                    </div>
                    <p class="text-sm text-ink-500 mt-0.5">
                      Spend: {{ formatCurrency(cmp.spend) }}
                      <span v-if="cmp.dailyBudget" class="text-ink-400"> · Budget: {{ formatCurrency(cmp.dailyBudget) }}/hari</span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- Bottom: Metrics Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-ink-200/60">
                <div>
                  <p class="text-xs text-ink-400 font-medium">Impresi</p>
                  <p class="font-display font-bold text-ink-900">{{ cmp.impressions?.toLocaleString('id-ID') || '0' }}</p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">Klik</p>
                  <p class="font-display font-bold text-green-600">{{ cmp.clicks?.toLocaleString('id-ID') || '0' }}</p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">CTR</p>
                  <p class="font-display font-bold" :class="cmp.ctr > 3 ? 'text-green-600' : cmp.ctr > 1 ? 'text-orange-500' : 'text-red-500'">
                    {{ cmp.ctr?.toFixed(2) || '0.00' }}%
                  </p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">CPC</p>
                  <p class="font-display font-bold text-ink-900">{{ formatCurrency(cmp.averageCpc || 0) }}</p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">Konversi</p>
                  <p class="font-display font-bold" :class="cmp.conversions > 0 ? 'text-green-600' : 'text-ink-400'">
                    {{ cmp.conversions?.toFixed(0) || '0' }}
                  </p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, Activity, Target, ShieldAlert } from 'lucide-vue-next'
import { onMounted, ref, computed } from 'vue'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'

definePageMeta({
  layout: 'dashboard',
})

const saldoStore = useSaldoStore()
const adsStore = useAdsStore()

const { user } = useAuth()
const supabase = useSupabaseClient()
const verificationStatus = ref<string | null>(null)

// Computed: total konversi dari semua kampanye
const totalConversions = computed(() => {
  return adsStore.campaigns.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0)
})

onMounted(async () => {
  saldoStore.fetchSaldo()
  adsStore.fetchAllPerformance()

  // Fetch verification status
  if (user.value) {
    const uid = (user.value as any).id || (user.value as any).sub
    if (uid) {
      const { data } = await (supabase as any)
        .from('users')
        .select('verification_status')
        .eq('id', uid)
        .single()
        
      if (data && data.verification_status) {
        verificationStatus.value = data.verification_status
      } else {
        verificationStatus.value = 'unverified'
      }
    }
  }
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(value || 0)
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; class: string }> = {
    'ENABLED': { label: 'Aktif', class: 'bg-green-100 text-green-700' },
    'PAUSED': { label: 'Dijeda', class: 'bg-yellow-100 text-yellow-700' },
    'REMOVED': { label: 'Dihapus', class: 'bg-red-100 text-red-700' },
  }
  return map[status] || { label: status || 'N/A', class: 'bg-ink-200 text-ink-600' }
}

const formatCampaignType = (type: string) => {
  const map: Record<string, string> = {
    'SEARCH': 'Search',
    'DISPLAY': 'Display',
    'VIDEO': 'Video',
    'SHOPPING': 'Shopping',
    'PERFORMANCE_MAX': 'PMax',
    'SMART': 'Smart',
    'DEMAND_GEN': 'Demand Gen',
  }
  return map[type] || type
}
</script>

