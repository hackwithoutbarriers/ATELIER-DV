const CACHE = "dv-i18n-v12";
const FILES = [
  "/",
  "/index.html",
  "/404.html",
  "/confidentialite.html",
  "/mentions-legales.html",
  "/manifest.webmanifest",
  "/en/index.html",
  "/en/404.html",
  "/en/privacy.html",
  "/en/legal-notice.html",
  "/en/manifest.webmanifest",
  "/app.css",
  "/app.js",
  "/i18n.js",
  "/workbook-export.js",
  "/config.js",
  "/lang/fr.json",
  "/lang/en.json",
  "/logo.svg",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/og-image.png",
  "/og-image-en.png",
  "/assets/dv-lottery-preparation-template.xlsx",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    new URL(event.request.url).origin !== location.origin
  ) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        const fallback = event.request.url.includes("/en/")
          ? "/en/index.html"
          : "/index.html";
        return caches.match(fallback);
      }),
  );
});
