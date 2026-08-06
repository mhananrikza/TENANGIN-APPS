// Sistem pencapaian kecil (badge) — bikin progres terasa dirayakan tanpa
// membuat aplikasi ramai. Tidak ada skor/leaderboard, murni penanda pribadi.

export type BadgeStats = {
  completedMateri: number;
  appStreak: number;
  activitiesCount: number;
  moodCheckins: number;
  tasksDone: number;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: "Sprout" | "Flame" | "Heart" | "Sparkles" | "Sun" | "Trophy";
  earned: boolean;
};

export function computeBadges(stats: BadgeStats): Badge[] {
  return [
    {
      id: "langkah-pertama",
      title: "Langkah Pertama",
      description: "Menyelesaikan materi Bertumbuh pertamamu.",
      icon: "Sprout",
      earned: stats.completedMateri >= 1,
    },
    {
      id: "setengah-jalan",
      title: "Setengah Perjalanan",
      description: "Menyelesaikan separuh dari perjalanan Bertumbuh.",
      icon: "Trophy",
      earned: stats.completedMateri >= 4,
    },
    {
      id: "api-kecil",
      title: "Api Kecil",
      description: "Hadir 3 hari berturut-turut untuk dirimu sendiri.",
      icon: "Flame",
      earned: stats.appStreak >= 3,
    },
    {
      id: "api-menyala",
      title: "Api yang Menyala",
      description: "Hadir 7 hari berturut-turut. Konsistensi kecil, dampak besar.",
      icon: "Flame",
      earned: stats.appStreak >= 7,
    },
    {
      id: "jujur-pada-rasa",
      title: "Jujur Pada Rasa",
      description: "Mencatat perasaanmu 5 kali. Mengenali rasa itu langkah besar.",
      icon: "Heart",
      earned: stats.moodCheckins >= 5,
    },
    {
      id: "kreatif-bareng-anak",
      title: "Kreatif Bareng Anak",
      description: "Membuat 5 ide aktivitas untuk si kecil.",
      icon: "Sparkles",
      earned: stats.activitiesCount >= 5,
    },
    {
      id: "hari-yang-tertata",
      title: "Hari yang Tertata",
      description: "Menyelesaikan 10 rencana di Planner.",
      icon: "Sun",
      earned: stats.tasksDone >= 10,
    },
  ];
}
