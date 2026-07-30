<template>
  <div class="space-y-6 pb-20">
    <!-- Header Tiket -->
    <div class="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm shadow-ink-900/5 relative overflow-hidden">
      <!-- Decorative left border -->
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-2">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-ink-900">{{ ticket?.subject || 'Memuat tiket...' }}</h1>
            <span v-if="ticket" :class="getStatusOutlineClass(ticket.status)">
              {{ getStatusLabel(ticket.status).toUpperCase() }}
            </span>
            <span v-if="ticket" :class="getPriorityClass(ticket.priority || 'normal')">
              {{ (ticket.priority || 'NORMAL').toUpperCase() }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-sm text-ink-500 font-medium">
            <div class="flex items-center gap-1.5">
              <Building2 class="w-4 h-4" />
              Departemen: {{ getCategoryLabel(ticket?.category || '') }}
            </div>
            <span class="w-1 h-1 bg-ink-300 rounded-full"></span>
            <div class="font-bold text-ink-700">#{{ ticket?.ticket_number }}</div>
            <span class="w-1 h-1 bg-ink-300 rounded-full"></span>
            <div class="flex items-center gap-1.5">
              <Calendar class="w-4 h-4" />
              {{ formatDate(ticket?.created_at) }}
            </div>
            <span class="w-1 h-1 bg-ink-300 rounded-full"></span>
            <div>{{ formatRelativeTime(ticket?.created_at) }}</div>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <NuxtLink to="/admin/support" class="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-sm font-bold transition-colors">
            <ArrowLeft class="w-4 h-4" />
            Kembali
          </NuxtLink>
          <!-- Admin doesn't have the close ticket button -->
        </div>
      </div>
    </div>

    <!-- Detail Tiket -->
    <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm shadow-ink-900/5">
      <div class="px-6 py-4 border-b border-ink-100 flex items-center gap-2">
        <Info class="w-5 h-5 text-ink-400" />
        <h3 class="font-bold text-ink-900">Detail Klien & Tiket</h3>
      </div>
      <div class="p-6 bg-ink-50/30 flex gap-12">
        <div class="max-w-xs">
          <p class="text-xs font-bold text-ink-500 mb-1 uppercase tracking-wider">KLIEN</p>
          <p class="font-semibold text-ink-900">{{ ticket?.users?.full_name || 'Tanpa Nama' }}</p>
          <p class="text-sm text-ink-500">{{ ticket?.users?.email || '-' }}</p>
        </div>
        <div class="max-w-xs">
          <p class="text-xs font-bold text-ink-500 mb-1 uppercase tracking-wider">DEPARTEMEN</p>
          <p class="font-semibold text-ink-900">{{ getCategoryLabel(ticket?.category || '') }}</p>
        </div>
      </div>
    </div>

    <!-- Percakapan -->
    <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm shadow-ink-900/5 relative">
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>

      <div class="px-6 py-4 border-b border-ink-100 flex items-center justify-between pl-8">
        <div class="flex items-center gap-2">
          <MessageSquare class="w-5 h-5 text-ink-400" />
          <h3 class="font-bold text-ink-900">Percakapan</h3>
        </div>
        <div class="flex items-center gap-4 text-sm text-ink-500 font-medium">
          <span>1 - {{ replies.length + 1 }} dari {{ replies.length + 1 }}</span>
          <div class="flex items-center gap-1">
            <button class="p-1 rounded-lg border border-ink-200 text-ink-400 hover:bg-ink-50 disabled:opacity-50"><ChevronLeft class="w-4 h-4"/></button>
            <button class="p-1 rounded-lg border border-ink-200 text-ink-400 hover:bg-ink-50 disabled:opacity-50"><ChevronRight class="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Original Ticket Description (Client) -->
        <div class="flex gap-4">
          <div class="w-10 h-10 shrink-0 bg-ink-100 text-ink-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ ticket?.users?.full_name?.substring(0, 2).toUpperCase() || 'KL' }}
          </div>
          <div class="flex-1">
            <div class="bg-white border border-ink-200 rounded-2xl p-5 shadow-sm relative">
              <div class="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-t border-ink-200 transform -rotate-45"></div>
              
              <div class="flex justify-between items-center mb-4 text-sm">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-ink-100 text-ink-600 text-[10px] font-extrabold rounded-md uppercase tracking-wider">CLIENT</span>
                  <span class="font-bold text-ink-900">{{ ticket?.users?.full_name || 'Klien' }}</span>
                </div>
                <span class="text-ink-400 font-medium">{{ formatDate(ticket?.created_at) }}</span>
              </div>
              <div class="prose prose-sm max-w-none text-ink-700" v-html="ticket?.description"></div>
              
              <!-- Lampiran Tiket -->
              <div v-if="ticket?.attachments && ticket.attachments.length > 0" class="mt-4 pt-4 border-t border-ink-100">
                <h4 class="text-xs font-bold text-ink-500 mb-2 uppercase tracking-wider">Lampiran</h4>
                <div class="flex flex-wrap gap-3">
                  <a v-for="(url, idx) in ticket.attachments" :key="idx" :href="url" target="_blank" class="block group">
                    <img v-if="url.match(/\.(jpeg|jpg|gif|png|webp)/i) || url.includes('image')" :src="url" alt="Lampiran Tiket" class="w-24 h-24 object-cover rounded-xl border border-ink-200 group-hover:border-orange-500 transition-colors shadow-sm" />
                    <div v-else class="w-24 h-24 bg-ink-50 flex flex-col items-center justify-center rounded-xl border border-ink-200 group-hover:border-orange-500 transition-colors shadow-sm text-ink-500 group-hover:text-orange-500">
                      <Paperclip class="w-6 h-6 mb-1" />
                      <span class="text-[10px] font-medium text-center px-2 truncate w-full">File {{ Number(idx) + 1 }}</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div class="mt-2 text-xs text-ink-400 font-medium pl-2">{{ formatRelativeTime(ticket?.created_at) }}</div>
          </div>
        </div>

        <!-- Mocked Replies -->
        <div v-for="reply in replies" :key="reply.id" class="flex gap-4" :class="reply.is_staff ? 'flex-row-reverse' : ''">
          <div v-if="reply.is_staff" class="w-10 h-10 shrink-0 bg-orange-100 text-orange-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ reply.sender_name?.substring(0, 2).toUpperCase() || 'AD' }}
          </div>
          <div v-else class="w-10 h-10 shrink-0 bg-ink-100 text-ink-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ ticket?.users?.full_name?.substring(0, 2).toUpperCase() || 'KL' }}
          </div>

          <div class="flex-1" :class="reply.is_staff ? 'flex flex-col items-end' : ''">
            <div :class="[
              'rounded-2xl p-5 shadow-sm relative w-full',
              reply.is_staff ? 'bg-orange-50/50 border border-orange-100' : 'bg-white border border-ink-200'
            ]">
              <div v-if="reply.is_staff" class="absolute -right-2 top-4 w-4 h-4 bg-orange-50/50 border-r border-t border-orange-100 transform rotate-45"></div>
              <div v-else class="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-t border-ink-200 transform -rotate-45"></div>
              
              <div class="flex justify-between items-center mb-4 text-sm" :class="reply.is_staff ? 'flex-row-reverse' : ''">
                <div class="flex items-center gap-2">
                  <span v-if="reply.is_staff" class="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-extrabold rounded-md uppercase tracking-wider">SUPPORT</span>
                  <span class="font-bold text-ink-900">{{ reply.sender_name }}</span>
                </div>
                <span class="text-ink-400 font-medium">{{ formatDate(reply.created_at) }}</span>
              </div>
              
              <div class="prose prose-sm max-w-none text-ink-700" v-html="reply.content"></div>
              
              <!-- Lampiran Balasan -->
              <div v-if="reply.attachments && reply.attachments.length > 0" class="mt-4 pt-4 border-t border-ink-100" :class="reply.is_staff ? 'text-right' : 'text-left'">
                <h4 class="text-xs font-bold text-ink-500 mb-2 uppercase tracking-wider">Lampiran</h4>
                <div class="flex flex-wrap gap-3" :class="reply.is_staff ? 'justify-end' : 'justify-start'">
                  <a v-for="(url, idx) in reply.attachments" :key="idx" :href="url" target="_blank" class="block group">
                    <img v-if="url.match(/\.(jpeg|jpg|gif|png|webp)/i) || url.includes('image')" :src="url" alt="Lampiran Balasan" class="w-24 h-24 object-cover rounded-xl border border-ink-200 group-hover:border-orange-500 transition-colors shadow-sm" />
                    <div v-else class="w-24 h-24 bg-ink-50 flex flex-col items-center justify-center rounded-xl border border-ink-200 group-hover:border-orange-500 transition-colors shadow-sm text-ink-500 group-hover:text-orange-500">
                      <Paperclip class="w-6 h-6 mb-1" />
                      <span class="text-[10px] font-medium text-center px-2 truncate w-full">File {{ Number(idx) + 1 }}</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div class="mt-2 text-xs text-ink-400 font-medium" :class="reply.is_staff ? 'pr-2' : 'pl-2'">
              {{ formatRelativeTime(reply.created_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Balasan Admin -->
    <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm shadow-ink-900/5 relative">
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500 z-10"></div>
      
      <div class="px-6 py-4 border-b border-ink-100 flex items-center justify-between pl-8">
        <div class="flex items-center gap-2">
          <CornerDownRight class="w-5 h-5 text-ink-400" />
          <h3 class="font-bold text-ink-900">Balas Klien</h3>
        </div>
        
        <!-- Status Ubah via Reply -->
        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">Ubah Status:</span>
          <select 
            v-model="replyStatus"
            @change="updateStatus(($event.target as HTMLSelectElement).value)"
            class="px-3 py-1.5 bg-ink-50 border border-ink-200 text-ink-700 text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            <option value="open">Terbuka</option>
            <option value="in_progress">In Progress</option>
            <option value="answered">Dijawab</option>
            <option value="pending">Ditunda</option>
            <option value="closed">Ditutup</option>
          </select>
        </div>
      </div>
      
      <div class="p-6 pl-8">
        <!-- Template Buttons -->
        <div class="mb-4 flex gap-2">
          <button @click="applyTemplate('selesai')" class="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-bold transition-colors border border-green-200 flex items-center gap-1.5">
            <CheckCircle class="w-3.5 h-3.5" />
            Template Selesai
          </button>
          <button @click="applyTemplate('kurang_info')" class="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold transition-colors border border-yellow-200 flex items-center gap-1.5">
            <AlertCircle class="w-3.5 h-3.5" />
            Template Kurang Info
          </button>
          <button @click="applyTemplate('kosong')" class="px-3 py-1.5 bg-ink-50 hover:bg-ink-100 text-ink-600 rounded-lg text-xs font-bold transition-colors border border-ink-200">
            Teks Kosong + Signature
          </button>
        </div>

        <div class="mb-4">
          <ClientOnly>
            <QuillEditor
              :key="editorKey"
              v-model:content="replyContent"
              contentType="html"
              theme="snow"
              toolbar="minimal"
              placeholder="Ketik pesan balasan Anda di sini..."
              class="min-h-[200px] bg-white rounded-xl border-ink-200 [&>.ql-toolbar]:rounded-t-xl [&>.ql-container]:rounded-b-xl focus-within:[&>.ql-container]:border-orange-500"
            />
          </ClientOnly>
        </div>
        
        
        <div class="flex flex-col gap-4">
          <!-- Preview Lampiran -->
          <div v-if="attachments.length > 0" class="flex flex-wrap gap-2">
            <div v-for="(file, index) in attachments" :key="index" class="flex items-center gap-2 bg-ink-50 px-3 py-1.5 rounded-lg border border-ink-200">
              <span class="text-xs text-ink-600 truncate max-w-[150px]">{{ file.name }}</span>
              <button @click="removeAttachment(index)" class="text-ink-400 hover:text-red-500">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="flex justify-between items-center">
            <input type="file" ref="fileInputRef" multiple class="hidden" @change="handleFileChange" accept="image/*,.pdf,.doc,.docx" />
            <button @click="fileInputRef?.click()" type="button" class="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-sm font-bold transition-colors">
              <Paperclip class="w-4 h-4" />
              Lampirkan File
            </button>
            <button @click="submitReply" :disabled="isSubmitting" class="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Send v-else class="w-4 h-4" />
              {{ isSubmitting ? 'Mengirim...' : 'Kirim balasan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { 
  Building2, 
  Calendar, 
  ArrowLeft, 
  Info, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  CornerDownRight,
  Paperclip,
  Send,
  CheckCircle,
  AlertCircle,
  X,
  Loader2
} from 'lucide-vue-next'


definePageMeta({ layout: 'admin' })

const route = useRoute()
const supabase = useSupabaseClient()
const { user } = useAuth()
const toast = useToast()

const ticketId = route.params.id

// Fetch ticket data with user relation
const { data: ticket, pending, refresh } = useFetch<any>(`/api/admin/tickets/${ticketId}`, {
  transform: (res) => res.data
})

// Refs
const replyContent = ref('')
const editorKey = ref(0)
const replyStatus = ref('answered')
const isSubmitting = ref(false)

// Actual Replies from API
const replies = computed(() => ticket.value?.replies || [])
watch(() => ticket.value, (newVal) => {
  if (newVal && newVal.status) {
    replyStatus.value = newVal.status
  }
}, { immediate: true })

const attachments = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    const files = Array.from(input.files)
    // Validasi ukuran max 5MB per file
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024)
    if (validFiles.length < files.length) {
      toast.addToast('Beberapa file diabaikan karena melebihi batas 5MB', 'error')
    }
    attachments.value.push(...validFiles)
  }
  // Reset input value to allow selecting the same file again
  if (input) input.value = ''
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}

const updateStatus = async (status: string) => {
  if (!confirm(`Yakin ingin mengubah status tiket menjadi ${status.toUpperCase()}?`)) return
  
  try {
    const { csrf } = useCsrf()
    const csrfToken = unref(csrf)
    await $fetch('/api/admin/tickets', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: { ticket_id: ticketId, status }
    })
    toast.addToast('Status tiket diperbarui', 'success')
    if (ticket.value) {
      ticket.value.status = status
    }
  } catch (err: any) {
    toast.addToast(err.statusMessage || 'Terjadi kesalahan', 'error')
  }
}

