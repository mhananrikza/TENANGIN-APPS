// Daily Reminder Logic + Tantangan Harian
// ------------------------------------------------------------------
// Sengaja DETERMINISTIK (bukan panggil Gemini) supaya:
// - Selalu tersedia instan, tanpa biaya, tanpa risiko gagal API.
// - Konsisten sepanjang hari yang sama (dihitung dari dateKey, bukan random
//   tiap refresh) — walau dipanggil berkali-kali, hasilnya sama.
//
// Sumber tantangan diprioritaskan dari "action" milik materi Bertumbuh yang
// sedang dijalani pengguna (biar nyambung dengan progres belajarnya), dengan
// daftar cadangan generik kalau materi belum ada progres.

import { GROWTH_MATERIALS } from "@/lib/growth-content";

const FALLBACK_CHALLENGES = [
  "Tarik napas panjang 3 kali sebelum menanggapi anak hari ini, walau situasinya biasa saja.",
  "Peluk anakmu 10 detik lebih lama dari biasanya, tanpa buru-buru.",
  "Catat satu hal kecil yang kamu syukuri dari harimu bersama anak.",
  "Sebelum tidur, ucapkan satu kalimat baik untuk dirimu sendiri, bukan cuma untuk anak.",
  "Coba 5 menit bermain mengikuti keinginan anak, tanpa gawai di tangan.",
  "Kalau hari ini terasa berat, izinkan dirimu istirahat sebentar tanpa merasa bersalah.",
  "Ganti satu kalimat teguran hari ini dengan kalimat yang lebih menenangkan.",
];

function dayIndexFromDateKey(dateKey: string): number {
  // dateKey format "YYYY-MM-DD" — dijadikan angka stabil harian.
  const digits = dateKey.replace(/-/g, "");
  let sum = 0;
  for (const ch of digits) sum += ch.charCodeAt(0);
  return sum;
}

export type DailyChallenge = {
  challenge: string;
  source: "materi" | "curated";
  materiId?: string;
};

export function pickDailyChallenge(dateKey: string, currentMateriId?: string): DailyChallenge {
  if (currentMateriId) {
    const material = GROWTH_MATERIALS.find((m) => m.id === currentMateriId);
    if (material?.action) {
      return { challenge: material.action, source: "materi", materiId: material.id };
    }
  }
  const idx = dayIndexFromDateKey(dateKey) % FALLBACK_CHALLENGES.length;
  return { challenge: FALLBACK_CHALLENGES[idx], source: "curated" };
}
