"use client";

import { useEffect, useState } from "react";

const COLORS = ["#7FA98F", "#E8B4B8", "#F0C987", "#A8C9B5", "#2C4A46"];
const PIECES = 18;

// Burst konfeti kecil untuk momen keberhasilan (selesai materi, streak naik).
// Murni CSS/SVG, otomatis hilang sendiri — tidak butuh library eksternal.
export function Confetti({ onDone }: { onDone?: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1400);
    return () => window.clearTimeout(t);
  }, [onDone]);

  if (!visible) return null;

  const pieces = Array.from({ length: PIECES }, (_, i) => {
    const angle = (360 / PIECES) * i + Math.random() * 12;
    const distance = 90 + Math.random() * 70;
    const delay = Math.random() * 120;
    const size = 6 + Math.random() * 5;
    const color = COLORS[i % COLORS.length];
    const dx = Math.cos((angle * Math.PI) / 180) * distance;
    const dy = Math.sin((angle * Math.PI) / 180) * distance;
    return { id: i, dx, dy, delay, size, color };
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center">
      <div className="relative h-0 w-0">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-sm animate-confetti-burst"
            style={
              {
                width: p.size,
                height: p.size * 1.4,
                backgroundColor: p.color,
                animationDelay: `${p.delay}ms`,
                "--dx": `${p.dx}px`,
                "--dy": `${p.dy}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
