import { NextRequest, NextResponse } from "next/server";
import type { CompanionMessage } from "@/lib/types";
import { buildMemorySummarizationPrompt } from "@/lib/ai/memory";
import { callGemini } from "@/lib/ai/gemini-client";

export const runtime = "nodejs";

// Endpoint khusus untuk memperbarui ringkasan memori (lihat lib/ai/memory.ts).
// Dipanggil client setiap MEMORY_UPDATE_INTERVAL pesan, BUKAN setiap pesan,
// supaya hemat token. Outputnya disimpan client-side ke
// users/{uid}/companion/memory.

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum diatur di server." },
      { status: 500 }
    );
  }

  let body: { previousSummary?: string; messages: CompanionMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const recentText = (body.messages ?? [])
    .map((m) => `${m.role === "user" ? "Ibu" : "Teman AI"}: ${m.content}`)
    .join("\n");

  if (!recentText.trim()) {
    return NextResponse.json({ summary: body.previousSummary ?? "" });
  }

  try {
    const summary = await callGemini(apiKey, {
      messages: [
        {
          role: "user",
          content: buildMemorySummarizationPrompt(body.previousSummary ?? "", recentText),
        },
      ],
      temperature: 0.3,
      maxTokens: 120,
    });

    return NextResponse.json({ summary: summary.trim() });
  } catch (err) {
    console.error(err);
    // Gagal memperbarui memori bukan hal kritis — pakai ringkasan lama saja.
    return NextResponse.json({ summary: body.previousSummary ?? "" });
  }
}
