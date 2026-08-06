"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { collection, db, onSnapshot } from "./local-db";
import { TOTAL_MATERIALS, GROWTH_MATERIALS, getMaterialById } from "./growth-content";
import { dateKey } from "./date";
import type { GrowthProgress } from "./types";

export function useGrowthProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Record<string, GrowthProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProgress({});
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(collection(db, "users", user.uid, "growth"), (snap) => {
      const next: Record<string, GrowthProgress> = {};
      snap.docs.forEach((d: { id: string; data: () => unknown }) => {
        next[d.id] = d.data() as GrowthProgress;
      });
      setProgress(next);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const percent = Math.round((completedCount / TOTAL_MATERIALS) * 100);

  // Materi pertama yang belum selesai = "sedang dipelajari"
  const currentMateri =
    GROWTH_MATERIALS.find((m) => !progress[m.id]?.completed) ?? GROWTH_MATERIALS[GROWTH_MATERIALS.length - 1];

  const nextMateri = getMaterialById(currentMateri?.id ?? "")
    ? GROWTH_MATERIALS.find((m) => m.order === (currentMateri?.order ?? 0) + 1)
    : undefined;

  // Perkiraan hari beruntun belajar, dihitung dari tanggal aktivitas terakhir
  // (completedAt / actionDoneAt) di semua materi.
  function computeStreak(): number {
    const dateKeys = new Set<string>();
    Object.values(progress).forEach((p) => {
      [p.completedAt, p.actionDoneAt].forEach((ts) => {
        if (ts) dateKeys.add(dateKey(ts));
      });
    });
    if (dateKeys.size === 0) return 0;

    const cursor = new Date();
    // Kalau belum ada aktivitas hari ini, mulai hitung dari kemarin
    // supaya streak tidak langsung putus di pagi hari.
    if (!dateKeys.has(dateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (dateKeys.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  return {
    loading,
    progress,
    completedCount,
    totalCount: TOTAL_MATERIALS,
    percent,
    currentMateri,
    nextMateri,
    streak: computeStreak(),
  };
}
