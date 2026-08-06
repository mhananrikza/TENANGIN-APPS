"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Trash2,
  Clock,
  Sparkles,
  BookHeart,
  Baby,
  SmilePlus,
  PiggyBank,
  RotateCcw,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "@/lib/local-db";
import type { Activity } from "@/lib/types";

// Rentang usia dipakai sebagai filter, bukan cuma bawaan dari profil anak —
// jadi orang tua tetap bisa cari ide untuk usia lain (mis. buat kakak/adiknya).
const AGE_BANDS = [
  { label: "0–6 bulan", months: 3, min: 0, max: 6 },
  { label: "6–12 bulan", months: 9, min: 6, max: 12 },
  { label: "1–2 tahun", months: 18, min: 12, max: 24 },
  { label: "2–3 tahun", months: 30, min: 24, max: 36 },
  { label: "3–5 tahun", months: 48, min: 36, max: 60 },
  { label: "5 tahun ke atas", months: 72, min: 60, max: Infinity },
];

function bandLabelForMonths(months?: number): string {
  if (!months) return AGE_BANDS[2].label;
  const found = AGE_BANDS.find((b) => months >= b.min && months < b.max);
  return (found ?? AGE_BANDS[AGE_BANDS.length - 1]).label;
}

const MOODS = ["Ceria", "Biasa aja", "Capek", "Rewel dikit"];
const DURATIONS = ["15 menit", "30 menit", "1 jam"];
const BUDGETS = ["Gratis, pakai barang rumah", "Hemat (di bawah Rp50rb)", "Fleksibel, boleh beli bahan"];

