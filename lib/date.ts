/** Format sebuah timestamp (ms) menjadi kunci tanggal lokal "YYYY-MM-DD". */
export function dateKey(ts: number | Date = Date.now()): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(Date.now());
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}
