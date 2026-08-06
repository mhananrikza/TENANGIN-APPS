"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "./bottom-nav";
import { SplashScreen } from "./splash-screen";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Tidak ada login — kalau device ini belum pernah mengisi onboarding
    // (nama & usia anak), arahkan ke situ dulu.
    if (!loading && !profile) {
      router.replace("/register");
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-sand dark:bg-dark-bg">
      <main className="mx-auto max-w-md animate-fade-up px-5 pb-28 pt-8">{children}</main>
      <BottomNav />
    </div>
  );
}
