// Service Worker for Tentaklik Web Push Notifications
// Runs in background to handle push events even when the website is closed.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle incoming Web Push notification from server
self.addEventListener('push', (event) => {
  let data = {
    title: 'Notifikasi Tentaklik',
    body: 'Ada notifikasi baru di akun Anda.',
    url: '/dashboard/notifikasi',
    tag: 'tentaklik-notif',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      data = { ...data, ...parsed }
    } catch (e) {
      try {
        data.body = event.data.text()
      } catch (_) {}
    }
  }

  const options = {
    body: data.body || 'Ada notifikasi baru untuk Anda.',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || `tentaklik-${Date.now()}`,
    data: {
      url: data.url || '/dashboard/notifikasi',
      id: data.id
    },
    vibrate: [100, 50, 100],
    renotify: true,
    requireInteraction: false
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification click by user
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard/notifikasi'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus and navigate it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i]
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl)
          }
          return client.focus()
        }
      }
      // If no window open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
