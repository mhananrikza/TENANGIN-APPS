import { NextRequest, NextResponse } from "next/server";
import { pickDailyChallenge } from "@/lib/ai/daily-challenge";

export const runtime = "nodejs";

// Daily Reminder Logic — deterministik, tanpa panggilan Gemini, tanpa biaya,
// dan hasilnya konsisten sepanjang hari yang sama. Lihat lib/ai/daily-challenge.ts.

export async function POST(req: NextRequest) {
  let body: { dateKey?: string; currentMateriId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  if (!body.dateKey) {
    return NextResponse.json({ error: "dateKey wajib diisi." }, { status: 400 });
  }

  const result = pickDailyChallenge(body.dateKey, body.currentMateriId);
  return NextResponse.json(result);
}
