"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { collection, db, onSnapshot } from "./local-db";
import { useGrowthProgress } from "./use-growth-progress";
import { useDailyStreak } from "./use-daily-streak";
import { computeBadges, type Badge } from "./badges";
import type { Task } from "./types";

export function useBadges() {
  const { user } = useAuth();
  const { completedCount } = useGrowthProgress();
  const { streak: appStreak } = useDailyStreak();
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [moodCheckins, setMoodCheckins] = useState(0);
  const [tasksDone, setTasksDone] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "activities"), (snap) => {
      setActivitiesCount(snap.size);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "moods"), (snap) => {
      setMoodCheckins(snap.size);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "tasks"), (snap) => {
      const done = snap.docs.filter((d: { data: () => unknown }) => (d.data() as Task).done).length;
      setTasksDone(done);
    });
    return () => unsub();
  }, [user]);

  const badges: Badge[] = computeBadges({
    completedMateri: completedCount,
    appStreak,
    activitiesCount,
    moodCheckins,
    tasksDone,
  });

  return { badges, earnedCount: badges.filter((b) => b.earned).length };
}
