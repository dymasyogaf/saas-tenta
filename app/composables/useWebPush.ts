import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'

export const useWebPush = () => {
  const isSupported = ref(false)
  const isSubscribed = ref(false)
  const isSubscribing = ref(false)
  const pushPermission = ref<string>('default')
  const statusMessage = ref('')

  const config = useRuntimeConfig()
  const vapidPublicKey = config.public.vapidPublicKey

  // Utility to convert VAPID base64 string to Uint8Array for PushManager
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Register service worker if not already registered
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!import.meta.client || !('serviceWorker' in navigator)) return null
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      await navigator.serviceWorker.ready
      return reg
    } catch (err) {
      console.warn('[WebPush] Service Worker registration failed:', err)
      return null
    }
  }

  // Check current subscription status
  const checkSubscription = async () => {
    if (!import.meta.client) return

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      isSupported.value = false
      pushPermission.value = 'unsupported'
      return
    }

    isSupported.value = true
    pushPermission.value = Notification.permission

    try {
      const reg = await registerServiceWorker()
      if (!reg) return

      const existingSub = await reg.pushManager.getSubscription()
      isSubscribed.value = !!existingSub
    } catch (err) {
      console.warn('[WebPush] Error checking subscription:', err)
    }
  }

  // Subscribe current device to Web Push
  const subscribeToPush = async () => {
    if (!import.meta.client || !isSupported.value || isSubscribing.value) return false
    isSubscribing.value = true
    statusMessage.value = 'Mendaftar notifikasi push...'

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission()
      pushPermission.value = permission

      if (permission !== 'granted') {
        statusMessage.value = 'Izin notifikasi tidak diberikan.'
        isSubscribing.value = false
        return false
      }

      // 2. Register Service Worker & Subscribe with VAPID Public Key
      const reg = await registerServiceWorker()
      if (!reg) {
        throw new Error('Gagal menginisialisasi Service Worker')
      }

      let sub = await reg.pushManager.getSubscription()

      if (!sub) {
        if (!vapidPublicKey) {
          throw new Error('VAPID Public Key belum dikonfigurasi')
        }

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey)
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        })
      }

      // 3. Send subscription to server
      const subJson = sub.toJSON()
      const { csrf } = useCsrf()
      const csrfToken = unref(csrf) || ''
      await $fetch('/api/notifications/push-subscribe', {
        method: 'POST',
        headers: csrfToken ? { 'csrf-token': csrfToken } : {},
        body: subJson
      })

      isSubscribed.value = true
      statusMessage.value = 'Berhasil berlangganan notifikasi push!'
      return true
    } catch (err: any) {
      console.error('[WebPush] subscribeToPush Error:', err)
      statusMessage.value = 'Gagal mendaftar push: ' + (err.message || 'Kesalahan sistem')
      return false
    } finally {
      isSubscribing.value = false
    }
  }

  // Unsubscribe device
  const unsubscribeFromPush = async () => {
    if (!import.meta.client || !isSupported.value) return false
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
      }
      isSubscribed.value = false
      return true
    } catch (err) {
      console.error('[WebPush] unsubscribe Error:', err)
      return false
    }
  }

  // Send a test push notification
  const sendTestPush = async () => {
    try {
      const { csrf } = useCsrf()
      const csrfToken = unref(csrf) || ''
      const res = await $fetch<any>('/api/notifications/push-test', {
        method: 'POST',
        headers: csrfToken ? { 'csrf-token': csrfToken } : {},
        body: {
          title: 'Tes Web Push Latar Belakang 🚀',
          body: 'Notifikasi berhasil terkirim melalui background Service Worker!',
          url: '/dashboard'
        }
      })
      return res
    } catch (err: any) {
      console.error('[WebPush] sendTestPush Error:', err)
      throw err
    }
  }

  onMounted(() => {
    checkSubscription()
  })

  return {
    isSupported,
    isSubscribed,
    isSubscribing,
    pushPermission,
    statusMessage,
    checkSubscription,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestPush
  }
}
