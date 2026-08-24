<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <div>
      <h2 class="text-2xl font-display font-bold text-ink-900">Pengumuman (Broadcast)</h2>
      <p class="text-ink-500 text-sm mt-1">Kelola dan kirim notifikasi massal ke grup pengguna atau staf secara spesifik.</p>
    </div>

    <!-- Tabs -->
    <div class="flex items-center gap-2 border-b border-ink-200">
      <button 
        @click="activeTab = 'send'"
        class="px-4 py-3 font-bold text-sm transition-colors border-b-2"
        :class="activeTab === 'send' ? 'border-orange-500 text-orange-600' : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'"
      >
        Kirim Pengumuman
      </button>
      <button 
        @click="activeTab = 'history'"
        class="px-4 py-3 font-bold text-sm transition-colors border-b-2"
        :class="activeTab === 'history' ? 'border-orange-500 text-orange-600' : 'border-transparent text-ink-500 hover:text-ink-700 hover:border-ink-300'"
      >
        Riwayat Pengumuman
      </button>
    </div>

    <!-- TAB: Send Broadcast -->
    <div v-if="activeTab === 'send'" class="bg-white border border-ink-200 rounded-xl shadow-sm p-6">
      <form @submit.prevent="submitBroadcast" class="space-y-5">
        <div>
          <label class="block text-sm font-bold text-ink-900 mb-1">Target Penerima</label>
          <BaseSelect 
            v-model="form.targetRole" 
            :options="targetRoleOptions"
            wrapperClass="w-full border border-ink-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
          />
          <p class="text-xs text-ink-500 mt-1">Notifikasi akan langsung masuk ke menu lonceng 🔔 target terpilih.</p>
        </div>

        <div>
          <label class="block text-sm font-bold text-ink-900 mb-1">Judul Pengumuman</label>
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="Misal: Update Fitur Baru Dasbor V2.0"
            class="w-full border border-ink-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-bold text-ink-900 mb-1">Isi Pesan</label>
          <div class="max-w-full overflow-x-auto scrollbar-hide">
            <div class="min-w-[500px]">
              <ClientOnly>
                <QuillEditor 
                  ref="quillSendRef"
                  v-model:content="form.message" 
                  contentType="html" 
                  theme="snow" 
                  placeholder="Tulis pesan pengumuman... (bisa dicetak tebal, list, dll)"
                  class="bg-white min-h-[200px] border-ink-200 rounded-lg text-sm"
                />
              </ClientOnly>
            </div>
          </div>
        </div>

        <div class="pt-2">
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Send v-if="!isSubmitting" class="w-4 h-4" />
            <Loader2 v-else class="w-4 h-4 animate-spin" />
            {{ isSubmitting ? 'Mengirim...' : 'Kirim Pengumuman Sekarang' }}
          </button>
        </div>
      </form>
    </div>

    <!-- TAB: History -->
    <div v-if="activeTab === 'history'" class="space-y-4">
      <!-- Toolbar: Search & Filter -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari judul atau isi pengumuman..."
            class="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
          />
        </div>
        <div class="relative min-w-[180px] z-10">
          <BaseSelect 
            v-model="filterTarget" 
            :options="filterTargetOptions"
            wrapperClass="border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white w-full"
          />
        </div>
        <div class="relative min-w-[140px] z-10">
          <BaseSelect 
            v-model="sortOrder" 
            :options="sortOrderOptions"
            wrapperClass="border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 bg-white w-full"
          />
        </div>
      </div>

      <div v-if="isLoadingHistory" class="flex justify-center p-12">
        <Loader2 class="w-8 h-8 animate-spin text-orange-500" />
      </div>
      
      <div v-else-if="filteredBroadcasts.length === 0" class="bg-white border border-ink-200 rounded-xl p-12 text-center">
        <p class="text-ink-500" v-if="broadcasts.length === 0">Belum ada riwayat pengumuman yang dikirim.</p>
        <p class="text-ink-500" v-else>Tidak ada pengumuman yang cocok dengan filter/pencarian.</p>
      </div>

      <div v-else class="bg-white border border-ink-200 rounded-xl shadow-sm overflow-hidden">
        <!-- Summary -->
        <div class="px-4 py-3 bg-ink-50 border-b border-ink-200 flex items-center justify-between">
          <p class="text-xs text-ink-500">Menampilkan <span class="font-bold text-ink-700">{{ paginatedBroadcasts.length }}</span> dari <span class="font-bold text-ink-700">{{ filteredBroadcasts.length }}</span> pengumuman</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-ink-50 border-b border-ink-200">
                <th class="py-3 px-4 font-bold text-xs text-ink-500 uppercase tracking-wider w-10">No</th>
                <th class="py-3 px-4 font-bold text-xs text-ink-500 uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                <th class="py-3 px-4 font-bold text-xs text-ink-500 uppercase tracking-wider">Judul & Pesan</th>
                <th class="py-3 px-4 font-bold text-xs text-ink-500 uppercase tracking-wider">Target</th>
                <th class="py-3 px-4 font-bold text-xs text-ink-500 uppercase tracking-wider">Pengirim</th>
                <th class="py-3 px-4 font-bold text-xs text-ink-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="(b, index) in paginatedBroadcasts" :key="b.id" class="hover:bg-ink-50 transition-colors">
                <td class="py-3 px-4 text-sm text-ink-400 font-mono align-top">
                  {{ (currentPage - 1) * perPage + index + 1 }}
                </td>
                <td class="py-3 px-4 text-sm text-ink-600 whitespace-nowrap align-top">
                  {{ formatDate(b.created_at) }}
                </td>
                <td class="py-3 px-4 align-top max-w-sm">
                  <p class="text-sm font-bold text-ink-900 mb-1">{{ b.title }}</p>
                  <p class="text-xs text-ink-500 line-clamp-2">{{ stripHtml(b.message) }}</p>
                </td>
                <td class="py-3 px-4 text-xs font-semibold text-ink-600 align-top whitespace-nowrap">
                  <span class="bg-ink-100 px-2 py-1 rounded-md">{{ getTargetLabel(b.target_role) }}</span>
                </td>
                <td class="py-3 px-4 text-xs text-ink-600 align-top whitespace-nowrap">
                  {{ b.created_by?.full_name || 'Admin' }}
                </td>
                <td class="py-3 px-4 align-top text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button @click="openDetails(b)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat Penerima">
                      <Users class="w-4 h-4" />
                    </button>
                    <button @click="openEdit(b)" class="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button @click="deleteBroadcast(b.id)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Keseluruhan">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-4 py-3 bg-ink-50 border-t border-ink-200 flex items-center justify-between">
          <p class="text-xs text-ink-500">Halaman {{ currentPage }} dari {{ totalPages }}</p>
          <div class="flex items-center gap-2">
            <button 
              @click="currentPage = Math.max(1, currentPage - 1)" 
              :disabled="currentPage === 1"
              class="px-3 py-1.5 text-xs font-bold border border-ink-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Sebelumnya
            </button>
            <button 
              v-for="page in visiblePages" :key="page"
              @click="currentPage = page"
              class="w-8 h-8 text-xs font-bold rounded-lg transition-colors"
              :class="page === currentPage ? 'bg-orange-500 text-white' : 'hover:bg-white border border-ink-200'"
            >
              {{ page }}
            </button>
            <button 
              @click="currentPage = Math.min(totalPages, currentPage + 1)" 
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 text-xs font-bold border border-ink-200 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <Teleport to="body">
<div v-if="editingBroadcast" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" @click="editingBroadcast = null"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h3 class="font-bold text-xl text-ink-900 mb-4">Edit Pengumuman</h3>
        <form @submit.prevent="submitEdit" class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-ink-900 mb-1">Judul Pengumuman</label>
            <input 
              v-model="editForm.title" 
              type="text" 
              class="w-full border border-ink-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-bold text-ink-900 mb-1">Isi Pesan</label>
            <ClientOnly>
              <QuillEditor 
                ref="quillEditRef"
                v-model:content="editForm.message" 
                contentType="html" 
                theme="snow" 
                class="bg-white min-h-[200px] border-ink-200 rounded-lg text-sm"
              />
            </ClientOnly>
            <p class="text-xs text-ink-500 mt-1">Perubahan akan langsung mengubah notifikasi yang ada di klien.</p>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="editingBroadcast = null" class="px-4 py-2 text-sm font-bold text-ink-600 hover:bg-ink-100 rounded-lg">Batal</button>
            <button type="submit" :disabled="isSubmitting" class="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center gap-2">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
    </Teleport>


    <!-- Details/Recipients Modal -->
    <Teleport to="body">
