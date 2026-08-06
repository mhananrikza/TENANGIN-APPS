"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { db, doc, getDoc, setDoc } from "./local-db";
import { todayKey, yesterdayKey } from "./date";

type StreakDoc = {
  count: number;
  lastOpenDateKey: string;
};

// Menghitung & memperbarui "hari beruntun membuka TENANGIN" — berbeda dari
// streak belajar Bertumbuh. Ini merayakan kehadiran, bukan penyelesaian materi.
export function useDailyStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [grewToday, setGrewToday] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStreak(0);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function sync() {
      const ref = doc(db, "users", user!.uid, "meta", "streak");
      try {
        const snap = await getDoc(ref);
        const today = todayKey();
        const existing = snap.exists() ? (snap.data() as StreakDoc) : null;

        if (existing?.lastOpenDateKey === today) {
          if (!cancelled) {
            setStreak(existing.count);
            setLoading(false);
          }
          return;
        }

        const continuing = existing?.lastOpenDateKey === yesterdayKey();
        const nextCount = continuing ? (existing?.count ?? 0) + 1 : 1;

        await setDoc(ref, { count: nextCount, lastOpenDateKey: today }, { merge: true });

        if (!cancelled) {
          setStreak(nextCount);
          setGrewToday(true);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { streak, grewToday, loading };
}
