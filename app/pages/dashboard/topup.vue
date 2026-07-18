<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">My Balance by Pivot</h2>
      <div class="flex gap-3">
        <button class="bg-white border border-ink-200 text-ink-600 hover:text-ink-900 hover:border-ink-300 px-4 py-2.5 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
          <Calendar class="w-4 h-4" /> 16 Apr 2026 - 16 Jul 2026
        </button>
      </div>
    </div>

    <!-- Top Section: Summary Cards -->
    <div class="flex flex-col lg:flex-row gap-6 mb-8">
      <!-- Left Card: Saldo -->
      <div class="bg-white border border-ink-100 rounded-xl p-6 lg:w-1/3 shadow-sm flex flex-col">
        <p class="text-sm font-medium text-ink-500 mb-2">Saldo Bisa Ditarik</p>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-8 bg-orange-500 rounded-md flex items-center justify-center text-white shrink-0">
            <Wallet class="w-5 h-5" />
          </div>
          <h3 class="text-3xl font-display font-bold text-ink-900">{{ formatRupiah(saldoStore.balance) }}</h3>
        </div>
        
        <div class="flex items-center gap-3 mb-6">
          <button class="flex-1 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-bold py-2.5 rounded-lg text-sm transition-colors">Tarik Saldo</button>
          <button @click="handleTopup" :disabled="saldoStore.isLoading" class="flex-1 bg-orange-500 border-2 border-orange-500 text-white hover:bg-orange-600 font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {{ saldoStore.isLoading ? 'Memproses...' : 'Tambah Saldo' }}
          </button>
        </div>
        
        <hr class="border-ink-100 mb-6">
        
        <div class="flex items-center gap-1 mb-2">
          <p class="text-sm font-medium text-ink-500">Saldo tertunda</p>
          <Info class="w-3.5 h-3.5 text-ink-400" />
        </div>
        <p class="text-lg font-bold text-ink-900 mb-6">{{ formatRupiah(saldoStore.pendingBalance) }}</p>
        
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-1 mb-1">
              <p class="text-xs font-medium text-ink-500">Dalam proses penarikan</p>
              <Info class="w-3 h-3 text-ink-400" />
            </div>
            <p class="text-base font-bold text-ink-900">Rp 0</p>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-1 mb-1">
              <p class="text-xs font-medium text-ink-500">Saldo yang sudah ditarik</p>
              <Info class="w-3 h-3 text-ink-400" />
            </div>
            <p class="text-base font-bold text-ink-900">Rp 0</p>
          </div>
        </div>
      </div>
      
      <!-- Right Card: Laporan -->
      <div class="bg-white border border-ink-100 rounded-xl p-6 lg:w-2/3 shadow-sm flex flex-col">
        <h4 class="text-base font-bold text-ink-900 mb-4">Laporan <span class="text-ink-500 font-normal">(16 April 2026 - 16 Juli 2026)</span></h4>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <!-- Laporan Utama -->
          <div class="md:col-span-2 bg-ink-50/50 rounded-lg p-5 flex flex-col justify-between border border-ink-100/50">
            <div>
              <div class="flex items-center gap-1 mb-2">
                <p class="text-sm font-medium text-ink-500">Pendapatan COD Bersih</p>
                <Info class="w-3.5 h-3.5 text-ink-400" />
              </div>
              <div class="flex items-center gap-2 mb-6 text-orange-500">
                <Download class="w-4 h-4 cursor-pointer hover:text-orange-600 transition-colors" />
                <h3 class="text-2xl font-display font-bold text-ink-900">Rp 0</h3>
              </div>
            </div>
            
            <div class="space-y-5">
              <div>
                <div class="flex items-center gap-1 mb-1">
                  <p class="text-xs font-medium text-ink-500">Total COD Dikumpulkan dari Customer</p>
                  <Info class="w-3.5 h-3.5 text-ink-400" />
                </div>
                <p class="text-base font-bold text-ink-900">Rp 0</p>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="flex items-center gap-1 mb-1">
                    <p class="text-xs font-medium text-ink-500">Total Biaya COD</p>
                    <Info class="w-3.5 h-3.5 text-ink-400" />
                  </div>
                  <p class="text-base font-bold text-ink-900">Rp 0</p>
                </div>
                <div>
                  <div class="flex items-center gap-1 mb-1">
                    <p class="text-xs font-medium text-ink-500">Total Ongkir COD</p>
                    <Info class="w-3.5 h-3.5 text-ink-400" />
                  </div>
                  <p class="text-base font-bold text-ink-900">Rp 0</p>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="flex items-center gap-1 mb-1">
                    <p class="text-xs font-medium text-ink-500">Total Harga Barang COD</p>
                    <Info class="w-3.5 h-3.5 text-ink-400" />
                  </div>
                  <p class="text-base font-bold text-ink-900">Rp 0</p>
                </div>
                <div>
                  <div class="flex items-center gap-1 mb-1">
                    <p class="text-xs font-medium text-ink-500">Total Asuransi</p>
                    <Info class="w-3.5 h-3.5 text-ink-400" />
                  </div>
                  <p class="text-base font-bold text-ink-900">Rp 0</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 3 Right Mini Cards -->
          <div class="flex flex-col gap-4">
            <div class="bg-ink-50/50 rounded-lg p-4 flex-1 border border-ink-100/50">
              <div class="flex items-center gap-1 mb-2">
                <p class="text-xs font-medium text-ink-500">Pendapatan COD Berlangsung</p>
                <Info class="w-3.5 h-3.5 text-ink-400" />
              </div>
              <div class="flex items-center gap-2 text-orange-500">
                <Download class="w-4 h-4 cursor-pointer hover:text-orange-600 transition-colors" />
                <p class="text-lg font-bold text-ink-900">Rp 0</p>
              </div>
            </div>
            <div class="bg-ink-50/50 rounded-lg p-4 flex-1 border border-ink-100/50">
              <div class="flex items-center gap-1 mb-2">
                <p class="text-xs font-medium text-ink-500">Total Cashback Ongkir</p>
                <Info class="w-3.5 h-3.5 text-ink-400" />
              </div>
              <div class="flex items-center gap-2 text-orange-500">
                <Download class="w-4 h-4 cursor-pointer hover:text-orange-600 transition-colors" />
                <p class="text-lg font-bold text-ink-900">Rp 0</p>
              </div>
            </div>
            <div class="bg-ink-50/50 rounded-lg p-4 flex-1 border border-ink-100/50">
              <div class="flex items-center gap-1 mb-2">
                <p class="text-xs font-medium text-ink-500">Total Refund</p>
                <Info class="w-3.5 h-3.5 text-ink-400" />
              </div>
              <div class="flex items-center gap-2 text-orange-500">
                <Download class="w-4 h-4 cursor-pointer hover:text-orange-600 transition-colors" />
                <p class="text-lg font-bold text-ink-900">Rp 0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Tabs and Table -->
    <div class="bg-white border border-ink-100 rounded-xl shadow-sm flex flex-col">
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
          <button class="w-full xl:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <Download class="w-4 h-4" /> Download My Balance Report
          </button>
        </div>
      </div>
      
      <!-- Filters (simplified logic for UI) -->
      <div class="p-5 flex flex-col md:flex-row items-start md:items-center justify-end gap-3">
        <div class="relative w-full md:w-72">
          <input type="text" placeholder="Cari..." class="pl-4 pr-10 py-2.5 border border-ink-200 rounded-lg text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
        
        <div v-if="['berhasil', 'tertunda', 'dibatalkan'].includes(activeTab)" class="relative w-full md:w-56">
          <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2.5 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
            <option>Semua Jenis Mutasi</option>
          </select>
          <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>

        <div v-if="['tambah-saldo', 'penarikan'].includes(activeTab)" class="relative w-full md:w-56">
          <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2.5 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
            <option>Semua Status</option>
          </select>
          <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
      </div>
      
      <!-- Tables -->
      <div class="w-full overflow-x-auto pb-4 pt-1">
        <!-- Generic empty table representation -->
        <table class="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr class="border-b border-ink-100 text-xs font-bold text-orange-500 uppercase tracking-wider">
              <th class="px-6 py-4">TANGGAL</th>
              <th v-if="['berhasil', 'tertunda', 'dibatalkan'].includes(activeTab)" class="px-6 py-4">DEBIT / KREDIT</th>
              <th v-if="['berhasil', 'tertunda', 'dibatalkan'].includes(activeTab)" class="px-6 py-4">JENIS MUTASI</th>
              <th v-if="activeTab === 'tambah-saldo'" class="px-6 py-4">ID TOP UP</th>
              <th v-if="activeTab === 'penarikan'" class="px-6 py-4">ID PENARIKAN</th>
              <th class="px-6 py-4">STATUS / INFO LAIN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="px-6 py-24 text-center">
                <p class="text-ink-500 text-sm font-medium">Data mutasi tidak ditemukan</p>
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
                <input type="number" v-model="topupAmount" class="w-full pl-12 pr-4 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-lg transition-all" placeholder="50000" />
              </div>
            </div>
            
            <div class="grid grid-cols-3 gap-2">
              <button @click="topupAmount = 50000" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">50 Ribu</button>
              <button @click="topupAmount = 100000" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">100 Ribu</button>
              <button @click="topupAmount = 500000" class="py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-sm font-bold text-ink-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-colors">500 Ribu</button>
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

  </div>
