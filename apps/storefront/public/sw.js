self.addEventListener("push", (e) => {
  let d = {}
  try {
    d = e.data ? e.data.json() : {}
  } catch {
    d = { title: e.data && e.data.text() }
  }
  e.waitUntil(
    self.registration.showNotification(d.title || "Hybreed", {
      body: d.body || "",
      icon: "/images/brand-mark.png",
      badge: "/images/brand-mark.png",
      data: { url: d.url || "/" },
    })
  )
})

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || "/"))
})

// Installability requirement: Chrome only offers "Install app" when a
// service worker has a fetch handler. Not calling respondWith means every
// request still goes straight to the network - no caching, no stale data.
self.addEventListener("fetch", () => {})
