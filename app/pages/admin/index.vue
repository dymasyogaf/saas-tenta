<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Dashboard Operasional</h2>
        <p class="text-slate-500 text-sm mt-1">Ringkasan aktivitas internal dan kesehatan bisnis agensi Tentaklik.</p>
      </div>
      <button @click="() => refresh()" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': pending }" /> Segarkan Data
      </button>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-4">
      <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <Info class="w-4 h-4" />
      </div>
      <div>
        <h3 class="text-sm font-bold text-blue-900">Control Room Admin</h3>
        <p class="text-blue-700 text-xs mt-1">Gunakan data di bawah ini untuk memantau aktivitas operasional dan finansial. Data diperbarui secara real-time dari Supabase.</p>
      </div>
    </div>

    <!-- Row 1: Operational Stats -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-b border-slate-200 pb-2 mb-4 gap-3">
      <h3 class="text-lg font-bold text-slate-900">Antrean Operasional (To-Do)</h3>
      
      <!-- Custom Date Filter Popover -->
      <div class="relative shrink-0">
        <!-- Visual Button -->
        <button @click="showDatePopover = !showDatePopover" class="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm hover:border-slate-300 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
          <Calendar class="w-4 h-4 text-slate-500" />
          <span class="font-medium whitespace-nowrap">{{ dateRangeText }}</span>
        </button>
        
        <!-- Popover Content -->
        <div v-if="showDatePopover" class="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
          <h4 class="font-bold text-slate-900 mb-4">Pilih Rentang Waktu</h4>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Mulai Tanggal</label>
              <input v-model="tempStartDate" type="date" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-slate-700" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Sampai Tanggal</label>
              <input v-model="tempEndDate" type="date" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-slate-700" />
            </div>
          </div>
          
          <button @click="applyDateFilter" class="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
            Terapkan
          </button>
        </div>
        
        <!-- Overlay for closing popover when clicking outside -->
        <div v-if="showDatePopover" @click="showDatePopover = false" class="fixed inset-0 z-40"></div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Verifikasi KYC -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <ShieldCheck class="w-4 h-4" />
          </div>
          <p class="text-sm font-bold text-slate-700">Antrean KYC</p>
        </div>
        <div v-if="pending" class="h-9 w-16 bg-ink-200 rounded animate-pulse my-1"></div>
        <p v-else class="text-3xl font-display font-bold text-slate-900">{{ stats?.kyc || 0 }}</p>
        <p class="text-xs font-medium text-slate-500 mt-2">Menunggu review Tim Audit</p>
      </div>

      <!-- Request Ad Account -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Megaphone class="w-4 h-4" />
          </div>
          <p class="text-sm font-bold text-slate-700">Request Akun</p>
        </div>
        <div v-if="pending" class="h-9 w-16 bg-ink-200 rounded animate-pulse my-1"></div>
        <p v-else class="text-3xl font-display font-bold text-slate-900">{{ stats?.ads || 0 }}</p>
        <p class="text-xs font-medium text-slate-500 mt-2">Menunggu eksekusi Tim Ads</p>
      </div>

      <!-- Eksekusi Finance -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <WalletCards class="w-4 h-4" />
          </div>
          <p class="text-sm font-bold text-slate-700">Withdraw & Alokasi</p>
        </div>
        <div v-if="pending" class="h-9 w-16 bg-ink-200 rounded animate-pulse my-1"></div>
        <p v-else class="text-3xl font-display font-bold text-slate-900">{{ stats?.withdraw || 0 }}</p>
        <p class="text-xs font-medium text-slate-500 mt-2">Menunggu eksekusi Tim Finance</p>
      </div>

      <!-- Top Up Masuk -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <TrendingUp class="w-4 h-4" />
          </div>
          <p class="text-sm font-bold text-slate-700">Top Up Masuk</p>
        </div>
        <div v-if="pending" class="h-9 w-32 bg-ink-200 rounded animate-pulse my-1"></div>
        <p v-else class="text-3xl font-display font-bold text-slate-900">{{ formatCurrency(stats?.topup || 0) }}</p>
        <p class="text-xs font-medium text-slate-500 mt-2">
          Total masuk pada rentang waktu terpilih
        </p>
      </div>
    </div>

    <!-- Row 2: Financial & Growth Stats -->
    <h3 class="text-lg font-bold text-slate-900 pt-2 border-b border-slate-200 pb-2">Kesehatan Bisnis (Growth)</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md relative overflow-hidden group">
        <div class="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
        <div class="relative z-10">
          <p class="text-sm font-medium text-slate-400 mb-1">Total Klien Terdaftar</p>
          <div v-if="pending" class="h-10 w-20 bg-slate-800 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-white">{{ stats?.totalUsers || 0 }}</p>
          <p class="text-xs text-slate-500 mt-2">Keseluruhan pengguna SaaS</p>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md relative overflow-hidden group">
        <div class="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>
        <div class="relative z-10">
          <p class="text-sm font-medium text-slate-400 mb-1">Akun Iklan Aktif</p>
          <div v-if="pending" class="h-10 w-20 bg-slate-800 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-white">{{ stats?.totalAds || 0 }}</p>
          <p class="text-xs text-slate-500 mt-2">Meta, Google, & TikTok</p>
        </div>
      </div>
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400 rounded-xl p-6 shadow-lg shadow-orange-500/20 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
        <div class="relative z-10">
          <p class="text-sm font-medium text-orange-100 mb-1">Estimasi Management Fee (Bulan Ini)</p>
          <div v-if="pending" class="h-10 w-32 bg-orange-400/50 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-white">{{ formatCurrency(stats?.totalFee || 0) }}</p>
          <p class="text-xs text-orange-100 mt-2">Potongan 3-4% dari total spend iklan</p>
        </div>
      </div>
    </div>

    <!-- Row 3: Charts & Recent Activities -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Chart Section -->
      <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-900">Volume Top-Up (7 Hari Terakhir)</h3>
          <select class="text-xs border border-slate-200 rounded p-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500">
            <option>7 Hari Terakhir</option>
            <option>Bulan Ini</option>
          </select>
        </div>
        <div class="h-72 w-full bg-slate-50 rounded-lg flex items-center justify-center">
          <div v-if="pending" class="w-full h-full animate-pulse bg-slate-100 rounded-lg"></div>
          <ClientOnly v-else>
            <apexchart 
              type="area" 
              height="100%" 
              width="100%" 
              :options="chartOptions" 
              :series="stats?.chartSeries || []"
            ></apexchart>
          </ClientOnly>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div class="p-5 border-b border-slate-100">
          <h3 class="font-bold text-slate-900">Aktivitas Transaksi Terbaru</h3>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="pending" class="p-4 space-y-4">
            <div v-for="i in 5" :key="i" class="h-12 bg-slate-100 rounded animate-pulse"></div>
          </div>
          <div v-else-if="stats?.recentTxs?.length === 0" class="p-8 text-center text-slate-400 text-sm">
            Belum ada aktivitas.
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="tx in stats?.recentTxs" :key="tx.id" class="p-3 hover:bg-slate-50 flex flex-col gap-1 transition-colors rounded-lg">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold" 
                  :class="{
                    'text-green-600': tx.type === 'topup',
                    'text-orange-600': tx.type === 'transfer',
                    'text-blue-600': tx.type === 'withdraw'
                  }">
                  {{ tx.type.toUpperCase() }}
                </span>
                <span class="text-[10px] text-slate-400">{{ new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}</span>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-sm font-bold text-slate-800">{{ formatCurrency(tx.amount || 0) }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  :class="{
                    'bg-green-100 text-green-700': tx.status === 'success',
                    'bg-orange-100 text-orange-700': tx.status === 'pending',
                    'bg-red-100 text-red-700': tx.status === 'failed',
                  }">
                  {{ tx.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-3 border-t border-slate-100 text-center">
          <NuxtLink to="/admin/finance" class="text-xs font-bold text-orange-600 hover:text-orange-700">Lihat Semua Transaksi &rarr;</NuxtLink>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ShieldCheck, Megaphone, TrendingUp, WalletCards, Info, RefreshCw, Calendar } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const supabase = useSupabaseClient()

const showDatePopover = ref(false)

// Default range: 30 hari terakhir
const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

// Format YYYY-MM-DD untuk input type="date"
const formatDateForInput = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const tempStartDate = ref(formatDateForInput(thirtyDaysAgo))
const tempEndDate = ref(formatDateForInput(today))

const startDate = ref(formatDateForInput(thirtyDaysAgo))
const endDate = ref(formatDateForInput(today))

const applyDateFilter = () => {
  startDate.value = tempStartDate.value
  endDate.value = tempEndDate.value
  showDatePopover.value = false
}

// Format tampilan tanggal di tombol filter (Misal: 18 Jun 2026 - 18 Jul 2026)
const dateRangeText = computed(() => {
  if (!startDate.value || !endDate.value) return 'Pilih Rentang Waktu'
  
  const format = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  
  return `${format(startDate.value)} - ${format(endDate.value)}`
})

interface AdminStats {
  kyc: number;
  ads: number;
  topup: number;
  withdraw: number;
  totalUsers: number;
  totalAds: number;
  totalFee: number;
  recentTxs: {
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
  }[];
  chartSeries: { name: string; data: number[] }[];
  chartLabels: string[];
}

// Fetch real metrics from Backend API (Bypass RLS)
const { data: stats, pending, refresh } = useAsyncData<AdminStats>('admin_dashboard_stats', async () => {
  return await $fetch<AdminStats>('/api/admin/stats', {
    query: {
      startDate: startDate.value,
      endDate: endDate.value
    }
  })
}, { watch: [startDate, endDate] })

// Helper untuk format rupiah yang singkat
const formatCurrency = (val: number) => {
  if (val === 0) return 'Rp 0'
  if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1).replace('.0', '')}M`
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')} Juta`
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

// Konfigurasi Grafik ApexCharts
const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif'
  },
  colors: ['#f97316'], // Orange
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 3 },
  xaxis: {
    categories: stats.value?.chartLabels || [],
    labels: { style: { colors: '#64748b' } },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => {
        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`
        return val
      },
      style: { colors: '#64748b' }
    }
  },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4,
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.4,
      opacityTo: 0,
      stops: [0, 90, 100]
    }
  }
}))
</script>
