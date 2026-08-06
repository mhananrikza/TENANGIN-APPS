"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { db, doc, getLocalUid, onSnapshot } from "./local-db";
import type { UserProfile } from "./types";

type LocalUser = { uid: string };

type AuthContextValue = {
  user: LocalUser | null;
  profile: UserProfile | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
});

// Tidak ada login/email di TENANGIN — setiap device otomatis punya id lokal
// (dibuat sekali, tersimpan di localStorage) supaya struktur data
// `users/{uid}/...` yang sudah ada tetap bisa dipakai tanpa akun apa pun.
// Profil (nama & usia anak) dianggap ada begitu pengguna mengisi wizard
// singkat di /register.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getLocalUid();
    // onSnapshot memanggil callback ini secara sinkron sekali di awal
    // (baca lib/local-db.ts), jadi `profile` & `loading` sudah pasti
    // konsisten sebelum komponen lain (mis. redirect di app/page.tsx)
    // sempat merender ulang.
    const unsubDoc = onSnapshot(doc(db, "users", uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      setLoading(false);
    });
    setUser({ uid });
    return () => unsubDoc();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
