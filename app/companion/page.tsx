"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, Sprout, Sparkles, Leaf } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { addDoc, collection, db, doc, onSnapshot, setDoc } from "@/lib/local-db";
import { todayKey } from "@/lib/date";
import { useGrowthProgress } from "@/lib/use-growth-progress";
import { getMaterialTitle } from "@/lib/ai/parenting-engine";
import { shouldUpdateMemory, RECENT_MESSAGES_WINDOW } from "@/lib/ai/memory";
import { sapaan } from "@/lib/greeting";
import type { CompanionMessage, CompanionMemory, MoodEntry, ReflectionEntry } from "@/lib/types";

const MAX_STORED = 30;

// Starter kalimat biar obrolan gampang dimulai — bukan pertanyaan formal,
// tapi hal-hal yang biasa dirasain ibu sehari-hari.
const STARTERS = [
  "Anakku lagi susah banget diatur hari ini",
  "Aku ngerasa gagal jadi ibu",
  "Capek banget, pengen cerita aja",
  "Gimana caranya biar lebih sabar ke anak?",
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AiAvatar() {
  return (
    <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage-light/50 dark:bg-sage/20">
      <Leaf size={14} strokeWidth={1.5} className="text-sage dark:text-sage-light" />
    </div>
  );
}

function CompanionContent() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { progress } = useGrowthProgress();
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [memory, setMemory] = useState<CompanionMemory | null>(null);
  const [reflection, setReflection] = useState<ReflectionEntry | null>(null);
  const [reflecting, setReflecting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "companion", "thread");
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      setMessages((data?.messages as CompanionMessage[]) ?? []);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid, "moods", todayKey()), (snap) => {
      setTodayMood(snap.exists() ? (snap.data() as MoodEntry) : null);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid, "companion", "memory"), (snap) => {
      setMemory(snap.exists() ? (snap.data() as CompanionMemory) : null);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function maybeUpdateMemory(fullHistory: CompanionMessage[]) {
    if (!user) return;
    const userMessageCount = fullHistory.filter((m) => m.role === "user").length;
    if (!shouldUpdateMemory(userMessageCount)) return;

    try {
      const res = await fetch("/api/companion/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          previousSummary: memory?.summary ?? "",
          messages: fullHistory.slice(-RECENT_MESSAGES_WINDOW),
        }),
      });
      const data = await res.json();
      if (data.summary) {
        const nextMemory: CompanionMemory = {
          summary: data.summary,
          messageCount: userMessageCount,
          updatedAt: Date.now(),
        };
        await setDoc(doc(db, "users", user.uid, "companion", "memory"), nextMemory);
      }
    } catch {
      // Diam-diam gagal — ringkasan lama tetap dipakai, tidak mengganggu chat.
    }
  }

  async function sendMessage(text: string) {
    if (!user || !text.trim() || sending) return;

    setReflection(null);
    const userMessage: CompanionMessage = {
      role: "user",
      content: text.trim(),
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, userMessage].slice(-MAX_STORED);
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    const completedMateriIds = Object.keys(progress).filter((id) => progress[id]?.completed);

    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          parentName: profile?.parentName,
          childName: profile?.childName,
          childAgeMonths: profile?.childAgeMonths,
          todayMoodLabel: todayMood?.label,
          memorySummary: memory?.summary,
          completedMateriIds,
        }),
      });
      const data = await res.json();

      const finalMessages = res.ok
        ? [
            ...nextMessages,
            {
              role: "assistant",
              content: data.reply,
              createdAt: Date.now(),
              mood: data.mood,
              materiId: data.materiId ?? undefined,
            } as CompanionMessage,
          ].slice(-MAX_STORED)
        : [
            ...nextMessages,
            {
              role: "assistant",
              content: data.error ?? "Waduh, aku belum sempat nangkep ceritamu. Coba kirim ulang, ya.",
              createdAt: Date.now(),
            } as CompanionMessage,
          ].slice(-MAX_STORED);

      setMessages(finalMessages);
      await setDoc(doc(db, "users", user.uid, "companion", "thread"), {
        messages: finalMessages,
      });
      await maybeUpdateMemory(finalMessages);
    } catch {
      const finalMessages = [
        ...nextMessages,
        {
          role: "assistant",
          content: "Sepertinya koneksi lagi kurang stabil. Coba lagi sebentar ya.",
          createdAt: Date.now(),
        } as CompanionMessage,
      ].slice(-MAX_STORED);
      setMessages(finalMessages);
    } finally {
      setSending(false);
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    setInput("");
    void sendMessage(text);
  }

  function handleStarter(text: string) {
    if (sending) return;
    void sendMessage(text);
  }

  async function handleReflect() {
    if (!user || reflecting || messages.length === 0) return;
    setReflecting(true);
    try {
      const res = await fetch("/api/companion/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (data.reflection && data.affirmation) {
        const entry: ReflectionEntry = {
          reflection: data.reflection,
          affirmation: data.affirmation,
          createdAt: Date.now(),
        };
        setReflection(entry);
        await addDoc(collection(db, "users", user.uid, "reflections"), entry);
        showToast("Refleksimu tersimpan. Bacalah lagi kapan pun kamu butuh.", "success");
      }
    } catch {
      showToast("Belum bisa merangkum sekarang. Coba lagi sebentar ya.", "error");
    } finally {
      setReflecting(false);
    }
  }

  const userMessageCount = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light/50 dark:bg-sage/20">
            <Leaf size={18} strokeWidth={1.5} className="text-sage dark:text-sage-light" />
          </div>
          <div>
            <h1 className="text-[22px] font-serif font-medium text-teal dark:text-dark-text">
              Teman AI
            </h1>
            <p className="mt-0.5 text-[13px] text-teal/60 dark:text-dark-text/60">
              Selalu ada, kapan pun kamu butuh cerita
            </p>
          </div>
        </div>
        {userMessageCount >= 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReflect}
            disabled={reflecting}
            className="shrink-0"
          >
            <Sparkles size={16} strokeWidth={1.5} />
            {reflecting ? "Merangkum..." : "Refleksi"}
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <AiAvatar />
              <div className="max-w-[80%] rounded-[20px] rounded-bl-[6px] border border-cloud/60 bg-white px-4 py-3 text-[15px] leading-relaxed text-teal/80 shadow-soft dark:border-dark-card dark:bg-dark-card dark:text-dark-text/80">
                Halo, {sapaan(profile)} 😊 Cerita apa aja boleh, capek,
                kesel, bingung, atau lagi bersyukur. Aku dengerin sampai
                habis, nggak akan buru-buru.
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-9">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStarter(s)}
                  className="rounded-full border border-sage/40 bg-sage-light/20 px-3.5 py-2 text-left text-[13.5px] leading-snug text-teal/80 transition-colors hover:bg-sage-light/40 active:scale-[0.98] dark:border-sage/30 dark:bg-sage/10 dark:text-dark-text/80"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const prevSameRole = i > 0 && messages[i - 1].role === m.role;
          return (
            <div
              key={i}
              className={cn(
                "flex animate-in fade-in slide-in-from-bottom-2 flex-col duration-300 ease-out",
                isUser ? "items-end" : "items-start",
                prevSameRole ? "mt-1" : "mt-2"
              )}
            >
              <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
                {!isUser && (prevSameRole ? <div className="w-7 shrink-0" /> : <AiAvatar />)}
                <div
                  className={cn(
                    "max-w-[78%] px-4 py-3 text-[15px] leading-relaxed shadow-soft",
                    isUser
                      ? "rounded-[20px] rounded-br-[6px] bg-sage text-white"
                      : "rounded-[20px] rounded-bl-[6px] bg-white text-teal dark:bg-dark-card dark:text-dark-text"
                  )}
                >
                  {m.content}
                </div>
              </div>
              <span
                className={cn(
                  "mt-1 text-[11px] text-teal/40 dark:text-dark-text/40",
                  isUser ? "pr-1" : "pl-9"
                )}
              >
                {formatTime(m.createdAt)}
              </span>
              {!isUser && m.materiId && getMaterialTitle(m.materiId) && (
                <Link href={`/bertumbuh/${m.materiId}`} className="mt-1 max-w-[78%] pl-9">
                  <Badge variant="sage" className="gap-1.5">
                    <Sprout size={13} strokeWidth={1.5} />
                    Baca: {getMaterialTitle(m.materiId)}
                  </Badge>
                </Link>
              )}
            </div>
          );
        })}
        {sending && (
          <div className="flex items-end gap-2">
            <AiAvatar />
            <div className="flex items-center gap-1.5 rounded-[20px] rounded-bl-[6px] bg-white px-4 py-3.5 shadow-soft dark:bg-dark-card">
              <span className="h-2 w-2 animate-breathe rounded-full bg-sage [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-breathe rounded-full bg-sage [animation-delay:200ms]" />
              <span className="h-2 w-2 animate-breathe rounded-full bg-sage [animation-delay:400ms]" />
            </div>
          </div>
        )}
        {reflection && (
          <Card className="border-amber/40 bg-amber/10 animate-bloom">
            <p className="mb-1 text-[13px] font-medium text-teal/70 dark:text-dark-text/70">
              Refleksi untukmu
            </p>
            <CardDescription>{reflection.reflection}</CardDescription>
            <p className="mt-3 text-[15px] font-medium italic text-teal dark:text-dark-text">
              {reflection.affirmation}
            </p>
          </Card>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-end gap-2 pt-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Ketik apa aja yang lagi kamu rasain..."
          aria-label="Tulis pesan untuk Teman AI"
          rows={1}
          className="max-h-28 flex-1 resize-none rounded-input border border-cloud bg-white px-4 py-3 text-[15px] text-teal placeholder:text-teal/40 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30 dark:bg-dark-card dark:text-dark-text dark:border-dark-card"
        />
        <Button type="submit" size="icon" disabled={sending || !input.trim()} aria-label="Kirim pesan">
          <Send size={18} strokeWidth={1.5} />
        </Button>
      </form>
    </div>
  );
}

export default function CompanionPage() {
  return (
    <AppShell>
      <CompanionContent />
    </AppShell>
  );
}
