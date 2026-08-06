import { NextRequest, NextResponse } from "next/server";
import type { CompanionMessage } from "@/lib/types";
import { buildCompanionSystemPrompt } from "@/lib/ai/system-prompt";
import { checkSafety } from "@/lib/ai/safety-guard";
import { detectEmotionFromText, isValidEmotionTag, type EmotionTag } from "@/lib/ai/emotion";
import { recommendMaterial } from "@/lib/ai/parenting-engine";
import { callGemini, safeParseJSON } from "@/lib/ai/gemini-client";
import { RECENT_MESSAGES_WINDOW } from "@/lib/ai/memory";

export const runtime = "nodejs";

type CompanionRequestBody = {
  messages: CompanionMessage[];
  parentName?: string;
  childName?: string;
  childAgeMonths?: number;
  todayMoodLabel?: string;
  memorySummary?: string;
  completedMateriIds?: string[];
};

type ModelReply = {
  reply: string;
  mood?: string;
  topic?: string | null;
  needsMaterial?: boolean;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum diatur di server." },
      { status: 500 }
    );
  }

  let body: CompanionRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const allMessages = body.messages ?? [];
  const lastUserMessage = [...allMessages].reverse().find((m) => m.role === "user");
  const latestText = lastUserMessage?.content ?? "";

  // --- Safety Guard: dicek dulu, sebelum menyentuh Gemini sama sekali. ---
  const safety = checkSafety(latestText);
  if (safety.category !== "none" && safety.triggeredMessage) {
    return NextResponse.json({
      reply: safety.triggeredMessage,
      mood: "kewalahan" as EmotionTag,
      materiId: null,
      safety: safety.category,
    });
  }

  // --- Emotion Detection (fallback cepat berbasis kata kunci) ---
  const quickEmotion = detectEmotionFromText(latestText);

  // Hanya kirim jendela pesan terakhir ke model — ringkasan memori menutupi sisanya.
  const recentHistory = allMessages.slice(-RECENT_MESSAGES_WINDOW).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const systemPrompt = buildCompanionSystemPrompt({
    parentName: body.parentName,
    childName: body.childName,
    childAgeMonths: body.childAgeMonths,
    todayMoodLabel: body.todayMoodLabel,
    memorySummary: body.memorySummary,
    currentEmotion: quickEmotion,
  });

  try {
    const raw = await callGemini(apiKey, {
      messages: [{ role: "system", content: systemPrompt }, ...recentHistory],
      temperature: 0.8,
      maxTokens: 350,
      jsonMode: true,
    });

    const parsed = safeParseJSON<ModelReply>(raw);
    if (!parsed?.reply) {
      return NextResponse.json(
        { error: "Aku belum bisa jawab sekarang. Boleh dicoba ulang?" },
        { status: 502 }
      );
    }

    const mood = isValidEmotionTag(parsed.mood) ? parsed.mood : quickEmotion;

    let materiId: string | null = null;
    if (parsed.needsMaterial) {
      materiId = recommendMaterial(
        `${parsed.topic ?? ""} ${latestText}`,
        mood,
        body.completedMateriIds ?? []
      );
    }

    return NextResponse.json({ reply: parsed.reply, mood, materiId });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Sepertinya koneksi lagi kurang stabil. Coba lagi sebentar ya." },
      { status: 500 }
    );
  }
}
