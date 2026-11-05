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
      data: { url: d.url || "/dk" },
    })
  )
})

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || "/dk"))
})
