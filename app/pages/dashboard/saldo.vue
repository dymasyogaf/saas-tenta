<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">Saldo Saya</h2>
      
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <!-- Date Filter -->
        <div v-if="['histori-topup', 'histori-pindah', 'histori-tambahan', 'histori-pengganti'].includes(activeTab)" class="block">
          <button class="flex items-center gap-2 bg-white border border-ink-200 text-ink-900 py-2 px-3 rounded-lg text-sm hover:border-ink-300 transition-colors focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm">
            <Calendar class="w-4 h-4 text-ink-500" />
            <span class="font-medium">01 Jun 2026 - 16 Jul 2026</span>
          </button>
        </div>
        
        <!-- Filters for Histori Akun Pengganti -->
        <div v-if="activeTab === 'histori-pengganti'" class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div class="relative w-full sm:w-44">
            <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm cursor-pointer">
              <option>Pilih Platform</option>
              <option>Meta Ads</option>
              <option>Tiktok Ads</option>
              <option>Google Ads</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
          <div class="relative w-full sm:w-56">
            <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm cursor-pointer">
              <option>Semua Status</option>
              <option>Menunggu Persetujuan</option>
              <option>Pengajuan Sedang Diproses</option>
              <option>Approved</option>
              <option>Pengajuan Ditolak</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-ink-200 mb-6 flex gap-8 overflow-x-auto hide-scrollbar whitespace-nowrap">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id" 
        :class="[
          'pb-3.5 text-sm px-1 border-b-2 transition-colors',
          activeTab === tab.id 
            ? 'font-semibold text-orange-500 border-orange-500' 
            : 'font-medium text-ink-600 hover:text-ink-900 border-transparent'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <!-- Tab Contents -->
    
    <!-- List Saldo -->
    <div v-if="activeTab === 'list-saldo'">
      <div class="flex justify-end mb-4">
        <div class="relative w-full lg:w-72">
          <input type="text" placeholder="Cari ID Kredit atau Nama Kredit" class="pl-4 pr-10 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
      </div>
      
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <EmptyState v-else />
    </div>

    <!-- Histori Top Up -->
    <div v-else-if="activeTab === 'histori-topup'">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <button class="bg-ink-50 border border-ink-100 text-ink-500 px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-ink-100 hover:text-ink-700 transition-colors">
          <Download class="w-4 h-4" /> Download Topup
        </button>
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div class="relative w-full sm:w-64">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" placeholder="Cari ID Top Up" class="pl-9 pr-4 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          </div>
          <div class="relative w-full sm:w-48">
            <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2 pl-4 pr-10 rounded-md text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
              <option>Semua Status</option>
              <option>Berhasil</option>
              <option>Pending</option>
              <option>Gagal</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <EmptyState v-else />
    </div>

    <!-- Histori Pindah Saldo -->
    <div v-else-if="activeTab === 'histori-pindah'">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <button class="bg-ink-50 border border-ink-100 text-ink-500 px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-ink-100 hover:text-ink-700 transition-colors">
          <Download class="w-4 h-4" /> Download Report
        </button>
        <div class="relative w-full md:w-64">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" placeholder="Cari ID Transfer Saldo" class="pl-9 pr-4 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
        </div>
      </div>
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <EmptyState v-else />
    </div>
    
    <!-- Histori Akun Tambahan -->
    <div v-else-if="activeTab === 'histori-tambahan'">
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <EmptyState v-else />
    </div>
    
    <!-- Histori Akun Pengganti -->
    <div v-else-if="activeTab === 'histori-pengganti'">
      <div class="flex justify-end mb-4">
        <div class="relative w-full md:w-72">
          <input type="text" placeholder="Cari ID Kredit atau Nama Kredit" class="pl-4 pr-10 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
      </div>
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <EmptyState v-else />
    </div>

  </div>
</template>

<script setup lang="ts">
import { Calendar, ChevronDown, Search, Download } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'
import { useSaldoStore } from '~/stores/saldo'

definePageMeta({
  layout: 'dashboard',
})

const saldoStore = useSaldoStore()

onMounted(() => {
  saldoStore.fetchTransactions()
})

const activeTab = ref('list-saldo')

const tabs = [
  { id: 'list-saldo', label: 'List Saldo' },
  { id: 'histori-topup', label: 'Histori Top Up' },
  { id: 'histori-pindah', label: 'Histori Pindah Saldo' },
  { id: 'histori-tambahan', label: 'Histori Akun Tambahan' },
  { id: 'histori-pengganti', label: 'Histori Akun Pengganti' },
]
</script>