<div v-if="viewingDetails" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" @click="viewingDetails = null"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div class="p-6 border-b border-ink-100 flex items-center justify-between shrink-0">
          <div>
            <h3 class="font-bold text-lg text-ink-900">Daftar Penerima Notifikasi</h3>
            <p class="text-xs text-ink-500 mt-1">Pengumuman: {{ viewingDetails.title }}</p>
          </div>
          <button @click="viewingDetails = null" class="p-2 text-ink-400 hover:bg-ink-50 rounded-full">
            <Plus class="w-5 h-5 rotate-45" />
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="isLoadingRecipients" class="flex justify-center p-8">
            <Loader2 class="w-8 h-8 animate-spin text-orange-500" />
          </div>
          <div v-else-if="recipients.length === 0" class="text-center p-8 text-ink-500">
            Tidak ada penerima atau semua notifikasi telah dihapus.
          </div>
          <div v-else class="space-y-2">
            <div v-for="r in recipients" :key="r.id" class="flex items-center justify-between p-3 bg-ink-50 rounded-xl border border-ink-100">
              <div>
                <p class="text-sm font-bold text-ink-900">{{ r.users?.full_name || 'User' }}</p>
                <p class="text-xs text-ink-500">{{ r.users?.email }} • <span class="uppercase">{{ r.users?.role }}</span></p>
              </div>
              <button @click="removeUserNotif(r.user_id)" class="p-2 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1" title="Hapus Notif untuk orang ini">
                <Trash2 class="w-4 h-4" /> Tarik
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Teleport>


    <!-- Success Modal -->
    <Teleport to="body">
