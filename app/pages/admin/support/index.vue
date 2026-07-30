<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-ink-900">Tiket Pusat Bantuan</h1>
      <p class="text-ink-500 mt-1">Pantau dan kelola keluhan klien (Support Tickets)</p>
    </div>

    <!-- Filter & Search -->
    <div class="bg-white border border-ink-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm shadow-ink-900/5">
      <div class="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
        <button 
          v-for="f in [{id:'all', label:'Semua Tiket'}, {id:'open', label:'Terbuka'}, {id:'in_progress', label:'In Progress'}, {id:'answered', label:'Dijawab'}, {id:'pending', label:'Ditunda'}, {id:'closed', label:'Ditutup'}]" 
          :key="f.id"
          @click="filterStatus = f.id"
          class="px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border"
          :class="filterStatus === f.id ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-ink-200 text-ink-600 hover:border-orange-500 hover:text-orange-500'"
        >
          {{ f.label }}
        </button>
      </div>
      <div class="relative w-full sm:w-64 flex-shrink-0">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search class="w-4 h-4 text-ink-400" />
        </div>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Cari tiket..." 
          class="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
        >
      </div>
    </div>

    <!-- Tickets Table -->
    <div class="bg-white border border-ink-100 rounded-2xl shadow-sm shadow-ink-900/5 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr class="border-b border-ink-100">
              <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">SUBJEK</th>
              <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">KLIEN</th>
              <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">KATEGORI</th>
              <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">STATUS</th>
              <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">PRIORITAS</th>
              <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">DIPERBARUI</th>
              <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase text-right">AKSI</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-if="pending" class="animate-pulse">
              <td colspan="7" class="p-6 text-center text-ink-400 font-medium">Memuat data tiket...</td>
            </tr>
            <tr v-else-if="filteredTickets.length === 0">
              <td colspan="7" class="p-12 text-center text-ink-500 font-medium">Belum ada tiket yang cocok dengan pencarian atau filter Anda.</td>
            </tr>
            <tr v-for="ticket in filteredTickets" :key="ticket.id" class="hover:bg-ink-50/50 transition-colors">
              <!-- SUBJEK -->
              <td class="p-4 sm:px-6 py-4 align-middle">
                <div class="flex items-center gap-4">
                  <div class="w-11 h-11 shrink-0 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                    <MessageCircle class="w-5 h-5" />
                  </div>
                  <div>
                    <p class="font-bold text-ink-900 text-sm leading-tight max-w-[200px] truncate" :title="ticket.subject">{{ ticket.subject }}</p>
                    <p class="text-[13px] text-ink-500 font-medium mt-1">#{{ ticket.ticket_number }}</p>
                  </div>
                </div>
              </td>
              
              <!-- KLIEN -->
              <td class="p-4 sm:px-6 py-4 align-middle">
                <p class="font-bold text-ink-900 text-[13px] leading-tight">{{ ticket.users?.full_name || 'Tanpa Nama' }}</p>
                <p class="text-[13px] text-ink-500 font-medium mt-1 max-w-[150px] truncate">{{ ticket.users?.email }}</p>
              </td>

              <!-- KATEGORI -->
              <td class="p-4 sm:px-6 py-4 align-middle">
                <span class="text-[13px] font-bold text-ink-600">
                  {{ getCategoryLabel(ticket.category) }}
                </span>
              </td>
              
              <!-- STATUS -->
              <td class="p-4 sm:px-6 py-4 align-middle">
                <span :class="getStatusOutlineClass(ticket.status)">
                  {{ getStatusLabel(ticket.status).toUpperCase() }}
                </span>
              </td>

              <!-- PRIORITAS -->
              <td class="p-4 sm:px-6 py-4 align-middle">
                <span :class="getPriorityClass(ticket.priority || 'normal')">
                  {{ (ticket.priority || 'NORMAL').toUpperCase() }}
                </span>
              </td>

              <!-- DIPERBARUI -->
              <td class="p-4 sm:px-6 py-4 align-middle">
                <p class="text-[13px] font-bold text-ink-900">{{ formatDateOnly(ticket.created_at) }}</p>
                <p class="text-[13px] text-ink-500 font-medium mt-0.5">{{ formatRelativeTime(ticket.created_at) }}</p>
              </td>
              
              <!-- AKSI -->
              <td class="p-4 sm:px-6 py-4 align-middle text-right">
                <div class="flex items-center justify-end gap-2">
                  <select 
                    :value="ticket.status"
                    @change="updateStatus(ticket.id, ($event.target as HTMLSelectElement).value)"
                    class="w-28 px-3 py-1.5 bg-ink-50 border border-ink-200 text-ink-700 text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    <option value="open">Terbuka</option>
                    <option value="in_progress">In Progress</option>
                    <option value="answered">Dijawab</option>
                    <option value="pending">Ditunda</option>
                    <option value="closed">Ditutup</option>
                  </select>
                  <NuxtLink 
                    :to="`/admin/support/${ticket.id}`" 
                    class="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
                  >
                    Balas
                  </NuxtLink>
                  <button 
                    @click="deleteTicket(ticket.id, ticket.ticket_number)"
                    class="p-2 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Hapus Tiket"
                  >
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
import { MessageCircle, Trash2, Search } from 'lucide-vue-next'


definePageMeta({ layout: 'admin' })

const toast = useToast()
const { csrf } = useCsrf()
const { data: tickets, pending, refresh } = useFetch<any>('/api/admin/tickets')

const filterStatus = ref('all')
const searchQuery = ref('')

const filteredTickets = computed(() => {
  if (!tickets.value?.data) return []
  let result = tickets.value.data
  
  if (filterStatus.value !== 'all') {
    result = result.filter((t: any) => t.status === filterStatus.value)
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((t: any) => 
      (t.ticket_number && t.ticket_number.toLowerCase().includes(q)) || 
      (t.subject && t.subject.toLowerCase().includes(q)) ||
      (t.users?.full_name && t.users.full_name.toLowerCase().includes(q)) ||
      (t.users?.email && t.users.email.toLowerCase().includes(q))
    )
  }
  
  return result
})

const updateStatus = async (ticket_id: string, status: string) => {
  if (!confirm(`Yakin ingin mengubah status tiket menjadi ${status.toUpperCase()}?`)) return
  
  try {
    const csrfToken = unref(csrf)
    await $fetch('/api/admin/tickets', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: { ticket_id, status }
    })
    toast.addToast('Status tiket diperbarui', 'success')
    refresh()
  } catch (err: any) {
    toast.addToast(err.statusMessage || 'Terjadi kesalahan', 'error')
  }
}

const deleteTicket = async (id: string, ticketNumber: string) => {
  if (!confirm(`Yakin ingin menghapus tiket #${ticketNumber}? Tindakan ini tidak dapat dibatalkan.`)) return
  
  try {
    const csrfToken2 = unref(csrf)
    await $fetch(`/api/admin/tickets/${id}`, { method: 'DELETE', headers: csrfToken2 ? { 'csrf-token': csrfToken2 } : {} })
    toast.addToast('Tiket berhasil dihapus', 'success')
    refresh()
  } catch (err: any) {
    toast.addToast(err.statusMessage || 'Gagal menghapus tiket', 'error')
  }
}
</script>
