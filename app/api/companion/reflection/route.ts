import { NextRequest, NextResponse } from "next/server";
import type { CompanionMessage } from "@/lib/types";
import { buildReflectionPrompt, fallbackReflection, type ReflectionResult } from "@/lib/ai/reflection";
import { callGemini, safeParseJSON } from "@/lib/ai/gemini-client";

export const runtime = "nodejs";

// Reflection Engine — dipanggil saat pengguna menekan "Minta refleksi"
// di halaman Teman AI, biasanya di akhir sesi curhat.

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(fallbackReflection());
  }

  let body: { messages: CompanionMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const conversationText = (body.messages ?? [])
    .slice(-12)
    .map((m) => `${m.role === "user" ? "Ibu" : "Teman AI"}: ${m.content}`)
    .join("\n");

  if (!conversationText.trim()) {
    return NextResponse.json(fallbackReflection());
  }

  try {
    const raw = await callGemini(apiKey, {
      messages: [{ role: "user", content: buildReflectionPrompt(conversationText) }],
      temperature: 0.7,
      maxTokens: 150,
      jsonMode: true,
    });

    const parsed = safeParseJSON<ReflectionResult>(raw);
    if (!parsed?.reflection || !parsed?.affirmation) {
      return NextResponse.json(fallbackReflection());
    }
    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(fallbackReflection());
  }
}
