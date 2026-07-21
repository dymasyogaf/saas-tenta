<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">Saldo Saya</h2>
      
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <!-- Date Filter -->
        <div v-if="['histori-topup', 'histori-pindah', 'histori-tambahan', 'histori-pengganti'].includes(activeTab)" class="block">
          <SharedDateRangePicker v-model="dateRange" />
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
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <button 
          @click="syncAds"
          :disabled="adsStore.isFetchingAccounts"
          class="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-md text-sm font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': adsStore.isFetchingAccounts }" />
          Sync Sekarang
        </button>
        <div class="relative w-full lg:w-72">
          <input type="text" placeholder="Cari ID Kredit atau Nama Kredit" class="pl-4 pr-10 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
      </div>
      
      <div class="overflow-x-auto bg-white border border-ink-200 rounded-xl shadow-sm hide-scrollbar">
        <table class="w-full min-w-[1200px] text-left border-collapse">
          <thead>
            <tr class="border-b border-ink-200 bg-ink-50/50 text-[11px] font-bold text-ink-500 uppercase tracking-wider">
              <th class="py-4 px-5 whitespace-nowrap">ID Kredit</th>
              <th class="py-4 px-5 whitespace-nowrap">Nama Kredit</th>
              <th class="py-4 px-5 whitespace-nowrap">Platform</th>
              <th class="py-4 px-5 whitespace-nowrap">Saldo</th>
              <th class="py-4 px-5 whitespace-nowrap">Limit</th>
              <th class="py-4 px-5 whitespace-nowrap">Penggunaan</th>
              <th class="py-4 px-5 whitespace-nowrap">Update Terakhir</th>
            </tr>
          </thead>
          <tbody class="text-[13px] text-ink-900 divide-y divide-ink-100">
            <!-- Skeleton Loading -->
            <tr v-if="adsStore.isFetchingAccounts" v-for="i in 3" :key="'skeleton-'+i">
              <td colspan="9" class="p-4">
                <div class="flex items-center gap-4 animate-pulse">
                  <div class="h-6 bg-ink-200 rounded w-1/4"></div>
                  <div class="h-6 bg-ink-200 rounded w-1/4"></div>
                  <div class="h-6 bg-ink-200 rounded w-1/4"></div>
                </div>
              </td>
            </tr>
            <!-- Actual Data -->
            <tr v-else-if="adsStore.adAccounts.length > 0" v-for="account in adsStore.adAccounts" :key="account.id" class="hover:bg-ink-50/50 transition-colors group">
              <td class="py-4 px-5 font-medium text-ink-600 whitespace-nowrap">{{ account.account_id }}</td>
              <td class="py-4 px-5 font-medium text-ink-900 whitespace-nowrap">{{ account.name }}</td>
              <td class="py-4 px-5">
                <div class="flex items-center gap-2.5 font-bold text-ink-800">
                  <div v-if="account.platform === 'Meta'" class="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 28 28" class="w-6 h-6 text-blue-600" fill="currentColor">
                      <path d="M19.34 6.8c-1.93 0-3.34.73-4.26 1.7a6.02 6.02 0 0 0-3.51-1.55c-1.75-.26-3.42.23-4.68 1.24-1.59 1.3-2.39 3.28-2.39 5.39 0 4.15 3 6.6 6.35 6.6 1.93 0 3.34-.73 4.26-1.7a6.02 6.02 0 0 0 3.51 1.55c1.75.26 3.42-.23 4.68-1.24 1.59-1.3 2.39-3.28 2.39-5.39 0-4.15-3-6.6-6.35-6.6zm-8.5 11.38c-2.24 0-4.35-1.64-4.35-4.6 0-1.43.54-2.74 1.56-3.57.82-.67 1.9-1 3.02-.93 1.2.08 2.31.73 3.05 1.83.15.23.29.48.41.75-1.05 1.53-1.69 3.24-1.76 4.96-.55 1.05-1.44 1.56-2.32 1.56zm12.84-4.6c0 1.43-.54 2.74-1.56 3.57-.82.67-1.9 1-3.02.93-1.2-.08-2.31-.73-3.05-1.83-.15-.23-.29-.48-.41-.75 1.05-1.53 1.69-3.24 1.76-4.96.55-1.05 1.44-1.56 2.32-1.56 2.24 0 4.35 1.64 4.35 4.6z"/>
                    </svg>
                  </div>
                  <div v-else-if="account.platform === 'Google'" class="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" class="w-5 h-5">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div v-else class="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <span class="text-[11px] font-bold">T</span>
                  </div>
                  {{ account.platform }}
                </div>
              </td>
              <td class="py-4 px-5">
                <div class="flex items-center gap-2 whitespace-nowrap">
                  <span class="font-bold text-[14px]">{{ formatCurrency(account.saldo) }}</span>
                  <span v-if="account.alert_saldo" class="bg-red-50 text-red-500 border border-red-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full">{{ account.alert_saldo }}</span>
                </div>
              </td>
              <td class="py-4 px-5 font-medium text-ink-700 whitespace-nowrap">{{ formatCurrency(account.limit) }}</td>
              <td class="py-4 px-5 font-medium text-ink-700 whitespace-nowrap">{{ formatCurrency(account.penggunaan) }}</td>
              <td class="py-4 px-5 text-ink-500 text-[13px] whitespace-nowrap">{{ formatLastUpdated(account.updated_at) }}</td>
            </tr>
            <!-- Empty State -->
            <tr v-else>
              <td colspan="9" class="p-8 text-center text-ink-500">
                Data tidak ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Dummy -->
      <div class="flex justify-between items-center mt-4 text-sm text-ink-500">
        <div class="flex items-center gap-2">
          <select class="border border-ink-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white cursor-pointer font-medium">
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>
        <div class="flex items-center gap-1">
          <button class="p-1.5 border border-ink-200 rounded-md hover:bg-ink-50 hover:text-ink-700 transition-colors bg-white"><ChevronLeft class="w-4 h-4" /></button>
          <button class="py-1 px-3 border border-orange-500 bg-orange-50 text-orange-600 rounded-md font-bold">1</button>
          <button class="p-1.5 border border-ink-200 rounded-md hover:bg-ink-50 hover:text-ink-700 transition-colors bg-white"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
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
      <template v-else>
        <div v-if="filteredTransactions.length > 0" class="space-y-4">
          <div v-for="trx in filteredTransactions" :key="trx.id" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl hover:border-orange-200 transition-colors shadow-sm">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" 
                :class="{
                  'bg-green-100 text-green-600': trx.type === 'topup' || trx.type === 'refund',
                  'bg-blue-100 text-blue-600': trx.type === 'transfer',
                  'bg-orange-100 text-orange-600': trx.type === 'payment'
                }">
                <ArrowDown v-if="trx.type === 'topup' || trx.type === 'refund'" class="w-5 h-5" />
                <ArrowUpRight v-else-if="trx.type === 'transfer'" class="w-5 h-5" />
                <CreditCard v-else class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-ink-900 text-sm">
                  {{ trx.type === 'topup' ? 'Top Up Saldo' : 
                     trx.type === 'transfer' ? 'Alokasi Iklan' : 
                     trx.type === 'payment' ? 'Tagihan Iklan' : 
                     trx.type === 'refund' ? 'Refund Sisa Saldo' : trx.type }}
                </p>
                <p class="text-[12px] text-ink-500 mt-1">{{ trx.description || '-' }}</p>
                <p class="text-[10px] text-ink-400 mt-0.5">{{ new Date(trx.created_at).toLocaleString('id-ID') }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-display font-bold text-base" 
                :class="(trx.type === 'topup' || trx.type === 'refund') ? 'text-green-600' : 'text-ink-900'">
                {{ (trx.type === 'topup' || trx.type === 'refund') ? '+' : '-' }}{{ formatCurrency(trx.amount) }}
              </p>
              <span class="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold"
                :class="{
                  'bg-green-100 text-green-700': trx.status === 'success',
                  'bg-orange-100 text-orange-700': trx.status === 'pending',
                  'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'cancelled'
                }">
                {{ trx.status.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
        <EmptyState v-else />
      </template>
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
      <template v-else>
        <div v-if="filteredTransactions.length > 0" class="space-y-4">
          <div v-for="trx in filteredTransactions" :key="trx.id" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl hover:border-orange-200 transition-colors shadow-sm">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" 
                :class="{
                  'bg-green-100 text-green-600': trx.type === 'topup' || trx.type === 'refund',
                  'bg-blue-100 text-blue-600': trx.type === 'transfer',
                  'bg-orange-100 text-orange-600': trx.type === 'payment'
                }">
                <ArrowDown v-if="trx.type === 'topup' || trx.type === 'refund'" class="w-5 h-5" />
                <ArrowUpRight v-else-if="trx.type === 'transfer'" class="w-5 h-5" />
                <CreditCard v-else class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-ink-900 text-sm">
                  {{ trx.type === 'topup' ? 'Top Up Saldo' : 
                     trx.type === 'transfer' ? 'Alokasi Iklan' : 
                     trx.type === 'payment' ? 'Tagihan Iklan' : 
                     trx.type === 'refund' ? 'Refund Sisa Saldo' : trx.type }}
                </p>
                <p class="text-[12px] text-ink-500 mt-1">{{ trx.description || '-' }}</p>
                <p class="text-[10px] text-ink-400 mt-0.5">{{ new Date(trx.created_at).toLocaleString('id-ID') }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-display font-bold text-base" 
                :class="(trx.type === 'topup' || trx.type === 'refund') ? 'text-green-600' : 'text-ink-900'">
                {{ (trx.type === 'topup' || trx.type === 'refund') ? '+' : '-' }}{{ formatCurrency(trx.amount) }}
              </p>
              <span class="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold"
                :class="{
                  'bg-green-100 text-green-700': trx.status === 'success',
                  'bg-orange-100 text-orange-700': trx.status === 'pending',
                  'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'cancelled'
                }">
                {{ trx.status.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
        <EmptyState v-else />
      </template>
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
      <EmptyState />
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
      <EmptyState />
    </div>

  </div>
</template>

<script setup lang="ts">
import { Calendar, ChevronDown, Search, Download, ArrowDown, ArrowUpRight, CreditCard, PlusCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-vue-next'
import { ref, onMounted, computed } from 'vue'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'dashboard',
})

const saldoStore = useSaldoStore()
const adsStore = useAdsStore()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0)
}

