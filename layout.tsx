import fs from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { NO_FLASH_THEME_SCRIPT } from "@/lib/theme";
import { RegisterServiceWorker } from "@/components/register-sw";
import { InstallPrompt } from "@/components/install-prompt";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
});

const APP_NAME = "TENANGIN";
const APP_SUBTITLE = "Teman Parenting Tanpa Bentakan";

// Daftar splash screen iPhone/iPad (apple-touch-startup-image) di-generate oleh
// scripts/gen-pwa-assets.py ke public/splash/manifest.json, supaya tidak perlu
// menulis ulang puluhan tag <link> secara manual tiap kali logo berubah.
function getAppleSplashImages() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "public", "splash", "manifest.json"), "utf-8");
    const entries = JSON.parse(raw) as { file: string; media: string }[];
    return entries.map((entry) => ({ url: entry.file, media: entry.media }));
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: `${APP_NAME}, ${APP_SUBTITLE}`,
    template: `%s, ${APP_NAME}`,
  },
  description:
    "TENANGIN, Teman Parenting Tanpa Bentakan: ide aktivitas anak yang dipersonalisasi AI, perjalanan Bertumbuh, dan Teman AI yang selalu mendengarkan. Bisa dipakai offline, semua data tersimpan di perangkat Anda.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/icons/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  // "Add to Home Screen" di Safari iOS/iPadOS memakai meta tag ini (bukan
  // manifest), termasuk splash screen statis lewat startupImage.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
    startupImage: getAppleSplashImages(),
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#FAF6F0",
    "msapplication-TileImage": "/icons/mstile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Mencegah "kedipan" tema saat pertama render — dijalankan sebelum paint. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>
            {children}
            <InstallPrompt />
            <RegisterServiceWorker />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
