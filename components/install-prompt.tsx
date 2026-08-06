"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Logo } from "./logo";

const DISMISS_KEY = "tenangin:installPromptDismissedAt";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS/iPadOS lama menaruh flag ini di navigator, bukan lewat
    // media query display-mode.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAppleTouch = /iPhone|iPad|iPod/.test(ua);
  // iPadOS 13+ menyamar sebagai "Macintosh" tapi punya multi-touch.
  const isIPadDesktopMode = ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return isAppleTouch || isIPadDesktopMode;
}

function wasRecentlyDismissed() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return days < DISMISS_DAYS;
}

function dismiss() {
  window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

/**
 * Banner "Install TENANGIN" ringan di bagian bawah layar.
 * - Android/desktop Chrome/Edge: pakai event `beforeinstallprompt` asli.
 * - iOS/iPadOS Safari: tidak ada API prompt, jadi tampilkan instruksi
 *   manual (Share -> Tambah ke Layar Utama).
 * Tidak pernah muncul kalau app sudah berjalan standalone (sudah di-install),
 * dan tidak mengganggu lagi selama beberapa hari setelah ditutup.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
      window.localStorage.removeItem(DISMISS_KEY);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // iOS tidak pernah mengirim beforeinstallprompt — tampilkan tip manual
    // setelah jeda singkat supaya tidak menghalangi render pertama.
    let iosTimer: number | undefined;
    if (isIOS()) {
      iosTimer = window.setTimeout(() => {
        setShowIOSTip(true);
        setVisible(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  if (!visible) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    dismiss();
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-[calc(env(safe-area-inset-bottom)+84px)] sm:pb-6 sm:pl-6 sm:pr-auto sm:max-w-sm">
      <div className="animate-toast-in flex items-start gap-3 rounded-3xl border border-cloud/60 bg-white/95 p-4 shadow-soft backdrop-blur-md dark:border-dark-card dark:bg-dark-card/95">
        <Logo size={36} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-teal dark:text-dark-text">Install TENANGIN</p>
          {showIOSTip ? (
            <p className="mt-0.5 text-[13px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              Ketuk{" "}
              <Share size={13} strokeWidth={2} className="mx-0.5 inline-block -translate-y-px" aria-hidden />
              {" "}Bagikan, lalu pilih{" "}
              <SquarePlus size={13} strokeWidth={2} className="mx-0.5 inline-block -translate-y-px" aria-hidden />
              {" "}"Tambah ke Layar Utama".
            </p>
          ) : (
            <p className="mt-0.5 text-[13px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              Pasang di layar utama untuk akses lebih cepat, tanpa address bar, dan tetap bisa dibuka offline.
            </p>
          )}
          {!showIOSTip && (
            <Button size="sm" className="mt-3 gap-1.5" onClick={handleInstall}>
              <Download size={15} strokeWidth={2} />
              Install
            </Button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Tutup"
          className="shrink-0 rounded-full p-1 text-teal/40 hover:bg-cloud/40 hover:text-teal/70 dark:text-dark-text/40"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