<div v-if="showSuccess" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" @click="showSuccess = false"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 class="w-8 h-8" />
        </div>
        <h3 class="font-bold text-xl text-ink-900 mb-2">Berhasil!</h3>
        <p class="text-sm text-ink-600 mb-6">Aksi berhasil dilakukan.</p>
        <button @click="showSuccess = false" class="w-full bg-ink-100 hover:bg-ink-200 text-ink-900 font-bold py-2.5 rounded-xl transition-colors">
          Tutup
        </button>
      </div>
    </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { Send, Loader2, CheckCircle2, Edit2, Trash2, Users, Plus, Search } from 'lucide-vue-next'
import { stripHtml } from '../../../utils/formatters'
import BaseSelect from '~/components/ui/BaseSelect.vue'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import { useCsrf } from '#imports'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const { csrf } = useCsrf()
const activeTab = ref('send') // 'send' | 'history'

const quillSendRef = ref<any>(null)
const quillEditRef = ref<any>(null)

// --- Send Tab State ---
const form = reactive({
  targetRole: 'all',
  title: '',
  message: ''
})

const targetRoleOptions = [
  { label: '📢 Semua (Klien & Admin)', value: 'all' },
  { label: '🛡️ Semua Admin', value: 'admin_only' },
  { label: '📣 Tim Iklan', value: 'admin_ads_ops' },
  { label: '💰 Tim Keuangan', value: 'admin_finance' },
  { label: '🔍 Tim Audit', value: 'admin_compliance' },
]
const isSubmitting = ref(false)
const showSuccess = ref(false)

const submitBroadcast = async () => {
  if (!form.title || !form.message || form.message.trim() === '' || form.message === '<p><br></p>') {
    useToast().addToast("Isi pesan tidak boleh kosong", "error")
    return
  }

  isSubmitting.value = true
  const messageToSend = quillSendRef.value?.getHTML() || form.message

  try {
    await $fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: { 'csrf-token': csrf },
      body: {
        title: form.title,
        message: messageToSend,
        targetRole: form.targetRole
      }
    })
    
    form.title = ''
    form.message = ''
    form.targetRole = 'all'
    showSuccess.value = true
    loadHistory() // reload history in background
  } catch (err: any) {
    useToast().addToast('Gagal mengirim broadcast: ' + (err.data?.statusMessage || err.message), 'error')
  } finally {
    isSubmitting.value = false
  }
}

// --- History Tab State ---
const broadcasts = ref<any[]>([])
const isLoadingHistory = ref(false)
const searchQuery = ref('')
const filterTarget = ref('all_filter')
const sortOrder = ref('newest')

const filterTargetOptions = [
  { label: 'Semua Target', value: 'all_filter' },
  { label: '📢 Semua Pengguna', value: 'all' },
  { label: '🛡️ Hanya Admin', value: 'admin_only' },
  { label: '📣 Tim Iklan', value: 'admin_ads_ops' },
  { label: '💰 Tim Keuangan', value: 'admin_finance' },
  { label: '🔍 Tim Audit', value: 'admin_compliance' },
]

const sortOrderOptions = [
  { label: 'Terbaru', value: 'newest' },
  { label: 'Terlama', value: 'oldest' },
]

