<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Riwayat Transaksi Lengkap</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau seluruh aktivitas transaksi (Top Up, Transfer, Payment, Withdraw) dari semua pengguna.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative w-64">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" v-model="searchQuery" placeholder="Cari nama klien atau referensi..." class="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-900 placeholder:text-slate-400" />
        </div>
        <button @click="() => refresh()" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': pending }" /> Segarkan Data
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Tgl & Waktu</th>
              <th class="px-6 py-4">Klien</th>
              <th class="px-6 py-4">Jenis Transaksi</th>
              <th class="px-6 py-4 text-right">Nominal</th>
              <th class="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="pending" v-for="i in 5" :key="'skeleton-'+i">
              <td colspan="5" class="px-6 py-4">
                <div class="h-10 bg-slate-100 rounded animate-pulse"></div>
              </td>
            </tr>
            <tr v-else-if="filteredHistory.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                <Receipt class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Tidak ada riwayat transaksi yang ditemukan.</p>
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
                    'text-emerald-600': tx.type === 'topup' || tx.type === 'refund',
                    'text-orange-600': tx.type === 'withdraw' || tx.type === 'payment',
                    'text-blue-600': tx.type === 'transfer'
                  }">
                  {{ tx.type }}
                </span>
                <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-[200px]" :title="tx.payment_gateway_ref || tx.description">{{ tx.payment_gateway_ref || tx.description || '-' }}</p>
              </td>
              <td class="px-6 py-4 text-right font-bold"
                  :class="{
                    'text-emerald-600': tx.type === 'topup' || tx.type === 'refund',
                    'text-slate-900': tx.type !== 'topup' && tx.type !== 'refund',
                  }">
                {{ (tx.type === 'topup' || tx.type === 'refund') ? '+' : '-' }} {{ formatCurrency(tx.amount || 0) }}
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
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, Search, Receipt } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const { data: history, pending, refresh } = useFetch('/api/admin/finance')

const searchQuery = ref('')

const filteredHistory = computed(() => {
  let result = history.value || []
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((t: any) => 
      (t.users?.full_name || '').toLowerCase().includes(q) ||
      (t.payment_gateway_ref || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    )
  }
  
  return result
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>
