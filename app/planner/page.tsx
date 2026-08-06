"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ClipboardList,
  PartyPopper,
  Heart,
  Coffee,
  Home as HomeIcon,
  History,
  ChevronDown,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Confetti } from "@/components/confetti";
import { haptic } from "@/lib/haptics";
import { useToast } from "@/lib/toast-context";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { dateKey, todayKey } from "@/lib/date";
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
import type { Task, TaskCategory } from "@/lib/types";

// Planner TENANGIN bukan to-do list kerja — ini ruang rencana kecil seputar
// momen bareng anak, waktu buat diri sendiri, dan urusan rumah. Kategori di
// bawah ini yang bikin bedanya kelihatan di layout & checklist.
const CATEGORIES: Record<
  TaskCategory,
  { label: string; icon: LucideIcon; badge: "rose" | "amber" | "sage" | "cloud" }
> = {
  anak: { label: "Anak", icon: Heart, badge: "rose" },
  diri: { label: "Diri Sendiri", icon: Coffee, badge: "amber" },
  rumah: { label: "Rumah", icon: HomeIcon, badge: "sage" },
  lainnya: { label: "Lainnya", icon: ClipboardList, badge: "cloud" },
};

const CATEGORY_ORDER: TaskCategory[] = ["anak", "diri", "rumah", "lainnya"];

function suggestionsFor(childName?: string): { label: string; category: TaskCategory }[] {
  const child = childName?.trim() || "si kecil";
  return [
    { label: `Main bareng ${child} 15 menit`, category: "anak" },
    { label: "Me-time sebentar, seduh minuman favorit", category: "diri" },
    { label: "Siapkan bekal / baju besok", category: "rumah" },
    { label: `Baca buku bareng ${child}`, category: "anak" },
  ];
}

