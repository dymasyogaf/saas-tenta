<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">Manajemen Saldo</h2>
      <div class="flex gap-3">
        <div class="relative">
          <button @click="isDatePopoverOpen = !isDatePopoverOpen" class="bg-white border border-ink-200 text-ink-600 hover:text-ink-900 hover:border-ink-300 px-4 py-2.5 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
            <Calendar class="w-4 h-4" /> {{ formattedDateRange }}
          </button>
          
          <div v-if="isDatePopoverOpen" class="absolute top-full mt-2 right-0 bg-white border border-ink-200 rounded-xl shadow-lg p-4 w-72 z-10">
            <h5 class="text-sm font-bold text-ink-900 mb-3">Pilih Rentang Waktu</h5>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-ink-500 mb-1">Mulai Tanggal</label>
                <input type="date" v-model="startDate" class="w-full bg-white border border-ink-200 text-ink-900 px-3 py-2 rounded-md text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-ink-500 mb-1">Sampai Tanggal</label>
                <input type="date" v-model="endDate" class="w-full bg-white border border-ink-200 text-ink-900 px-3 py-2 rounded-md text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none" />
              </div>
              <button @click="isDatePopoverOpen = false" class="w-full bg-orange-500 text-white font-bold py-2 rounded-md text-sm mt-2 hover:bg-orange-600 transition-colors">Terapkan</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Section: Summary Cards -->
    <div class="flex flex-col lg:flex-row gap-6 mb-8">
      <!-- Left Card: Saldo -->
      <div class="bg-white border border-ink-100 rounded-xl p-6 lg:w-1/3 shadow-sm flex flex-col">
        <p class="text-sm font-medium text-ink-500 mb-2">Saldo Utama (Belum Dialokasikan)</p>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-8 bg-orange-500 rounded-md flex items-center justify-center text-white shrink-0">
            <Wallet class="w-5 h-5" />
          </div>
          <h3 class="text-3xl font-display font-bold text-ink-900">{{ formatRupiah(saldoStore.balance) }}</h3>
        </div>
        
        <div class="flex items-center gap-3 mb-6">
          <button @click="handleAllocate" :disabled="saldoStore.isLoading" class="flex-1 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Alokasikan</button>
          <button @click="handleTopup" :disabled="saldoStore.isLoading" class="flex-1 bg-orange-500 border-2 border-orange-500 text-white hover:bg-orange-600 font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {{ saldoStore.isLoading ? 'Memproses...' : 'Tambah Saldo' }}
          </button>
        </div>
        
        <hr class="border-ink-100 mb-6">
        
        <div class="flex items-center gap-1 mb-2">
          <p class="text-sm font-medium text-ink-500">Top-Up Tertunda / Pending</p>
          <Info class="w-3.5 h-3.5 text-ink-400" />
        </div>
        <p class="text-lg font-bold text-ink-900 mb-6">{{ formatRupiah(saldoStore.pendingBalance) }}</p>
        
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-1 mb-1">
              <p class="text-xs font-medium text-ink-500">Saldo di Akun Iklan (Terpakai)</p>
              <Info class="w-3 h-3 text-ink-400" />
            </div>
            <p class="text-base font-bold text-ink-900">Rp 0</p>
          </div>
        </div>
      </div>
      
      <!-- Right Card: Laporan -->
      <div class="bg-white border border-ink-100 rounded-xl p-6 lg:w-2/3 shadow-sm flex flex-col">
        <h4 class="text-base font-bold text-ink-900 mb-4">Laporan Ads <span class="text-ink-500 font-normal">({{ formattedDateRange }})</span></h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <!-- Laporan Utama: Ad Spend -->
          <div class="bg-ink-50/50 rounded-lg p-5 flex flex-col justify-center border border-ink-100/50">
            <div class="flex items-center gap-1 mb-2">
              <p class="text-sm font-medium text-ink-500">Total Pengeluaran Iklan (Ad Spend)</p>
              <Info class="w-3.5 h-3.5 text-ink-400" />
            </div>
            <div class="flex items-center gap-2 text-orange-500">
              <h3 class="text-3xl font-display font-bold text-ink-900">
                <span v-if="adsStore.isLoading" class="inline-block w-24 h-8 bg-ink-200 rounded animate-pulse"></span>
                <template v-else>{{ formatRupiah(adsStore.totalSpend) }}</template>
              </h3>
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-4">
            <div class="bg-ink-50/50 rounded-lg p-4 flex flex-col justify-center border border-ink-100/50">
              <div class="flex items-center gap-1 mb-1">
                <p class="text-xs font-medium text-ink-500">Total Saldo Masuk (Top Up)</p>
              </div>
              <p class="text-lg font-bold text-ink-900">{{ formatRupiah(saldoStore.balance) }}</p>
            </div>
            
            <div class="flex gap-4">
              <div class="bg-ink-50/50 rounded-lg p-4 flex-1 border border-ink-100/50">
                <div class="flex items-center gap-1 mb-1">
                  <p class="text-xs font-medium text-ink-500">Management Fee</p>
                </div>
                <p class="text-base font-bold text-ink-900">Rp 0</p>
              </div>
              
              <div class="bg-ink-50/50 rounded-lg p-4 flex-1 border border-ink-100/50">
                <div class="flex items-center gap-1 mb-1">
                  <p class="text-xs font-medium text-ink-500">Total Refund</p>
                </div>
                <p class="text-base font-bold text-ink-900">Rp 0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Tabs and Table -->
    <div class="bg-white border border-ink-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
      <!-- Tabs & Download -->
      <div class="flex flex-col xl:flex-row xl:items-center justify-between border-b border-ink-100 p-2 gap-4">
        <div class="flex overflow-x-auto hide-scrollbar bg-ink-50 p-1.5 rounded-xl flex-1 max-w-full gap-1">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'whitespace-nowrap px-4 py-2.5 text-sm rounded-lg transition-colors',
              activeTab === tab.id
                ? 'bg-white text-orange-500 font-bold shadow-sm'
                : 'text-ink-500 hover:text-ink-900 font-medium'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="px-2 xl:px-4 shrink-0 pb-2 xl:pb-0">
          <button @click="downloadReport" class="w-full xl:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Download class="w-4 h-4" /> Download Laporan Transaksi
          </button>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="p-5 flex flex-col md:flex-row items-start md:items-center justify-end gap-3">
        <div class="relative w-full md:w-72">
          <input type="text" v-model="searchQuery" placeholder="Cari ID transaksi..." class="pl-4 pr-10 py-2.5 border border-ink-200 rounded-lg text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
        
        <div class="relative w-full md:w-56">
          <select v-model="statusFilter" class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2.5 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
            <option value="all">Semua Status</option>
            <option value="success">Berhasil (Success)</option>
            <option value="pending">Pending</option>
            <option value="failed">Gagal (Failed)</option>
          </select>
          <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
      </div>
      
      <!-- Tables -->
      <div class="w-full overflow-x-auto pb-4 pt-1">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr class="border-b border-ink-100 text-xs font-bold text-orange-500 uppercase tracking-wider">
              <th class="px-6 py-4">TANGGAL</th>
              <th class="px-6 py-4">JENIS MUTASI</th>
              <th class="px-6 py-4">NOMINAL</th>
              <th class="px-6 py-4">KETERANGAN</th>
              <th class="px-6 py-4 text-right">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="5" class="px-6 py-24 text-center">
                <p class="text-ink-500 text-sm font-medium">Data mutasi tidak ditemukan</p>
              </td>
            </tr>
            <tr v-for="trx in filteredTransactions" :key="trx.id" class="border-b border-ink-50 hover:bg-ink-50/50">
              <td class="px-6 py-4 text-sm font-medium text-ink-900">{{ formatDate(trx.created_at) }}</td>
              <td class="px-6 py-4 text-sm font-bold" :class="trx.type === 'topup' ? 'text-green-600' : 'text-orange-600'">
                {{ trx.type === 'topup' ? 'Top Up Saldo' : 'Alokasi Iklan' }}
              </td>
              <td class="px-6 py-4 text-sm font-bold text-ink-900">{{ formatRupiah(trx.amount) }}</td>
              <td class="px-6 py-4 text-sm text-ink-500">{{ trx.description || '-' }}</td>
              <td class="px-6 py-4 text-right">
                <span class="px-2.5 py-1 text-xs font-bold rounded-full" 
                  :class="{
                    'bg-green-100 text-green-700': trx.status === 'success' || trx.status === 'settled',
                    'bg-orange-100 text-orange-700': trx.status === 'pending',
                    'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'expired'
                  }">
                  {{ trx.status.toUpperCase() }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal Top Up -->
    <div v-if="isTopupModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-ink-100">
        <div class="p-6">
          <h3 class="text-xl font-display font-bold text-ink-900 mb-2">Tambah Saldo Iklan</h3>
          <p class="text-ink-500 text-sm mb-6">Masukkan nominal yang ingin ditambahkan. Pembayaran diproses aman oleh Duitku.</p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-2">Nominal Top Up (Min Rp 10.000)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-medium text-lg">Rp</span>
                <input type="number" v-model.number="topupAmount" class="w-full pl-12 pr-4 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-lg transition-all" placeholder="50000" />
              </div>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button @click="topupAmount = 50000" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">50 Ribu</button>
              <button @click="topupAmount = 100000" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">100 Ribu</button>
              <button @click="topupAmount = 500000" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">500 Ribu</button>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-ink-700 mb-2">Pilih Metode Pembayaran</label>
              <div class="relative">
                <select v-model="selectedMethod" class="w-full appearance-none pl-4 pr-10 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-sm transition-all cursor-pointer">
                  <optgroup label="Virtual Account">
                    <option value="BC">BCA Virtual Account</option>
                    <option value="BM">Mandiri Virtual Account</option>
                    <option value="BR">BRI Virtual Account</option>
                  </optgroup>
                  <optgroup label="E-Wallet & Retail">
                    <option value="OV">OVO</option>
                    <option value="SP">ShopeePay</option>
                    <option value="DA">DANA</option>
                    <option value="QR">QRIS</option>
                  </optgroup>
                </select>
                <ChevronDown class="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-5 bg-ink-50 flex gap-3 border-t border-ink-100">
          <button @click="isTopupModalOpen = false" class="flex-1 bg-white border-2 border-ink-200 text-ink-700 hover:bg-ink-100 font-bold py-3 rounded-xl transition-colors">Batal</button>
          <button @click="submitTopup" :disabled="saldoStore.isLoading || !isValidTopup" class="flex-1 bg-orange-500 border-2 border-orange-500 text-white hover:bg-orange-600 font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span v-if="saldoStore.isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ saldoStore.isLoading ? 'Memproses...' : 'Lanjutkan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Alokasi -->
    <div v-if="isAllocateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-ink-100">
        <div class="p-6">
          <h3 class="text-xl font-display font-bold text-ink-900 mb-2">Alokasikan Saldo Iklan</h3>
          <p class="text-ink-500 text-sm mb-6">Pindahkan saldo utama Anda ke akun iklan pilihan Anda. Maksimal sesuai saldo Anda saat ini.</p>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-2">Nominal Alokasi (Min Rp 10.000)</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-medium text-lg">Rp</span>
                <input type="number" v-model.number="allocateAmount" class="w-full pl-12 pr-4 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-lg transition-all" placeholder="50000" />
              </div>
              <p class="text-xs text-ink-500 mt-2">Saldo tersedia: <span class="font-bold text-orange-600">{{ formatRupiah(saldoStore.balance) }}</span></p>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button @click="allocateAmount = Math.min(50000, saldoStore.balance)" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">50 Ribu</button>
              <button @click="allocateAmount = Math.min(100000, saldoStore.balance)" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">100 Ribu</button>
              <button @click="allocateAmount = saldoStore.balance" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">Semua</button>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-ink-700 mb-2">Target Platform Iklan</label>
              <div class="relative">
                <select v-model="selectedTargetPlatform" class="w-full appearance-none pl-4 pr-10 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-sm transition-all cursor-pointer">
                  <option value="Meta Ads">Meta Ads (Facebook/Instagram)</option>
                  <option value="TikTok Ads">TikTok Ads</option>
                  <option value="Google Ads">Google Ads</option>
                </select>
                <ChevronDown class="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-5 bg-ink-50 flex gap-3 border-t border-ink-100">
          <button @click="isAllocateModalOpen = false" class="flex-1 bg-white border-2 border-ink-200 text-ink-700 hover:bg-ink-100 font-bold py-3 rounded-xl transition-colors">Batal</button>
          <button @click="submitAllocate" :disabled="saldoStore.isLoading || !isValidAllocate" class="flex-1 bg-orange-500 border-2 border-orange-500 text-white hover:bg-orange-600 font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span v-if="saldoStore.isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ saldoStore.isLoading ? 'Memproses...' : 'Alokasikan' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Calendar, Wallet, Info, Download, Search, ChevronDown } from 'lucide-vue-next'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'

