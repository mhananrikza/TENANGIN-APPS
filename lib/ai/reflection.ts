// Reflection Engine
// ------------------------------------------------------------------
// Dipanggil saat pengguna menekan "Minta refleksi" di halaman Teman AI
// (biasanya di akhir sesi curhat). Satu panggilan Gemini singkat, output
// dibatasi ketat (maxTokens kecil) supaya hemat, dengan fallback statis
// kalau API gagal supaya fitur tidak pernah terasa "rusak".

export type ReflectionResult = {
  reflection: string;
  affirmation: string;
};

export function buildReflectionPrompt(conversationText: string): string {
  return `Berikut potongan obrolan seorang Ibu dengan teman AI di aplikasi parenting TENANGIN:

${conversationText}

Buatkan refleksi singkat untuknya. Sapa/sebut sebagai "Ibu" saja kalau perlu, jangan pakai "Bunda", "Mama", "Mami", atau "Mom". Jangan pakai emoji. Jangan pakai tanda pisah panjang (—); kalau perlu jeda, pakai koma atau titik. Balas HANYA JSON valid, tanpa markdown:
{"reflection":"1-2 kalimat refleksi lembut tentang apa yang ia rasakan/lalui, membantu ia menyadari sesuatu, bukan menggurui","affirmation":"1 kalimat afirmasi singkat dan tulus, tidak berlebihan, tidak klise"}`;
}

export function fallbackReflection(): ReflectionResult {
  return {
    reflection:
      "Terima kasih sudah meluangkan waktu untuk cerita hari ini. Menyadari dan menyuarakan perasaanmu saja sudah langkah yang berarti.",
    affirmation: "Kamu sedang berusaha, dan itu cukup untuk hari ini.",
  };
}
