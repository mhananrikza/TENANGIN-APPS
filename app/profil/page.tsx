"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  Trash2,
  Sprout,
  Flame,
  Heart,
  Sparkles,
  Sun,
  Moon,
  Trophy,
  Lock,
  User,
  Info,
  ShieldCheck,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";
import { useBadges } from "@/lib/use-badges";
import { db, doc, updateDoc, exportAllData, importAllData, clearAllLocalData } from "@/lib/local-db";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { haptic } from "@/lib/haptics";
import { sapaan } from "@/lib/greeting";
import { cn } from "@/lib/utils";
import type { Badge as BadgeType } from "@/lib/badges";

const BADGE_ICONS: Record<BadgeType["icon"], LucideIcon> = {
  Sprout,
  Flame,
  Heart,
  Sparkles,
  Sun,
  Trophy,
};

const APP_VERSION = "1.0.0";

function BadgeTile({ badge }: { badge: BadgeType }) {
  const Icon = BADGE_ICONS[badge.icon];
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-card border p-4 text-center transition-transform",
        badge.earned
          ? "border-sage/40 bg-sage-light/20 active:scale-[0.97]"
          : "border-cloud/60 bg-white/50 opacity-60 dark:bg-dark-card/40"
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full",
          badge.earned ? "bg-sage/20" : "bg-cloud/40"
        )}
      >
        {badge.earned ? (
          <Icon size={20} strokeWidth={1.5} className="text-sage" />
        ) : (
          <Lock size={16} strokeWidth={1.5} className="text-teal/30" />
        )}
      </span>
      <p className="text-[12px] font-medium leading-tight text-teal dark:text-dark-text">
        {badge.title}
      </p>
    </div>
  );
}

