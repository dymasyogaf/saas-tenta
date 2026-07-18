<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Total Saldo Aktif</p>
        <h3 class="text-3xl font-display font-bold text-ink-900">{{ formatCurrency(saldoStore.balance) }}</h3>
        <p class="text-sm text-green-600 mt-3 flex items-center gap-1 font-medium">
          <TrendingUp class="w-4 h-4" /> +0% dari bulan lalu
        </p>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Akun Iklan Berjalan</p>
        <h3 class="text-3xl font-display font-bold text-ink-900">
          <span v-if="adsStore.isLoading" class="inline-block w-8 h-8 bg-ink-200 rounded animate-pulse"></span>
          <template v-else>{{ adsStore.activeCampaigns }}</template>
        </h3>
        <p class="text-sm text-ink-500 mt-3">2 Meta, 1 Google, 1 TikTok</p>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Iklan Butuh Perhatian</p>
        <h3 class="text-3xl font-display font-bold text-orange-600">2</h3>
        <p class="text-sm text-orange-600 mt-3 flex items-center gap-1 font-medium">
          <AlertCircle class="w-4 h-4" /> Cek segera
        </p>
      </div>
    </div>

    <!-- Campaign Performance Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden mt-8">
      <div class="px-6 py-5 border-b border-ink-100 flex justify-between items-center">
        <h4 class="font-display font-bold text-lg text-ink-900">Performa Kampanye Teratas</h4>
        <button class="text-sm text-orange-500 font-bold hover:text-orange-600">Lihat Semua</button>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div v-if="adsStore.isLoading" class="p-6 text-center space-y-3">
            <div class="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-ink-500 font-medium">Menarik data dari Meta Ads...</p>
          </div>
          <div v-else-if="adsStore.campaigns.length === 0" class="p-6 text-center">
            <p class="text-ink-500">Tidak ada kampanye aktif yang ditemukan.</p>
          </div>
          
          <template v-else>
            <!-- Looping Campaign Dinamis dari Meta Ads Proxy -->
            <div v-for="cmp in adsStore.campaigns" :key="cmp.id" class="flex items-center justify-between p-4 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors">
              <div class="flex items-center gap-4">
                <img :src="cmp.id.startsWith('gads') ? '/icon-google-ads.png' : (cmp.id.startsWith('tt') ? '/tiktok.svg' : '/icon-meta-ads.png')" alt="Ads" class="w-12 h-12 rounded-xl shadow-sm border border-ink-100 object-contain bg-white p-2" />
                <div>
                  <p class="font-bold text-ink-900 text-base">{{ cmp.name }}</p>
                  <p class="text-sm text-ink-500">Berjalan • Spend: {{ formatCurrency(cmp.spend) }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-display font-bold text-ink-900 text-lg">{{ cmp.impressions.toLocaleString('id-ID') }} Impresi</p>
                <p class="text-sm font-medium text-green-600">{{ cmp.clicks.toLocaleString('id-ID') }} Klik</p>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, AlertCircle } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'

definePageMeta({
  layout: 'dashboard',
})

const saldoStore = useSaldoStore()
const adsStore = useAdsStore()

onMounted(async () => {
  saldoStore.fetchSaldo()
  await adsStore.fetchMetaPerformance()
  await adsStore.fetchGooglePerformance()
  await adsStore.fetchTikTokPerformance()
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(value || 0)
}
</script>