const submitReply = async () => {
  const rawText = replyContent.value.replace(/<[^>]*>?/gm, '').trim()
  if (!rawText) {
    toast.addToast('Pesan balasan tidak boleh kosong', 'error')
    return
  }

  isSubmitting.value = true
  try {
    const uploadedUrls: string[] = []
    
    // Upload files if any
    if (attachments.value.length > 0) {
      for (const file of attachments.value) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('support_attachments')
          .upload(fileName, file)
        
        if (uploadError) {
          toast.addToast(`Gagal upload file ${file.name}`, 'error')
          console.error('Upload Error:', uploadError)
          continue
        }
        
        if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('support_attachments')
            .getPublicUrl(data.path)
            
          uploadedUrls.push(publicUrl)
        }
      }
    }

    const { csrf } = useCsrf()
    const csrfToken = unref(csrf)
    await $fetch('/api/admin/replies', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: { 
        ticket_id: ticketId, 
        content: replyContent.value,
        status: replyStatus.value,
        attachments: uploadedUrls
      }
    })
    
    toast.addToast('Balasan berhasil dikirim', 'success')
    replyContent.value = ''
    attachments.value = []
    editorKey.value++
    if (ticket.value) ticket.value.status = replyStatus.value
    refresh()
  } catch (err: any) {
    toast.addToast(err.statusMessage || 'Gagal mengirim balasan', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Helpers
const adminName = computed(() => user.value?.user_metadata?.full_name || 'Admin Support')

const getSignature = () => {
  return `
<p><br></p>
<p>--</p>
<p>Regards.</p>
<p><strong>${adminName.value}</strong></p>
<p><br></p>
<p>PT Media Pro Indonesia</p>
<p>Tentaklik Admin Support</p>
`
}

const applyTemplate = (type: string) => {
  let text = ''
  
  if (type === 'selesai') {
    replyStatus.value = 'answered'
    text = `<p>Halo,</p>
<p>Keluhan Anda telah kami proses dan kendala tersebut sudah terselesaikan dengan baik. Silakan cek kembali sistem Anda.</p>
<p>Terima kasih atas laporannya.</p>`
  } else if (type === 'kurang_info') {
    replyStatus.value = 'pending'
    text = `<p>Halo,</p>
<p>Kami kesulitan memproses laporan Anda karena informasi yang diberikan kurang lengkap. Mohon lampirkan *screenshot* terkait masalah atau sertakan detail akun/ID transaksi yang bermasalah.</p>
<p>Kami tunggu informasinya.</p>`
  } else {
    text = `<p>Halo,</p><p><br></p>`
  }

  replyContent.value = text + getSignature()
}


</script>
