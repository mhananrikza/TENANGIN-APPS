export type UserProfile = {
  parentName?: string;
  childName: string;
  childAgeMonths: number;
  createdAt: number;
};

export type Activity = {
  id?: string;
  title: string;
  description: string;
  durationMinutes: number;
  materials: string[];
  steps: string[];
  ageRangeLabel: string;
  favorite: boolean;
  createdAt: number;
};

export type GenerateActivityRequest = {
  childName: string;
  ageMonths: number;
  ageBandLabel?: string;
  mood?: string;
  duration?: string;
  budget?: string;
  materials?: string;
};

export type MoodEntry = {
  id?: string;
  emoji: string;
  label: string;
  note?: string;
  dateKey: string; // "YYYY-MM-DD"
  createdAt: number;
};

// Progres perjalanan belajar "Bertumbuh" — satu dokumen per materi,
// disimpan di users/{uid}/growth/{materiId}
export type GrowthProgress = {
  materiId: string;
  completed: boolean;
  completedAt?: number;
  reflection?: string;
  reflectionUpdatedAt?: number;
  actionDone: boolean;
  actionDoneAt?: number;
};

export type TaskCategory = "anak" | "diri" | "rumah" | "lainnya";

export type Task = {
  id?: string;
  title: string;
  done: boolean;
  createdAt: number;
  category?: TaskCategory;
};

export type CompanionMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  mood?: string;
  materiId?: string;
};

// Ringkasan memori percakapan Teman AI — lihat lib/ai/memory.ts.
// Disimpan di users/{uid}/companion/memory
export type CompanionMemory = {
  summary: string;
  lastMoodTag?: string;
  topics?: string[];
  messageCount: number;
  updatedAt: number;
};

// Tantangan kecil harian — lihat lib/ai/daily-challenge.ts.
// Disimpan di users/{uid}/daily/{YYYY-MM-DD}
export type DailyChallengeEntry = {
  challenge: string;
  source: "materi" | "curated";
  materiId?: string;
  dateKey: string;
  done: boolean;
  createdAt: number;
};

// Refleksi akhir sesi curhat — lihat lib/ai/reflection.ts.
// Disimpan di users/{uid}/companion/reflections/{id}
export type ReflectionEntry = {
  id?: string;
  reflection: string;
  affirmation: string;
  createdAt: number;
};