/** Satu baris menu Pengaturan yang bisa dibuka/tutup, gaya premium & minim. */
function SettingsRow({
  icon: Icon,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-cloud/50 last:border-b-0 dark:border-dark-card/70">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 py-4 text-left transition-opacity active:opacity-60"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15">
          <Icon size={18} strokeWidth={1.5} className="text-sage" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-teal dark:text-dark-text">
            {title}
          </span>
          <span className="block truncate text-[12.5px] text-teal/50 dark:text-dark-text/50">
            {subtitle}
          </span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          className={cn(
            "shrink-0 text-teal/35 transition-transform duration-300 dark:text-dark-text/40",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-5 pl-[52px] pr-0.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DarkModeRow() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      setTheme(stored);
    } else {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    haptic("tap");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Ganti tema terang/gelap"
      className="flex w-full items-center gap-3 border-b border-cloud/50 py-4 text-left dark:border-dark-card/70"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage/15">
        {theme === "dark" ? (
          <Moon size={18} strokeWidth={1.5} className="text-sage" />
        ) : (
          <Sun size={18} strokeWidth={1.5} className="text-sage" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-teal dark:text-dark-text">
          Dark Mode
        </span>
        <span className="block text-[12.5px] text-teal/50 dark:text-dark-text/50">
          Tampilan {theme === "dark" ? "gelap" : "terang"} aktif
        </span>
      </span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          theme === "dark" ? "bg-sage" : "bg-cloud"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-soft transition-transform",
            theme === "dark" ? "translate-x-6" : "translate-x-1"
          )}
        />
      </span>
    </button>
  );
}

function SettingsContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { badges, earnedCount } = useBadges();

  const [openSection, setOpenSection] = useState<string | null>(null);
  function toggleSection(id: string) {
    haptic("tap");
    setOpenSection((cur) => (cur === id ? null : id));
  }

  // --- Profil ---
  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setParentName(profile.parentName ?? "");
    setChildName(profile.childName);
    setYears(String(Math.floor(profile.childAgeMonths / 12)));
    setMonths(String(profile.childAgeMonths % 12));
  }, [profile]);

  async function handleSave() {
    if (!user) return;
    const totalMonths = (Number(years) || 0) * 12 + (Number(months) || 0);
    if (!childName.trim() || totalMonths <= 0) {
      showToast("Lengkapi dulu nama dan usia anak ya, Ibu.", "error");
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        parentName: parentName.trim() || undefined,
        childName: childName.trim(),
        childAgeMonths: totalMonths,
      });
      setSaved(true);
      showToast("Data anak berhasil diperbarui.", "success");
    } catch {
      showToast("Belum tersimpan, coba lagi sebentar ya.", "error");
    } finally {
      setSaving(false);
    }
  }

  // --- Backup & Restore ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetConfirming, setResetConfirming] = useState(false);

  async function handleExport() {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tenangin-cadangan-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Cadangan berhasil diunduh. Simpan file ini baik-baik ya.", "success");
    } catch {
      showToast("Belum bisa membuat cadangan sekarang. Coba lagi ya.", "error");
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importAllData(text);
      if (result.ok) {
        showToast("Data berhasil dipulihkan dari cadangan.", "success");
        router.refresh();
      } else {
        showToast(result.error ?? "File cadangan tidak bisa dibaca.", "error");
      }
    } catch {
      showToast("File cadangan tidak bisa dibaca.", "error");
    }
  }

  async function handleReset() {
    if (!resetConfirming) {
      setResetConfirming(true);
      // Batalkan otomatis kalau tidak dikonfirmasi dalam beberapa detik,
      // supaya tombol tidak "nyangkut" di mode konfirmasi selamanya.
      window.setTimeout(() => setResetConfirming(false), 4000);
      return;
    }
    await clearAllLocalData();
    router.replace("/register");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Logo size={44} />
        <div>
          <h1 className="text-[22px] font-serif font-medium text-teal dark:text-dark-text">Pengaturan</h1>
          <p className="text-[14px] text-teal/60 dark:text-dark-text/60">
            {profile
              ? `Halo, ${sapaan(profile)}, semua tersimpan rapi di HP ini`
              : "Atur profil, data, dan tampilan TENANGIN"}
          </p>
        </div>
      </div>

      <div className="rounded-card border border-cloud/60 bg-white px-5 shadow-soft dark:border-dark-card dark:bg-dark-card">
        {/* Profil */}
        <SettingsRow
          icon={User}
          title="Profil"
          subtitle={profile ? `${profile.childName} · ${sapaan(profile)}` : "Nama & usia anak"}
          isOpen={openSection === "profil"}
          onToggle={() => toggleSection("profil")}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="parentName">Nama Ibu (opsional)</Label>
              <Input
                id="parentName"
                placeholder="mis. Ika"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="childName">Nama anak</Label>
              <Input
                id="childName"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="years">Usia (tahun)</Label>
                <Input
                  id="years"
                  type="number"
                  min={0}
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="months">Usia (bulan)</Label>
                <Input
                  id="months"
                  type="number"
                  min={0}
                  max={11}
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : saved ? "Tersimpan ✓" : "Simpan perubahan"}
            </Button>

            <div className="pt-2">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-medium text-teal/70 dark:text-dark-text/70">
                  Pencapaianmu
                </span>
                <span className="text-[13px] font-medium text-sage">
                  {earnedCount}/{badges.length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {badges.map((b) => (
                  <BadgeTile key={b.id} badge={b} />
                ))}
              </div>
            </div>
          </div>
        </SettingsRow>

        {/* Backup */}
        <SettingsRow
          icon={Download}
          title="Backup"
          subtitle="Unduh cadangan data ke HP"
          isOpen={openSection === "backup"}
          onToggle={() => toggleSection("backup")}
        >
          <div className="space-y-3">
            <p className="text-[13.5px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              Semua data TENANGIN hanya tersimpan di HP ini. Tidak ada akun cloud. Unduh
              cadangan sesekali (mis. sebelum ganti HP) supaya mood, planner, dan progres
              Bertumbuh tidak hilang.
            </p>
            <Button variant="secondary" className="w-full" onClick={handleExport}>
              <Download size={18} strokeWidth={1.5} />
              Unduh cadangan
            </Button>
          </div>
        </SettingsRow>

        {/* Restore */}
        <SettingsRow
          icon={Upload}
          title="Restore"
          subtitle="Pulihkan data dari file cadangan"
          isOpen={openSection === "restore"}
          onToggle={() => toggleSection("restore")}
        >
          <div className="space-y-3">
            <p className="text-[13.5px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              Punya file cadangan dari HP lama? Pulihkan di sini. Data yang tersimpan saat
              ini akan digantikan dengan isi file cadangan tersebut.
            </p>
            <Button variant="secondary" className="w-full" onClick={handleImportClick}>
              <Upload size={18} strokeWidth={1.5} />
              Pulihkan dari cadangan
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportFile}
            />

            <div className="pt-2">
              <Button
                variant="secondary"
                className={cn("w-full", resetConfirming && "border-rose text-rose")}
                onClick={handleReset}
              >
                <Trash2 size={18} strokeWidth={1.5} />
                {resetConfirming ? "Yakin? Ketuk sekali lagi" : "Hapus semua data di HP ini"}
              </Button>
            </div>
          </div>
        </SettingsRow>

        {/* Dark Mode — langsung aktif tanpa perlu dibuka */}
        <DarkModeRow />

        {/* Tentang TENANGIN */}
        <SettingsRow
          icon={Info}
          title="Tentang TENANGIN"
          subtitle={`Versi ${APP_VERSION}`}
          isOpen={openSection === "tentang"}
          onToggle={() => toggleSection("tentang")}
        >
          <div className="space-y-3">
            <p className="text-[13.5px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              TENANGIN adalah teman pendamping yang tenang untuk perjalanan mengasuh Ibu,
              hadir lewat catatan mood, planner harian, dan Teman AI yang mendengarkan tanpa
              menghakimi.
            </p>
            <p className="text-[13.5px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              Dibuat dengan sederhana dan hangat, supaya Ibu tetap punya ruang untuk bernapas
              di tengah kesibukan mengasuh.
            </p>
            <p className="text-[12px] text-teal/40 dark:text-dark-text/40">
              TENANGIN · Versi {APP_VERSION}
            </p>
          </div>
        </SettingsRow>

        {/* Privacy */}
        <SettingsRow
          icon={ShieldCheck}
          title="Privacy"
          subtitle="Data kamu, kendali kamu"
          isOpen={openSection === "privasi"}
          onToggle={() => toggleSection("privasi")}
        >
          <div className="space-y-3">
            <p className="text-[13.5px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              Tidak ada akun ataupun server pusat, data Ibu dan anak (mood, planner, progres
              Bertumbuh) tersimpan hanya di HP ini, tidak dikirim atau dibagikan ke pihak lain.
            </p>
            <p className="text-[13.5px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              File cadangan yang diunduh lewat menu Backup sepenuhnya berada dalam kendali
              Ibu, simpan atau hapus kapan saja sesuai kebutuhan.
            </p>
            <p className="text-[13.5px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              Menghapus data di menu Restore akan menghapus seluruhnya secara permanen dari
              HP ini dan tidak bisa dikembalikan tanpa file cadangan.
            </p>
          </div>
        </SettingsRow>
      </div>

      <p className="pt-2 text-center text-[12px] text-teal/30 dark:text-dark-text/30">
        TENANGIN · dibuat dengan hangat untuk perjalanan mengasuhmu
      </p>
    </div>
  );
}

export default function ProfilPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}
