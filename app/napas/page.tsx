"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/haptics";

type Phase = "idle" | "in" | "hold" | "out";

const PHASES: { key: Phase; label: string; seconds: number; scale: number }[] = [
  { key: "in", label: "Tarik napas...", seconds: 4, scale: 1.4 },
  { key: "hold", label: "Tahan...", seconds: 7, scale: 1.4 },
  { key: "out", label: "Buang napas...", seconds: 8, scale: 1 },
];

function NapasContent() {
  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!running) return;
    const current = PHASES[phaseIndex];
    timerRef.current = setTimeout(() => {
      const next = (phaseIndex + 1) % PHASES.length;
      if (next === 0) {
        setCycles((c) => c + 1);
        haptic("tap");
      }
      setPhaseIndex(next);
    }, current.seconds * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, phaseIndex]);

  function start() {
    setPhaseIndex(0);
    setCycles(0);
    setRunning(true);
    haptic("tap");
  }

  function stop() {
    setRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (cycles > 0) haptic("success");
  }

  const current = running ? PHASES[phaseIndex] : null;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 flex w-full items-center">
        <Link href="/beranda" className="p-2 -ml-2">
          <ArrowLeft size={22} className="text-teal dark:text-dark-text" />
        </Link>
        <p className="ml-1 text-[18px] font-medium text-teal dark:text-dark-text">
          Sesi Napas
        </p>
      </div>

      <p className="mb-10 text-center text-[15px] leading-relaxed text-teal/60 dark:text-dark-text/60">
        {running
          ? "Ikuti saja iramanya. Tidak ada yang salah di sini."
          : "Sebelum apa pun, tarik napas dulu bersamaku. Tidak perlu buru-buru."}
      </p>

      <div className="relative flex h-64 w-64 items-center justify-center">
        <div
          className="absolute h-40 w-40 rounded-full bg-sage-light/60"
          style={{
            transform: `scale(${current ? current.scale : 1})`,
            transition: current ? `transform ${current.seconds}s ease-in-out` : "transform 400ms ease-out",
          }}
        />
        <div className="absolute h-40 w-40 rounded-full bg-sage/30" />
        <p className="z-10 px-6 text-center text-[16px] font-medium text-teal">
          {current ? current.label : "Siap mulai?"}
        </p>
      </div>

      {running && cycles > 0 && (
        <p className="mt-4 text-[13px] text-teal/40 dark:text-dark-text/40">
          {cycles} siklus napas selesai, pelan-pelan saja, tidak perlu diburu.
        </p>
      )}

      <div className="mt-12 w-full">
        {running ? (
          <Button variant="secondary" className="w-full" onClick={stop}>
            Selesai untuk sekarang
          </Button>
        ) : (
          <Button className="w-full" onClick={start}>
            {cycles > 0 ? "Mulai lagi" : "Mulai sesi napas"}
          </Button>
        )}
      </div>

      <p className="mt-6 text-center text-[13px] text-teal/40 dark:text-dark-text/40">
        Pola 4-7-8 &mdash; tarik 4 detik, tahan 7 detik, buang 8 detik.
      </p>
    </div>
  );
}

export default function NapasPage() {
  return (
    <AppShell>
      <NapasContent />
    </AppShell>
  );
}
