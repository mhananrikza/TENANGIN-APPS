"use client";

import Link from "next/link";
import {
  Flame,
  Wind,
  Eye,
  MessageCircleHeart,
  Sparkles,
  Sunrise,
  HeartHandshake,
  PartyPopper,
  Check,
  Leaf,
  ChevronRight,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { useGrowthProgress } from "@/lib/use-growth-progress";
import { GROWTH_MATERIALS, GROWTH_PHASES, levelTitle } from "@/lib/growth-content";
import { sapaan, timeGreeting } from "@/lib/greeting";
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

const MOTIVATIONS = [
  "Setiap materi kecil membawamu satu langkah lebih tenang.",
  "Tidak perlu buru-buru. Bertumbuh itu pelan-pelan, bukan lomba.",
  "Kamu tidak sendirian menjalani ini, dan kamu sedang berusaha.",
  "Perjalanan ini tentangmu, bukan tentang siapa yang lebih dulu selesai.",
];

// Bungkus tiap seksi supaya muncul bertahap — nuansa "learning journey"
// premium, bukan halaman ebook yang muncul sekaligus.
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

function CircularProgress({ percent }: { percent: number }) {
  const size = 88;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-cloud/50 dark:stroke-dark-card"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-sage transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[19px] font-medium tabular-nums text-teal dark:text-dark-text">
          {percent}%
        </span>
      </div>
    </div>
  );
}

function StatusPill({ kind }: { kind: "selesai" | "dibaca" | "berikutnya" }) {
  if (kind === "selesai") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-light/40 px-2.5 py-1 text-[11px] font-medium text-teal dark:bg-sage/20 dark:text-dark-text">
        <Check size={11} strokeWidth={3} />
        Selesai
      </span>
    );
  }
  if (kind === "dibaca") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/30 px-2.5 py-1 text-[11px] font-medium text-teal">
        <span className="h-1.5 w-1.5 rounded-full bg-amber animate-pulse" />
        Sedang Dibaca
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-cloud/50 px-2.5 py-1 text-[11px] font-medium text-teal/60 dark:bg-dark-card dark:text-dark-text/50">
      Berikutnya
    </span>
  );
}

