// Safety Guard
// ------------------------------------------------------------------
// Diperiksa SEBELUM memanggil Gemini. Kalau ada indikasi krisis, aplikasi
// membalas dengan pesan yang sudah ditetapkan (deterministik, tidak bergantung
// pada model) supaya:
// 1. Responnya selalu konsisten dan aman, tidak pernah "meleset".
// 2. Tidak ada biaya panggilan API untuk kasus paling sensitif.
// 3. Nomor bantuan yang diberikan selalu benar (tidak dikarang model).

export type SafetyCategory = "self_harm" | "risk_to_child" | "none";

export type SafetyCheckResult = {
  category: SafetyCategory;
  triggeredMessage?: string;
};

const SELF_HARM_PATTERNS = [
  /bunuh diri/i,
  /mengakhiri hidup/i,
  /gak (mau|pengen) hidup/i,
  /nggak (mau|pengen) hidup/i,
  /pengen mati/i,
  /pingin mati/i,
  /ingin mati/i,
  /menyakiti diri/i,
  /melukai diri/i,
  /nyilet/i,
  /self harm/i,
];

// Ungkapan dorongan untuk menyakiti anak akibat kewalahan. Ditangani dengan
// sangat hati-hati: tidak menghakimi, tapi tetap mengarahkan ke bantuan nyata.
const RISK_TO_CHILD_PATTERNS = [
  /pengen (mukul|nampar|banting) anak/i,
  /mau (mukul|nampar|banting) anak/i,
  /hampir (mukul|nyakitin|nyubit) anak/i,
  /takut nyakitin anak/i,
  /takut mencelakai anak/i,
];

const SELF_HARM_RESPONSE =
  "Makasih udah cerita sejujurnya ke aku, itu berat banget rasanya, ya. Aku pengin kamu tetap aman. " +
  "boleh banget hubungi Layanan Sejiwa Kemenkes di 119 ext 8 (24 jam), atau chat WhatsApp LISA di 0811-3855-472. " +
  "Kalau ada orang terdekat yang kamu percaya, coba hubungi mereka sekarang juga. Kamu nggak harus melewati ini sendirian.";

const RISK_TO_CHILD_RESPONSE =
  "Terima kasih sudah berani jujur soal ini. Itu butuh keberanian besar. Perasaan itu tanda kamu sedang sangat kewalahan, " +
  "bukan tanda kamu orang tua yang jahat. Yuk, kalau bisa sekarang, jauhkan diri sejenak dari anak (walau cuma ke ruangan lain), " +
  "tarik napas panjang, dan hubungi orang dewasa lain yang bisa bantu jaga. Kalau butuh bicara dengan konselor, " +
  "Layanan SAPA 129 (Kementerian PPPA) bisa dihubungi lewat telepon 129 atau WhatsApp 08111-129-129, kapan saja.";

export function checkSafety(text: string): SafetyCheckResult {
  if (SELF_HARM_PATTERNS.some((p) => p.test(text))) {
    return { category: "self_harm", triggeredMessage: SELF_HARM_RESPONSE };
  }
  if (RISK_TO_CHILD_PATTERNS.some((p) => p.test(text))) {
    return { category: "risk_to_child", triggeredMessage: RISK_TO_CHILD_RESPONSE };
  }
  return { category: "none" };
}