const toast = useToast()
const saldoStore = useSaldoStore()
const adsStore = useAdsStore()

definePageMeta({
  layout: 'dashboard',
})

const activeTab = ref('semua')
const isDatePopoverOpen = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const startDate = ref<string>(thirtyDaysAgo.toISOString().split('T')[0] as string)
const endDate = ref<string>(today.toISOString().split('T')[0] as string)

const formattedDateRange = computed(() => {
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  
  const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  const startStr = new Intl.DateTimeFormat('id-ID', formatOptions).format(start)
  const endStr = new Intl.DateTimeFormat('id-ID', formatOptions).format(end)
  
  return `${startStr} - ${endStr}`
})

const tabs = [
  { id: 'semua', label: 'Semua Transaksi' },
  { id: 'topup', label: 'Riwayat Top Up' },
  { id: 'alokasi', label: 'Riwayat Alokasi Iklan' },
]

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka || 0)
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d)
}

const filteredTransactions = computed(() => {
  let trxs = saldoStore.transactions
  
  // Date filter logic
  const start = new Date(startDate.value)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate.value)
  end.setHours(23, 59, 59, 999)
  
  trxs = trxs.filter(t => {
    if (!t.created_at) return false
    const d = new Date(t.created_at)
    return d >= start && d <= end
  })

  // Tab filter
  if (activeTab.value !== 'semua') {
    trxs = trxs.filter(t => t.type === activeTab.value)
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    trxs = trxs.filter(t => {
      if (statusFilter.value === 'success') return ['success', 'settled'].includes(t.status?.toLowerCase())
      if (statusFilter.value === 'failed') return ['failed', 'expired', 'cancelled'].includes(t.status?.toLowerCase())
      return t.status?.toLowerCase() === statusFilter.value
    })
  }

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    trxs = trxs.filter(t => {
      return (t.id && t.id.toLowerCase().includes(query)) || 
             (t.description && t.description.toLowerCase().includes(query)) ||
             (t.payment_gateway_ref && t.payment_gateway_ref.toLowerCase().includes(query))
    })
  }
  
  return trxs
})

