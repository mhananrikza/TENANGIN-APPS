"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Wind,
  Eye,
  MessageCircleHeart,
  Sparkles,
  Sunrise,
  HeartHandshake,
  PartyPopper,
  Leaf,
  Check,
  CheckCircle2,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Confetti } from "@/components/confetti";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { db, doc, onSnapshot, setDoc } from "@/lib/local-db";
import { getMaterialById, getNextMaterial, GROWTH_MATERIALS } from "@/lib/growth-content";
import type { GrowthProgress } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Flame,
  Wind,
  Eye,
  MessageCircleHeart,
  Sparkles,
  Sunrise,
  HeartHandshake,
  PartyPopper,
};

// Bungkus tiap blok konten supaya muncul bertahap saat dibuka — terasa
// seperti langkah demi langkah dalam perjalanan belajar, bukan halaman
// ebook yang langsung menumpuk semua teks sekaligus.
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

// Bilah progres baca tipis di paling atas — mengikuti posisi scroll,
// supaya materi terasa seperti "langkah yang sedang dijalani", bukan
// artikel panjang tanpa penanda posisi.
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const docEl = document.documentElement;
      const scrollTop = docEl.scrollTop || document.body.scrollTop;
      const scrollHeight =
        (docEl.scrollHeight || document.body.scrollHeight) - docEl.clientHeight;
      const pct = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0;
      setProgress(pct);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-cloud/40 dark:bg-dark-card">
      <div
        className="h-full bg-sage transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function StatusBadge({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-light/40 px-2.5 py-1 text-[11px] font-medium text-teal dark:bg-sage/20 dark:text-dark-text">
        <Check size={11} strokeWidth={3} />
        Selesai
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/30 px-2.5 py-1 text-[11px] font-medium text-teal">
      <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
      Sedang Dibaca
    </span>
  );
}

