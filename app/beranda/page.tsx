"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Sprout,
  ListChecks,
  Wind,
  MessageCircle,
  ChevronRight,
  CheckCircle2,
  Circle,
  Flame,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { CardSkeleton, Skeleton } from "@/components/skeleton";
import { useAuth } from "@/lib/auth-context";
import {
  db,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
} from "@/lib/local-db";
import { todayKey } from "@/lib/date";
import { useGrowthProgress } from "@/lib/use-growth-progress";
import { useDailyStreak } from "@/lib/use-daily-streak";
import { quoteOfTheDay } from "@/lib/quotes";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/lib/toast-context";
import { sapaan, timeGreeting } from "@/lib/greeting";
import type { MoodEntry, DailyChallengeEntry, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOODS = [
  { emoji: "😊", label: "Senang" },
  { emoji: "😌", label: "Tenang" },
  { emoji: "😐", label: "Biasa" },
  { emoji: "😩", label: "Lelah" },
  { emoji: "😢", label: "Sedih" },
];

// Emoji hanya dipakai di sapaan — malam terasa lebih tenang dengan bulan,
// selain itu senyum hangat khas TENANGIN.
function greetingEmoji(): string {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 4 ? "🌙" : "😊";
}

// Bungkus setiap seksi supaya muncul bertahap (stagger) saat halaman dibuka —
// nuansa premium ala Headspace/Calm, bukan sekadar "muncul langsung".
function Reveal({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-3 duration-500 ease-out"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      {children}
    </div>
  );
}

function BerandaContent() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [justPicked, setJustPicked] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<DailyChallengeEntry | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const { currentMateri, percent, completedCount, totalCount, loading: growthLoading } =
    useGrowthProgress();
  const { streak: appStreak, grewToday } = useDailyStreak();
  const quote = quoteOfTheDay();

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "moods", todayKey());
    const unsub = onSnapshot(ref, (snap) => {
      setTodayMood(snap.exists() ? (snap.data() as MoodEntry) : null);
    });
    return () => unsub();
  }, [user]);

  // Tantangan kecil hari ini: sekali dibuat per hari, disimpan di IndexedDB,
  // jadi konsisten walau halaman dibuka berkali-kali (lihat lib/ai/daily-challenge.ts).
  useEffect(() => {
    if (!user || growthLoading) return;
    const ref = doc(db, "users", user.uid, "daily", todayKey());
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        setChallenge(snap.data() as DailyChallengeEntry);
        return;
      }
      try {
        const res = await fetch("/api/daily-challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateKey: todayKey(),
            currentMateriId: currentMateri?.id,
          }),
        });
        const data = await res.json();
        if (data.challenge) {
          const entry: DailyChallengeEntry = {
            challenge: data.challenge,
            source: data.source,
            materiId: data.materiId,
            dateKey: todayKey(),
            done: false,
            createdAt: Date.now(),
          };
          await setDoc(ref, entry);
        }
      } catch {
        // Kalau gagal, kartu tantangan cukup tidak muncul hari ini — tidak fatal.
      }
    });
    return () => unsub();
  }, [user, growthLoading, currentMateri?.id]);

  // Pratinjau Planner Hari Ini — sumber data yang sama dengan halaman Planner,
  // supaya kartu di Beranda selalu sinkron dan bisa langsung dicentang dari sini.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs.map((d: { id: string; data: () => unknown }) => ({
          id: d.id,
          ...(d.data() as Task),
        }))
      );
      setTasksLoading(false);
    });
    return () => unsub();
  }, [user]);

  async function toggleChallengeDone() {
    if (!user || !challenge) return;
    haptic(challenge.done ? "tap" : "success");
    const ref = doc(db, "users", user.uid, "daily", todayKey());
    await setDoc(ref, { ...challenge, done: !challenge.done }, { merge: true });
    if (!challenge.done) showToast("Tantangan hari ini selesai. Kerja bagus, Ibu.", "success");
  }

  async function pickMood(emoji: string, label: string) {
    if (!user) return;
    haptic("tap");
    setSaving(true);
    setJustPicked(label);
    try {
      const ref = doc(db, "users", user.uid, "moods", todayKey());
      await setDoc(ref, {
        emoji,
        label,
        dateKey: todayKey(),
        createdAt: Date.now(),
      });
      showToast("Perasaanmu hari ini sudah tercatat.", "success");
    } catch {
      showToast("Belum tersimpan, coba sekali lagi ya.", "error");
    } finally {
      setSaving(false);
      setTimeout(() => setJustPicked(null), 450);
    }
  }

  async function toggleTask(task: Task) {
    if (!user || !task.id) return;
    haptic(task.done ? "tap" : "success");
    await updateDoc(doc(db, "users", user.uid, "tasks", task.id), { done: !task.done });
  }

  const activeTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);
  const previewTasks = [...activeTasks, ...doneTasks].slice(0, 3);
  const remainingTasks = Math.max(0, tasks.length - previewTasks.length);

  return (
    <div className="space-y-5">
      {/* Sapaan */}
      <Reveal>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[26px] font-serif font-medium leading-snug text-teal dark:text-dark-text">
              {timeGreeting()}, {sapaan(profile)}. {greetingEmoji()}
            </h1>
            {profile?.childName && (
              <p className="mt-1 text-[15px] text-teal/55 dark:text-dark-text/55">
                Semoga harimu bareng {profile.childName} berjalan tenang.
              </p>
            )}
          </div>
          {appStreak > 0 && (
            <div
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border border-amber/40 bg-amber/20 px-3 py-1.5 text-[13px] font-medium text-teal transition-transform dark:text-dark-text",
                grewToday && "animate-pop"
              )}
              title="Hari beruntun kamu hadir di TENANGIN"
            >
              <Flame size={15} strokeWidth={1.75} className="text-amber" />
              {appStreak}
            </div>
          )}
        </div>
      </Reveal>

      {/* Pertanyaan + Mood Check */}
      <Reveal delay={60}>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-[17px] font-medium text-teal dark:text-dark-text">
              Apa kabar hari ini?
            </p>
            {todayMood && (
              <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-sage animate-in fade-in duration-300">
                <CheckCircle2 size={14} strokeWidth={2} />
                Tercatat
              </span>
            )}
          </div>
          <div
            className={cn(
              "flex justify-between transition-opacity duration-200",
              saving && "opacity-60"
            )}
          >
            {MOODS.map((m) => {
              const selected = todayMood?.label === m.label;
              return (
                <button
                  key={m.label}
                  onClick={() => pickMood(m.emoji, m.label)}
                  disabled={saving}
                  className={cn(
                    "flex h-14 w-14 flex-col items-center justify-center rounded-full text-2xl transition-all duration-200 active:scale-90",
                    selected
                      ? "scale-105 bg-sage-light/60 ring-2 ring-sage"
                      : "bg-sand hover:bg-cloud/40 dark:bg-dark-bg",
                    justPicked === m.label && selected && "animate-pop"
                  )}
                  aria-label={m.label}
                  aria-pressed={selected}
                >
                  {m.emoji}
                </button>
              );
            })}
          </div>
          {todayMood && (
            <p className="mt-3 text-center text-[13px] text-teal/50 dark:text-dark-text/50">
              Sudah dicatat hari ini: {todayMood.label}
            </p>
          )}
        </Card>
      </Reveal>

      {/* CTA relief cepat */}
      <Reveal delay={110}>
        <Link
          href="/napas"
          className="flex h-[52px] items-center justify-center gap-2 rounded-full bg-rose text-[15px] font-medium text-teal shadow-soft transition-transform active:scale-[0.97]"
        >
          <Wind size={18} strokeWidth={1.75} />
          Aku Hampir Meledak
        </Link>
      </Reveal>

      {/* Lanjutkan Bacaan */}
      <Reveal delay={160}>
        {growthLoading ? (
          <CardSkeleton />
        ) : (
          currentMateri && (
            <Link
              href={`/bertumbuh/${currentMateri.id}`}
              className="group block rounded-card border border-cloud/60 bg-white p-4 shadow-soft transition-all duration-200 active:scale-[0.98] dark:border-dark-card dark:bg-dark-card"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-sage">
                    <Sprout size={14} strokeWidth={1.75} />
                    Lanjutkan Bacaan
                  </p>
                  <p className="mt-1.5 truncate text-[16px] font-serif font-medium text-teal dark:text-dark-text">
                    {currentMateri.title}
                  </p>
                  <p className="mt-0.5 text-[13px] text-teal/50 dark:text-dark-text/50">
                    {currentMateri.phase} · {currentMateri.readMinutes} menit baca
                  </p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/10 text-sage transition-transform duration-200 group-active:scale-90">
                  <ChevronRight size={20} />
                </span>
              </div>
              <div className="mt-3.5 flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cloud/50 dark:bg-dark-bg">
                  <div
                    className="h-full rounded-full bg-sage transition-all duration-700 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="shrink-0 text-[12px] font-medium tabular-nums text-teal/40 dark:text-dark-text/40">
                  {completedCount}/{totalCount}
                </span>
              </div>
            </Link>
          )
        )}
      </Reveal>

      {/* Planner Hari Ini */}
      <Reveal delay={210}>
        <Card>
          <div className="mb-3.5 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[17px] font-medium text-teal dark:text-dark-text">
              <ListChecks size={17} strokeWidth={1.75} className="text-sage" />
              Planner Hari Ini
            </p>
            <Link
              href="/planner"
              className="flex shrink-0 items-center text-[13px] font-medium text-sage"
            >
              Lihat semua
              <ChevronRight size={14} className="ml-0.5" />
            </Link>
          </div>

          {tasksLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-5/6" />
            </div>
          ) : tasks.length === 0 ? (
            <Link
              href="/planner"
              className="flex items-center gap-3 rounded-input border border-dashed border-cloud/70 px-4 py-4 transition-colors active:bg-sand/60 dark:border-dark-card dark:active:bg-dark-bg/60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage/10 text-sage">
                <ListChecks size={17} strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <p className="text-[14px] font-medium text-teal dark:text-dark-text">
                  Rencana hari ini masih kosong
                </p>
                <p className="text-[13px] text-teal/50 dark:text-dark-text/50">
                  Ketuk untuk menambah rencana pertama
                </p>
              </span>
            </Link>
          ) : (
            <>
              <p className="mb-2.5 text-[13px] text-teal/50 dark:text-dark-text/50">
                {doneTasks.length} dari {tasks.length} selesai
              </p>
              <div className="space-y-1">
                {previewTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggleTask(t)}
                    className="flex w-full items-center gap-3 rounded-input px-2 py-2.5 text-left transition-colors active:bg-sand/60 dark:active:bg-dark-bg/60"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        t.done ? "border-sage bg-sage" : "border-cloud"
                      )}
                    >
                      {t.done && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span
                      className={cn(
                        "flex-1 truncate text-[14.5px]",
                        t.done
                          ? "text-teal/40 line-through dark:text-dark-text/40"
                          : "text-teal dark:text-dark-text"
                      )}
                    >
                      {t.title}
                    </span>
                  </button>
                ))}
              </div>
              {remainingTasks > 0 && (
                <p className="mt-2 pl-2 text-[12.5px] text-teal/40 dark:text-dark-text/40">
                  +{remainingTasks} rencana lainnya
                </p>
              )}
            </>
          )}
        </Card>
      </Reveal>

      {/* Curhat ke TENANGIN */}
      <Reveal delay={260}>
        <Link
          href="/companion"
          className="flex items-center gap-3.5 rounded-card border border-cloud/60 bg-white p-4 shadow-soft transition-transform duration-200 active:scale-[0.98] dark:border-dark-card dark:bg-dark-card"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose/25 text-rose-dark">
            <MessageCircle size={21} strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-teal dark:text-dark-text">
              Curhat ke TENANGIN
            </p>
            <p className="mt-0.5 text-[13px] text-teal/50 dark:text-dark-text/50">
              Cerita apa saja, aku dengerin tanpa menghakimi.
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-teal/30 dark:text-dark-text/30" />
        </Link>
      </Reveal>

      {/* Aktivitas Anak */}
      <Reveal delay={300}>
        <Link
          href="/aktivitas"
          className="flex items-center gap-3.5 rounded-card border border-cloud/60 bg-white p-4 shadow-soft transition-transform duration-200 active:scale-[0.98] dark:border-dark-card dark:bg-dark-card"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage">
            <Sparkles size={21} strokeWidth={1.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium text-teal dark:text-dark-text">
              Aktivitas Anak
            </p>
            <p className="mt-0.5 truncate text-[13px] text-teal/50 dark:text-dark-text/50">
              {profile?.childName ? `Ide seru bareng ${profile.childName}` : "Ide seru sesuai usia anak"}
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-teal/30 dark:text-dark-text/30" />
        </Link>
      </Reveal>

      {/* Tantangan kecil hari ini */}
      {challenge && (
        <Reveal delay={340}>
          <Card>
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-sage">
              <Sparkles size={15} strokeWidth={1.5} />
              Tantangan kecil hari ini
            </p>
            <button
              onClick={toggleChallengeDone}
              className="flex w-full items-start gap-3 text-left"
            >
              {challenge.done ? (
                <CheckCircle2 size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-sage" />
              ) : (
                <Circle size={22} strokeWidth={1.5} className="mt-0.5 shrink-0 text-teal/30" />
              )}
              <span
                className={cn(
                  "text-[15px] leading-relaxed",
                  challenge.done
                    ? "text-teal/40 line-through dark:text-dark-text/40"
                    : "text-teal dark:text-dark-text"
                )}
              >
                {challenge.challenge}
              </span>
            </button>
          </Card>
        </Reveal>
      )}

      {/* Renungan Hari Ini */}
      <Reveal delay={380}>
        <div className="rounded-card bg-teal p-5 text-sand shadow-soft dark:bg-sage/15">
          <p className="text-[12px] font-medium uppercase tracking-wide text-sand/60 dark:text-dark-text/50">
            Renungan Hari Ini
          </p>
          <p className="mt-2 text-[15px] font-serif italic leading-relaxed text-sand/95 dark:text-dark-text/90">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      </Reveal>
    </div>
  );
}

export default function BerandaPage() {
  return (
    <AppShell>
      <BerandaContent />
    </AppShell>
  );
}
