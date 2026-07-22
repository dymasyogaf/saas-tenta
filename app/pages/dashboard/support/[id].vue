<template>
  <div class="space-y-6 pb-20">
    <!-- Header Tiket -->
    <div class="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm shadow-ink-900/5 relative overflow-hidden">
      <!-- Decorative left border -->
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
      
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
          <NuxtLink to="/dashboard/support" class="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-sm font-bold transition-colors">
            <ArrowLeft class="w-4 h-4" />
            Kembali
          </NuxtLink>
          <button class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-400 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Lock class="w-4 h-4" />
            Tutup Tiket
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Tiket -->
    <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm shadow-ink-900/5">
      <div class="px-6 py-4 border-b border-ink-100 flex items-center gap-2">
        <Info class="w-5 h-5 text-ink-400" />
        <h3 class="font-bold text-ink-900">Detail Tiket</h3>
      </div>
      <div class="p-6 bg-ink-50/30">
        <div class="max-w-xs">
          <p class="text-xs font-bold text-ink-500 mb-1 uppercase tracking-wider">DEPARTEMEN</p>
          <p class="font-semibold text-ink-900">{{ getCategoryLabel(ticket?.category || '') }}</p>
        </div>
      </div>
    </div>

    <!-- Percakapan -->
    <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm shadow-ink-900/5 relative">
      <!-- Decorative left border -->
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>

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
          <div class="w-10 h-10 shrink-0 bg-blue-100 text-blue-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ userInitials }}
          </div>
          <div class="flex-1">
            <div class="bg-white border border-ink-200 rounded-2xl p-5 shadow-sm relative">
              <!-- Tail -->
              <div class="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-t border-ink-200 transform -rotate-45"></div>
              
              <div class="flex justify-between items-center mb-4 text-sm">
                <span class="font-bold text-ink-900">{{ userName }}</span>
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
            <img src="https://ui-avatars.com/api/?name=Tim+Support&background=0D8ABC&color=fff" alt="Support" class="w-full h-full object-cover"/>
          </div>
          <div v-else class="w-10 h-10 shrink-0 bg-blue-100 text-blue-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ userInitials }}
          </div>

          <div class="flex-1" :class="reply.is_staff ? 'flex flex-col items-end' : ''">
            <div :class="[
              'rounded-2xl p-5 shadow-sm relative w-full',
              reply.is_staff ? 'bg-blue-50/50 border border-blue-100' : 'bg-white border border-ink-200'
            ]">
              <!-- Tail -->
              <div v-if="reply.is_staff" class="absolute -right-2 top-4 w-4 h-4 bg-blue-50/50 border-r border-t border-blue-100 transform 45deg rotate-45"></div>
              <div v-else class="absolute -left-2 top-4 w-4 h-4 bg-white border-l border-t border-ink-200 transform -rotate-45"></div>
              
              <div class="flex justify-between items-center mb-4 text-sm" :class="reply.is_staff ? 'flex-row-reverse' : ''">
                <div class="flex items-center gap-2">
                  <span v-if="reply.is_staff" class="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-extrabold rounded-md uppercase tracking-wider">SUPPORT</span>
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

    <!-- Form Balasan -->
    <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm shadow-ink-900/5 relative">
      <!-- Decorative left border -->
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 z-10"></div>
      
      <div class="px-6 py-4 border-b border-ink-100 flex items-center gap-2 pl-8">
        <CornerDownRight class="w-5 h-5 text-ink-400" />
        <h3 class="font-bold text-ink-900">Balas</h3>
      </div>
      
      <div class="p-6 pl-8">
        <div class="mb-4">
          <ClientOnly>
            <QuillEditor
              v-model:content="replyContent"
              contentType="html"
              theme="snow"
              toolbar="minimal"
              placeholder="Ketik pesan balasan Anda di sini..."
              class="min-h-[150px] bg-white rounded-xl border-ink-200 [&>.ql-toolbar]:rounded-t-xl [&>.ql-container]:rounded-b-xl focus-within:[&>.ql-container]:border-orange-500"
            />
          </ClientOnly>
        </div>
        
        <div class="flex justify-between items-center">
          <button class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-400 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Paperclip class="w-4 h-4" />
            Tambah Lampiran
          </button>
          <button class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-400 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Send class="w-4 h-4" />
            Kirim Balasan
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
  Lock, 
  Info, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  CornerDownRight,
  Paperclip,
  Send
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const supabase = useSupabaseClient()
const { user } = useAuth()

const ticketId = route.params.id

// Fetch ticket data
const { data: ticket, pending } = useFetch<any>(`/api/support/tickets/${ticketId}`)

// Mocked Replies for Frontend Design purpose
const replies = ref([
  {
    id: 1,
    is_staff: true,
    sender_name: 'Kang Ivan',
    content: '<p>Selamat siang,</p><p>Invoicenya sudah terbit, silahkan di cek di Billing <strong>INV-6TMAH2</strong>, jika login sebagai Team pastikan permission nya sudah di allow untuk billing.</p><p><br></p><p>--</p><p>Regards.</p>',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  }
])

const replyContent = ref('')

// Helpers
const userName = computed(() => user.value?.user_metadata?.full_name || user.value?.email || 'Klien')
const userInitials = computed(() => {
  const name = userName.value
  return name.substring(0, 2).toUpperCase()
})


</script>