</template>

<script setup lang="ts">
import { Calendar, Wallet, Info, Download, Search, ChevronDown } from 'lucide-vue-next'
import { useSaldoStore } from '~/stores/saldo'

definePageMeta({
  layout: 'dashboard',
})

const activeTab = ref('berhasil')

const tabs = [
  { id: 'berhasil', label: 'Mutasi Berhasil' },
  { id: 'tertunda', label: 'Mutasi Tertunda' },
  { id: 'dibatalkan', label: 'Mutasi Dibatalkan' },
  { id: 'tambah-saldo', label: 'Riwayat Tambah Saldo' },
  { id: 'penarikan', label: 'Riwayat Penarikan' },
]

const saldoStore = useSaldoStore()

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka || 0)
}

const isTopupModalOpen = ref(false)
const topupAmount = ref<number | ''>('')
const user = useSupabaseUser()

const isValidTopup = computed(() => {
  return typeof topupAmount.value === 'number' && topupAmount.value >= 10000
})

const handleTopup = () => {
  isTopupModalOpen.value = true
  topupAmount.value = 50000
}

const submitTopup = async () => {
  if (!isValidTopup.value) return
  await saldoStore.topup(topupAmount.value as number, user.value)
}

onMounted(() => {
  saldoStore.fetchSaldo()
  saldoStore.fetchTransactions()
})
</script>