const currentPage = ref(1)
const perPage = 10

const filteredBroadcasts = computed(() => {
  let result = broadcasts.value
  
  // Filter by target
  if (filterTarget.value !== 'all_filter') {
    result = result.filter(b => b.target_role === filterTarget.value)
  }
  
  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(b => 
      b.title?.toLowerCase().includes(q) || 
      stripHtml(b.message).toLowerCase().includes(q)
    )
  }
  
  // Sort
  result = [...result].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder.value === 'newest' ? dateB - dateA : dateA - dateB
  })
  
  return result
})

const totalPages = computed(() => Math.ceil(filteredBroadcasts.value.length / perPage))
const paginatedBroadcasts = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredBroadcasts.value.slice(start, start + perPage)
})
const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// Reset page when filters change
watch([searchQuery, filterTarget, sortOrder], () => { currentPage.value = 1 })

const loadHistory = async () => {
  isLoadingHistory.value = true
  try {
    const data = await $fetch('/api/admin/broadcasts')
    broadcasts.value = data as any[]
  } catch (err: any) {
    console.error('Load history error:', err)
    useToast().addToast('Gagal memuat riwayat: ' + (err.data?.statusMessage || err.message || 'Unknown error'), 'error')
  } finally {
    isLoadingHistory.value = false
  }
}

watch(activeTab, (val) => {
  if (val === 'history') {
    loadHistory()
  }
})

// --- Edit Broadcast ---
const editingBroadcast = ref<any>(null)
const editForm = reactive({ title: '', message: '' })

const openEdit = (b: any) => {
  editingBroadcast.value = b
  editForm.title = b.title
  editForm.message = b.message
}

const submitEdit = async () => {
  if (!editingBroadcast.value) return
  isSubmitting.value = true
  
  const messageToUpdate = quillEditRef.value?.getHTML ? quillEditRef.value.getHTML() : editForm.message

  try {
    await $fetch(`/api/admin/broadcasts/${editingBroadcast.value.id}`, {
      method: 'PUT',
      headers: { 'csrf-token': csrf },
      body: {
        title: editForm.title,
        message: messageToUpdate
      }
    })
    showSuccess.value = true
    editingBroadcast.value = null
    loadHistory()
  } catch (err: any) {
    useToast().addToast('Gagal mengedit: ' + (err.data?.statusMessage || err.message), 'error')
  } finally {
    isSubmitting.value = false
  }
}

// --- Delete Broadcast ---
const deleteBroadcast = async (id: string) => {
  if (!(await useConfirm().show({ message: 'Yakin ingin menghapus pengumuman ini? Semua notifikasi di klien juga akan ditarik mundur.' }))) return
  try {
    await $fetch(`/api/admin/broadcasts/${id}`, {
      method: 'DELETE',
      headers: { 'csrf-token': csrf }
    })
    loadHistory()
  } catch (err: any) {
    useToast().addToast('Gagal menghapus: ' + (err.data?.statusMessage || err.message), 'error')
  }
}

// --- View Details (Selective Delete) ---
const viewingDetails = ref<any>(null)
const recipients = ref<any[]>([])
const isLoadingRecipients = ref(false)

const openDetails = async (b: any) => {
  viewingDetails.value = b
  isLoadingRecipients.value = true
  recipients.value = []
  try {
    const data = await $fetch(`/api/admin/broadcasts/${b.id}/users`)
    recipients.value = data as any[]
  } catch (err) {
    console.error(err)
  } finally {
    isLoadingRecipients.value = false
  }
}

const removeUserNotif = async (userId: string) => {
  if (!viewingDetails.value) return
  if (!(await useConfirm().show({ message: 'Tarik notifikasi untuk pengguna ini?' }))) return
  
  try {
    await $fetch(`/api/admin/broadcasts/${viewingDetails.value.id}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'csrf-token': csrf }
    })
    // Remove locally from UI
    recipients.value = recipients.value.filter(r => r.user_id !== userId)
  } catch (err: any) {
    useToast().addToast('Gagal menghapus: ' + (err.data?.statusMessage || err.message), 'error')
  }
}

// --- Helpers ---
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}

const getTargetLabel = (role: string) => {
  const map: Record<string, string> = {
    'all': 'Semua Pengguna',
    'admin_only': 'Hanya Admin',
    'admin_ads_ops': 'Tim Iklan',
    'admin_finance': 'Tim Keuangan',
    'admin_compliance': 'Tim Audit'
  }
  return map[role] || role
}
</script>
