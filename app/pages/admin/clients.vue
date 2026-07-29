<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Daftar Klien (CRM)</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau seluruh pengguna, status KYC, dan saldo mereka.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative w-64">
          <input v-model="searchQuery" type="text" placeholder="Cari nama atau email..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select v-model="statusFilter" class="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-orange-500">
          <option value="all">Semua Status</option>
          <option value="verified">Verified (Aktif)</option>
          <option value="pending">Pending KYC</option>
          <option value="unverified">Belum KYC</option>
        </select>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Klien</th>
              <th class="px-6 py-4">Tgl Mendaftar</th>
              <th class="px-6 py-4">Status Verifikasi</th>
              <th class="px-6 py-4 text-right">Saldo Dompet</th>
              <th class="px-6 py-4 text-center">Akun Iklan</th>
              <th class="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Loading Skeleton -->
            <tr v-if="pending" v-for="i in 5" :key="'skel'+i" class="animate-pulse bg-white">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-ink-200 shrink-0"></div>
                  <div class="space-y-2">
                    <div class="h-4 w-32 bg-ink-200 rounded"></div>
                    <div class="h-3 w-24 bg-ink-200 rounded"></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4"><div class="h-4 w-24 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-6 w-20 bg-ink-200 rounded-full"></div></td>
              <td class="px-6 py-4"><div class="h-5 w-24 bg-ink-200 rounded ml-auto"></div></td>
              <td class="px-6 py-4"><div class="h-6 w-6 bg-ink-200 rounded-full mx-auto"></div></td>
              <td class="px-6 py-4"><div class="h-8 w-8 bg-ink-200 rounded-lg mx-auto"></div></td>
            </tr>
            
            <!-- Empty State -->
            <tr v-else-if="filteredClients.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p class="font-medium text-slate-600">Tidak ada klien yang ditemukan.</p>
                <p class="text-xs mt-1">Coba ubah kata kunci atau filter pencarian Anda.</p>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr v-else v-for="client in filteredClients" :key="client.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-200">
                    {{ client.full_name ? client.full_name.substring(0,2).toUpperCase() : 'US' }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{{ client.full_name || 'Tanpa Nama' }}</p>
                    <p class="text-xs text-slate-500">{{ client.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-600">
                {{ new Date(client.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-[11px] font-bold rounded-full border"
                  :class="{
                    'bg-green-50 text-green-700 border-green-200': client.verification_status === 'verified',
                    'bg-orange-50 text-orange-700 border-orange-200': client.verification_status === 'pending',
                    'bg-slate-50 text-slate-700 border-slate-200': client.verification_status === 'unverified' || !client.verification_status
                  }">
                  {{ (client.verification_status || 'unverified').toUpperCase() }}
                </span>
              </td>
              <td class="px-6 py-4 text-right font-bold text-slate-900">
                {{ formatCurrency(client.balance || 0) }}
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                  {{ client.ad_accounts_count || 0 }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button class="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Lihat Detail Klien">
                    <ExternalLink class="w-4 h-4" />
                  </button>
                  <button @click="deleteClient(client.id, client.full_name)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Klien">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Users, ExternalLink, Trash2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const supabase = useSupabaseClient()
const searchQuery = ref('')
const statusFilter = ref('all')

// Fetch and merge Data dari Server Endpoint (Bypass RLS)
const { data: clients, pending } = useFetch<any[]>('/api/admin/clients')

// Filter Dinamis Berdasarkan Pencarian & Dropdown Status
const filteredClients = computed(() => {
  if (!clients.value) return []
  
  return clients.value.filter((client: any) => {
    // 1. Pencocokan Kata Kunci (Nama atau Email)
    const searchMatch = !searchQuery.value || 
      client.full_name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.value.toLowerCase())
      
    // 2. Pencocokan Status Dropdown
    const statusMatch = statusFilter.value === 'all' || 
      (client.verification_status || 'unverified') === statusFilter.value
      
    return searchMatch && statusMatch
  })
})

// Format Rupiah
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

// Hapus Klien
const deleteClient = async (id: string, name: string) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus klien ${name || 'ini'} secara permanen? Semua data terkait juga akan terhapus.`)) return
  
  try {
    const res = await $fetch(`/api/admin/users/${id}`, {
      method: 'DELETE'
    })
    
    alert('Klien berhasil dihapus.')
    
    // Update local state by refetching or filtering
    if (clients.value) {
      clients.value = clients.value.filter((c: any) => c.id !== id)
    }
  } catch (err: any) {
    alert(err.data?.statusMessage || 'Terjadi kesalahan saat menghapus klien')
  }
}
</script>
