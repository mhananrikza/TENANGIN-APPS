"use client";

import { useEffect } from "react";
import { useToast } from "@/lib/toast-context";

/**
 * Mendaftarkan service worker TENANGIN supaya browser (Chrome/Edge di
 * Android, desktop, Windows) menganggap app ini bisa di-install, dan
 * supaya app shell tersedia offline.
 *
 * Safari iOS/iPadOS tidak butuh service worker untuk "Add to Home Screen"
 * (itu cukup lewat manifest + meta tag appleWebApp di layout.tsx), tapi
 * mendaftarkannya di sini tidak masalah — Safari modern juga mendukungnya
 * dan ikut mendapat manfaat offline cache.
 */
export function RegisterServiceWorker() {
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Kalau ada worker baru yang sudah "waiting", app sedang dibuka dari
        // versi lama (mis. tab yang sudah lama terbuka). Aktifkan versi baru
        // begitu pengguna siap.
        if (registration.waiting) {
          showToast?.("Pembaruan TENANGIN tersedia. Memuat versi terbaru…");
          registration.waiting.postMessage("SKIP_WAITING");
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage("SKIP_WAITING");
            }
          });
        });
      })
      .catch(() => {
        // Kalau gagal (mis. dev server tanpa HTTPS), abaikan saja —
        // ini bukan fitur yang boleh mengganggu pemakaian normal.
      });
  }, [showToast]);

  return null;
}