function GrowthJourneyContent() {
  const { profile } = useAuth();
  const { progress, completedCount, totalCount, percent, currentMateri, streak, loading } =
    useGrowthProgress();

  const motivation = MOTIVATIONS[completedCount % MOTIVATIONS.length];
  let globalIdx = 0;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Reveal>
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wide text-sage">
            <BookOpen size={14} strokeWidth={1.75} />
            Perjalanan Bertumbuh
          </p>
          <p className="mt-1.5 text-[26px] font-serif font-medium leading-snug text-teal dark:text-dark-text">
            {timeGreeting()}, {sapaan(profile)}
            {profile?.childName ? ` & ${profile.childName}` : ""}
          </p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-teal/60 dark:text-dark-text/60">
            {motivation}
          </p>
        </div>
      </Reveal>

      {/* Progress */}
      <Reveal delay={60}>
        <div className="flex items-center gap-5 rounded-card border border-cloud/60 bg-white p-5 shadow-soft dark:border-dark-card dark:bg-dark-card">
          <CircularProgress percent={loading ? 0 : percent} />
          <div className="min-w-0">
            <p className="text-[15.5px] font-medium text-teal dark:text-dark-text">
              {levelTitle(percent)}
            </p>
            <p className="mt-1 text-[13px] text-teal/50 dark:text-dark-text/50">
              {completedCount} dari {totalCount} materi selesai
            </p>
            {streak > 0 && (
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber/30 px-3 py-1 text-[12px] font-medium text-teal">
                <Flame size={13} strokeWidth={1.5} className="text-amber" />
                {streak} hari beruntun
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* Continue Reading */}
      {currentMateri && percent < 100 && (
        <Reveal delay={110}>
          <div>
            <p className="mb-2.5 text-[13px] font-medium uppercase tracking-wide text-teal/40 dark:text-dark-text/40">
              Lanjutkan Membaca
            </p>
            <Link
              href={`/bertumbuh/${currentMateri.id}`}
              className="group flex items-center gap-4 rounded-card bg-teal p-5 text-sand shadow-soft transition-transform duration-200 active:scale-[0.98] dark:bg-sage/20"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-sand/55">{currentMateri.phase}</p>
                <p className="mt-1 text-[18px] font-serif font-medium leading-snug">
                  {currentMateri.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-sand/70">
                  {currentMateri.teaser}
                </p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand/10 transition-transform duration-200 group-active:scale-90">
                <ChevronRight size={20} />
              </span>
            </Link>
          </div>
        </Reveal>
      )}

      {percent === 100 && (
        <Reveal delay={110}>
          <div className="flex items-center gap-3 rounded-card bg-sage-light/40 p-5">
            <PartyPopper size={28} strokeWidth={1.5} className="text-sage shrink-0" />
            <p className="text-[14px] leading-relaxed text-teal dark:text-dark-text">
              Kamu sudah menyelesaikan seluruh perjalanan ini. Boleh dibaca ulang kapan pun kamu
              butuh diingatkan lagi.
            </p>
          </div>
        </Reveal>
      )}

      {/* Journey path */}
      <div className="space-y-10">
        {GROWTH_PHASES.map((phase, phaseIdx) => {
          const materials = GROWTH_MATERIALS.filter((m) => m.phase === phase);
          return (
            <Reveal key={phase} delay={160 + phaseIdx * 40}>
              <div>
                <div className="mb-5 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sage/15 text-[12px] font-medium text-sage">
                    {phaseIdx + 1}
                  </span>
                  <p className="text-[13px] font-medium uppercase tracking-wide text-teal/50 dark:text-dark-text/50">
                    {phase}
                  </p>
                </div>

                <div className="space-y-0">
                  {materials.map((m, idx) => {
                    const isCompleted = !!progress[m.id]?.completed;
                    const isCurrent = currentMateri?.id === m.id && !isCompleted;
                    const isNext =
                      !isCompleted && !isCurrent && m.order === (currentMateri?.order ?? 0) + 1;
                    const Icon = ICONS[m.icon] ?? Leaf;
                    const prevCompleted =
                      idx === 0 ? true : !!progress[materials[idx - 1].id]?.completed;
                    const itemDelay = Math.min(200 + globalIdx * 35, 560);
                    globalIdx += 1;

                    return (
                      <Reveal key={m.id} delay={itemDelay}>
                        <div>
                          {idx > 0 && (
                            <div
                              className={cn(
                                "ml-[27px] h-4 w-0 border-l-2",
                                prevCompleted
                                  ? "border-sage"
                                  : "border-dashed border-cloud dark:border-dark-card"
                              )}
                            />
                          )}
                          <Link href={`/bertumbuh/${m.id}`} className="group flex items-start gap-4">
                            <span
                              className={cn(
                                "z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 shadow-soft transition-all duration-200 group-active:scale-90",
                                isCompleted && "border-sage bg-sage text-white",
                                isCurrent && "border-sage bg-white text-sage dark:bg-dark-card",
                                !isCompleted &&
                                  !isCurrent &&
                                  "border-cloud bg-white text-teal/40 dark:bg-dark-card dark:border-dark-card"
                              )}
                            >
                              {isCompleted ? (
                                <Check size={22} strokeWidth={2} />
                              ) : (
                                <Icon size={22} strokeWidth={1.5} />
                              )}
                            </span>

                            <span
                              className={cn(
                                "min-w-0 flex-1 rounded-card border p-4 shadow-soft transition-all duration-200 group-active:scale-[0.98]",
                                isCurrent
                                  ? "border-sage bg-white dark:bg-dark-card"
                                  : "border-cloud/60 bg-white/70 dark:bg-dark-card/70 dark:border-dark-card",
                                !isCompleted && !isCurrent && !isNext && "opacity-70"
                              )}
                            >
                              <span className="mb-1.5 flex items-center gap-2">
                                {isCompleted && <StatusPill kind="selesai" />}
                                {isCurrent && <StatusPill kind="dibaca" />}
                                {isNext && <StatusPill kind="berikutnya" />}
                              </span>
                              <span className="block font-serif text-[15.5px] font-medium leading-snug text-teal dark:text-dark-text">
                                {m.title}
                              </span>
                              <span className="mt-1 block text-[13px] leading-relaxed text-teal/50 dark:text-dark-text/50">
                                {m.teaser}
                              </span>
                              <span className="mt-2 block text-[12px] text-teal/40 dark:text-dark-text/40">
                                {m.readMinutes} menit baca
                              </span>
                            </span>
                          </Link>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

export default function BertumbuhPage() {
  return (
    <AppShell>
      <GrowthJourneyContent />
    </AppShell>
  );
}
