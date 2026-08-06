// Wrapper tipis untuk panggilan Google Gemini API (generateContent).
// Dipusatkan di satu tempat supaya model, error handling, dan timeout konsisten
// di semua API route (companion, memory, reflection, activity).

export const CHAT_MODEL = "gemini-2.5-flash";

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${CHAT_MODEL}:generateContent`;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type CallOptions = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

export class GeminiError extends Error {}

export async function callGemini(apiKey: string, opts: CallOptions): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  // Gemini memisahkan instruksi sistem dari daftar pesan, dan memakai role
  // "model" (bukan "assistant") untuk balasan asisten.
  const systemMessages = opts.messages.filter((m) => m.role === "system");
  const conversation = opts.messages.filter((m) => m.role !== "system");

  const contents = conversation.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const systemInstruction = systemMessages.length
    ? { parts: [{ text: systemMessages.map((m) => m.content).join("\n\n") }] }
    : undefined;

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        ...(systemInstruction ? { system_instruction: systemInstruction } : {}),
        contents,
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxTokens ?? 400,
          ...(opts.jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", errText);
      throw new GeminiError("gemini_request_failed");
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      ?.trim();
    if (!content) throw new GeminiError("gemini_empty_response");
    return content;
  } finally {
    clearTimeout(timeout);
  }
}

/** Parse JSON dari respons model dengan aman; fallback null kalau gagal. */
export function safeParseJSON<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Kadang model tetap menambahkan teks di luar JSON meski sudah diminta murni.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}
