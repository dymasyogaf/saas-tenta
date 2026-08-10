<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-ink-900 mb-2">{{ $t('dashboard.notifications.title') }}</h2>
        <p class="text-ink-600">{{ $t('dashboard.notifications.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="markAllRead"
          :disabled="notifications.filter(n => !n.is_read).length === 0"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-600 bg-white border border-ink-200 rounded-xl hover:bg-ink-50 hover:text-ink-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <CheckCheck class="w-4 h-4" />
          Baca Semua
        </button>
        <button 
          @click="deleteAll"
          :disabled="notifications.length === 0"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Trash2 class="w-4 h-4" />
          Hapus Semua
        </button>
      </div>
    </div>

    <div class="bg-white border border-ink-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
      <div v-if="loading" class="p-16 flex justify-center items-center h-full">
        <div class="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="notifications.length === 0" class="p-16 flex flex-col items-center justify-center text-center h-full flex-1">
        <div class="w-24 h-24 bg-ink-50 rounded-full flex items-center justify-center text-ink-300 mb-6 relative">
          <Bell class="w-10 h-10" />
          <span class="absolute top-2 right-2 text-ink-400 font-bold text-xs transform rotate-12">zZ</span>
        </div>
        <h3 class="text-lg font-bold text-ink-900 mb-2">{{ $t('dashboard.notifications.emptyTitle') }}</h3>
        <p class="text-ink-500 max-w-sm">{{ $t('dashboard.notifications.emptyDesc') }}</p>
      </div>

      <!-- List Notifikasi -->
      <div v-else class="divide-y divide-ink-100">
        <div 
          v-for="notif in notifications" 
          :key="notif.id"
          @click="viewNotification(notif)"
          class="p-4 sm:p-6 cursor-pointer hover:bg-ink-50 transition-colors relative flex items-start gap-3 sm:gap-4 group"
          :class="{'bg-orange-50/20': !notif.is_read}"
        >
          <div v-if="!notif.is_read" class="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
          
          <div class="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mt-1 transition-colors"
               :class="!notif.is_read ? 'bg-orange-100 text-orange-600' : 'bg-ink-100 text-ink-500 group-hover:text-orange-500 group-hover:bg-orange-50'">
            <Bell class="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1.5">
              <h3 class="font-bold text-base sm:text-lg text-ink-900 group-hover:text-orange-600 transition-colors">{{ notif.title }}</h3>
              <span class="text-[10px] sm:text-xs font-medium text-ink-500 bg-ink-50 px-2 py-0.5 rounded-full w-fit whitespace-nowrap">
                {{ formatDate(notif.created_at) }}
              </span>
            </div>
            
            <p class="text-xs sm:text-sm text-ink-600 line-clamp-2 leading-relaxed">{{ stripHtml(notif.message) }}</p>
          </div>
          
          <button 
            @click.stop="deleteNotif(notif.id)"
            class="shrink-0 p-2 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1 opacity-0 group-hover:opacity-100 sm:opacity-100"
            title="Hapus"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Notification Detail Modal -->
    <Teleport to="body">
<div v-if="selectedNotif" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" @click="selectedNotif = null"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div class="p-5 sm:p-6 border-b border-ink-100 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
              <Bell class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-lg text-ink-900 leading-tight">{{ selectedNotif.title }}</h3>
              <p class="text-xs text-ink-500 mt-0.5">{{ formatDate(selectedNotif.created_at) }}</p>
            </div>
          </div>
          <button @click="selectedNotif = null" class="p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-50 rounded-full transition-colors shrink-0">
            <Plus class="w-6 h-6 rotate-45" />
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 text-sm sm:text-base text-ink-700 prose prose-sm sm:prose-base prose-orange max-w-none leading-relaxed prose-p:my-1.5 prose-ol:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
          <div v-html="selectedNotif.message"></div>
        </div>
        <div class="p-4 sm:p-5 border-t border-ink-100 bg-ink-50 rounded-b-2xl shrink-0 flex justify-end">
          <button @click="selectedNotif = null" class="px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 shadow-sm transition-colors">
            {{ $t('dashboard.notifications.close') }}
          </button>
        </div>
      </div>
    </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell, Plus, Trash2, CheckCheck } from 'lucide-vue-next'
import { stripHtml } from '../../../utils/formatters'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'dashboard'
})

const { user } = useAuth()
const supabase = useSupabaseClient<any>()
const notifications = ref<any[]>([])
const loading = ref(true)
const selectedNotif = ref<any>(null)



const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const fetchNotifications = async () => {
  if (!user.value) return
  
  loading.value = true
  try {
    const userId = user.value.id || (user.value as any).sub
    const data = await $fetch<any[]>('/api/notifications', {
      params: {
        userId: userId,
        _t: Date.now()
      }
    })
    
    if (data) {
      notifications.value = data
    }
  } catch (err) {
    console.error('Error fetching notifications page:', err)
  } finally {
    loading.value = false
  }
}

const viewNotification = async (notif: any) => {
  selectedNotif.value = notif
  if (!notif.is_read) {
    notif.is_read = true
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
    window.dispatchEvent(new CustomEvent('refresh-notifications'))
  }
}

const markAllRead = async () => {
  if (!user.value) return
  const userId = user.value.id || (user.value as any).sub
  loading.value = true
  try {
    await $fetch('/api/notifications/read-all', {
      method: 'PUT',
      body: { userId }
    })
    await fetchNotifications()
    window.dispatchEvent(new CustomEvent('refresh-notifications'))
  } catch (err) {
    console.error('Error marking all as read:', err)
    loading.value = false
  }
}

const deleteAll = async () => {
  if (!user.value || !confirm('Yakin ingin menghapus SEMUA notifikasi? Aksi ini tidak dapat dibatalkan.')) return
  const userId = user.value.id || (user.value as any).sub
  loading.value = true
  try {
    await $fetch('/api/notifications/all', {
      method: 'DELETE',
      body: { userId }
    })
    await fetchNotifications()
    window.dispatchEvent(new CustomEvent('refresh-notifications'))
  } catch (err) {
    console.error('Error deleting all notifications:', err)
    loading.value = false
  }
}

const deleteNotif = async (id: string) => {
  try {
    // Optimistic UI update
    notifications.value = notifications.value.filter(n => n.id !== id)
    await $fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    window.dispatchEvent(new CustomEvent('refresh-notifications'))
  } catch (err) {
    console.error('Error deleting notification:', err)
    fetchNotifications() // Revert UI if error
  }
}

onMounted(() => {
  fetchNotifications()
  window.addEventListener('refresh-notifications', fetchNotifications)
})

onUnmounted(() => {
  window.removeEventListener('refresh-notifications', fetchNotifications)
})
</script>
