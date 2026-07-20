/* Versioned Web Push extension loaded by the generated Workbox service worker. */
const AQUA_PUSH_SW_VERSION = '1'

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'Aqua — alerta territorial'
  const options = {
    body: payload.body || payload.message || 'Há uma atualização em uma região acompanhada.',
    icon: payload.icon || '/icons/aqua-192.png',
    badge: '/icons/aqua-192.png',
    tag: payload.tag || `aqua-alert-${AQUA_PUSH_SW_VERSION}`,
    data: { url: payload.url || (payload.data && payload.data.url) || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const requestedDestination = new URL(
    event.notification.data?.url || '/',
    self.location.origin,
  )
  const destination =
    requestedDestination.origin === self.location.origin
      ? requestedDestination.href
      : self.location.origin
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url === destination)
      if (existing) return existing.focus()
      return self.clients.openWindow(destination)
    }),
  )
})
