/* global self */
// This service worker listens for push events from the server and displays
// notifications.  When the user clicks on a notification the worker
// navigates to the configured URL if present.
self.addEventListener('push', function (event) {
  let data = {}
  try {
    data = event.data?.json() || {}
  } catch (err) {
    data = { title: 'Scruffy Butts', body: event.data?.text() }
  }
  const title = data.title || 'Scruffy Butts'
  const options = {
    body: data.body || 'You have a new notification from Scruffy Butts.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url
  // Focus or open the URL.
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})