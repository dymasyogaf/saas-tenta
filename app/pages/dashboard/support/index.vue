<template>
  <div class="space-y-6">
    
    <!-- LIST VIEW -->
    <template v-if="!isCreating">
      <!-- Header Area -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-ink-900">Pusat Bantuan (Tiket)</h1>
          <p class="text-ink-500 mt-1">Sampaikan kendala Anda dan tim kami akan segera menindaklanjutinya.</p>
        </div>
        <div class="flex gap-3">
          <button 
            @click="isCreating = true"
            class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
          >
            Buat Tiket Baru
          </button>
        </div>
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
      <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm shadow-ink-900/5">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr class="border-b border-ink-100">
                <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">SUBJEK</th>
                <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">KATEGORI</th>
                <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">STATUS</th>
                <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">PRIORITAS</th>
                <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase">DIPERBARUI</th>
                <th class="p-4 sm:px-6 py-5 font-extrabold text-ink-900 text-xs tracking-wider uppercase text-right">AKSI</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-if="pending" class="animate-pulse">
                <td colspan="6" class="p-6 text-center text-ink-400 font-medium">Memuat tiket...</td>
              </tr>
              <tr v-else-if="filteredTickets.length === 0">
                <td colspan="6" class="p-12 text-center">
                  <div class="flex flex-col items-center justify-center">
                    <div class="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center text-ink-300 mb-4">
                      <Ticket class="w-8 h-8" />
                    </div>
                    <h3 class="font-bold text-ink-900 mb-1">Tidak Ada Tiket</h3>
                    <p class="text-sm text-ink-500 mb-4">Belum ada tiket yang cocok dengan pencarian atau filter Anda.</p>
                  </div>
                </td>
              </tr>
              <tr v-for="ticket in filteredTickets" :key="ticket.id" class="hover:bg-ink-50/50 transition-colors">
                <!-- SUBJEK -->
                <td class="p-4 sm:px-6 py-4 align-middle">
                  <div class="flex items-center gap-4">
                    <div class="w-11 h-11 shrink-0 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                      <MessageCircle class="w-5 h-5" />
                    </div>
                    <div>
                      <p class="font-bold text-ink-900 text-sm leading-tight">{{ ticket.subject }}</p>
                      <p class="text-[13px] text-ink-500 font-medium mt-1">#{{ ticket.ticket_number }}</p>
                    </div>
                  </div>
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
                  <NuxtLink :to="`/dashboard/support/${ticket.id}`" class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-400 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                    <Eye class="w-4 h-4" />
                    Lihat
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    
    <!-- CREATE VIEW -->
    <template v-else>
      <div class="bg-white border border-ink-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="border-b border-ink-100 p-4 sm:p-6 flex items-center gap-3 bg-ink-50/50">
          <div class="w-1.5 h-5 bg-blue-500 rounded-full"></div>
          <h2 class="text-lg font-bold text-ink-900">Detail Tiket</h2>
        </div>
        
        <form @submit.prevent="submitTicket" class="p-4 sm:p-8 space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Kategori / Layanan Terkait -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1.5">Kategori Masalah <span class="text-red-500">*</span></label>
              <select v-model="form.category" required class="w-full px-4 py-2.5 bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm">
                <option value="top_up">Top Up Saldo</option>
                <option value="ad_account">Akun Iklan (Banned/Limit)</option>
                <option value="technical">Masalah Teknis Website</option>
                <option value="other">Lainnya</option>
              </select>
              <p class="text-[11px] text-ink-500 mt-1.5">Pilih kategori layanan yang paling sesuai dengan kendala Anda.</p>
            </div>
            
            <!-- Prioritas / Departemen -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1.5">Prioritas <span class="text-red-500">*</span></label>
              <select v-model="form.priority" required class="w-full px-4 py-2.5 bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm">
                <option value="low">Rendah</option>
                <option value="normal">Normal</option>
                <option value="high">Tinggi</option>
              </select>
            </div>
            
            <div v-if="form.category === 'other'" class="sm:col-span-2">
              <label class="block text-sm font-bold text-ink-900 mb-1.5">Sebutkan Kategori Masalah <span class="text-red-500">*</span></label>
              <input v-model="customCategory" required type="text" placeholder="Misal: Ubah Data Profil" class="w-full px-4 py-2.5 bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm">
            </div>

            <!-- Subjek -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-bold text-ink-900 mb-1.5">Subjek <span class="text-red-500">*</span></label>
              <input v-model="form.subject" required type="text" placeholder="Deskripsi singkat masalah Anda" class="w-full px-4 py-2.5 bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm">
            </div>
            
            <!-- Pesan -->
            <div class="sm:col-span-2">
              <label class="block text-sm font-bold text-ink-900 mb-1.5">Pesan <span class="text-red-500">*</span></label>
              <ClientOnly>
                <div class="border border-ink-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 bg-white">
                  <QuillEditor theme="snow" v-model:content="form.description" contentType="html" class="min-h-[200px]" :toolbar="['bold', 'italic', 'underline', { 'list': 'ordered'}, { 'list': 'bullet' }, 'blockquote', 'link', 'code-block', 'clean']" />
                </div>
                <template #fallback>
                  <textarea v-model="form.description" required rows="6" placeholder="Memuat editor..." class="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl focus:outline-none text-sm"></textarea>
                </template>
              </ClientOnly>
              <p class="text-[11px] text-ink-500 mt-1.5">Gunakan editor di atas. HTML akan disanitasi.</p>
            </div>
          </div>
          
          <hr class="border-ink-100 my-6">
          
          <!-- Lampiran -->
          <div>
            <h3 class="text-sm font-bold text-ink-900 mb-2">Lampiran</h3>
            <button type="button" @click="triggerFileInput" class="inline-flex items-center gap-2 px-4 py-2 bg-orange-400 hover:bg-orange-500 text-white rounded-lg text-sm font-bold transition-colors mb-2 shadow-sm">
              <Paperclip class="w-4 h-4" />
              Pilih File
            </button>
            <p class="text-[11px] text-ink-500">Allowed: Images, PDF. Maksimal 5 file.</p>
            <input ref="fileInput" type="file" multiple accept="image/*,.pdf" class="hidden" @change="handleFileChange">
            
            <!-- Previews -->
             <div v-if="selectedFiles.length > 0" class="mt-4 flex flex-wrap gap-2">
               <div v-for="(file, idx) in selectedFiles" :key="idx" class="flex items-center gap-2 px-3 py-1.5 bg-ink-50 border border-ink-200 rounded-lg text-xs font-medium text-ink-700">
                 <span class="truncate max-w-[200px]">{{ file.name }}</span>
                 <button type="button" @click="removeImage(idx)" class="text-red-500 hover:text-red-600 p-0.5 hover:bg-red-50 rounded">
                   <X class="w-3 h-3" />
                 </button>
               </div>
             </div>
          </div>
          
          <div class="flex justify-end gap-3 pt-6 border-t border-ink-100">
            <button type="button" @click="isCreating = false" class="px-5 py-2.5 bg-red-400 hover:bg-red-500 text-white font-bold rounded-lg text-sm transition-colors shadow-sm">Batal</button>
            <button type="submit" :disabled="isSubmitting" class="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 shadow-sm">
              <span class="flex items-center gap-2">
                <Send class="w-4 h-4" />
                {{ isSubmitting ? 'Mengirim...' : 'Kirim Tiket' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </template>

  </div>
</template>

<script setup lang="ts">
import { Ticket, X, Image, Search, ArrowLeft, Paperclip, Send, MessageCircle, Eye } from 'lucide-vue-next'


definePageMeta({ layout: 'dashboard' })

const toast = useToast()
const supabase = useSupabaseClient()

const { data: tickets, pending, refresh } = useAsyncData('user-tickets', async () => {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching tickets:', error)
    return { data: [] }
  }
  return { data }
})

const isCreating = ref(false)
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
      (t.description && t.description.toLowerCase().includes(q))
    )
  }
  
  return result
})