function MateriContent({ id }: { id: string }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const materi = getMaterialById(id);
  const next = getNextMaterial(id);

  const [reflection, setReflection] = useState("");
  const [actionDone, setActionDone] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [justToggledAction, setJustToggledAction] = useState(false);

  useEffect(() => {
    if (!user || !materi) return;
    const ref = doc(db, "users", user.uid, "growth", materi.id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as GrowthProgress;
        setReflection(data.reflection ?? "");
        setActionDone(!!data.actionDone);
        setCompleted(!!data.completed);
      } else {
        setReflection("");
        setActionDone(false);
        setCompleted(false);
      }
    });
    return () => unsub();
  }, [user, materi]);

  if (!materi) {
    return (
      <div className="space-y-4">
        <p className="text-[16px] text-teal dark:text-dark-text">Materi tidak ditemukan.</p>
        <Link href="/bertumbuh" className="text-[14px] font-medium text-sage">
          Kembali ke perjalanan
        </Link>
      </div>
    );
  }

  const Icon = ICONS[materi.icon] ?? Leaf;
  const stepLabel = `Langkah ${materi.order} dari ${GROWTH_MATERIALS.length}`;

  async function saveReflection() {
    if (!user || !materi) return;
    const ref = doc(db, "users", user.uid, "growth", materi.id);
    await setDoc(
      ref,
      { materiId: materi.id, reflection, reflectionUpdatedAt: Date.now() },
      { merge: true }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function toggleAction() {
    if (!user || !materi) return;
    const nextVal = !actionDone;
    haptic(nextVal ? "success" : "tap");
    setActionDone(nextVal);
    setJustToggledAction(true);
    setTimeout(() => setJustToggledAction(false), 420);
    const ref = doc(db, "users", user.uid, "growth", materi.id);
    await setDoc(
      ref,
      {
        materiId: materi.id,
        actionDone: nextVal,
        actionDoneAt: nextVal ? Date.now() : null,
      },
      { merge: true }
    );
  }

  async function handleFinish() {
    if (!user || !materi) return;
    setFinishing(true);
    try {
      const ref = doc(db, "users", user.uid, "growth", materi.id);
      await setDoc(
        ref,
        {
          materiId: materi.id,
          completed: true,
          completedAt: Date.now(),
          reflection,
          actionDone,
        },
        { merge: true }
      );
      haptic("celebrate");
      setCelebrate(true);
      showToast(
        next
          ? "Materi selesai. Satu langkah lagi menuju lebih tenang."
          : "Perjalanan Bertumbuh selesai. Bagus sekali, Ibu.",
        "success"
      );
      setTimeout(() => {
        router.push(next ? `/bertumbuh/${next.id}` : "/bertumbuh");
      }, 1100);
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="space-y-7 pb-28">
      <ReadingProgressBar />
      {celebrate && <Confetti />}

      <Reveal>
        <Link
          href="/bertumbuh"
          className="inline-flex items-center gap-1 text-[14px] font-medium text-teal/60 dark:text-dark-text/60"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
          Perjalanan Bertumbuh
        </Link>
      </Reveal>

      {/* Header */}
      <Reveal delay={50}>
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-sage">
            {materi.phase} · {stepLabel}
          </p>
          <div className="mt-3 flex items-center gap-3.5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage">
              <Icon size={26} strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <h1 className="text-[22px] font-serif font-medium leading-snug text-teal dark:text-dark-text">
                {materi.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge completed={completed} />
                <span className="text-[13px] text-teal/50 dark:text-dark-text/50">
                  {materi.readMinutes} menit baca
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Isi materi — tiap bagian ditata sebagai langkah, bukan paragraf ebook */}
      <div className="space-y-4">
        {materi.sections.map((s, i) => (
          <Reveal key={i} delay={100 + i * 60}>
            <div className="rounded-card border border-cloud/60 bg-white p-5 shadow-soft dark:border-dark-card dark:bg-dark-card">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/10 text-[11px] font-medium tabular-nums text-sage">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[16px] font-serif font-medium text-teal dark:text-dark-text">
                  {s.heading}
                </h2>
              </div>
              <p className="text-[15px] leading-[1.75] text-teal/75 dark:text-dark-text/75">
                {s.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Highlight poin penting */}
      <Reveal delay={100 + materi.sections.length * 60 + 40}>
        <Card className="border-amber/40 bg-amber/10">
          <p className="mb-3 text-[13px] font-medium uppercase tracking-wide text-teal/60">
            Poin Penting
          </p>
          <ul className="space-y-2.5">
            {materi.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber/50">
                  <Check size={12} strokeWidth={2.5} className="text-teal" />
                </span>
                <span className="text-[14px] leading-relaxed text-teal dark:text-dark-text">{h}</span>
              </li>
            ))}
          </ul>
        </Card>
      </Reveal>

      {/* Ringkasan */}
      <Reveal delay={100 + materi.sections.length * 60 + 90}>
        <Card className="border-none bg-teal text-sand dark:bg-sage/15">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-medium uppercase tracking-wide text-sand/60 dark:text-dark-text/50">
            <Sprout size={15} strokeWidth={1.5} />
            Ringkasan
          </p>
          <p className="text-[14.5px] leading-relaxed text-sand/90 dark:text-dark-text/80">
            {materi.summary}
          </p>
        </Card>
      </Reveal>

      {/* Refleksi */}
      <Reveal delay={100 + materi.sections.length * 60 + 140}>
        <div>
          <h2 className="mb-1 text-[16px] font-medium text-teal dark:text-dark-text">Refleksi</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-teal/50 dark:text-dark-text/50">
            {materi.reflection}
          </p>
          <Card>
            <Textarea
              placeholder="Tulis apa saja yang muncul di pikiranmu... (opsional)"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              onBlur={saveReflection}
              className="min-h-[96px]"
            />
            {saved && (
              <p className="mt-2 flex items-center gap-1 text-[12px] font-medium text-sage animate-in fade-in duration-300">
                <CheckCircle2 size={13} strokeWidth={2} />
                Tersimpan
              </p>
            )}
          </Card>
        </div>
      </Reveal>

      {/* Aksi hari ini */}
      <Reveal delay={100 + materi.sections.length * 60 + 190}>
        <div>
          <h2 className="mb-3 text-[16px] font-medium text-teal dark:text-dark-text">
            Aksi Hari Ini
          </h2>
          <button
            onClick={toggleAction}
            className={cn(
              "flex w-full items-start gap-3 rounded-card border p-4 text-left shadow-soft transition-all duration-200 active:scale-[0.99]",
              actionDone
                ? "border-sage bg-sage-light/30"
                : "border-cloud/60 bg-white dark:bg-dark-card dark:border-dark-card"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                actionDone ? "border-sage bg-sage text-white" : "border-cloud text-transparent",
                justToggledAction && "animate-pop"
              )}
            >
              <Check size={14} strokeWidth={3} />
            </span>
            <span
              className={cn(
                "text-[14.5px] leading-relaxed",
                actionDone
                  ? "text-teal/50 line-through dark:text-dark-text/50"
                  : "text-teal dark:text-dark-text"
              )}
            >
              {materi.action}
            </span>
          </button>
        </div>
      </Reveal>

      {/* Tombol lanjut - sticky di bawah, dengan gradasi peredam di belakangnya */}
      <div className="fixed bottom-[76px] left-0 right-0 z-30">
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-sand to-transparent dark:from-dark-bg" />
        <div className="relative bg-sand px-5 pb-3 pt-2 dark:bg-dark-bg">
          <div className="mx-auto max-w-md">
            <Button className="w-full gap-1.5" onClick={handleFinish} disabled={finishing}>
              {celebrate ? (
                "Mantap, satu langkah lagi"
              ) : (
                <>
                  {next ? "Tandai Selesai & Lanjut" : "Selesaikan Perjalanan"}
                  <ChevronRight size={18} strokeWidth={2} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MateriPage() {
  const params = useParams<{ id: string }>();
  return (
    <AppShell>
      <MateriContent id={params.id} />
    </AppShell>
  );
}
