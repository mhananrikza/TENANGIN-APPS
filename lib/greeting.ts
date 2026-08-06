// Sapaan & salam TENANGIN — satu sumber kebenaran supaya nada bicara di
// seluruh aplikasi konsisten dengan style guide:
//   - Sapaan yang dipakai: "Ibu" atau "Bu {Nama}" (bukan Bunda/Mama/Mami/Mom).
//   - "Bu {Nama}" hanya dipakai kalau pengguna sudah mengisi namanya sendiri
//     di Profil/onboarding; kalau belum, jatuh ke "Ibu" biasa.

export type SapaanProfile = { parentName?: string | null } | null | undefined;

/** "Bu Ika" kalau nama diisi, atau "Ibu" polos kalau belum. */
export function sapaan(profile: SapaanProfile): string {
  const name = profile?.parentName?.trim();
  return name ? `Bu ${name}` : "Ibu";
}

/** Salam sesuai jam saat ini: "Selamat pagi/siang/sore/malam". */
export function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}
