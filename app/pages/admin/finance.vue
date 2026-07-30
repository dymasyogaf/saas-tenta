<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Audit Keuangan & Mutasi (Finance)</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau perputaran uang (Top Up) dan proses permintaan pencairan dana klien.</p>
      </div>
      <button @click="() => refresh()" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': pending }" /> Segarkan Data
      </button>
    </div>

    <!-- Alert Info -->
    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
      <WalletCards class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-bold text-emerald-900">Brankas Utama Agensi</h3>
        <p class="text-xs text-emerald-700 mt-1">Halaman ini adalah pusat rekonsiliasi. Tugas utama Tim Keuangan adalah mencocokkan mutasi Bank riil dengan data di Dasbor ini, serta memproses (mentransfer secara manual lalu klik <b>Setujui</b>) untuk setiap permintaan <b>Pencairan Dana</b> (Withdraw) yang masuk.</p>
      </div>
    </div>

    <!-- Tabs/Filter -->
    <div class="flex border-b border-slate-200 mt-6 gap-6">
      <button 
        @click="activeTab = 'withdraw'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2"
        :class="activeTab === 'withdraw' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Tugas Eksekusi (Withdraw) 
        <span v-if="pendingWithdraws.length > 0" class="bg-red-500 text-white py-0.5 px-2 rounded-full text-[10px] animate-pulse">{{ pendingWithdraws.length }}</span>
      </button>
      <button 
        @click="activeTab = 'history'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2"
        :class="activeTab === 'history' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Riwayat Mutasi Global
      </button>
    </div>

    <!-- Tab 1: Pencairan (Withdraw) -->
    <div v-if="activeTab === 'withdraw'" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Klien & Tanggal</th>
              <th class="px-6 py-4">Tujuan Rekening</th>
              <th class="px-6 py-4 text-right">Nominal Pencairan</th>
              <th class="px-6 py-4 text-center">Aksi (Eksekusi)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="pending" v-for="i in 2" :key="'skel'+i" class="animate-pulse bg-white">
              <td class="px-6 py-4"><div class="h-4 w-32 bg-ink-200 rounded mb-2"></div><div class="h-3 w-24 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-4 w-48 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-5 w-24 bg-ink-200 rounded ml-auto"></div></td>
              <td class="px-6 py-4"><div class="h-8 w-32 bg-ink-200 rounded-lg mx-auto"></div></td>
            </tr>
            <tr v-else-if="pendingWithdraws.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                <CheckCircle2 class="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p class="font-medium text-slate-600">Semua pencairan sudah diselesaikan.</p>
              </td>
            </tr>
            <tr v-else v-for="tx in pendingWithdraws" :key="tx.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-slate-900">{{ tx.users?.full_name || 'Tanpa Nama' }}</p>
                <p class="text-[10px] text-slate-400 mt-1">{{ new Date(tx.created_at).toLocaleString('id-ID') }}</p>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700">
                    PENCAIRAN
                  </span>
                </div>
                <p class="text-xs font-semibold text-slate-800 uppercase">{{ tx.payment_gateway_ref || 'BANK TRANSFER' }}</p>
                <p class="text-[11px] text-slate-500 mt-0.5">Silakan cek data rekening klien.</p>
              </td>
              <td class="px-6 py-4 text-right">
                <p class="font-display font-bold text-slate-900 text-lg">{{ formatCurrency(tx.amount || 0) }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="processWithdraw(tx.id, 'reject')"
                    :disabled="isSubmitting === tx.id"
                    class="px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                  >
                    Tolak
                  </button>
                  <button 
                    @click="processWithdraw(tx.id, 'approve')"
                    :disabled="isSubmitting === tx.id"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span v-if="isSubmitting === tx.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Transfer & Setujui
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Riwayat Mutasi -->
    <div v-if="activeTab === 'history'" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <!-- Search & Filter -->
      <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div class="relative w-64">
          <input v-model="searchQuery" type="text" placeholder="Cari nama klien..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select v-model="typeFilter" class="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-emerald-500">
          <option value="all">Semua Jenis Transaksi</option>
          <option value="topup">Top Up Masuk</option>
          <option value="withdraw">Pencairan Keluar</option>
        </select>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-white border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Tgl & Waktu</th>
              <th class="px-6 py-4">Klien</th>
              <th class="px-6 py-4">Jenis Transaksi</th>
              <th class="px-6 py-4 text-right">Nominal</th>
              <th class="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredHistory.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                <Receipt class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Tidak ada riwayat mutasi yang sesuai.</p>
              </td>
            </tr>
            <tr v-else v-for="tx in filteredHistory" :key="tx.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-slate-600 text-xs">
                {{ new Date(tx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) }}
              </td>
              <td class="px-6 py-4 font-bold text-slate-900">
                {{ tx.users?.full_name || 'Tanpa Nama' }}
              </td>
              <td class="px-6 py-4">
                <span class="text-[11px] font-bold uppercase tracking-wider"
                  :class="{
                    'text-emerald-600': tx.type === 'topup',
                    'text-orange-600': tx.type === 'withdraw',
                  }">
                  {{ tx.type }}
                </span>
                <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-[150px]" :title="tx.payment_gateway_ref">{{ tx.payment_gateway_ref || 'Internal' }}</p>
              </td>
              <td class="px-6 py-4 text-right font-bold"
                  :class="{
                    'text-emerald-600': tx.type === 'topup',
                    'text-slate-900': tx.type !== 'topup',
                  }">
                {{ tx.type === 'topup' ? '+' : '-' }} {{ formatCurrency(tx.amount || 0) }}
              </td>
              <td class="px-6 py-4 text-center">
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-full"
                  :class="{
                    'bg-emerald-100 text-emerald-700': tx.status === 'success',
                    'bg-orange-100 text-orange-700': tx.status === 'pending',
                    'bg-red-100 text-red-700': tx.status === 'failed',
                  }">
                  {{ (tx.status || 'unknown').toUpperCase() }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Custom Confirmation Modal -->
    <div v-if="isConfirmModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative border border-ink-100 transform transition-all">
        <div class="p-6 text-center">
          <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
               :class="confirmAction === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'">
            <CheckCircle2 v-if="confirmAction === 'approve'" class="w-8 h-8" />
            <WalletCards v-else class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-display font-bold text-ink-900 mb-2">
            {{ confirmAction === 'approve' ? 'Konfirmasi Persetujuan' : 'Tolak Permintaan' }}
          </h3>
          <p class="text-ink-500 text-sm mb-6">{{ confirmMessage }}</p>
          
          <div class="flex gap-3">
            <button @click="isConfirmModalOpen = false" class="flex-1 bg-white border border-ink-200 text-ink-700 hover:bg-ink-50 font-bold py-2.5 rounded-xl transition-colors text-sm">
              Batal
            </button>
            <button @click="executeProcessWithdraw" class="flex-1 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm text-sm"
                    :class="confirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'">
              Ya, Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, WalletCards, CheckCircle2, Search, Receipt } from 'lucide-vue-next'
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'] // Harusnya dilindungi middleware admin_finance / super_admin
})

