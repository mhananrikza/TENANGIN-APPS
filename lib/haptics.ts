// Getaran halus untuk micro-interaction (mood, checklist, milestone).
// Aman dipanggil di server maupun browser yang tidak mendukung vibrate.
type Pattern = "tap" | "success" | "celebrate";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  success: [10, 40, 12],
  celebrate: [12, 30, 12, 30, 20],
};

export function haptic(pattern: Pattern = "tap") {
  if (typeof window === "undefined") return;
  try {
    window.navigator.vibrate?.(PATTERNS[pattern]);
  } catch {
    // Diam-diam gagal — getaran hanya penyempurna, tidak esensial.
  }
}