function dayLabel(key: string): string {
  const diffDays = Math.round(
    (new Date(`${todayKey()}T00:00:00`).getTime() - new Date(`${key}T00:00:00`).getTime()) /
      86_400_000
  );
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  return new Date(`${key}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function TaskRow({
  task,
  onToggle,
  onRemove,
}: {
  task: Task;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const meta = CATEGORIES[task.category ?? "lainnya"];
  const Icon = meta.icon;
  return (
    <div className="flex animate-pop items-center gap-3 rounded-card border border-cloud/60 bg-white p-4 shadow-soft transition-colors dark:border-dark-card dark:bg-dark-card">
      <button
        onClick={onToggle}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.done ? "border-sage bg-sage" : "border-cloud"
        )}
        aria-label={task.done ? "Tandai belum selesai" : "Tandai selesai"}
        aria-pressed={task.done}
      >
        {task.done && <span className="h-2 w-2 animate-pop rounded-full bg-white" />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[15px]",
            task.done
              ? "text-teal/40 line-through dark:text-dark-text/40"
              : "text-teal dark:text-dark-text"
          )}
        >
          {task.title}
        </p>
        <Badge variant={meta.badge} className="mt-1.5 gap-1 py-0.5 text-[11px]">
          <Icon size={11} strokeWidth={1.5} />
          {meta.label}
        </Badge>
      </div>
      <button
        onClick={onRemove}
        aria-label="Hapus rencana"
        className="shrink-0 rounded-full p-1.5 hover:bg-rose/20"
      >
        <Trash2 size={16} strokeWidth={1.5} className="text-teal/40" />
      </button>
    </div>
  );
}

function PlannerContent() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("anak");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adding, setAdding] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "tasks"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs.map((d: { id: string; data: () => unknown }) => ({ id: d.id, ...(d.data() as Task) }))
      );
    });
    return () => unsub();
  }, [user]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setAdding(true);
    try {
      await addDoc(collection(db, "users", user.uid, "tasks"), {
        title: title.trim(),
        done: false,
        category,
        createdAt: Date.now(),
      });
      setTitle("");
      haptic("tap");
    } finally {
      setAdding(false);
    }
  }

  async function addSuggestion(label: string, cat: TaskCategory) {
    if (!user || adding) return;
    haptic("tap");
    setAdding(true);
    try {
      await addDoc(collection(db, "users", user.uid, "tasks"), {
        title: label,
        done: false,
        category: cat,
        createdAt: Date.now(),
      });
    } finally {
      setAdding(false);
    }
  }

  async function toggle(task: Task, siblings: Task[]) {
    if (!user || !task.id) return;
    const willBeDone = !task.done;
    haptic(willBeDone ? "success" : "tap");
    await updateDoc(doc(db, "users", user.uid, "tasks", task.id), {
      done: willBeDone,
    });

    // Rayakan momen ketika seluruh rencana hari ini selesai — tanpa berlebihan,
    // hanya sekali saat rencana terakhir yang aktif dicentang.
    const stillActive = siblings.filter((t) => t.id !== task.id && !t.done);
    if (willBeDone && stillActive.length === 0 && siblings.length > 1) {
      haptic("celebrate");
      setCelebrate(true);
      showToast("Semua rencana hari ini selesai. Kerja bagus, Ibu.", "success");
    }
  }

  async function remove(id?: string) {
    if (!user || !id) return;
    haptic("tap");
    await deleteDoc(doc(db, "users", user.uid, "tasks", id));
  }

  const today = todayKey();

  const { todayTasks, historyGroups } = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const t of tasks) {
      const key = dateKey(t.createdAt);
      const list = groups.get(key) ?? [];
      list.push(t);
      groups.set(key, list);
    }
    const todayList = groups.get(today) ?? [];
    groups.delete(today);
    const history = Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, list]) => ({
        key,
        label: dayLabel(key),
        tasks: list,
        done: list.filter((t) => t.done).length,
      }));
    return { todayTasks: todayList, historyGroups: history };
  }, [tasks, today]);

  const activeToday = todayTasks.filter((t) => !t.done);
  const doneToday = todayTasks.filter((t) => t.done);
  const orderedToday = [...activeToday, ...doneToday];
  const percent = todayTasks.length > 0 ? Math.round((doneToday.length / todayTasks.length) * 100) : 0;

  const progressCopy =
    todayTasks.length === 0
      ? ""
      : percent === 100
        ? "Semua rencana hari ini kelar. Kamu boleh rehat sekarang, Bu."
        : doneToday.length === 0
          ? "Ayo mulai dari satu yang paling ringan dulu."
          : "Pelan-pelan aja, satu-satu juga sudah maju.";

  const suggestions = suggestionsFor(profile?.childName);

  return (
    <div className="space-y-6">
      {celebrate && <Confetti onDone={() => setCelebrate(false)} />}

      <div>
        <h1 className="text-[22px] font-serif font-medium text-teal dark:text-dark-text">
          Parenting Planner
        </h1>
        <p className="mt-1 text-[15px] text-teal/60 dark:text-dark-text/60">
          {profile?.childName
            ? `Rencana kecil buat kamu & ${profile.childName} hari ini.`
            : "Rencana kecil hari ini, secukupnya saja."}
        </p>
      </div>

      {todayTasks.length > 0 && (
        <Card className="animate-bloom">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-teal/60 dark:text-dark-text/60">
                Progres hari ini
              </p>
              <p className="mt-0.5 text-[15px] font-medium text-teal dark:text-dark-text">
                {doneToday.length} dari {todayTasks.length} rencana selesai
              </p>
            </div>
            <span className="font-serif text-[22px] font-medium text-sage">{percent}%</span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cloud/40 dark:bg-dark-bg">
            <div
              className="h-full rounded-full bg-sage transition-all duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-[13px] text-teal/50 dark:text-dark-text/50">{progressCopy}</p>
        </Card>
      )}

      <div className="space-y-2.5">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {CATEGORY_ORDER.map((c) => {
            const meta = CATEGORIES[c];
            const Icon = meta.icon;
            const selected = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  selected
                    ? "border-sage bg-sage text-white"
                    : "border-cloud/70 bg-white text-teal/60 hover:bg-sage/10 dark:bg-dark-card dark:text-dark-text/60"
                )}
              >
                <Icon size={13} strokeWidth={1.5} />
                {meta.label}
              </button>
            );
          })}
        </div>
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            placeholder="Apa yang mau direncanakan hari ini?"
            aria-label="Tulis rencana baru"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={adding || !title.trim()} aria-label="Tambah rencana">
            <Plus size={20} strokeWidth={2} />
          </Button>
        </form>
      </div>

      {todayTasks.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={ClipboardList}
            title="Belum ada rencana hari ini"
            description="Nggak harus banyak, satu hal kecil buat kamu atau si kecil juga cukup."
          />
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-teal/60 dark:text-dark-text/60">
              <Lightbulb size={14} strokeWidth={1.5} />
              Butuh ide? Coba salah satu ini
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => addSuggestion(s.label, s.category)}
                  disabled={adding}
                  className="rounded-full border border-sage/40 bg-sage-light/20 px-3.5 py-2 text-left text-[13.5px] leading-snug text-teal/80 transition-colors hover:bg-sage-light/40 active:scale-[0.98] disabled:opacity-50 dark:border-sage/30 dark:bg-sage/10 dark:text-dark-text/80"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : activeToday.length === 0 ? (
        <div className="flex animate-bloom items-center gap-3 rounded-card bg-sage-light/40 p-4">
          <PartyPopper size={22} strokeWidth={1.5} className="shrink-0 text-sage" />
          <p className="text-[14px] leading-relaxed text-teal dark:text-dark-text">
            Semua rencana hari ini sudah selesai. Kamu boleh istirahat sekarang.
          </p>
        </div>
      ) : null}

      {todayTasks.length > 0 && (
        <div className="space-y-2">
          {orderedToday.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={() => toggle(t, todayTasks)}
              onRemove={() => remove(t.id)}
            />
          ))}
        </div>
      )}

      {historyGroups.length > 0 && (
        <div className="border-t border-cloud/60 pt-4 dark:border-dark-card">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-1.5 text-[15px] font-medium text-teal dark:text-dark-text">
              <History size={16} strokeWidth={1.5} className="text-teal/50" />
              Riwayat rencana
            </span>
            <ChevronDown
              size={18}
              strokeWidth={1.5}
              className={cn(
                "text-teal/40 transition-transform duration-200",
                historyOpen && "rotate-180"
              )}
            />
          </button>

          {historyOpen && (
            <div className="mt-3 animate-bloom space-y-2">
              {historyGroups.map((g) => (
                <div key={g.key}>
                  <button
                    type="button"
                    onClick={() => setOpenDay((v) => (v === g.key ? null : g.key))}
                    className="flex w-full items-center justify-between gap-2 rounded-card border border-cloud/60 bg-white/60 px-4 py-3 text-left dark:border-dark-card dark:bg-dark-card/40"
                  >
                    <span className="text-[14px] font-medium text-teal dark:text-dark-text">
                      {g.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant={g.done === g.tasks.length ? "sage" : "cloud"}>
                        {g.done}/{g.tasks.length} selesai
                      </Badge>
                      <ChevronDown
                        size={15}
                        strokeWidth={1.5}
                        className={cn(
                          "text-teal/40 transition-transform duration-200",
                          openDay === g.key && "rotate-180"
                        )}
                      />
                    </span>
                  </button>
                  {openDay === g.key && (
                    <div className="mt-2 animate-bloom space-y-2 pl-1">
                      {g.tasks.map((t) => (
                        <TaskRow
                          key={t.id}
                          task={t}
                          onToggle={() => toggle(t, g.tasks)}
                          onRemove={() => remove(t.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <AppShell>
      <PlannerContent />
    </AppShell>
  );
}
