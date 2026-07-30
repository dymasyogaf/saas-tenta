<template>
  <div class="space-y-6 max-w-6xl mx-auto">

    <!-- Stats Cards Row 1 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">{{ $t('dashboard.totalActiveBalance') }}</p>
        <template v-if="saldoStore.isFetchingSaldo">
          <div class="h-9 w-32 bg-ink-200 rounded-md animate-pulse mb-3 mt-1"></div>
          <div class="h-4 w-24 bg-ink-200 rounded-md animate-pulse mt-4"></div>
        </template>
        <template v-else>
          <h3 class="text-2xl xl:text-3xl font-display font-bold text-ink-900">{{ formatCurrency(saldoStore.balance) }}</h3>
          <p class="text-sm text-green-600 mt-3 flex items-center gap-1 font-medium">
            <TrendingUp class="w-4 h-4" /> {{ $t('dashboard.fromLastMonth') }}
          </p>
        </template>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">{{ $t('dashboard.totalAdSpend') }}</p>
        <template v-if="adsStore.isLoading">
          <div class="h-9 w-32 bg-ink-200 rounded-md animate-pulse mb-3 mt-1"></div>
          <div class="h-4 w-24 bg-ink-200 rounded-md animate-pulse mt-4"></div>
        </template>
        <template v-else>
          <h3 class="text-2xl xl:text-3xl font-display font-bold text-ink-900">{{ formatCurrency(adsStore.totalSpend) }}</h3>
          <p class="text-sm text-ink-500 mt-3 flex items-center gap-1">
            <Activity class="w-4 h-4 text-orange-500" /> {{ $t('dashboard.last30days') }}
          </p>
        </template>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">{{ $t('dashboard.activeAdAccounts') }}</p>
        <template v-if="adsStore.isLoading">
          <div class="h-9 w-16 bg-ink-200 rounded-md animate-pulse mb-3 mt-1"></div>
          <div class="h-4 w-40 bg-ink-200 rounded-md animate-pulse mt-4"></div>
        </template>
        <template v-else>
          <h3 class="text-2xl xl:text-3xl font-display font-bold text-ink-900">{{ adsStore.activeCampaigns }}</h3>
          <p class="text-sm text-ink-500 mt-3">{{ $t('dashboard.activeCampaigns30d') }}</p>
        </template>
      </div>

    </div>

    <!-- Campaign Performance Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden">
      <div class="px-6 py-5 border-b border-ink-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h4 class="font-display font-bold text-lg text-ink-900">{{ $t('dashboard.topCampaignPerformance') }}</h4>
        <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <!-- Platform Filter -->
          <div class="relative w-full sm:w-44">
            <select v-model="selectedPlatform" class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm cursor-pointer">
              <option value="all">{{ $t('dashboard.allAds') }}</option>
              <option value="meta">Meta Ads</option>
              <option value="tiktok">TikTok Ads</option>
              <option value="google">Google Ads</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
          
          <!-- Date Filter -->
          <div class="w-full sm:w-auto">
            <SharedDateRangePicker v-model="dateRange" />
          </div>
        </div>
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
          <div v-else-if="displayedCampaigns.length === 0" class="p-6 text-center">
            <p class="text-ink-500">{{ $t('dashboard.noCampaignsFound') }}</p>
          </div>
          
          <template v-else>
            <div v-for="cmp in displayedCampaigns" :key="cmp.id" class="p-4 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors">
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
                      {{ $t('dashboard.spend') }}: {{ formatCurrency(cmp.spend) }}
                      <span v-if="cmp.dailyBudget" class="text-ink-400"> · {{ $t('dashboard.budget') }}: {{ formatCurrency(cmp.dailyBudget) }}{{ $t('dashboard.perDay') }}</span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- Bottom: Metrics Grid -->
              <!-- Meta Ads Metrics -->
              <div v-if="cmp.platform === 'meta'" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-ink-200/60">
                <div>
                  <p class="text-xs text-ink-400 font-medium">{{ $t('dashboard.metrics.reach') }}</p>
                  <p class="font-display font-bold text-ink-900">{{ cmp.reach?.toLocaleString(locale) || '0' }}</p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">{{ $t('dashboard.metrics.linkClicks') }}</p>
                  <p class="font-display font-bold text-green-600">{{ cmp.linkClicks?.toLocaleString(locale) || '0' }}</p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">{{ $t('dashboard.metrics.cpcLink') }}</p>
                  <p class="font-display font-bold text-ink-900">{{ formatCurrency(cmp.cpcLink || 0) }}</p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">{{ $t('dashboard.metrics.roas') }}</p>
                  <p class="font-display font-bold" :class="(cmp.roas || 0) > 1 ? 'text-green-600' : 'text-ink-400'">
                    {{ (cmp.roas || 0).toFixed(2) }}x
                  </p>
                </div>
              </div>

              <!-- Google & TikTok Metrics -->
              <div v-else class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-ink-200/60">
                <div>
                  <p class="text-xs text-ink-400 font-medium">{{ $t('dashboard.metrics.impressions') }}</p>
                  <p class="font-display font-bold text-ink-900">{{ cmp.impressions?.toLocaleString(locale) || '0' }}</p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">{{ $t('dashboard.metrics.clicks') }}</p>
                  <p class="font-display font-bold text-green-600">{{ cmp.clicks?.toLocaleString(locale) || '0' }}</p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">{{ $t('dashboard.metrics.ctr') }}</p>
                  <p class="font-display font-bold" :class="cmp.ctr > 3 ? 'text-green-600' : cmp.ctr > 1 ? 'text-orange-500' : 'text-red-500'">
                    {{ cmp.ctr?.toFixed(2) || '0.00' }}%
                  </p>
                </div>
                <div>
                  <p class="text-xs text-ink-400 font-medium">{{ $t('dashboard.metrics.cpc') }}</p>
                  <p class="font-display font-bold text-ink-900">{{ formatCurrency(cmp.averageCpc || 0) }}</p>
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
import { TrendingUp, Activity, ShieldAlert, ChevronDown } from 'lucide-vue-next'
import { onMounted, ref, computed, watch } from 'vue'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'

definePageMeta({
  layout: 'dashboard',
})

const { t, locale } = useI18n()
const saldoStore = useSaldoStore()
const adsStore = useAdsStore()

const { user } = useAuth()
const supabase = useSupabaseClient()
const verificationStatus = ref<string | null>(null)

// Filter states
const selectedPlatform = ref('all')
const dateRange = ref({ start: '', end: '' })

// Computed filtered campaigns
const displayedCampaigns = computed(() => {
  let filtered = adsStore.campaigns || []
  if (selectedPlatform.value !== 'all') {
    filtered = filtered.filter((c: any) => c.platform === selectedPlatform.value)
  }
  return filtered
})

// Refetch on date change
watch(dateRange, (newDate) => {
  if (newDate && newDate.start && newDate.end) {
    adsStore.fetchAllPerformance(newDate.start, newDate.end)
  }
}, { deep: true })

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
  return new Intl.NumberFormat(locale.value === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value || 0)
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; class: string }> = {
    'ENABLED': { label: t('dashboard.status.active'), class: 'bg-green-100 text-green-700' },
    'ACTIVE': { label: t('dashboard.status.active'), class: 'bg-green-100 text-green-700' },
    'PAUSED': { label: t('dashboard.status.paused'), class: 'bg-yellow-100 text-yellow-700' },
    'REMOVED': { label: t('dashboard.status.removed'), class: 'bg-red-100 text-red-700' },
    'ARCHIVED': { label: t('dashboard.status.archived'), class: 'bg-ink-100 text-ink-700' },
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

