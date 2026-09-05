<template>
  <div 
    aria-live="polite"
    class="fixed z-[9999] pointer-events-none transition-all duration-300
           top-3 inset-x-3 sm:top-5 sm:right-5 sm:left-auto sm:max-w-md sm:w-full flex flex-col gap-3"
  >
    <TransitionGroup
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="-translate-y-5 opacity-0 sm:translate-y-0 sm:translate-x-10 scale-95"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="-translate-y-3 sm:translate-x-8 opacity-0 scale-95"
    >
      <div
        v-for="popup in activePopups"
        :key="popup.popupId"
        class="pointer-events-auto group relative w-full overflow-hidden rounded-2xl bg-white border border-orange-200 shadow-2xl shadow-orange-950/15 p-4 transition-all duration-200 hover:shadow-orange-950/20 hover:scale-[1.01] cursor-pointer ring-1 ring-orange-500/10"
        role="alert"
        @click="handleClickNotification(popup)"
      >
        <!-- Top Orange Accent Bar -->
        <div 
          class="absolute top-0 left-0 right-0 h-1.5"
          :class="getNotificationStyle(popup.type).accentBarClass"
        ></div>

        <div class="flex items-start gap-3.5 pt-1">
          <!-- Icon Container -->
          <div 
            class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
            :class="getNotificationStyle(popup.type).iconBgClass"
          >
            <component 
              :is="getNotificationStyle(popup.type).icon" 
              class="w-5 h-5 animate-pulse" 
            />
          </div>

          <!-- Content Body -->
          <div class="flex-1 min-w-0 pr-1">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <div class="flex items-center gap-2 min-w-0">
                <span 
                  class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0"
                  :class="getNotificationStyle(popup.type).badgeClass"
                >
                  {{ getNotificationStyle(popup.type).badgeLabel }}
                </span>
                <span class="text-[11px] text-ink-400 font-medium whitespace-nowrap">
                  Baru saja
                </span>
              </div>
            </div>

            <!-- Title: Crisp Black -->
            <h4 class="text-[14px] font-bold text-ink-950 leading-snug mb-1 truncate group-hover:text-orange-600 transition-colors">
              {{ popup.title }}
            </h4>

            <!-- Body Message: Dark Charcoal -->
            <p class="text-xs text-ink-700 leading-relaxed line-clamp-2 font-normal">
              {{ formatCleanText(popup.message) }}
            </p>

            <!-- Bottom Action Link: Bold Orange -->
            <div class="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-orange-600 group-hover:text-orange-700 group-hover:translate-x-0.5 transition-all">
              <span>Buka notifikasi</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </div>
          </div>

          <!-- Close (X) Button -->
          <button
            type="button"
            class="shrink-0 -mr-1 -mt-1 p-1.5 text-ink-400 hover:text-ink-800 hover:bg-orange-50 rounded-lg transition-colors"
            title="Tutup Notifikasi"
            @click.stop="dismissPopup(popup.popupId)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Progress Timeout Indicator -->
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-orange-100/60 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-orange-500 to-amber-500 animate-progress"></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { 
  Bell, 
  CheckCircle2, 
  AlertOctagon, 
  Megaphone, 
  MessageSquare, 
  ArrowRight, 
  X, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useRealtimeNotifications, type ActivePopupNotification } from '~/composables/useRealtimeNotifications'
import { stripHtml } from '../../../utils/formatters'

const router = useRouter()
const { activePopups, dismissPopup } = useRealtimeNotifications()

const formatCleanText = (msg?: string) => {
  if (!msg) return ''
  return stripHtml(msg).trim()
}

const handleClickNotification = (popup: ActivePopupNotification) => {
  dismissPopup(popup.popupId)

  // Navigate according to notification type or specific link
  if (popup.link) {
    router.push(popup.link)
    return
  }

  const type = (popup.type || '').toLowerCase()
  if (type.includes('budget') || type.includes('saldo') || type.includes('topup') || type.includes('payment')) {
    router.push('/dashboard/saldo')
  } else if (type.includes('kyc') || type.includes('verify') || type.includes('verification')) {
    router.push('/dashboard/verification')
  } else if (type.includes('ticket') || type.includes('support')) {
    router.push('/dashboard/support')
  } else {
    router.push('/dashboard/notifikasi')
  }
}

const getNotificationStyle = (type?: string) => {
  const t = (type || '').toLowerCase()

  if (t === 'budget_approved' || t === 'topup_approved' || t === 'success' || t === 'payment_success') {
    return {
      icon: CheckCircle2,
      badgeLabel: 'Disetujui',
      iconBgClass: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      accentBarClass: 'bg-gradient-to-r from-emerald-500 to-teal-400'
    }
  }

  if (t === 'budget_rejected' || t === 'error' || t === 'rejected') {
    return {
      icon: AlertOctagon,
      badgeLabel: 'Ditolak',
      iconBgClass: 'bg-rose-50 text-rose-600 border-rose-200',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      accentBarClass: 'bg-gradient-to-r from-rose-500 to-red-400'
    }
  }

  if (t === 'broadcast' || t === 'announcement') {
    return {
      icon: Megaphone,
      badgeLabel: 'Pengumuman',
      iconBgClass: 'bg-orange-50 text-orange-600 border-orange-200',
      badgeClass: 'bg-orange-50 text-orange-900 border-orange-200',
      accentBarClass: 'bg-gradient-to-r from-orange-500 to-amber-500'
    }
  }

  if (t === 'kyc_approved' || t === 'verification') {
    return {
      icon: ShieldCheck,
      badgeLabel: 'Verifikasi',
      iconBgClass: 'bg-teal-50 text-teal-600 border-teal-200',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
      accentBarClass: 'bg-gradient-to-r from-teal-500 to-emerald-400'
    }
  }

  if (t === 'support' || t === 'ticket') {
    return {
      icon: MessageSquare,
      badgeLabel: 'Bantuan',
      iconBgClass: 'bg-sky-50 text-sky-600 border-sky-200',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
      accentBarClass: 'bg-gradient-to-r from-sky-500 to-blue-400'
    }
  }

  if (t === 'warning') {
    return {
      icon: AlertTriangle,
      badgeLabel: 'Peringatan',
      iconBgClass: 'bg-amber-50 text-amber-600 border-amber-200',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      accentBarClass: 'bg-gradient-to-r from-amber-500 to-orange-400'
    }
  }

  return {
    icon: Bell,
    badgeLabel: 'Notifikasi',
    iconBgClass: 'bg-orange-50 text-orange-600 border-orange-200',
    badgeClass: 'bg-orange-50 text-orange-900 border-orange-200',
    accentBarClass: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400'
  }
}
</script>

<style scoped>
@keyframes progressShrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-progress {
  animation: progressShrink 7s linear forwards;
}
</style>
