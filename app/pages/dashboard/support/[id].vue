<template>
  <div class="space-y-6 pb-20">
    <!-- Header Tiket -->
    <div class="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm shadow-ink-900/5 relative overflow-hidden">
      <!-- Decorative left border -->
      <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-2">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-ink-900">{{ ticketData?.subject || $t('support.loadingTicket') }}</h1>
            <span v-if="ticketData" :class="getStatusOutlineClass(ticketData.status)">
              {{ $t(`support.status.${ticketData.status}`).toUpperCase() }}
            </span>
            <span v-if="ticketData" :class="getPriorityClass(ticketData.priority || 'normal')">
              {{ (ticketData.priority || 'NORMAL').toUpperCase() }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-3 text-sm text-ink-500 font-medium">
            <div class="flex items-center gap-1.5">
              <Building2 class="w-4 h-4" />
              {{ $t('support.department') }}: {{ $t(`support.categoryShort.${ticketData?.category || 'other'}`) }}
            </div>
            <span class="w-1 h-1 bg-ink-300 rounded-full"></span>
            <div class="font-bold text-ink-700">#{{ ticketData?.ticket_number }}</div>
            <span class="w-1 h-1 bg-ink-300 rounded-full"></span>
            <div class="flex items-center gap-1.5">
              <Calendar class="w-4 h-4" />
              {{ formatDate(ticketData?.created_at, locale) }}
            </div>
            <span class="w-1 h-1 bg-ink-300 rounded-full"></span>
            <div>{{ formatRelativeTime(ticketData?.created_at, locale) }}</div>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <NuxtLink to="/dashboard/support" class="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-sm font-bold transition-colors">
            <ArrowLeft class="w-4 h-4" />
            {{ $t('support.back') }}
          </NuxtLink>
          <button @click="closeTicket" class="inline-flex items-center gap-2 px-5 py-2.5 bg-red-400 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Lock class="w-4 h-4" />
            {{ $t('support.closeTicket') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Tiket -->
    <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm shadow-ink-900/5">
      <div class="px-6 py-4 border-b border-ink-100 flex items-center gap-2">
        <Info class="w-5 h-5 text-ink-400" />
        <h3 class="font-bold text-ink-900">{{ $t('support.ticketDetail') }}</h3>
      </div>
      <div class="p-6 bg-ink-50/30">
        <div class="max-w-xs">
          <p class="text-xs font-bold text-ink-500 mb-1 uppercase tracking-wider">{{ $t('support.department').toUpperCase() }}</p>
          <p class="font-semibold text-ink-900">{{ $t(`support.categoryShort.${ticketData?.category || 'other'}`) }}</p>
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
          <h3 class="font-bold text-ink-900">{{ $t('support.conversation') }}</h3>
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
        <div class="flex gap-4 flex-row-reverse">
          <div class="w-10 h-10 shrink-0 bg-ink-100 text-ink-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ userInitials }}
          </div>
          <div class="flex-1 flex flex-col items-end">
            <div class="bg-white border border-ink-200 rounded-2xl p-5 shadow-sm relative w-full">
              <!-- Tail -->
              <div class="absolute -right-2 top-4 w-4 h-4 bg-white border-r border-t border-ink-200 transform rotate-45"></div>
              
              <div class="flex justify-between items-center mb-4 text-sm flex-row-reverse">
                <span class="font-bold text-ink-900">{{ userName }}</span>
                <span class="text-ink-400 font-medium">{{ formatDate(ticketData?.created_at, locale) }}</span>
              </div>
              <div class="prose prose-sm max-w-none text-ink-700" v-html="ticketData?.description"></div>
              
              <!-- Lampiran Tiket -->
              <div v-if="ticketData?.attachments && ticketData.attachments.length > 0" class="mt-4 pt-4 border-t border-ink-100">
                <h4 class="text-xs font-bold text-ink-500 mb-2 uppercase tracking-wider text-right">{{ $t('support.attachment') }}</h4>
                <div class="flex flex-wrap gap-3 justify-end">
                  <a v-for="(url, idx) in ticketData.attachments" :key="idx" :href="url" target="_blank" class="block group">
                    <img v-if="url.match(/\.(jpeg|jpg|gif|png|webp)/i) || url.includes('image')" :src="url" alt="Lampiran Tiket" class="w-24 h-24 object-cover rounded-xl border border-ink-200 group-hover:border-blue-500 transition-colors shadow-sm" />
                    <div v-else class="w-24 h-24 bg-ink-50 flex flex-col items-center justify-center rounded-xl border border-ink-200 group-hover:border-blue-500 transition-colors shadow-sm text-ink-500 group-hover:text-blue-500">
                      <Paperclip class="w-6 h-6 mb-1" />
                      <span class="text-[10px] font-medium text-center px-2 truncate w-full">File {{ Number(idx) + 1 }}</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div class="mt-2 text-xs text-ink-400 font-medium pr-2">{{ formatRelativeTime(ticketData?.created_at, locale) }}</div>
          </div>
        </div>

        <!-- Mocked Replies -->
        <div v-for="reply in replies" :key="reply.id" class="flex gap-4" :class="!reply.is_staff ? 'flex-row-reverse' : ''">
          <div v-if="reply.is_staff" class="w-10 h-10 shrink-0 bg-blue-100 text-blue-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ reply.sender_name?.substring(0, 2).toUpperCase() || 'AD' }}
          </div>
          <div v-else class="w-10 h-10 shrink-0 bg-ink-100 text-ink-600 font-bold flex items-center justify-center rounded-full text-sm">
            {{ userInitials }}
          </div>

          <div class="flex-1" :class="!reply.is_staff ? 'flex flex-col items-end' : ''">
            <div :class="[
              'rounded-2xl p-5 shadow-sm relative w-full',
              !reply.is_staff ? 'bg-white border border-ink-200' : 'bg-blue-50/50 border border-blue-100'
            ]">
              <!-- Tail -->
              <div v-if="reply.is_staff" class="absolute -left-2 top-4 w-4 h-4 bg-blue-50/50 border-l border-t border-blue-100 transform -rotate-45"></div>
              <div v-else class="absolute -right-2 top-4 w-4 h-4 bg-white border-r border-t border-ink-200 transform rotate-45"></div>
              
              <div class="flex justify-between items-center mb-4 text-sm" :class="!reply.is_staff ? 'flex-row-reverse' : ''">
                <div class="flex items-center gap-2">
                  <span v-if="reply.is_staff" class="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-extrabold rounded-md uppercase tracking-wider">SUPPORT</span>
                  <span class="font-bold text-ink-900">{{ reply.is_staff ? reply.sender_name : userName }}</span>
                </div>
                <span class="text-ink-400 font-medium">{{ formatDate(reply.created_at, locale) }}</span>
              </div>
              
              <div class="prose prose-sm max-w-none text-ink-700" v-html="reply.content"></div>
              
              <!-- Lampiran Balasan -->
              <div v-if="reply.attachments && reply.attachments.length > 0" class="mt-4 pt-4 border-t border-ink-100" :class="!reply.is_staff ? 'text-right' : 'text-left'">
                <h4 class="text-xs font-bold text-ink-500 mb-2 uppercase tracking-wider">{{ $t('support.attachment') }}</h4>
                <div class="flex flex-wrap gap-3" :class="!reply.is_staff ? 'justify-end' : 'justify-start'">
                  <a v-for="(url, idx) in reply.attachments" :key="idx" :href="url" target="_blank" class="block group">
                    <img v-if="url.match(/\.(jpeg|jpg|gif|png|webp)/i) || url.includes('image')" :src="url" alt="Lampiran Balasan" class="w-24 h-24 object-cover rounded-xl border border-ink-200 group-hover:border-blue-500 transition-colors shadow-sm" />
                    <div v-else class="w-24 h-24 bg-ink-50 flex flex-col items-center justify-center rounded-xl border border-ink-200 group-hover:border-blue-500 transition-colors shadow-sm text-ink-500 group-hover:text-blue-500">
                      <Paperclip class="w-6 h-6 mb-1" />
                      <span class="text-[10px] font-medium text-center px-2 truncate w-full">File {{ Number(idx) + 1 }}</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div class="mt-2 text-xs text-ink-400 font-medium" :class="!reply.is_staff ? 'pr-2' : 'pl-2'">
              {{ formatRelativeTime(reply.created_at, locale) }}
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
        <h3 class="font-bold text-ink-900">{{ $t('support.reply') }}</h3>
      </div>
      
      <div class="p-6 pl-8">
        <div class="mb-4">
          <ClientOnly>
            <QuillEditor
              :key="editorKey"
              v-model:content="replyContent"
              contentType="html"
              theme="snow"
              toolbar="minimal"
              placeholder="Ketik pesan balasan Anda di sini..."
              class="min-h-[150px] bg-white rounded-xl border-ink-200 [&>.ql-toolbar]:rounded-t-xl [&>.ql-container]:rounded-b-xl focus-within:[&>.ql-container]:border-orange-500"
            />
          </ClientOnly>
        </div>
        
        <div v-if="selectedFiles.length > 0" class="mb-4 flex flex-wrap gap-2">
          <div v-for="(file, idx) in selectedFiles" :key="idx" class="flex items-center gap-2 px-3 py-1.5 bg-ink-50 border border-ink-200 rounded-lg text-xs font-medium text-ink-700">
            <span class="truncate max-w-[200px]">{{ file.name }}</span>
            <button type="button" @click="removeImage(idx)" class="text-red-500 hover:text-red-600 p-0.5 hover:bg-red-50 rounded">
              <X class="w-3 h-3" />
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <input ref="fileInput" type="file" multiple accept="image/*,.pdf" class="hidden" @change="handleFileChange">
          <button @click="triggerFileInput" type="button" class="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Paperclip class="w-4 h-4" />
            {{ $t('support.addAttachment') }}
          </button>
          <button @click="sendReply" :disabled="isSubmitting" class="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50">
            <Send class="w-4 h-4" />
            {{ isSubmitting ? $t('support.sending') : $t('support.sendReply') }}
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
  Send,
  X
} from 'lucide-vue-next'


definePageMeta({ layout: 'dashboard' })

const { t, locale } = useI18n()
const route = useRoute()
const supabase = useSupabaseClient()
const { user } = useAuth()
const { csrf } = useCsrf()

const ticketId = route.params.id

// Fetch ticket data
const { data: ticketResponse, pending, refresh } = useFetch<any>(`/api/support/tickets/${ticketId}`)

const ticketData = computed(() => ticketResponse.value?.data)
const replies = computed(() => ticketData.value?.replies || [])

const replyContent = ref('')
const editorKey = ref(0)
const isSubmitting = ref(false)
const toast = useToast()

// Helpers
const userName = computed(() => user.value?.user_metadata?.full_name || user.value?.email || 'Klien')
const userInitials = computed(() => {
  const name = userName.value
  return name.substring(0, 2).toUpperCase()
})

const closeTicket = async () => {
  try {
    await $fetch(`/api/support/tickets/${ticketId}/close`, { 
      method: 'POST',
      headers: { 'csrf-token': csrf }
    })
    toast.addToast(t('support.toast.ticketClosed'), 'success')
    refresh()
  } catch (error: any) {
    toast.addToast(error.statusMessage || t('support.toast.closeFailed'), 'error')
  }
}

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
  
  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      toast.addToast(t('support.toast.fileTooLarge', { name: file.name }), 'error')
      continue
    }
    selectedFiles.value.push(file)
    previewUrls.value.push(URL.createObjectURL(file))
  }
  
  if (target) target.value = ''
}

const removeImage = (index: number) => {
  selectedFiles.value.splice(index, 1)
  previewUrls.value.splice(index, 1)
}

const sendReply = async () => {
  const rawText = replyContent.value.replace(/<[^>]*>?/gm, '').trim()
  if (!rawText && !selectedFiles.value.length) return toast.addToast(t('support.toast.emptyMessage'), 'error')
  
  isSubmitting.value = true
  try {
    let attachmentUrls: string[] = []
    
    if (selectedFiles.value.length > 0) {
      toast.addToast(t('support.toast.uploading'), 'info')
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

    await $fetch(`/api/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'csrf-token': csrf },
      body: { content: replyContent.value, attachments: attachmentUrls }
    })
    
    replyContent.value = ''
    editorKey.value++
    selectedFiles.value = []
    previewUrls.value = []
    toast.addToast(t('support.toast.replySent'), 'success')
    refresh()
  } catch (error: any) {
    toast.addToast(error.statusMessage || t('support.toast.replyFailed'), 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
