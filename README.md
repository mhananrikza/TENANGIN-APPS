# TENANGIN (MVP Lengkap — Local-only)

MVP aplikasi TENANGIN — mobile-first, tenang, dan personal — dengan semua fitur inti
sudah berfungsi penuh.

**Tidak ada login, tidak ada akun email, tidak ada database cloud.** Semua data
(profil anak, mood, planner, progres Bertumbuh, riwayat aktivitas, obrolan Teman AI)
tersimpan hanya di HP/browser masing-masing pengguna lewat **IndexedDB** (setting ringan
seperti tema & id perangkat tetap di `localStorage`). Lihat
[§8 Arsitektur data lokal](#8-arsitektur-data-lokal-tanpa-akun) untuk detail dan
konsekuensinya. Aplikasi ini juga sudah menjadi **Progressive Web App (PWA)** penuh —
bisa di-install di Android, iPhone, iPad, tablet Android, Windows, dan macOS, lengkap
dengan splash screen bermerek dan mode offline dasar — lihat
[§9](#9-bisa-di-install-seperti-aplikasi-pwa).

Fitur yang sudah jalan:
- **Onboarding tanpa akun** — cukup isi nama & usia anak sekali di device, langsung dipakai
- **Mood check-in** — catat perasaan harian lewat 5 emoji, langsung dari Beranda
- **Aktivitas Anak** — AI generator ide aktivitas sesuai usia anak (Google Gemini), riwayat + favorit
- **AI Companion** — obrolan hangat dengan "Teman AI" (Google Gemini), riwayat tersimpan di device
- **🌱 Bertumbuh** — perjalanan belajar parenting interaktif (materi bertahap, refleksi, aksi harian, progres)
- **Planner** — checklist rencana harian yang simpel
- **Sesi Napas** — panduan napas 4-7-8 dengan animasi lingkaran, dapat diakses cepat
  lewat tombol "Aku Hampir Meledak"
- **Cadangkan/pulihkan data** — ekspor & impor manual (file `.json`) dari halaman Profil,
  supaya data tidak hilang saat ganti HP
- Desain mengikuti design system TENANGIN (warna, tipografi, komponen, bottom nav 5 item)

---

## 1. Prasyarat

- Node.js 18.18+ atau 20+ ([nodejs.org](https://nodejs.org))
- Akun Google dengan API key Gemini ([aistudio.google.com/apikey](https://aistudio.google.com/apikey),
  tersedia gratis tier) — hanya dipakai untuk fitur AI (ide aktivitas & Teman AI), bukan
  untuk menyimpan data pengguna

Cek versi node di terminal:
```bash
node -v
```

---

## 2. Install project

```bash
cd tenangin
npm install
```

---

## 3. Setup Google Gemini

1. Buka [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. **Create API key** → copy key-nya, simpan baik-baik.
3. Gemini punya free tier (kuota harian gratis) yang cukup untuk pemakaian normal aplikasi
   ini — tidak wajib mengaktifkan billing untuk mulai coba-coba.

Tidak perlu setup Firebase atau layanan database lain — aplikasi ini tidak memakainya.

---

## 4. Isi environment variables

Copy file contoh lalu isi dengan key dari langkah 3:

```bash
cp .env.local.example .env.local
```

Buka `.env.local` dan isi:

```
GEMINI_API_KEY=AIza...
```

> `GEMINI_API_KEY` sengaja **tanpa** prefix `NEXT_PUBLIC_` supaya tidak pernah terkirim
> ke browser — hanya dipakai di server lewat `app/api/generate-activity/route.ts` dan
> `app/api/companion/*`.

---

## 5. Jalankan secara lokal

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) → akan diarahkan ke halaman **onboarding**
(isi nama & usia anak — tidak ada email/password), lalu coba fitur **Buat ide aktivitas**.

---

## 6. Deploy (rekomendasi: Vercel)

1. Push project ini ke GitHub.
2. Buka [vercel.com](https://vercel.com) → **New Project** → import repo GitHub kamu.
3. Di halaman konfigurasi, buka **Environment Variables** → masukkan `GEMINI_API_KEY`.
4. Klik **Deploy**. Selesai — aplikasi langsung online.

Framework preset akan otomatis terdeteksi sebagai **Next.js**, tidak perlu ubah apa-apa.
Karena tidak ada database server, tidak ada langkah provisioning tambahan.

---

## 7. Struktur project (ringkas)

```
app/
  layout.tsx               # root layout, font Fraunces + Inter, AuthProvider
  page.tsx                 # redirect awal (ke /register atau /beranda)
  register/page.tsx        # onboarding 2 langkah: nama anak -> usia anak (tanpa akun)
  beranda/page.tsx         # hub: sapaan, mood check-in, tombol darurat, akses cepat
  aktivitas/page.tsx       # generator ide aktivitas anak + riwayat
  bertumbuh/page.tsx       # Bertumbuh: hero + peta perjalanan belajar
  bertumbuh/[id]/page.tsx  # Bertumbuh: isi materi, refleksi, aksi harian
  planner/page.tsx         # checklist rencana harian
  companion/page.tsx       # chat dengan Teman AI
  napas/page.tsx           # sesi napas terpandu 4-7-8
  profil/page.tsx          # data anak + cadangkan/pulihkan data + hapus data
  api/generate-activity/   # API route Gemini untuk ide aktivitas (stateless)
  api/companion/           # API route Gemini untuk chat companion (stateless)
components/
  ui/                      # button, card, input, label, textarea, badge (gaya shadcn)
  bottom-nav.tsx           # 5 item: Beranda, Bertumbuh, Teman AI, Planner, Profil
  app-shell.tsx            # guard onboarding + bottom nav
lib/
  local-db.ts              # lapisan data lokal (IndexedDB + cache memori) + ekspor/impor cadangan
  auth-context.tsx         # context profil lokal (bukan akun cloud)
  types.ts
  date.ts
components/
  install-prompt.tsx       # banner "Install TENANGIN" (Android/desktop: beforeinstallprompt;
                           # iOS: instruksi manual Share -> Add to Home Screen)
  register-sw.tsx          # daftar + kelola update public/sw.js
public/
  manifest.webmanifest     # nama, ikon, shortcuts, warna tema PWA
  sw.js                    # service worker: cache-first aset statis, network-first navigasi
  offline.html             # halaman fallback saat benar-benar offline & belum ada cache
  icons/                   # seluruh ukuran ikon (any/maskable/apple/favicon/mstile Windows)
  splash/                  # splash screen iPhone/iPad statis (apple-touch-startup-image)
scripts/
  gen-pwa-assets.py        # generator ikon + splash dari public/brand/logo-mark.png
```

---

## 8. Arsitektur data lokal (tanpa akun)

Tidak ada Firebase/backend database, tidak ada Authentication, tidak ada Firestore,
tidak ada Storage. `lib/local-db.ts` menyediakan fungsi kecil yang bentuknya mirip
database dokumen pada umumnya (`doc`, `collection`, `query`, `onSnapshot`, `setDoc`,
dst.) supaya kode tiap halaman tetap sederhana, tapi semuanya membaca/menulis ke:

- **IndexedDB** — database utama, menyimpan semua data "dokumen" (lihat daftar di
  bawah). Dibaca sekali ke cache memori saat app dibuka (supaya komponen React bisa
  baca sinkron), lalu setiap perubahan langsung ditulis-tembus (write-through) ke
  IndexedDB secara async — jadi persisten antar sesi tanpa jaringan.
- **`localStorage`** — hanya untuk setting ringan: id perangkat anonim (`tenangin:uid`)
  dan preferensi tema (`tenangin-theme`, lihat `lib/theme.ts`). Tidak ada data
  "dokumen" (mood, planner, dst.) yang disimpan di `localStorage` lagi.

Struktur key (path gaya `koleksi/{id}`, disimpan sebagai satu record IndexedDB per path):
- `users/{uid}` — profil (nama Ibu, nama anak, usia anak)
- `users/{uid}/activities/{id}` — riwayat & favorit ide aktivitas
- `users/{uid}/moods/{YYYY-MM-DD}` — satu check-in mood per hari
- `users/{uid}/growth/{materiId}` — progres perjalanan Bertumbuh
- `users/{uid}/tasks/{id}` — item planner
- `users/{uid}/companion/thread` — riwayat chat Teman AI (maks. 30 pesan terakhir)
- `users/{uid}/companion/memory`, `users/{uid}/reflections/{id}`, `users/{uid}/daily/{YYYY-MM-DD}`

`{uid}` adalah id acak yang dibuat sekali per device (`tenangin:uid` di localStorage) —
bukan identitas pengguna, murni supaya struktur key konsisten. **Tidak ada login,
tidak ada registrasi, tidak ada email** di mana pun dalam aplikasi ini.

**Konsekuensi penting:**
- Data **hanya ada di device ini**. Uninstall app, ganti HP, atau bersihkan data situs =
  data hilang, kecuali sempat diekspor lewat Profil > Cadangkan data.
- Tidak ada sinkronisasi antar device — kalau dibuka di HP lain, dianggap pengguna baru.
- API route (`app/api/*`) tetap memanggil Gemini di server seperti biasa (butuh
  `GEMINI_API_KEY`), tapi **tidak menyimpan** apa pun — sepenuhnya stateless, semua hasil
  dikirim balik ke client untuk disimpan lokal.
- **Cadangan manual** — halaman Profil punya tombol "Unduh cadangan" (file `.json`
  berisi seluruh isi IndexedDB + setting ringan) dan "Pulihkan dari cadangan" untuk
  mengembalikannya (termasuk kompatibel membaca file cadangan format lama).

---



## 9. Bisa di-install seperti aplikasi (PWA)

TENANGIN adalah Progressive Web App penuh — bisa dipasang di **Android, iPhone, iPad,
tablet Android, Windows, dan macOS**, muncul dengan ikon & splash screen TENANGIN
sendiri, berjalan dalam mode standalone (tanpa address bar), dan tetap bisa dibuka
sebagian besar fiturnya saat offline (data lokal via IndexedDB tidak butuh internet
sama sekali; hanya fitur Teman AI/generator aktivitas yang butuh koneksi).

**Android (Chrome/Edge)**
1. Buka situs TENANGIN. Banner "Install TENANGIN" (dibuat sendiri, lihat
   `components/install-prompt.tsx`) akan muncul di bagian bawah layar, atau ketuk
   menu titik tiga → **Install app**.
2. Ikon TENANGIN muncul di home screen & app drawer, terbuka fullscreen tanpa
   address bar (`display: standalone`).

**iPhone / iPad (Safari)**
1. Buka situs TENANGIN di Safari (wajib Safari — ini batasan dari Apple, browser lain
   di iOS tidak bisa memicu "Add to Home Screen").
2. Karena iOS tidak punya API prompt-install otomatis, TENANGIN menampilkan tip:
   ketuk **Share** → **Add to Home Screen** → **Add**.
3. Ikon TENANGIN muncul di home screen, terbuka fullscreen dengan splash screen
   bermerek (lihat `public/splash/`, mencakup semua ukuran iPhone SE s/d iPhone 16
   Pro Max dan iPad 10.2"/Air/Pro) — bukan layar putih kosong.

**Tablet Android** — sama seperti langkah Android di atas; ikon adaptif (maskable)
sudah disiapkan supaya tidak terpotong di berbagai bentuk mask launcher (bulat,
squircle, dll).

**Windows / macOS (Chrome, Edge, atau Safari di macOS)**
1. Buka situs TENANGIN.
2. Klik ikon **Install** di address bar (atau menu titik tiga → **Install TENANGIN...**).
3. Aplikasi terpasang dan bisa dibuka dari taskbar/dock/start menu/Launchpad dengan
   ikon sendiri, dalam window standalone tanpa address bar. Windows klasik ("Pin to
   Start") juga didukung lewat `public/browserconfig.xml` + ikon `mstile-*`.

**Detail teknis:**
- `public/manifest.webmanifest` — nama (`TENANGIN`), subtitle/description
  ("Teman Parenting Tanpa Bentakan"), `display: standalone`, warna tema, seluruh
  ukuran ikon (`any` + `maskable`), dan app shortcuts (Teman AI, Planner, Aktivitas).
- `app/layout.tsx` — metadata `icons` (favicon, apple-touch-icon beberapa ukuran),
  `appleWebApp.startupImage` (splash screen iOS, dibaca otomatis dari
  `public/splash/manifest.json`), serta meta tag Windows tile.
- `public/sw.js` — service worker dengan strategi **cache-first** untuk aset statis
  (ikon, splash, JS/CSS hasil build) dan **network-first dengan fallback cache/offline**
  untuk navigasi halaman, plus `public/offline.html` sebagai jaring pengaman terakhir.
  Panggilan ke `/api/*` (Teman AI, generator aktivitas) **selalu** langsung ke jaringan,
  tidak pernah di-cache/dipalsukan.
- `components/register-sw.tsx` — mendaftarkan service worker & otomatis mengaktifkan
  versi baru saat ada update (tanpa perlu pengguna menutup semua tab).
- `components/install-prompt.tsx` — banner install kustom (Android/desktop pakai event
  asli `beforeinstallprompt`; iOS pakai instruksi manual karena Apple tidak menyediakan
  API prompt).
- `public/icons/`, `public/favicon.ico`, `public/splash/` — seluruh aset digenerate
  dari `public/brand/logo-mark.png` lewat `scripts/gen-pwa-assets.py`.

> Ganti logo? Timpa `public/brand/logo-mark.png` (PNG transparan, persegi, min.
> 512×512), lalu jalankan ulang:
> ```bash
> pip install pillow
> python3 scripts/gen-pwa-assets.py
> ```
> Ini otomatis menulis ulang semua ukuran ikon (any/maskable/apple/favicon/mstile
> Windows) dan seluruh splash screen iOS dengan proporsi yang konsisten.

---

## 10. Catatan biaya Gemini

Semua fitur AI memakai model `gemini-2.5-flash` (cepat, dan tersedia lewat free tier Gemini
API — cocok untuk MVP tanpa perlu mengaktifkan billing). Kalau traffic mulai besar dan
melewati kuota gratis, pertimbangkan menambah rate-limit sederhana per user di API route
sebelum go big, atau upgrade ke tier berbayar di [aistudio.google.com](https://aistudio.google.com).

---

## 11. Arsitektur sistem AI ("Teman AI")

Ditambahkan di atas MVP awal, semuanya production-ready dan saling terhubung:

- **First impression** — splash screen bermerek (`components/splash-screen.tsx`, `components/logo.tsx`) menggantikan 3 titik polos, dipakai di `app/page.tsx`, `app/loading.tsx`, dan `app-shell.tsx`.
- **Onboarding** — `app/register/page.tsx` dirombak jadi wizard 3 langkah (nama anak → usia → akun) dengan progress bar dan copywriting yang menyapa, bukan form transaksional.
- **Retensi harian** — `lib/use-daily-streak.ts` melacak hari beruntun membuka aplikasi (terpisah dari streak belajar Bertumbuh), ditampilkan di Beranda dengan animasi saat bertambah.
- **Renungan harian** — `lib/quotes.ts` menyajikan satu kutipan hangat per hari (deterministik per tanggal, tanpa API/koneksi) sebagai alasan kecil untuk kembali setiap hari.
- **Gamifikasi ringan** — `lib/badges.ts` + `lib/use-badges.ts` + grid pencapaian di `app/profil/page.tsx`. Tidak ada leaderboard/skor kompetitif, murni penanda progres pribadi.
- **Feedback sistem** — `lib/toast-context.tsx` (toast sukses/gagal/info) dipasang di seluruh aksi penting: mood check-in, tantangan harian, aktivitas, planner, refleksi, materi Bertumbuh.
- **Micro-interaction** — `lib/haptics.ts` (getaran halus via `navigator.vibrate`, aman di browser yang tidak mendukung) dan `components/confetti.tsx` (perayaan CSS ringan) dipicu saat milestone: planner selesai semua, materi Bertumbuh tuntas.
- **Empty & error state** — `components/empty-state.tsx` dan `components/error-state.tsx` (dengan tombol "Coba lagi") menggantikan teks generik di Aktivitas dan Planner.
- **Loading state** — `components/skeleton.tsx` dipakai di Beranda saat data progres belum siap, menggantikan konten yang muncul tiba-tiba.
- **Dark mode** — `lib/theme.ts` + `components/theme-toggle.tsx`, dengan skrip anti-kedip di `app/layout.tsx` (tema diterapkan sebelum first paint).
- **Aksesibilitas** — `prefers-reduced-motion` dihormati secara global di `app/globals.css`; atribut `aria-pressed`/`aria-live`/`role` ditambahkan pada kontrol interaktif utama.
- **Keamanan** — `next` dinaikkan ke `14.2.35` (menutup advisory keamanan pada `14.2.5`).


Semua logika AI ada di `lib/ai/` (murni TypeScript, tidak menyentuh UI) dan dipanggil dari
beberapa API route. Prinsip utamanya: **hemat token, stabil, dan aman** — panggilan Gemini
hanya dipakai di tempat yang benar-benar butuh generasi bahasa; segala sesuatu yang bisa
ditentukan lewat aturan (rules) dibuat deterministik supaya gratis dan tidak pernah gagal.

```
lib/ai/
  system-prompt.ts      # Prompt Template — persona statis (cache-friendly) + konteks dinamis
  safety-guard.ts        # Safety Guard — deteksi krisis (kata kunci), balasan aman tanpa panggil AI
  emotion.ts              # Emotion Detection — klasifikasi mood cepat berbasis kata kunci
  memory.ts               # Memory Strategy — ringkasan obrolan, diperbarui tiap 8 pesan
  parenting-engine.ts    # Parenting Recommendation Engine — rule-based, memetakan topik ke materi Bertumbuh
  daily-challenge.ts      # Daily Reminder Logic — tantangan harian deterministik per tanggal
  reflection.ts           # Reflection Engine — template refleksi + afirmasi akhir sesi
  gemini-client.ts        # Wrapper panggilan Gemini (model, timeout, parsing JSON aman)

app/api/
  companion/route.ts             # Chat utama: Safety Guard -> Emotion -> 1x panggilan Gemini (JSON terstruktur)
  companion/memory/route.ts      # Perbarui ringkasan memori (dipanggil tiap 8 pesan, bukan tiap pesan)
  companion/reflection/route.ts  # Refleksi + afirmasi akhir sesi (tombol "Refleksi" di halaman Teman AI)
  daily-challenge/route.ts       # Tantangan harian (tanpa panggil Gemini sama sekali)
  generate-activity/route.ts     # Generator ide aktivitas anak, kini sadar tahap perkembangan usia
```

**Conversation flow chat companion:**
1. Pesan pengguna dicek `safety-guard.ts` dulu — kalau ada indikasi krisis, balasan tetap
   (sudah ditulis manusia, bukan hasil AI) langsung dikirim, tanpa panggil Gemini sama sekali.
2. Kalau aman, `emotion.ts` mendeteksi mood cepat dari kata kunci sebagai fallback.
3. `system-prompt.ts` merangkai prompt: persona tetap (bagian ini selalu sama → memanfaatkan
   implicit context caching Gemini) + konteks singkat (nama/usia anak, mood hari ini, ringkasan memori).
4. Hanya `RECENT_MESSAGES_WINDOW` (8) pesan terakhir yang dikirim ke model — bukan seluruh
   riwayat — karena riwayat lama sudah terwakili lewat ringkasan memori.
5. Satu panggilan Gemini, `responseMimeType: application/json`, mengembalikan reply + mood + topic +
   apakah perlu rekomendasi materi — semuanya dalam satu request (irit token & latency).
6. Kalau `needsMaterial` true, `parenting-engine.ts` (rule-based, tanpa AI) memilih materi
   Bertumbuh paling relevan yang belum diselesaikan pengguna.
7. Tiap kelipatan 8 pesan pengguna, client memanggil `companion/memory` untuk merangkum
   obrolan jadi ringkasan baru (maks ~3 kalimat), disimpan di `users/{uid}/companion/memory`.
8. Pengguna bisa menekan tombol "Refleksi" kapan saja setelah beberapa pesan — memanggil
   `companion/reflection` untuk mendapat refleksi + afirmasi singkat akhir sesi.

Struktur key tambahan (masih di local storage, lihat §8):
- `users/{uid}/companion/memory` — ringkasan memori percakapan
- `users/{uid}/reflections/{id}` — riwayat refleksi akhir sesi
- `users/{uid}/daily/{YYYY-MM-DD}` — tantangan kecil harian + status selesai

---

## 12. Changelog — Redesign Premium (Audit UX/UI)

Ditambahkan di atas MVP awal, semuanya production-ready dan saling terhubung:

- **First impression** — splash screen bermerek (`components/splash-screen.tsx`, `components/logo.tsx`) menggantikan 3 titik polos, dipakai di `app/page.tsx`, `app/loading.tsx`, dan `app-shell.tsx`.
- **Onboarding** — `app/register/page.tsx` dirombak jadi wizard 3 langkah (nama anak → usia → akun) dengan progress bar dan copywriting yang menyapa, bukan form transaksional.
- **Retensi harian** — `lib/use-daily-streak.ts` melacak hari beruntun membuka aplikasi (terpisah dari streak belajar Bertumbuh), ditampilkan di Beranda dengan animasi saat bertambah.
- **Renungan harian** — `lib/quotes.ts` menyajikan satu kutipan hangat per hari (deterministik per tanggal, tanpa API/koneksi) sebagai alasan kecil untuk kembali setiap hari.
- **Gamifikasi ringan** — `lib/badges.ts` + `lib/use-badges.ts` + grid pencapaian di `app/profil/page.tsx`. Tidak ada leaderboard/skor kompetitif, murni penanda progres pribadi.
- **Feedback sistem** — `lib/toast-context.tsx` (toast sukses/gagal/info) dipasang di seluruh aksi penting: mood check-in, tantangan harian, aktivitas, planner, refleksi, materi Bertumbuh.
- **Micro-interaction** — `lib/haptics.ts` (getaran halus via `navigator.vibrate`, aman di browser yang tidak mendukung) dan `components/confetti.tsx` (perayaan CSS ringan) dipicu saat milestone: planner selesai semua, materi Bertumbuh tuntas.
- **Empty & error state** — `components/empty-state.tsx` dan `components/error-state.tsx` (dengan tombol "Coba lagi") menggantikan teks generik di Aktivitas dan Planner.
- **Loading state** — `components/skeleton.tsx` dipakai di Beranda saat data progres belum siap, menggantikan konten yang muncul tiba-tiba.
- **Dark mode** — `lib/theme.ts` + `components/theme-toggle.tsx`, dengan skrip anti-kedip di `app/layout.tsx` (tema diterapkan sebelum first paint).
- **Aksesibilitas** — `prefers-reduced-motion` dihormati secara global di `app/globals.css`; atribut `aria-pressed`/`aria-live`/`role` ditambahkan pada kontrol interaktif utama.
- **Keamanan** — `next` dinaikkan ke `14.2.35` (menutup advisory keamanan pada `14.2.5`).

### Verifikasi
- `npx tsc --noEmit` — lolos tanpa error di seluruh project.
- `npm run build` — hanya gagal di sandbox tertutup karena `next/font` butuh mengunduh Google Fonts (Inter, Fraunces) saat build; di lingkungan dengan akses internet normal (lokal/Vercel) ini akan berjalan normal seperti sebelumnya.

---

## 13. Changelog — Local-only (tanpa akun/cloud)

- **Tanpa Firebase** — `firebase` dihapus dari dependencies; `lib/firebase.ts` dan
  `firestore.rules` dihapus.
- **`lib/local-db.ts`** (baru) — lapisan data pengganti Firestore, API-compatible
  (`doc`, `collection`, `query`, `onSnapshot`, dst.) tapi membaca/menulis `localStorage`.
- **`lib/auth-context.tsx`** — dirombak: tidak ada Firebase Auth, hanya id lokal per
  device + profil yang tersimpan di local-db.
- **Onboarding** — `app/register/page.tsx` disederhanakan dari 3 langkah (termasuk
  email/password) menjadi 2 langkah: nama anak → usia anak. `app/login/page.tsx` dihapus.
- **`app/profil/page.tsx`** — tombol "Keluar" diganti kartu "Cadangkan data" (ekspor/impor
  `.json` manual) dan tombol "Hapus semua data di HP ini" (dengan konfirmasi).
- **`UserProfile`** (`lib/types.ts`) — field `email` dihapus.

### Verifikasi
- Tidak ada error sintaks/import terdeteksi lewat pemeriksaan `tsc` per-file (sandbox ini
  tidak punya akses jaringan untuk `npm install` penuh + `tsc --noEmit` menyeluruh dengan
  seluruh type Next.js/React — disarankan jalankan `npx tsc --noEmit` sekali lagi di
  lingkungan lokal/CI sebelum deploy untuk verifikasi akhir).
- `npm run build` belum dicoba di sandbox ini karena keterbatasan jaringan yang sama.

---

---

## 14. Changelog — Logo resmi & bisa di-install (PWA)

- **Logo asli TENANGIN** dipasang menggantikan ikon SVG generik sebelumnya:
  - `components/logo.tsx` sekarang merender `public/brand/logo-mark.png` (logo asli,
    latar transparan, hasil crop otomatis dari file yang diunggah) lewat `next/image`.
  - Dipakai otomatis di semua tempat lama yang memanggil `<Logo />` (splash screen,
    halaman Profil, halaman Register) — tidak ada perubahan API komponen.
- **Bisa di-install di semua perangkat (PWA)** — lihat §9 untuk cara install-nya:
  - `public/manifest.webmanifest` (baru) — nama, ikon, warna tema.
  - `public/icons/` (baru) — `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`,
    `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-16x16.png`,
    `favicon-32x32.png`, semuanya digenerate dari logo yang sama.
  - `public/favicon.ico` (baru) — favicon multi-ukuran untuk tab browser lama.
  - `app/layout.tsx` — tambah `metadata.manifest`, `metadata.icons`,
    `metadata.appleWebApp` (mekanisme khusus supaya "Add to Home Screen" di Safari
    iOS/iPadOS memakai ikon yang benar).
  - `public/sw.js` + `components/register-sw.tsx` (baru) — service worker minimal
    (network-first, tidak meng-cache `/api/*` maupun data pengguna) supaya Chrome
    Android/desktop menampilkan prompt/tombol "Install".

---

## 15. Changelog — Style guide & personalisasi sapaan

- **Sapaan resmi "Ibu" / "Bu {Nama}"** menggantikan "Bunda" di seluruh aplikasi
  (Beranda, Bertumbuh, Teman AI, Planner, Profil, Register, splash screen, metadata).
  Ditegakkan lewat helper terpusat `lib/greeting.ts` (`sapaan()`, `timeGreeting()`) —
  sebelumnya fungsi salam waktu duplikat persis di dua halaman, sekarang satu sumber.
- **Field baru `parentName` (opsional)** di `UserProfile` — diisi di langkah pertama
  onboarding (`app/register/page.tsx`, bisa dilewati) atau lewat halaman Profil.
  Kalau diisi, sapaan otomatis jadi "Bu {Nama}"; kalau tidak, tetap "Ibu". Ini juga
  memperbaiki bug lama di Teman AI yang salah memakai nama anak sebagai nama panggilan Ibu.
- **Emoji dirapikan** — dibatasi hanya di kalimat sapaan, dan hanya dari set
  ❤️ 😊 ☺️ 🥰 🙏. Emoji dekoratif lain (🌿🎉✨👏🫶👋 dll.) dihapus dari toast dan
  tombol di seluruh halaman. Emoji mood-tracker (😊😌😐😢😩) di Beranda TIDAK
  disentuh karena itu fitur inti, bukan gaya bahasa.
- **Persona "Teman AI" diperbarui** (`lib/ai/system-prompt.ts`, `lib/ai/reflection.ts`,
  `app/api/generate-activity/route.ts`) — sekarang secara eksplisit diinstruksikan
  memakai sapaan "Ibu"/"Bu {nama}", emoji terbatas, tanpa tanda seru berlebihan, dan
  tanpa kalimat motivasi panjang/klise, konsisten dengan style guide produk.

---

## 16. Changelog — PWA penuh (installable di semua platform) & migrasi ke IndexedDB

**PWA (Android, iPhone, iPad, tablet Android, Windows, macOS):**
- **Ikon lengkap digenerate ulang** dari `public/brand/logo-mark.png` lewat script baru
  `scripts/gen-pwa-assets.py`: ikon `any` (48–512px), ikon `maskable` dengan safe-zone
  padding yang benar (48–512px), apple-touch-icon (120/152/167/180px), favicon
  (16/32/48px PNG + `favicon.ico` multi-resolusi), dan ikon Windows tile
  (`mstile-*` + `public/browserconfig.xml`).
- **Splash screen iPhone/iPad statis** (`public/splash/`, 32 file) — mencakup iPhone SE
  s/d iPhone 16 Pro Max dan iPad 10.2"/Air/Pro-11/Pro-12.9, portrait & landscape,
  dipasang otomatis di `app/layout.tsx` lewat `appleWebApp.startupImage`.
- **`public/manifest.webmanifest` dirombak** — nama & subtitle resmi ("TENANGIN — Teman
  Parenting Tanpa Bentakan"), daftar ikon lengkap, `display_override`, `categories`,
  dan app shortcuts (Teman AI, Planner, Aktivitas).
- **`public/sw.js` ditulis ulang** — dari sekadar "installable trigger" jadi service
  worker dengan cache offline sungguhan: cache-first untuk aset statis (ikon, splash,
  JS/CSS Next.js), network-first dengan fallback cache/`offline.html` untuk navigasi
  halaman. `/api/*` tetap selalu network-only.
- **`components/register-sw.tsx`** — kini menangani update service worker (auto-refresh
  begitu versi baru siap, tanpa perlu pengguna menutup semua tab).
- **`components/install-prompt.tsx`** (baru) — banner "Install TENANGIN": pakai
  `beforeinstallprompt` asli di Android/desktop, instruksi manual "Share → Add to Home
  Screen" di iOS (yang tidak punya API prompt bawaan).
- **`app/layout.tsx`** — metadata di-lengkapi: banyak ukuran apple-touch-icon,
  `startupImage`, meta tag Windows tile, `viewportFit: cover` untuk notch/safe-area.

**Migrasi arsitektur data: localStorage → IndexedDB**
- **`lib/local-db.ts` ditulis ulang total** — sebelumnya semua "dokumen" (mood,
  planner, progres Bertumbuh, riwayat aktivitas, riwayat Teman AI, dst.) disimpan
  sebagai string JSON di `localStorage`. Sekarang disimpan di **IndexedDB**
  (object store `docs`, satu record per path), dengan cache di memori supaya
  komponen React tetap bisa baca data secara sinkron seperti sebelumnya — jadi
  **tidak ada perubahan** yang diperlukan di halaman-halaman yang memakainya
  (`beranda`, `planner`, `aktivitas`, `bertumbuh`, `companion`, `profil`, dst.).
- **`localStorage` sekarang murni untuk setting ringan** — hanya id perangkat anonim
  (`tenangin:uid`) dan preferensi tema (`tenangin-theme`).
- **Ekspor/impor/hapus data** (`exportAllData`, `importAllData`, `clearAllLocalData`)
  di-upgrade jadi `async` dan mencakup IndexedDB + setting ringan, dengan kompatibilitas
  membaca file cadangan format lama (v1, murni `localStorage`).
- **Tidak ada Firebase, Authentication, Firestore, atau Storage** di mana pun dalam
  proyek ini (sudah begitu sebelumnya juga — tidak pernah ada dependency `firebase` di
  `package.json`). Sisa penyebutan "Firestore" di komentar kode (peninggalan penamaan
  API lama) sudah dibersihkan.
- **Tidak ada login, registrasi, atau email** — onboarding tetap wizard lokal singkat
  (nama Ibu opsional, nama anak, usia anak) tanpa akun apa pun.

### Verifikasi
- `npx tsc --noEmit` — lolos tanpa error di seluruh project.
- `npm run build` — berhasil penuh (`✓ Compiled successfully`, seluruh 17 route
  ter-generate) saat diuji dengan font Google Fonts dinonaktifkan sementara (sandbox
  ini tidak punya akses ke `fonts.googleapis.com`); konfigurasi asli (`next/font/google`
  untuk Fraunces & Inter) dikembalikan setelah verifikasi, dan akan berjalan normal di
  lingkungan dengan akses internet biasa (lokal/Vercel).
