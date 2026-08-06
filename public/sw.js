// Service worker TENANGIN.
//
// Tujuan:
// 1. Membuat app ini "installable" (Chrome/Edge Android & desktop, Safari
//    iOS/iPadOS, Windows) dengan ikon & splash TENANGIN.
// 2. Memberi pengalaman offline yang wajar: app shell (halaman, ikon, font,
//    JS/CSS hasil build Next.js) di-cache supaya bisa dibuka tanpa internet.
//
// Data pengguna (mood, planner, progres Bertumbuh, riwayat Teman AI, dsb.)
// TIDAK disimpan di sini — itu ada di IndexedDB lewat lib/local-db.ts, dan
// sudah otomatis offline-first karena murni berjalan di perangkat.
//
// Permintaan ke /api/* (Teman AI, generator aktivitas, dsb.) SENGAJA selalu
// langsung ke jaringan (network-only) — ini butuh model AI di server, jadi
// tidak masuk akal untuk di-cache atau dipalsukan saat offline.

const VERSION = "v2";
const SHELL_CACHE = `tenangin-shell-${VERSION}`;
const ASSET_CACHE = `tenangin-assets-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const APP_SHELL = ["/", "/manifest.webmanifest", OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        // Kalau precache gagal (mis. offline saat install pertama), jangan
        // blokir instalasi — service worker tetap aktif tanpa shell cache.
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/splash/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.webmanifest"
  );
}

// Cache-first, isi ulang di belakang layar (stale-while-revalidate) — cocok
// untuk file hasil build Next.js yang nama filenya sudah di-hash, dan aset
// statis (ikon, splash) yang jarang berubah.
async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || Response.error();
}

// Network-first untuk navigasi halaman — supaya user selalu dapat versi
// terbaru saat online, tapi tetap bisa buka app saat offline lewat cache
// (atau halaman offline.html sebagai jaring pengaman terakhir).
async function navigationHandler(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hanya tangani GET same-origin; biarkan POST/API/cross-origin langsung
  // ke jaringan tanpa campur tangan sama sekali.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

// Memungkinkan halaman memicu update SW baru langsung tanpa tunggu semua
// tab ditutup (dipakai oleh prompt "Versi baru tersedia" bila ada).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
