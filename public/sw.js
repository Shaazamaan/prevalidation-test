const CACHE = "devbridge-v1";
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/", "/advisor", "/pitch-deck"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((r) => r ?? caches.match(OFFLINE_URL)))
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body, url, icon, badge } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title ?? "Devbridge", {
      body: body ?? "",
      icon: icon ?? "/icon-192.png",
      badge: badge ?? "/icon-192.png",
      data: { url: url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