const { csrf } = useCsrf()

const activeTab = ref('withdraw')
const searchQuery = ref('')
const typeFilter = ref('all')
const isSubmitting = ref<string | null>(null)

// Fetch Data Transaksi dari Server (Bypass RLS)
const { data: transactions, pending, refresh } = useAsyncData<any[]>('admin_finance_list', async () => {
  return (await ($fetch as any)('/api/admin/finance')) as any[]
}, { default: () => [] })

// Filter Transaksi (Withdraw yang masih Pending)
const pendingWithdraws = computed(() => {
  return transactions.value.filter(tx => tx.type === 'withdraw' && tx.status === 'pending')
})

const filteredHistory = computed(() => {
  // Semua transaksi kecuali pending tasks (sudah ada di tab Eksekusi)
  let history = transactions.value.filter(tx => !(tx.type === 'withdraw' && tx.status === 'pending'))

  // Terapkan filter pencarian nama
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    history = history.filter(tx => tx.users?.full_name?.toLowerCase().includes(q))
  }

  // Terapkan filter jenis transaksi
  if (typeFilter.value !== 'all') {
    history = history.filter(tx => tx.type === typeFilter.value)
  }

  return history
})

// Modal Confirmation State
const isConfirmModalOpen = ref(false)
const confirmAction = ref<'approve' | 'reject'>('approve')
const confirmId = ref<string>('')
const confirmMessage = ref<string>('')

// Eksekusi API
const processWithdraw = (id: string, action: 'approve' | 'reject') => {
  const msg = action === 'approve' 
    ? 'Anda yakin sudah mentransfer dana ini ke rekening klien?'
    : 'Anda yakin ingin menolak pencairan dana ini?'
    
  confirmAction.value = action
  confirmId.value = id
  confirmMessage.value = msg
  isConfirmModalOpen.value = true
}

const executeProcessWithdraw = async () => {
  isConfirmModalOpen.value = false
  isSubmitting.value = confirmId.value
  const toast = useToast()

  try {
    const csrfToken = unref(csrf)
    const response = await $fetch('/api/admin/finance', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: {
        transaction_id: confirmId.value,
        action: confirmAction.value
      }
    })

    toast.addToast((response as any).message, 'success')
    await refresh()
    refreshNuxtData('admin-badges')
    
    // Pindah ke tab history untuk melihat hasil jika tidak ada pending lagi
    if (pendingWithdraws.value.length === 0) {
      activeTab.value = 'history'
    }
  } catch (error: any) {
    toast.addToast(error.data?.statusMessage || 'Gagal memproses transaksi', 'error')
  } finally {
    isSubmitting.value = null
  }
}

// Helper Format Uang
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>
