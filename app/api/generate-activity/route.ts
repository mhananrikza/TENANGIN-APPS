import { NextRequest, NextResponse } from "next/server";
import type { GenerateActivityRequest } from "@/lib/types";
import { callGemini, safeParseJSON } from "@/lib/ai/gemini-client";

export const runtime = "nodejs";

function ageLabel(months: number) {
  if (months < 12) return `${months} bulan`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y} tahun ${m} bulan` : `${y} tahun`;
}

// Tahap perkembangan singkat supaya ide aktivitas lebih tepat sasaran
// (tanpa perlu panggilan AI tambahan — cukup ditambahkan sebagai konteks prompt).
function developmentalStage(months: number): string {
  if (months < 6) return "bayi awal: fokus pada indera (suara, sentuhan, kontras warna), belum bisa duduk sendiri";
  if (months < 12) return "bayi merangkak/belajar duduk: eksplorasi objek, permanensi objek, mulai merangkak";
  if (months < 24) return "batita awal: belajar jalan, kata-kata pertama, suka meniru dan bongkar-pasang";
  if (months < 36) return "batita: bahasa berkembang cepat, mulai main pura-pura, butuh banyak gerak fisik";
  if (months < 60) return "prasekolah: imajinasi aktif, suka bertanya, mulai bisa ikuti aturan main sederhana";
  return "usia sekolah awal: suka tantangan, permainan berstruktur, mulai bisa kerja sama dalam kelompok kecil";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum diatur di server." },
      { status: 500 }
    );
  }

  let body: GenerateActivityRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const { childName, ageMonths, ageBandLabel, mood, duration, budget, materials } = body;

  if (!ageMonths || ageMonths <= 0) {
    return NextResponse.json({ error: "Usia anak belum valid." }, { status: 400 });
  }

  const prompt = `Kamu adalah asisten parenting yang hangat dan praktis untuk aplikasi bernama TENANGIN.
Buatkan SATU ide aktivitas untuk anak bernama "${childName || "si kecil"}" berusia ${
    ageBandLabel || ageLabel(ageMonths)
  } (tahap perkembangan: ${developmentalStage(ageMonths)}).
${mood ? `Mood anak saat ini: ${mood}.` : ""}
${duration ? `Waktu yang tersedia sekitar: ${duration}.` : ""}
${budget ? `Batasan budget orang tua: ${budget}.` : ""}
${materials ? `Bahan/alat yang tersedia di rumah: ${materials}.` : "Gunakan bahan sederhana yang biasa ada di rumah."}

Aktivitas harus aman dan sesuai tahap perkembangan usia tersebut, mudah disiapkan orang tua yang lelah, dan dijelaskan dengan bahasa Indonesia yang hangat, singkat, tidak menggurui. Kalau perlu menyapa orang tua, sebut "Ibu" saja, jangan pakai "Bunda", "Mama", "Mami", atau "Mom". Jangan pakai emoji.

Balas HANYA dengan JSON valid, tanpa markdown, dengan struktur persis seperti ini:
{
  "title": "judul aktivitas singkat",
  "description": "1-2 kalimat penjelasan kenapa aktivitas ini bagus untuk usia tersebut",
  "durationMinutes": angka_menit_perkiraan,
  "materials": ["bahan 1", "bahan 2"],
  "steps": ["langkah 1", "langkah 2", "langkah 3"],
  "ageRangeLabel": "label rentang usia yang cocok, mis. '2-3 tahun'"
}`;

  try {
    const raw = await callGemini(apiKey, {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      maxTokens: 500,
      jsonMode: true,
    });

    const parsed = safeParseJSON<Record<string, unknown>>(raw);
    if (!parsed) {
      return NextResponse.json(
        { error: "Aku belum bisa jawab sekarang. Boleh dicoba ulang?" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Sepertinya koneksi lagi kurang stabil. Coba lagi sebentar ya." },
      { status: 500 }
    );
  }
}