const isSubmitting = ref(false)
const customCategory = ref('')
const form = ref({
  category: 'top_up',
  priority: 'normal',
  subject: '',
  description: ''
})

// Logika Upload Gambar
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const previewUrls = ref<string[]>([])

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files) return

  const files = Array.from(target.files)
  
  // Validasi max file size 5MB
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      toast.addToast(`File ${file.name} terlalu besar (Max 5MB)`, 'error')
      continue
    }
    selectedFiles.value.push(file)
    previewUrls.value.push(URL.createObjectURL(file))
  }
  
  if (target) target.value = '' // Reset input
}

const removeImage = (index: number) => {
  selectedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
}



const submitTicket = async () => {
  // Cegah pengiriman jika pesan kosong atau hanya tag HTML kosong
  const rawText = form.value.description.replace(/<[^>]*>?/gm, '').trim()
  if (!rawText && !selectedFiles.value.length) {
    toast.addToast('Pesan tidak boleh kosong', 'error')
    return
  }

  isSubmitting.value = true
  try {
    let attachmentUrls: string[] = []

    // Upload files jika ada
    if (selectedFiles.value.length > 0) {
      toast.addToast('Mengunggah lampiran...', 'info')
      for (const file of selectedFiles.value) {
        const ext = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
        
        const { data, error } = await supabase.storage.from('support_attachments').upload(fileName, file)
        
        if (!error && data) {
          const { data: publicData } = supabase.storage.from('support_attachments').getPublicUrl(data.path)
          attachmentUrls.push(publicData.publicUrl)
        }
      }
    }

    const payload: any = { ...form.value, attachments: attachmentUrls }
    // Apabila opsi lainnya dipilih, kita selipkan nama kategori custom-nya di depan Subjek
    if (payload.category === 'other' && customCategory.value) {
      payload.subject = `[${customCategory.value}] ${payload.subject}`
    }

    const res = await $fetch('/api/support/tickets', {
      method: 'POST',
      body: payload
    })
    
    toast.addToast('Tiket bantuan berhasil dikirim.', 'success')
    isCreating.value = false
    
    // Reset Form
    form.value = { category: 'top_up', priority: 'normal', subject: '', description: '' }
    customCategory.value = ''
    selectedFiles.value = []
    previewUrls.value = []
    
    refresh()
  } catch (error: any) {
    toast.addToast(error.statusMessage || 'Gagal mengirim tiket', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style>
/* Kustomisasi agar Quill Editor menyatu dengan desain */
.ql-toolbar.ql-snow {
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
  border-color: #E5E7EB; /* border-ink-200 */
  background-color: #F9FAFB; /* bg-ink-50 */
  padding: 12px;
}
.ql-container.ql-snow {
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  border-color: #E5E7EB; /* border-ink-200 */
  font-family: inherit;
  font-size: 0.875rem; /* text-sm */
}
.ql-editor {
  min-height: 200px;
}
.ql-editor.ql-blank::before {
  font-style: normal;
  color: #9CA3AF; /* text-ink-400 */
}
</style>
