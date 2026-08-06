// Emotion Detection
// ------------------------------------------------------------------
// Dua lapis deteksi:
// 1. Deteksi kata kunci (cepat, gratis, jalan di server tanpa panggil Gemini)
//    dipakai sebagai fallback dan untuk menyalakan Safety Guard secepat mungkin.
// 2. Tag mood yang dikembalikan oleh model dalam structured output
//    (lihat lib/ai/gemini-client.ts) — lebih akurat karena memahami konteks kalimat.
//
// Kedua lapis memakai set tag yang sama supaya konsisten dipakai di UI,
// di Parenting Recommendation Engine, dan disimpan ke Memory.

export const EMOTION_TAGS = [
  "senang",
  "tenang",
  "biasa",
  "lelah",
  "sedih",
  "cemas",
  "marah",
  "kewalahan",
] as const;

export type EmotionTag = (typeof EMOTION_TAGS)[number];

const KEYWORD_MAP: Record<EmotionTag, string[]> = {
  senang: ["senang", "bahagia", "seru", "asik", "bersyukur", "lucu banget"],
  tenang: ["tenang", "lega", "damai", "adem"],
  biasa: ["biasa aja", "standar", "b aja"],
  lelah: ["capek", "cape", "lelah", "ngantuk", "kurang tidur", "gak ada tenaga", "burnout"],
  sedih: ["sedih", "nangis", "kecewa", "hampa", "down", "terpuruk"],
  cemas: ["cemas", "khawatir", "takut", "panik", "was-was", "overthinking", "kepikiran terus"],
  marah: ["marah", "kesel", "kesal", "emosi", "geram", "bete", "jengkel"],
  kewalahan: ["kewalahan", "gak sanggup", "nggak sanggup", "gak kuat", "berat banget", "numpuk semua", "sendirian"],
};

/**
 * Deteksi cepat berbasis kata kunci. Dipakai sebelum memanggil Gemini supaya
 * Safety Guard & pemilihan nada bicara tidak bergantung pada API yang bisa gagal.
 */
export function detectEmotionFromText(text: string): EmotionTag {
  const lower = text.toLowerCase();
  let best: EmotionTag = "biasa";
  let bestScore = 0;

  for (const tag of EMOTION_TAGS) {
    const hits = KEYWORD_MAP[tag].filter((kw) => lower.includes(kw)).length;
    if (hits > bestScore) {
      bestScore = hits;
      best = tag;
    }
  }
  return best;
}

export function isValidEmotionTag(value: unknown): value is EmotionTag {
  return typeof value === "string" && (EMOTION_TAGS as readonly string[]).includes(value);
}

/** Nada bicara singkat yang disisipkan ke system prompt, disesuaikan mood. */
export function toneHintForEmotion(tag: EmotionTag): string {
  switch (tag) {
    case "lelah":
    case "kewalahan":
      return "Pengguna sedang lelah/kewalahan. Validasi dulu, jangan buru-buru kasih solusi, kalimat pendek.";
    case "sedih":
      return "Pengguna sedang sedih. Dengarkan dulu, jangan buru-buru menghibur berlebihan atau menyimpulkan.";
    case "cemas":
      return "Pengguna sedang cemas/overthinking. Bantu ia menurunkan intensitas pikiran, satu langkah kecil dulu.";
    case "marah":
      return "Pengguna sedang kesal. Jangan menghakimi, beri ruang untuk perasaannya dulu sebelum masuk ke saran.";
    case "senang":
      return "Pengguna sedang senang. Ikut senang bersamanya, singkat dan tulus, tidak perlu menggurui.";
    case "tenang":
      return "Pengguna sedang tenang. Jaga suasana itu, obrolan boleh lebih santai.";
    default:
      return "Nada netral-hangat seperti biasa.";
  }
}