const downloadReport = () => {
  if (filteredTransactions.value.length === 0) {
    toast.addToast('Tidak ada data transaksi untuk diunduh.', 'error')
    return
  }

  const headers = ['Tanggal', 'ID Transaksi', 'Jenis Mutasi', 'Nominal', 'Keterangan', 'Status']
  
  const csvContent = [
    headers.join(','),
    ...filteredTransactions.value.map(t => {
      const date = formatDate(t.created_at).replace(/,/g, '')
      const id = t.id
      const type = t.type === 'topup' ? 'Top Up Saldo' : 'Alokasi Iklan'
      const amount = t.amount
      const desc = `"${(t.description || '-').replace(/"/g, '""')}"`
      const status = (t.status || '').toUpperCase()
      return `${date},${id},${type},${amount},${desc},${status}`
    })
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `laporan_transaksi_${formattedDateRange.value.replace(/ /g, '_')}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const isTopupModalOpen = ref(false)
const topupAmount = ref<number | ''>('')
const selectedMethod = ref('OV')
const user = useSupabaseUser()

const isValidTopup = computed(() => {
  const amt = Number(topupAmount.value)
  return !isNaN(amt) && amt >= 10000
})

const handleTopup = () => {
  isTopupModalOpen.value = true
  topupAmount.value = 50000
  selectedMethod.value = 'OV'
}

const submitTopup = async () => {
  if (!isValidTopup.value) return
  await saldoStore.topup(topupAmount.value as number, user.value, selectedMethod.value)
}

const isAllocateModalOpen = ref(false)
const allocateAmount = ref<number | ''>('')
const selectedTargetPlatform = ref('Meta Ads')

const isValidAllocate = computed(() => {
  const amt = Number(allocateAmount.value)
  return !isNaN(amt) && amt >= 10000 && amt <= saldoStore.balance
})

const handleAllocate = () => {
  if (saldoStore.balance < 10000) {
    toast.addToast('Saldo Anda kurang dari batas minimum (Rp 10.000). Silakan top up.', 'error')
    return
  }
  isAllocateModalOpen.value = true
  allocateAmount.value = Math.min(50000, saldoStore.balance)
}

const submitAllocate = async () => {
  console.log('submitAllocate triggered. Valid:', isValidAllocate.value)
  if (!isValidAllocate.value) return
  
  const success = await saldoStore.allocate(Number(allocateAmount.value), user.value, selectedTargetPlatform.value)
  if (success) {
    isAllocateModalOpen.value = false
  }
}

onMounted(async () => {
  saldoStore.fetchSaldo()
  saldoStore.fetchTransactions()
  await adsStore.fetchMetaPerformance()
  await adsStore.fetchGooglePerformance()
  await adsStore.fetchTikTokPerformance()
})
</script>
