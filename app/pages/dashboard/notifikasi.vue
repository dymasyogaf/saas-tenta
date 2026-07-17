<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">Pusat Pemberitahuan</h2>
      <div class="flex gap-3">
        <button class="bg-white border border-ink-200 text-ink-600 hover:text-ink-900 hover:border-ink-300 px-4 py-2.5 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
          <Calendar class="w-4 h-4" /> 01 Jun 2026 - 16 Jul 2026
        </button>
        <button class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm">
          <Settings class="w-4 h-4" /> Pengaturan
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-ink-200 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div class="flex gap-6 overflow-x-auto hide-scrollbar">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'pb-3.5 text-sm px-2 border-b-2 transition-colors flex items-center gap-2',
            activeTab === tab.id 
              ? 'font-semibold text-orange-500 border-orange-500' 
              : 'font-medium text-ink-500 hover:text-ink-700 border-transparent'
          ]"
        >
          {{ tab.label }}
          <span v-if="tab.badge" class="bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full text-xs font-bold">
            {{ tab.badge }}
          </span>
        </button>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-3 pb-3 lg:pb-0 items-start sm:items-center">
        <button class="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1.5 px-2">
          <Eye class="w-4 h-4" /> Tandai Semua Sudah Dibaca
        </button>
        <div class="relative w-full sm:w-48">
          <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2 pl-4 pr-10 rounded-md text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
            <option>Semua Notifikasi</option>
          </select>
          <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
        <button class="bg-white border border-orange-500 text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
          <Filter class="w-4 h-4" /> Filter Layanan
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div class="flex flex-col items-center justify-center text-center py-24">
      <div class="w-32 h-32 mb-6 bg-ink-50 rounded-full flex items-center justify-center text-ink-300 relative">
        <Bell class="w-16 h-16" />
        <span class="absolute top-4 right-4 text-ink-400 font-bold text-lg transform rotate-12">zZ</span>
      </div>
      <p class="text-ink-500 text-base">Saat ini anda tidak memiliki notifikasi</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, Settings, Eye, ChevronDown, Filter, Bell } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
})

const activeTab = ref('notifikasi')

const tabs = [
  { id: 'notifikasi', label: 'Notifikasi' },
  { id: 'pengumuman', label: 'Pengumuman', badge: '27' },
  { id: 'whatsapp', label: 'Whatsapp' },
]
</script>