function FilterGroup({
  icon: Icon,
  label,
  options,
  value,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-teal/70 dark:text-dark-text/70">
        <Icon size={14} strokeWidth={1.5} className="text-sage" />
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(value === o ? null : o)}
            className={cn(
              "rounded-full border px-4 py-2 text-[14px] transition-all duration-150 active:scale-[0.97]",
              value === o
                ? "border-sage bg-sage text-white shadow-soft"
                : "border-cloud text-teal/60 hover:bg-sage/10 dark:text-dark-text/60"
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function AktivitasContent() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [ageBand, setAgeBand] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [materials, setMaterials] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Activity | null>(null);
  const [history, setHistory] = useState<Activity[]>([]);

  useEffect(() => {
    setAgeBand((prev) => prev ?? bandLabelForMonths(profile?.childAgeMonths));
  }, [profile?.childAgeMonths]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "activities"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(
        snap.docs.map((d: { id: string; data: () => unknown }) => ({ id: d.id, ...(d.data() as Activity) }))
      );
    });
    return () => unsub();
  }, [user]);

  const filtersChanged =
    ageBand !== bandLabelForMonths(profile?.childAgeMonths) || mood || duration || budget || materials.trim();

  function resetFilters() {
    haptic("tap");
    setAgeBand(bandLabelForMonths(profile?.childAgeMonths));
    setMood(null);
    setDuration(null);
    setBudget(null);
    setMaterials("");
  }

  async function handleGenerate() {
    if (!user || !profile) return;
    haptic("tap");
    setLoading(true);
    setError(null);
    setResult(null);
    const selectedBand = AGE_BANDS.find((b) => b.label === ageBand);
    try {
      const res = await fetch("/api/generate-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: profile.childName,
          ageMonths: selectedBand?.months ?? profile.childAgeMonths,
          ageBandLabel: ageBand ?? undefined,
          mood: mood ?? undefined,
          duration: duration ?? undefined,
          budget: budget ?? undefined,
          materials: materials.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Aku belum bisa jawab sekarang. Boleh dicoba ulang?");
        return;
      }
      const activity: Activity = {
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        materials: data.materials ?? [],
        steps: data.steps ?? [],
        ageRangeLabel: data.ageRangeLabel ?? ageBand ?? "",
        favorite: false,
        createdAt: Date.now(),
      };
      const ref = await addDoc(collection(db, "users", user.uid, "activities"), activity);
      setResult({ ...activity, id: ref.id });
      showToast("Ide aktivitas baru siap dicoba.", "success");
    } catch {
      setError("Sepertinya koneksi lagi kurang stabil. Coba lagi sebentar ya.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(a: Activity) {
    if (!user || !a.id) return;
    haptic("tap");
    const nextFavorite = !a.favorite;
    await updateDoc(doc(db, "users", user.uid, "activities", a.id), {
      favorite: nextFavorite,
    });
    if (result?.id === a.id) setResult({ ...result, favorite: nextFavorite });
    if (nextFavorite) showToast("Disimpan ke favorit.", "success");
  }

  async function removeActivity(id?: string) {
    if (!user || !id) return;
    haptic("tap");
    await deleteDoc(doc(db, "users", user.uid, "activities", id));
    showToast("Aktivitas dihapus dari riwayat.", "info");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-serif font-medium text-teal dark:text-dark-text">
          Ide aktivitas untuk {profile?.childName ?? "si kecil"}
        </h1>
        <p className="mt-1 text-[15px] text-teal/60 dark:text-dark-text/60">
          Atur usia, mood, waktu, dan budget, biar idenya pas buat hari ini.
        </p>
      </div>

      <Card>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-medium text-teal dark:text-dark-text">Filter</p>
            {filtersChanged && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1 text-[13px] font-medium text-teal/50 hover:text-teal/80 dark:text-dark-text/50"
              >
                <RotateCcw size={13} strokeWidth={1.75} />
                Reset
              </button>
            )}
          </div>

          <FilterGroup
            icon={Baby}
            label="Usia anak"
            options={AGE_BANDS.map((b) => b.label)}
            value={ageBand}
            onChange={setAgeBand}
          />
          <FilterGroup
            icon={SmilePlus}
            label="Mood anak hari ini"
            options={MOODS}
            value={mood}
            onChange={setMood}
          />
          <FilterGroup
            icon={Clock}
            label="Waktu tersedia"
            options={DURATIONS}
            value={duration}
            onChange={setDuration}
          />
          <FilterGroup
            icon={PiggyBank}
            label="Budget"
            options={BUDGETS}
            value={budget}
            onChange={setBudget}
          />

          <div>
            <p id="materials-label" className="mb-2 text-[13px] font-medium text-teal/70 dark:text-dark-text/70">
              Bahan yang ada di rumah (opsional)
            </p>
            <Textarea
              placeholder="mis. kertas, krayon, botol bekas..."
              aria-labelledby="materials-label"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={handleGenerate} disabled={loading}>
            <Sparkles size={18} strokeWidth={1.5} />
            {loading ? "Sedang mikirin ide terbaik..." : "Buatkan ide aktivitas"}
          </Button>

          {error && <ErrorState message={error} onRetry={handleGenerate} />}
        </div>
      </Card>

      {loading && <CardSkeleton className="animate-bloom" />}

      {result && !loading && (
        <Card className="relative overflow-hidden border-sage/40 bg-gradient-to-b from-sage-light/20 to-white animate-bloom dark:from-sage/10 dark:to-dark-card">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber/20 blur-2xl" />

          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-sage">
              <Wand2 size={13} strokeWidth={1.75} />
              Ide aktivitas siap
            </span>
            <button
              onClick={() => toggleFavorite(result)}
              aria-label="Tandai favorit"
              className="shrink-0 rounded-full p-1.5 hover:bg-amber/20"
            >
              <Star
                size={20}
                strokeWidth={1.5}
                className={cn(
                  "transition-transform active:scale-90",
                  result.favorite ? "fill-amber text-amber" : "text-teal/30"
                )}
              />
            </button>
          </div>

          <CardTitle className="text-[20px]">{result.title}</CardTitle>
          <CardDescription className="mt-1.5 italic">{result.description}</CardDescription>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {result.ageRangeLabel && <Badge variant="sage">{result.ageRangeLabel}</Badge>}
            <Badge variant="amber" className="gap-1">
              <Clock size={12} strokeWidth={1.5} />
              {result.durationMinutes} menit
            </Badge>
          </div>

          {result.materials.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-medium text-teal/70 dark:text-dark-text/70">
                Bahan
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.materials.map((m, i) => (
                  <Badge key={i} variant="cloud">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {result.steps.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[13px] font-medium text-teal/70 dark:text-dark-text/70">
                Langkah
              </p>
              <ol className="space-y-2.5">
                {result.steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-[12px] font-medium text-white">
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[15px] leading-relaxed text-teal dark:text-dark-text">
                      {s}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="mt-5 w-full justify-center"
          >
            <Sparkles size={14} strokeWidth={1.5} />
            Coba ide lain dengan filter ini
          </Button>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-[18px] font-medium">Riwayat aktivitas</h2>
        {history.length === 0 ? (
          <EmptyState
            icon={BookHeart}
            title="Riwayat masih kosong"
            description="Setiap ide yang kamu buat akan tersimpan di sini, jadi bisa dibuka lagi kapan pun kamu mau."
          />
        ) : (
          <div className="space-y-3">
            {history.map((a) => (
              <Card key={a.id} className="animate-pop">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{a.title}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {a.description}
                    </CardDescription>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.ageRangeLabel && (
                        <Badge variant="sage" className="text-[11px]">
                          {a.ageRangeLabel}
                        </Badge>
                      )}
                      <Badge variant="cloud" className="gap-1 text-[11px]">
                        <Clock size={11} strokeWidth={1.5} />
                        {a.durationMinutes} menit
                      </Badge>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => toggleFavorite(a)}
                      aria-label="Tandai favorit"
                      className="rounded-full p-2 hover:bg-amber/20"
                    >
                      <Star
                        size={18}
                        strokeWidth={1.5}
                        className={a.favorite ? "fill-amber text-amber" : "text-teal/40"}
                      />
                    </button>
                    <button
                      onClick={() => removeActivity(a.id)}
                      aria-label="Hapus"
                      className="rounded-full p-2 hover:bg-rose/20"
                    >
                      <Trash2 size={18} strokeWidth={1.5} className="text-teal/40" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AktivitasPage() {
  return (
    <AppShell>
      <AktivitasContent />
    </AppShell>
  );
}
