<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm"
        @click.self="handleDismiss"
      >
        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div 
            v-if="isOpen"
            class="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl shadow-orange-950/20 border border-orange-200/90 overflow-hidden ring-1 ring-orange-500/10"
            role="dialog"
            aria-modal="true"
          >
            <!-- Top Gradient Accent Bar -->
            <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400"></div>

            <!-- Close Button -->
            <button
              type="button"
              @click="handleDismiss"
              class="absolute top-4 right-4 p-2 text-ink-400 hover:text-ink-700 hover:bg-orange-50 rounded-xl transition-colors"
              title="Tutup"
            >
              <X class="w-5 h-5" />
            </button>

            <div class="flex flex-col items-center text-center pt-2">
              <!-- Animated Glowing Bell Icon -->
              <div class="relative mb-4">
                <div class="absolute inset-0 rounded-2xl bg-orange-400/20 blur-xl animate-pulse"></div>
                <div class="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <BellRing class="w-7 h-7" />
                </div>
              </div>

              <!-- Title & Description -->
              <h3 class="text-xl sm:text-2xl font-bold text-ink-950 font-display tracking-tight mb-2">
                Pemberitahuan Real-Time
              </h3>
              <p class="text-xs sm:text-sm text-ink-500 leading-relaxed mb-6 max-w-sm">
                Dapatkan informasi penting dan pembaruan aktivitas akun secara langsung, bahkan saat Anda tidak sedang membuka halaman ini.
              </p>

              <!-- Value Points Card -->
              <div class="w-full bg-ink-50/70 border border-ink-100 rounded-2xl p-4 text-left space-y-3.5 mb-6">
                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 class="w-4 h-4" />
                  </div>
                  <div>
                    <h5 class="text-xs font-bold text-ink-900 leading-snug">Transaksi & Mutasi Saldo</h5>
                    <p class="text-[11px] text-ink-500 leading-relaxed">Konfirmasi instan untuk deposit, alokasi saldo, dan pencairan komisi.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert class="w-4 h-4" />
                  </div>
                  <div>
                    <h5 class="text-xs font-bold text-ink-900 leading-snug">Peringatan Kampanye Iklan</h5>
                    <p class="text-[11px] text-ink-500 leading-relaxed">Pemberitahuan dini saat saldo menipis agar penayangan iklan tidak terhenti.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles class="w-4 h-4" />
                  </div>
                  <div>
                    <h5 class="text-xs font-bold text-ink-900 leading-snug">Bantuan & Pembaruan Sistem</h5>
                    <p class="text-[11px] text-ink-500 leading-relaxed">Respon tiket bantuan pelanggan serta pengumuman pembaruan fitur platform.</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="w-full space-y-2">
                <button
                  type="button"
                  @click="handleEnable"
                  :disabled="isLoading"
                  class="w-full py-3 px-5 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Bell class="w-4 h-4" />
                  <span>{{ isLoading ? 'Memproses Izin...' : 'Aktifkan Notifikasi' }}</span>
                </button>

                <button
                  type="button"
                  @click="handleDismiss"
                  class="w-full py-2 text-xs font-medium text-ink-400 hover:text-ink-600 transition-colors cursor-pointer"
                >
                  Lewati untuk Sekarang
                </button>
              </div>

              <!-- Reassurance Footer -->
              <div class="pt-2 text-[10px] text-ink-400 flex items-center justify-center gap-1">
                <span>Pengaturan dapat disesuaikan kapan saja di menu notifikasi.</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { 
  BellRing, 
  Bell, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles 
} from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import { useRealtimeNotifications } from '~/composables/useRealtimeNotifications'
import { useNotificationSound } from '~/composables/useNotificationSound'
import { useWebPush } from '~/composables/useWebPush'

const isOpen = ref(false)
const isLoading = ref(false)

const route = useRoute()
const { user } = useAuth()
const { requestDesktopPermission, isDesktopNotificationEnabled, toggleDesktopNotification } = useRealtimeNotifications()
const { isSoundEnabled, toggleSound, toggleHaptic } = useNotificationSound()
const { isSupported: isPushSupported, subscribeToPush } = useWebPush()

const checkShouldShowModal = () => {
  if (!import.meta.client || typeof window === 'undefined') return

  // Jangan munculkan di halaman auth/login
  if (route.path.startsWith('/login') || route.path.startsWith('/register') || route.path.startsWith('/forgot-password')) {
    isOpen.value = false
    return
  }

  // 1. Cek apakah izin notifikasi browser diblokir permanen (denied)
  if ('Notification' in window && Notification.permission === 'denied') {
    return
  }

  // 2. Baca status tersimpan terkini dari localStorage
  const savedDesktop = localStorage.getItem('tentaklik_desktop_notif_enabled')
  const savedSound = localStorage.getItem('tentaklik_sound_enabled')

  const isBrowserGranted = 'Notification' in window && Notification.permission === 'granted'
  const isDesktopActive = isBrowserGranted && (savedDesktop !== null ? savedDesktop === 'true' : isDesktopNotificationEnabled.value)
  const isSoundActive = (savedSound !== null ? savedSound === 'true' : isSoundEnabled.value)

  // Jika Notifikasi Desktop DAN Suara sudah aktif, TIDAK PERLU munculkan popup
  if (isDesktopActive && isSoundActive) {
    isOpen.value = false
    return
  }

  // 3. Cek apakah baru saja ditutup dalam sesi ini (sessionStorage)
  const dismissedInSession = sessionStorage.getItem('tentaklik_notif_modal_dismissed')
  if (dismissedInSession === 'true') {
    return
  }

  // 4. Munculkan popup modal dengan delay halus
  setTimeout(() => {
    if (!route.path.startsWith('/login') && !route.path.startsWith('/register')) {
      isOpen.value = true
    }
  }, 600)
}

const handleEnable = async () => {
  isLoading.value = true
  try {
    // 1. Aktifkan Izin Desktop & Switch Desktop
    await requestDesktopPermission()
    await toggleDesktopNotification(true)

    // 2. Aktifkan Suara & Getaran
    toggleSound(true)
    toggleHaptic(true)

    // 3. Mendaftarkan Web Push Background Service Worker jika didukung
    if (isPushSupported.value) {
      await subscribeToPush()
    }

    if (import.meta.client) {
      sessionStorage.removeItem('tentaklik_notif_modal_dismissed')
      localStorage.removeItem('tentaklik_notif_prompt_dismissed')
    }

    isOpen.value = false
  } catch (err) {
    console.warn('[NotificationPromptModal] Enable error:', err)
  } finally {
    isLoading.value = false
  }
}

const handleDismiss = () => {
  isOpen.value = false
  if (import.meta.client) {
    sessionStorage.setItem('tentaklik_notif_modal_dismissed', 'true')
  }
}

// Pantau perubahan user login dan navigasi halaman
watch(user, () => {
  checkShouldShowModal()
}, { immediate: true })

watch(() => route.path, () => {
  checkShouldShowModal()
})

onMounted(() => {
  // Bersihkan dismiss key lama di localStorage jika ada
  if (import.meta.client) {
    localStorage.removeItem('tentaklik_notif_prompt_dismissed')
  }
  checkShouldShowModal()
})
</script>
