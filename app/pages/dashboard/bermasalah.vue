<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">Iklan Bermasalah</h2>
      <div class="flex flex-col sm:flex-row gap-3">
        <a href="https://tentaklik.com/ketentuan/" target="_blank" class="bg-[#fcd34d] hover:bg-[#fbbf24] text-ink-900 px-4 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm">
          <div class="bg-orange-600 text-white rounded-full p-1"><Lightbulb class="w-3.5 h-3.5" /></div> Lihat Syarat dan Ketentuan
        </a>
        <div class="relative w-full sm:w-64">
          <SharedDateRangePicker v-model="dateRange" />
        </div>
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

    <!-- Tab Contents -->
    <div v-if="activeTab === 'meta-ads'">
      <!-- Filter Bar -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <button class="bg-ink-50 text-ink-300 px-4 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 cursor-not-allowed">
          <Download class="w-4 h-4" /> Download Report
        </button>
        
        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div class="relative w-full sm:w-80">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" placeholder="Cari judul iklan, nama campaign, ID iklan" class="pl-9 pr-4 py-2.5 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          </div>
          
          <div class="relative w-full sm:w-48">
            <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2.5 pl-4 pr-10 rounded-md text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
              <option>Semua Ad Account</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
          
          <div class="relative w-full sm:w-40">
            <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2.5 pl-4 pr-10 rounded-md text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
              <option>Semua Status</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
          
          <button class="bg-white border border-orange-500 text-orange-500 hover:bg-orange-50 px-5 py-2.5 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            <Filter class="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <EmptyState message="Bagus! Tidak ada iklan yang bermasalah saat ini. Semua kampanye Meta Ads Anda berjalan normal." />
    </div>

    <div v-else-if="activeTab === 'google-ads'">
      <div class="mb-4">
        <div class="relative w-full">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Cari judul iklan, nama campaign, ID iklan" class="pl-9 pr-4 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
        </div>
      </div>
      <EmptyState message="Bagus! Tidak ada iklan yang bermasalah saat ini. Semua kampanye Google Ads Anda berjalan normal." />
    </div>

  </div>
</template>

<script setup lang="ts">
import { Lightbulb, Calendar, Search, ChevronDown, Filter, Download } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
})

const activeTab = ref('meta-ads')

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const formatDateForInput = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const dateRange = ref({
  start: formatDateForInput(thirtyDaysAgo),
  end: formatDateForInput(today)
})

const tabs = [
  { id: 'meta-ads', label: 'Meta Ads' },
  { id: 'google-ads', label: 'Google Ads' },
]
</script>
