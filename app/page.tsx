"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "@/components/splash-screen";

export default function RootPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // Tidak ada login — kalau profil (nama & usia anak) sudah pernah diisi
    // di device ini, langsung masuk. Kalau belum, tampilkan onboarding.
    router.replace(profile ? "/beranda" : "/register");
  }, [profile, loading, router]);

  return <SplashScreen tagline="Teman Parenting Tanpa Bentakan" />;
}
