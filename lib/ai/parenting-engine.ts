// Parenting Recommendation Engine
// ------------------------------------------------------------------
// Rule-based (bukan panggilan AI tambahan) supaya cepat, gratis, dan hasilnya
// stabil/dapat diprediksi. Memetakan kata kunci topik curhatan pengguna ke
// materi "Bertumbuh" yang paling relevan (lib/growth-content.ts).
//
// Dipanggil dari app/api/companion/route.ts memakai field "topic" yang
// dikembalikan model (lihat lib/ai/system-prompt.ts) ditambah teks asli
// pesan pengguna sebagai sinyal cadangan.

import { GROWTH_MATERIALS } from "@/lib/growth-content";
import type { EmotionTag } from "./emotion";

type MaterialRule = { materiId: string; keywords: string[] };

const RULES: MaterialRule[] = [
  { materiId: "menyapa-amarah", keywords: ["marah", "emosi", "kesel", "kesal", "bentak", "membentak", "geram"] },
  { materiId: "jeda-sebelum-bereaksi", keywords: ["gampang reaktif", "keceplosan", "gak sempat mikir", "refleks"] },
  { materiId: "mata-anak", keywords: ["tantrum", "rewel", "susah diatur", "bandel", "nggak nurut", "ngambek"] },
  { materiId: "kalimat-menenangkan", keywords: ["bentak", "kata-kata", "ngomong kasar", "nyesel ngomong"] },
  { materiId: "momen-kecil-koneksi", keywords: ["jauh", "gak dekat", "sibuk", "gak sempat main", "quality time"] },
  { materiId: "rutinitas-tenang", keywords: ["berantakan", "gak teratur", "susah tidur", "jadwal"] },
  { materiId: "memaafkan-diri", keywords: ["bersalah", "nyesel", "gagal", "orang tua buruk", "menyesal"] },
  { materiId: "rayakan-langkah-kecil", keywords: ["capek banget", "udah usaha", "gak ada hasil", "lelah berjuang"] },
];

const EMOTION_FALLBACK: Partial<Record<EmotionTag, string>> = {
  marah: "menyapa-amarah",
  kewalahan: "rayakan-langkah-kecil",
  sedih: "memaafkan-diri",
  cemas: "jeda-sebelum-bereaksi",
};

/**
 * Cari materi paling relevan berdasarkan topik/teks curhatan.
 * completedIds dipakai supaya tidak merekomendasikan materi yang sudah selesai.
 */
export function recommendMaterial(
  text: string,
  emotion: EmotionTag,
  completedIds: string[] = []
): string | null {
  const lower = text.toLowerCase();
  const notCompleted = (id: string) => !completedIds.includes(id);

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw)) && notCompleted(rule.materiId)) {
      return rule.materiId;
    }
  }

  const fallbackId = EMOTION_FALLBACK[emotion];
  if (fallbackId && notCompleted(fallbackId)) return fallbackId;

  return null;
}

export function getMaterialTitle(materiId: string): string | null {
  return GROWTH_MATERIALS.find((m) => m.id === materiId)?.title ?? null;
}