const formatLastUpdated = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(d)
}

const syncAds = () => {
  const lastSync = localStorage.getItem('last_ads_sync')
  if (lastSync) {
    const timeDiff = new Date().getTime() - new Date(lastSync).getTime()
    if (timeDiff < 5 * 60 * 1000) { // 5 menit
      const remainingMs = 5 * 60 * 1000 - timeDiff
      const remainingMinutes = Math.floor(remainingMs / 60000)
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000)
      
      let timeString = ''
      if (remainingMinutes > 0) {
        timeString += `${remainingMinutes} menit `
      }
      timeString += `${remainingSeconds} detik`

      const toast = useToast()
      toast.addToast(`Sinkronisasi terlalu cepat. Harap tunggu ${timeString} lagi.`, 'error')
      return
    }
  }

  localStorage.setItem('last_ads_sync', new Date().toISOString())
  adsStore.fetchLiveSpendOnly()
}

const showPicComingSoon = () => {
  const toast = useToast()
  toast.addToast('Fitur manajemen PIC / Tim sedang dalam tahap pengembangan.', 'info')
}

const activeTab = ref('list-saldo')

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

const filteredTransactions = computed(() => {
  if (!saldoStore.transactions) return []
  
  let result = saldoStore.transactions
  
  // Tanggal filter
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)
    
    result = result.filter((t: any) => {
      const d = new Date(t.created_at)
      return d >= start && d <= end
    })
  }
  
  if (activeTab.value === 'histori-topup') {
    return result.filter((t: any) => t.type === 'topup')
  } else if (activeTab.value === 'histori-pindah') {
    return result.filter((t: any) => t.type === 'transfer' || t.type === 'payment' || t.type === 'refund')
  }
  
  return result
})

onMounted(() => {
  saldoStore.fetchTransactions()
  adsStore.fetchAdAccounts()
})


const tabs = [
  { id: 'list-saldo', label: 'List Saldo' },
  { id: 'histori-topup', label: 'Histori Top Up' },
  { id: 'histori-pindah', label: 'Histori Pindah Saldo' },
  { id: 'histori-tambahan', label: 'Histori Akun Tambahan' },
  { id: 'histori-pengganti', label: 'Histori Akun Pengganti' },
]
</script>
