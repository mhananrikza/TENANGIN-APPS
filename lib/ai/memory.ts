// Memory Strategy
// ------------------------------------------------------------------
// Supaya "Teman AI" terasa ingat obrolan sebelumnya TANPA mengirim seluruh
// riwayat chat ke Gemini setiap kali (mahal & lambat), kita simpan satu
// "ringkasan memori" pendek (maks ~120 token) di IndexedDB:
//   users/{uid}/companion/memory
//
// Alurnya:
// 1. Tiap request chat hanya mengirim ringkasan memori + N pesan terakhir
//    (bukan seluruh histori) ke system prompt.
// 2. Setiap kelipatan MEMORY_UPDATE_INTERVAL pesan pengguna, client memanggil
//    /api/companion/memory untuk memperbarui ringkasan (1 panggilan murah,
//    output dibatasi ketat) — ringkasan lama + pesan baru → ringkasan baru.
// 3. Ringkasan ini juga dipakai Parenting Recommendation Engine untuk tahu
//    topik apa saja yang sudah pernah dibahas.

// Tipe data CompanionMemory ada di lib/types.ts (disimpan lewat lib/local-db.ts).

export const MEMORY_UPDATE_INTERVAL = 8; // setiap 8 pesan pengguna, ringkasan diperbarui
export const RECENT_MESSAGES_WINDOW = 8; // hanya kirim 8 pesan terakhir sebagai konteks langsung

export function shouldUpdateMemory(userMessageCount: number): boolean {
  return userMessageCount > 0 && userMessageCount % MEMORY_UPDATE_INTERVAL === 0;
}

export function buildMemorySummarizationPrompt(previousSummary: string, recentText: string): string {
  return `Ringkas percakapan seorang ibu dengan teman AI-nya di aplikasi parenting TENANGIN.
Ringkasan sebelumnya: "${previousSummary || "(belum ada)"}"

Percakapan baru:
${recentText}

Gabungkan jadi SATU ringkasan baru, maksimal 3 kalimat, bahasa Indonesia, fokus pada: pola perasaan yang sering muncul, isu parenting yang dibahas, dan hal penting tentang anak/keluarganya. Jangan sertakan detail sensitif yang tidak perlu. Balas HANYA teks ringkasan, tanpa embel-embel.`;
}
