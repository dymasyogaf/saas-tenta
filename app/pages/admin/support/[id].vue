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
            </div>
            <div class="mt-2 text-xs text-ink-400 font-medium pl-2">{{ formatRelativeTime(ticket?.created_at) }}</div>
          </div>
        </div>

        <!-- Mocked Replies -->
        <div v-for="reply in replies" :key="reply.id" class="flex gap-4" :class="reply.is_staff ? 'flex-row-reverse' : ''">
          <div v-if="reply.is_staff" class="w-10 h-10 shrink-0 overflow-hidden rounded-full">
            <img src="https://ui-avatars.com/api/?name=Admin+Support&background=f97316&color=fff" alt="Support" class="w-full h-full object-cover"/>
          </div>
          <div v-else class="w-10 h-10 shrink-0 bg-ink-100 text-ink-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ ticket?.users?.full_name?.substring(0, 2).toUpperCase() || 'KL' }}
          </div>

          <div class="flex-1" :class="reply.is_staff ? 'flex flex-col items-end' : ''">
            <div :class="[
              'rounded-2xl p-5 shadow-sm relative w-full',
              reply.is_staff ? 'bg-orange-50/50 border border-orange-100' : 'bg-white border border-ink-200'
            ]">
              <div v-if="reply.is_staff" class="absolute -right-2 top-4 w-4 h-4 bg-orange-50/50 border-r border-t border-orange-100 transform 45deg rotate-45"></div>
              <div v-else class="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-t border-ink-200 transform -rotate-45"></div>
              
              <div class="flex justify-between items-center mb-4 text-sm" :class="reply.is_staff ? 'flex-row-reverse' : ''">
                <div class="flex items-center gap-2">
                  <span v-if="reply.is_staff" class="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-extrabold rounded-md uppercase tracking-wider">SUPPORT</span>
                  <span class="font-bold text-ink-900">{{ reply.sender_name }}</span>
                </div>
                <span class="text-ink-400 font-medium">{{ formatDate(reply.created_at) }}</span>
              </div>
              
              <div class="prose prose-sm max-w-none text-ink-700" v-html="reply.content" :class="reply.is_staff ? 'text-right' : ''"></div>
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
          <select v-model="replyStatus" class="px-3 py-1.5 bg-ink-50 border border-ink-200 text-ink-700 text-xs font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
            <option value="in_progress">In Progress</option>
            <option value="answered">Dijawab</option>
            <option value="pending">Ditunda</option>
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
              v-model:content="replyContent"
              contentType="html"
              theme="snow"
              toolbar="minimal"
              placeholder="Ketik pesan balasan Anda di sini..."
              class="min-h-[200px] bg-white rounded-xl border-ink-200 [&>.ql-toolbar]:rounded-t-xl [&>.ql-container]:rounded-b-xl focus-within:[&>.ql-container]:border-orange-500"
            />
          </ClientOnly>
        </div>
        
        <div class="flex justify-between items-center">
          <button class="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-sm font-bold transition-colors">
            <Paperclip class="w-4 h-4" />
            Lampirkan File
          </button>
          <button class="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Send class="w-4 h-4" />
            Kirim Balasan & Ubah Status
          </button>
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
  AlertCircle
} from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const supabase = useSupabaseClient()
const { user } = useAuth()

const ticketId = route.params.id

// Fetch ticket data with user relation
const { data: ticket, pending } = useFetch<any>(`/api/admin/tickets/${ticketId}`)

// Mocked Replies for Frontend Design purpose
const replies = ref([
  // Kosong atau bisa ditambah dummy
])

const replyContent = ref('')
const replyStatus = ref('answered')

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
