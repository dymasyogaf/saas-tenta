import { ref } from 'vue'
import { useSupabaseClient, useSupabaseUser } from '#imports'
import { useNotificationSound } from '~/composables/useNotificationSound'

export interface RealtimeNotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read?: boolean
  created_at: string
  link?: string
}

export interface ActivePopupNotification extends RealtimeNotificationItem {
  popupId: string
  autoDismissTimeout?: any
}

const activePopups = ref<ActivePopupNotification[]>([])
const desktopPermission = ref<string>('default')
let activeRealtimeChannel: any = null
let currentSubscribedUserId: string | null = null

export const useRealtimeNotifications = () => {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()
  const { playNotificationChime, triggerHaptic } = useNotificationSound()

  const isDesktopNotificationEnabled = useState<boolean>('notification_desktop_enabled', () => true)

  // Always sync state from localStorage on client
  if (import.meta.client && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('tentaklik_desktop_notif_enabled')
      if (saved !== null) {
        isDesktopNotificationEnabled.value = saved === 'true'
      }
    } catch (_) {}
  }

  const checkDesktopPermission = () => {
    if (import.meta.client && typeof window !== 'undefined' && 'Notification' in window) {
      desktopPermission.value = Notification.permission
    } else {
      desktopPermission.value = 'unsupported'
    }
  }

  // Check immediately on call
  checkDesktopPermission()

  const requestDesktopPermission = async () => {
    if (import.meta.client && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission()
        desktopPermission.value = perm
        if (perm === 'granted') {
          isDesktopNotificationEnabled.value = true
          if (import.meta.client && typeof window !== 'undefined') {
            try {
              localStorage.setItem('tentaklik_desktop_notif_enabled', 'true')
            } catch (_) {}
          }
          try {
            new Notification('Notifikasi Desktop Aktif! 🎉', {
              body: 'Anda akan menerima notifikasi otomatis bahkan saat aplikasi di-minimize atau membuka tab lain.',
              icon: '/favicon.ico'
            })
            playNotificationChime('info')
          } catch (_) {}
        }
        return perm
      } catch (err) {
        console.warn('Error requesting desktop notification permission:', err)
      }
    }
    return 'unsupported'
  }

  const toggleDesktopNotification = async (val?: boolean) => {
    const nextVal = typeof val === 'boolean' ? val : !isDesktopNotificationEnabled.value
    if (nextVal) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          const perm = await requestDesktopPermission()
          if (perm !== 'granted') {
            isDesktopNotificationEnabled.value = false
            if (import.meta.client && typeof window !== 'undefined') {
              try {
                localStorage.setItem('tentaklik_desktop_notif_enabled', 'false')
              } catch (_) {}
            }
            return false
          }
        }
      }
    }
    isDesktopNotificationEnabled.value = nextVal
    if (import.meta.client && typeof window !== 'undefined') {
      try {
        localStorage.setItem('tentaklik_desktop_notif_enabled', String(nextVal))
      } catch (_) {}
    }
    return nextVal
  }

  const showNativeDesktopNotification = (notif: RealtimeNotificationItem) => {
    if (!import.meta.client || typeof window === 'undefined' || !('Notification' in window)) return
    if (!isDesktopNotificationEnabled.value) return
    if (Notification.permission !== 'granted') return

    try {
      const cleanMessage = notif.message ? notif.message.replace(/<[^>]*>/g, '').trim() : ''
      const nativeNotif = new Notification(notif.title || 'Notifikasi Baru', {
        body: cleanMessage,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notif.id || `notif-${Date.now()}`
      })

      nativeNotif.onclick = () => {
        window.focus()
        nativeNotif.close()
      }
    } catch (err) {
      console.warn('Desktop notification error:', err)
    }
  }

  const dismissPopup = (popupId: string) => {
    const idx = activePopups.value.findIndex(p => p.popupId === popupId)
    if (idx !== -1) {
      const item = activePopups.value[idx]
      if (item?.autoDismissTimeout) {
        clearTimeout(item.autoDismissTimeout)
      }
      activePopups.value.splice(idx, 1)
    }
  }

  const triggerPopup = (notif: RealtimeNotificationItem, duration = 7000) => {
    const popupId = notif.id || Math.random().toString(36).substring(2, 9)

    // Check if already showing
    if (activePopups.value.some(p => p.id === notif.id && p.id !== undefined)) {
      return
    }

    // 1. Play chime & haptic
    playNotificationChime(notif.type)
    triggerHaptic([60, 40, 60])

    // 2. Trigger Native OS Desktop/Mobile Notification (for minimized/background tab)
    showNativeDesktopNotification(notif)

    const timeout = setTimeout(() => {
      dismissPopup(popupId)
    }, duration)

    const popupItem: ActivePopupNotification = {
      ...notif,
      popupId,
      autoDismissTimeout: timeout
    }

    // Keep max 3 notifications on screen
    if (activePopups.value.length >= 3) {
      const removed = activePopups.value.shift()
      if (removed?.autoDismissTimeout) clearTimeout(removed.autoDismissTimeout)
    }

    activePopups.value.push(popupItem)
  }

  const initRealtimeListener = () => {
    if (!import.meta.client) return

    checkDesktopPermission()

    const userId = user.value?.id || (user.value as any)?.sub
    if (!userId) return

    // If already subscribed to this user, do not recreate
    if (activeRealtimeChannel && currentSubscribedUserId === userId) {
      return
    }

    // Cleanup previous if user changed
    cleanupRealtimeListener()

    try {
      currentSubscribedUserId = userId
      const channelName = `realtime-user-notifications-${userId}-${Date.now().toString(36)}`
      
      activeRealtimeChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            console.log('[Realtime] New notification received:', payload)
            const newNotif = payload.new as RealtimeNotificationItem
            if (newNotif) {
              triggerPopup(newNotif)
              // Broadcast custom event so navbar bell and lists update instantly
              window.dispatchEvent(new CustomEvent('refresh-notifications', { detail: newNotif }))
            }
          }
        )
        .subscribe((status: string) => {
          console.log('[Realtime Notification] Channel connection status:', status)
        })
    } catch (err) {
      console.warn('Realtime subscription error:', err)
    }
  }

  const cleanupRealtimeListener = () => {
    if (activeRealtimeChannel) {
      try {
        supabase.removeChannel(activeRealtimeChannel)
      } catch (_) {}
      activeRealtimeChannel = null
      currentSubscribedUserId = null
    }
  }

  return {
    activePopups,
    desktopPermission,
    isDesktopNotificationEnabled,
    toggleDesktopNotification,
    checkDesktopPermission,
    requestDesktopPermission,
    showNativeDesktopNotification,
    triggerPopup,
    dismissPopup,
    initRealtimeListener,
    cleanupRealtimeListener
  }
}
