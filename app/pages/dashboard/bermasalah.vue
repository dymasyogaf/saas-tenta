<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">Iklan Bermasalah</h2>
      <div class="flex flex-col sm:flex-row gap-3">
        <a href="https://tentaklik.com/ketentuan/" target="_blank" class="bg-[#fcd34d] hover:bg-[#fbbf24] text-ink-900 px-4 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm">
          <div class="bg-orange-600 text-white rounded-full p-1"><Lightbulb class="w-3.5 h-3.5" /></div> Lihat Syarat dan Ketentuan
        </a>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-ink-200 mb-6 flex gap-6 overflow-x-auto hide-scrollbar">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'pb-3.5 text-sm px-2 border-b-2 transition-colors',
          activeTab === tab.id 
            ? 'font-semibold text-orange-500 border-orange-500' 
            : 'font-medium text-ink-500 hover:text-ink-700 border-transparent'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="py-12 flex justify-center">
      <div class="animate-spin w-8 h-8 border-4 border-ink-200 border-t-orange-500 rounded-full"></div>
    </div>

    <!-- Tab Contents -->
    <div v-else>
      <div v-if="filteredIssues.length === 0">
        <SharedEmptyState 
          :message="`Bagus! Tidak ada iklan yang bermasalah saat ini. Semua kampanye ${activeTabLabel} Anda berjalan normal.`" 
        />
      </div>
      
      <div v-else class="grid gap-4">
        <div 
          v-for="issue in filteredIssues" 
          :key="issue.id"
          class="bg-white border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          :class="issue.issue_type === 'OUT_OF_BALANCE' ? 'border-red-200 bg-red-50/30' : 'border-ink-200'"
        >
          <div class="flex items-start gap-4">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="issue.issue_type === 'OUT_OF_BALANCE' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'"
            >
              <AlertTriangle v-if="issue.issue_type === 'OUT_OF_BALANCE'" class="w-5 h-5" />
              <ShieldAlert v-else class="w-5 h-5" />
            </div>
            
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide" :class="issue.issue_type === 'OUT_OF_BALANCE' ? 'bg-red-100 text-red-700' : 'bg-ink-100 text-ink-700'">
                  {{ issue.issue_type === 'OUT_OF_BALANCE' ? 'SALDO HABIS' : 'DITOLAK' }}
                </span>
                <span class="text-sm font-semibold text-ink-900">{{ issue.account_name }}</span>
              </div>
              <h3 class="font-bold text-ink-900 mb-1" v-if="issue.campaign_name">
                {{ issue.campaign_name }}
              </h3>
              <p class="text-sm text-ink-600 leading-relaxed max-w-2xl">
                {{ issue.description }}
              </p>
            </div>
          </div>

          <div class="shrink-0 pt-2 sm:pt-0">
            <NuxtLink 
              v-if="issue.issue_type === 'OUT_OF_BALANCE'" 
              to="/dashboard/saldo"
              class="inline-flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm w-full sm:w-auto gap-2"
            >
              <Wallet class="w-4 h-4" /> Top Up Sekarang
            </NuxtLink>
            <a 
              v-else-if="issue.action_url"
              :href="issue.action_url" 
              target="_blank"
              class="inline-flex items-center justify-center px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-bold rounded-lg transition-colors w-full sm:w-auto"
            >
              Cek di Ads Manager
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lightbulb, AlertTriangle, ShieldAlert, Wallet } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
})

const activeTab = ref('meta')

const tabs = [
  { id: 'meta', label: 'Meta Ads' },
  { id: 'google', label: 'Google Ads' },
  { id: 'tiktok', label: 'TikTok Ads' },
]

const activeTabLabel = computed(() => {
  return tabs.find(t => t.id === activeTab.value)?.label || 'Platform'
})

const { data: response, pending } = useFetch<any>('/api/ads/issues')

const issues = computed(() => {
  return response.value?.data || []
})

const filteredIssues = computed(() => {
  return issues.value.filter((issue: any) => issue.platform === activeTab.value)
})
</script>
