"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { db, doc, getLocalUid, setDoc } from "@/lib/local-db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo, Wordmark } from "@/components/logo";
import { ErrorState } from "@/components/error-state";
import { cn } from "@/lib/utils";

type FormStep = "parent" | "child" | "age";
type Step = "welcome" | FormStep | "loading";

const FORM_STEPS: FormStep[] = ["parent", "child", "age"];

const AGE_OPTIONS: { label: string; months: number }[] = [
  { label: "0–1 tahun", months: 6 },
  { label: "2–3 tahun", months: 30 },
  { label: "4–5 tahun", months: 54 },
  { label: "6–8 tahun", months: 84 },
  { label: "9+ tahun", months: 108 },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");

  const [parentName, setParentName] = useState("");
  const [childName, setChildName] = useState("");
  const [selectedAge, setSelectedAge] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const formIndex = step === "welcome" || step === "loading" ? -1 : FORM_STEPS.indexOf(step);

  function goNext() {
    setError(null);
    if (step === "parent" && !parentName.trim()) {
      setError("Boleh diisi dulu nama Ibu, ya.");
      return;
    }
    if (step === "child" && !childName.trim()) {
      setError("Boleh diisi dulu nama si kecil, Ibu.");
      return;
    }
    const next = FORM_STEPS[formIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    setError(null);
    if (step === "parent") {
      setStep("welcome");
      return;
    }
    const prev = FORM_STEPS[formIndex - 1];
    if (prev) setStep(prev);
  }

  async function handleFinish() {
    setError(null);
    if (!selectedAge) return;
    const ageOption = AGE_OPTIONS.find((a) => a.label === selectedAge);
    if (!ageOption) return;

    setStep("loading");
    const startedAt = Date.now();
    try {
      // Tidak ada akun/email — data ini langsung tersimpan di HP ini saja.
      const uid = getLocalUid();
      await setDoc(doc(db, "users", uid), {
        parentName: parentName.trim() || undefined,
        childName: childName.trim(),
        childAgeMonths: ageOption.months,
        createdAt: Date.now(),
      });
      const elapsed = Date.now() - startedAt;
      setTimeout(() => router.replace("/beranda"), Math.max(0, 1000 - elapsed));
    } catch {
      setError("Ada kendala saat menyimpan. Coba lagi sebentar ya.");
      setStep("age");
    }
  }

  // --- Welcome ---
  if (step === "welcome") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-6 dark:bg-dark-bg">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center animate-bloom">
          <Logo size={64} className="animate-breathe [animation-duration:2.4s]" />
          <div className="space-y-2">
            <h1 className="text-[24px] font-serif font-medium text-teal dark:text-dark-text">
              Halo, Ibu. ❤️
            </h1>
            <p className="text-[15px] leading-relaxed text-teal/60 dark:text-dark-text/60">
              Senang bertemu dengan Ibu.
              <br />
              Mari mulai.
            </p>
          </div>
          <Button className="w-full" onClick={() => setStep("parent")}>
            Mulai
          </Button>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (step === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-6 dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-4 animate-bloom">
          <Logo size={64} className="animate-breathe [animation-duration:2.4s]" />
          <Wordmark />
          <p className="max-w-[240px] text-center text-[14px] leading-relaxed text-teal/50 dark:text-dark-text/50">
            Menyiapkan TENANGIN untuk Ibu...
          </p>
        </div>
        <div className="mt-10 flex gap-1.5">
          <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-sage [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-sage [animation-delay:200ms]" />
          <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-sage [animation-delay:400ms]" />
        </div>
      </div>
    );
  }

  // --- Nama Ibu / Nama Anak / Usia Anak ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-5 dark:bg-dark-bg">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Kembali"
            className="flex h-9 w-9 items-center justify-center rounded-full text-teal/60 hover:bg-cloud/40 dark:text-dark-text/60"
          >
            <ChevronLeft size={20} strokeWidth={1.75} />
          </button>
          <div className="flex flex-1 gap-1.5">
            {FORM_STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  i <= formIndex ? "bg-sage" : "bg-cloud/60 dark:bg-dark-card"
                )}
              />
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === "age") handleFinish();
            else goNext();
          }}
        >
          {step === "parent" && (
            <div key="step-parent" className="animate-slide-in space-y-6">
              <div>
                <h1 className="mb-1 text-[24px] font-serif font-medium text-teal dark:text-dark-text">
                  Siapa nama Ibu?
                </h1>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="parentName">Nama Ibu</Label>
                <Input
                  id="parentName"
                  placeholder="mis. Ika"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === "child" && (
            <div key="step-child" className="animate-slide-in space-y-6">
              <div>
                <h1 className="mb-1 text-[24px] font-serif font-medium text-teal dark:text-dark-text">
                  Siapa nama si kecil?
                </h1>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="childName">Nama anak</Label>
                <Input
                  id="childName"
                  placeholder="mis. Kirana"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === "age" && (
            <div key="step-age" className="animate-slide-in space-y-6">
              <div>
                <h1 className="mb-1 text-[24px] font-serif font-medium text-teal dark:text-dark-text">
                  Berapa usia si kecil?
                </h1>
              </div>
              <div className="flex flex-col gap-2.5">
                {AGE_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedAge(option.label)}
                    className={cn(
                      "w-full rounded-input border px-4 py-3.5 text-left text-[15px] font-medium transition-colors",
                      selectedAge === option.label
                        ? "border-sage bg-sage/10 text-teal dark:text-dark-text"
                        : "border-cloud bg-white text-teal/70 dark:border-dark-card dark:bg-dark-card dark:text-dark-text/70"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <ErrorState message={error} className="mt-5" />}

          <div className="mt-7">
            {step !== "age" ? (
              <Button type="submit" className="w-full">
                Berikutnya
              </Button>
            ) : (
              <Button type="submit" className="w-full" disabled={!selectedAge}>
                Mulai TENANGIN
              </Button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-teal/40 dark:text-dark-text/40">
          Data disimpan hanya di HP ini. Kamu bisa membuat cadangan kapan saja lewat halaman
          Profil.
        </p>
      </div>
    </div>
  );
}
