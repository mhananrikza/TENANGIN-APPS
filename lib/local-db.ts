"use client";

/**
 * Lapisan data lokal (device-only) untuk TENANGIN.
 *
 * Tidak ada Firebase, tidak ada akun, tidak ada server database. Semua data
 * (mood, planner, progres Bertumbuh, riwayat aktivitas, obrolan Teman AI,
 * dsb.) disimpan di IndexedDB HP/browser masing-masing pengguna.
 * `localStorage` hanya dipakai untuk setting ringan (id perangkat & tema),
 * lihat `getLocalUid()` dan `lib/theme.ts`.
 *
 * Modul ini sengaja mengekspos bentuk API kecil (`doc`, `collection`,
 * `query`, `orderBy`, `getDoc`, `setDoc`, `updateDoc`, `deleteDoc`,
 * `addDoc`, `onSnapshot`) yang mirip database dokumen pada umumnya, supaya
 * halaman lain (planner, mood, Bertumbuh, Teman AI, dsb.) cukup memakai
 * satu abstraksi konsisten tanpa perlu tahu detail IndexedDB.
 *
 * Konsekuensi penting (lihat juga Profil > Cadangkan data):
 * - Data HANYA ada di device ini. Uninstall app / bersihkan data situs /
 *   ganti HP = data hilang, kecuali pengguna sempat ekspor cadangan.
 * - Tidak ada sinkronisasi antar device, tidak ada login.
 */

export const db = {} as const; // penanda kompatibilitas, tidak benar-benar dipakai

const UID_KEY = "tenangin:uid";
const DB_NAME = "tenangin-db";
const DB_VERSION = 1;
const STORE_NAME = "docs";

// ---------------------------------------------------------------------------
// Identitas lokal anonim (menggantikan uid akun) — setting ringan, tetap di
// localStorage karena hanya satu string kecil dan perlu dibaca sinkron.
// ---------------------------------------------------------------------------

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Ambil (atau buat sekali) id anonim untuk device ini. */
export function getLocalUid(): string {
  if (typeof window === "undefined") return "server";
  let uid = window.localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = makeId();
    window.localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}

// ---------------------------------------------------------------------------
// IndexedDB: cache di memori (sinkron untuk dipakai komponen React) + tulis
// tembus (write-through) ke IndexedDB (async, persisten antar sesi).
// ---------------------------------------------------------------------------

const memoryCache = new Map<string, unknown>();
let idbHandle: IDBDatabase | null = null;
let readyPromise: Promise<void> | null = null;

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB tidak tersedia di lingkungan ini."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "path" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Membuka IndexedDB & memuat semua dokumen ke cache memori sekali di awal.
 * Aman dipanggil berkali-kali (idempotent) — pemanggilan berikutnya memakai
 * promise yang sama. Semua listener aktif otomatis di-refresh begitu cache
 * awal selesai dimuat (lihat `allRunners` di bawah).
 */
function ensureReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!readyPromise) {
    readyPromise = openIDB()
      .then(
        (database) =>
          new Promise<void>((resolve) => {
            idbHandle = database;
            const tx = database.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const getAllReq = store.getAll();
            getAllReq.onsuccess = () => {
              const rows = (getAllReq.result ?? []) as { path: string; data: unknown }[];
              rows.forEach((row) => memoryCache.set(row.path, row.data));
              resolve();
            };
            getAllReq.onerror = () => resolve();
          })
      )
      .catch(() => {
        // IndexedDB gagal dibuka (mis. mode privat ekstrem di sebagian
        // browser). App tetap jalan dengan cache di memori untuk sesi ini
        // saja — lebih baik daripada layar putih.
      })
      .then(() => {
        allRunners.forEach((fn) => fn());
      });
  }
  return readyPromise;
}

function persist(path: string, data: unknown) {
  if (!idbHandle) return;
  try {
    const tx = idbHandle.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    if (data === undefined) store.delete(path);
    else store.put({ path, data });
  } catch {
    // Abaikan kegagalan tulis tunggal — cache memori tetap konsisten untuk
    // sesi berjalan, dan operasi berikutnya akan mencoba lagi.
  }
}

if (typeof window !== "undefined") {
  // Mulai muat cache sedini mungkin, tidak perlu menunggu pemanggilan
  // pertama ke getDoc/onSnapshot.
  void ensureReady();
}

// ---------------------------------------------------------------------------
// Pub-sub sederhana (dipakai onSnapshot untuk "reaktif" seperti realtime db)
// ---------------------------------------------------------------------------

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();
const allRunners = new Set<Listener>();

function emit(changedPath: string) {
  listeners.forEach((set, listenerPath) => {
    const related =
      changedPath === listenerPath ||
      changedPath.startsWith(listenerPath + "/") ||
      listenerPath.startsWith(changedPath + "/");
    if (related) set.forEach((fn) => fn());
  });
}

function subscribe(path: string, fn: Listener) {
  if (!listeners.has(path)) listeners.set(path, new Set());
  listeners.get(path)!.add(fn);
  allRunners.add(fn);
  return () => {
    listeners.get(path)?.delete(fn);
    allRunners.delete(fn);
  };
}

function readRaw(path: string): unknown {
  if (typeof window === "undefined") return undefined;
  void ensureReady();
  return memoryCache.get(path);
}

function writeRaw(path: string, value: unknown) {
  if (typeof window === "undefined") return;
  memoryCache.set(path, value);
  emit(path);
  void ensureReady().then(() => persist(path, value));
}

function removeRaw(path: string) {
  if (typeof window === "undefined") return;
  memoryCache.delete(path);
  emit(path);
  void ensureReady().then(() => persist(path, undefined));
}

/** Daftar id dokumen langsung di bawah sebuah path koleksi. */
function listChildIds(collectionPath: string): string[] {
  const prefix = collectionPath + "/";
  const ids: string[] = [];
  memoryCache.forEach((_value, key) => {
    if (!key.startsWith(prefix)) return;
    const rest = key.slice(prefix.length);
    if (rest && !rest.includes("/")) ids.push(rest);
  });
  return ids;
}

// ---------------------------------------------------------------------------
// Referensi (doc/collection/query) — bentuk path sederhana, mis.
// doc(db, "users", uid) -> "users/<uid>"
// ---------------------------------------------------------------------------

export type DocRef = { __type: "doc"; path: string; id: string };
export type CollectionRef = { __type: "collection"; path: string };
export type OrderByConstraint = { field: string; direction: "asc" | "desc" };
export type QueryRef = {
  __type: "query";
  collectionRef: CollectionRef;
  orderByField?: string;
  orderByDirection?: "asc" | "desc";
};

export function doc(_db: unknown, ...segments: string[]): DocRef {
  const path = segments.join("/");
  return { __type: "doc", path, id: segments[segments.length - 1] };
}

export function collection(_db: unknown, ...segments: string[]): CollectionRef {
  return { __type: "collection", path: segments.join("/") };
}

export function orderBy(field: string, direction: "asc" | "desc" = "asc"): OrderByConstraint {
  return { field, direction };
}

export function query(collectionRef: CollectionRef, ...constraints: OrderByConstraint[]): QueryRef {
  const ob = constraints[0];
  return {
    __type: "query",
    collectionRef,
    orderByField: ob?.field,
    orderByDirection: ob?.direction,
  };
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

function docSnapshot(ref: DocRef) {
  const data = readRaw(ref.path);
  return {
    exists: () => data !== undefined,
    data: () => data,
    id: ref.id,
  };
}

function collectionDocs(ref: CollectionRef) {
  void ensureReady();
  return listChildIds(ref.path).map((id) => {
    const path = `${ref.path}/${id}`;
    const data = memoryCache.get(path);
    return { id, data: () => data };
  });
}

function collectionSnapshot(ref: CollectionRef, ob?: { field?: string; direction?: "asc" | "desc" }) {
  let docs = collectionDocs(ref);
  if (ob?.field) {
    const field = ob.field;
    const dir = ob.direction === "desc" ? -1 : 1;
    docs = [...docs].sort((a, b) => {
      const av = (a.data() as any)?.[field];
      const bv = (b.data() as any)?.[field];
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }
  return { docs, size: docs.length };
}

// ---------------------------------------------------------------------------
// Operasi baca/tulis
// ---------------------------------------------------------------------------

export async function getDoc(ref: DocRef) {
  await ensureReady();
  return docSnapshot(ref);
}

export async function setDoc(ref: DocRef, data: Record<string, unknown>, options?: { merge?: boolean }) {
  await ensureReady();
  const prev = options?.merge ? (memoryCache.get(ref.path) as Record<string, unknown> | undefined) ?? {} : {};
  writeRaw(ref.path, { ...prev, ...data });
}

export async function updateDoc(ref: DocRef, data: Record<string, unknown>) {
  await ensureReady();
  const prev = (memoryCache.get(ref.path) as Record<string, unknown> | undefined) ?? {};
  writeRaw(ref.path, { ...prev, ...data });
}

export async function deleteDoc(ref: DocRef) {
  await ensureReady();
  removeRaw(ref.path);
}

export async function addDoc(ref: CollectionRef, data: Record<string, unknown>) {
  await ensureReady();
  const id = makeId();
  writeRaw(`${ref.path}/${id}`, data);
  return { id };
}

export function onSnapshot(
  ref: DocRef | CollectionRef | QueryRef,
  callback: (snap: any) => void
): () => void {
  if (ref.__type === "doc") {
    callback(docSnapshot(ref));
    return subscribe(ref.path, () => callback(docSnapshot(ref)));
  }
  if (ref.__type === "query") {
    const cref = ref.collectionRef;
    const run = () =>
      callback(collectionSnapshot(cref, { field: ref.orderByField, direction: ref.orderByDirection }));
    run();
    return subscribe(cref.path, run);
  }
  const run = () => callback(collectionSnapshot(ref));
  run();
  return subscribe(ref.path, run);
}

// ---------------------------------------------------------------------------
// Cadangkan (export) & pulihkan (import) data — dipakai di halaman Profil
// supaya pengguna tidak kehilangan data walau tanpa akun cloud.
// Mencakup dokumen IndexedDB + setting ringan di localStorage (tema, id
// perangkat) supaya cadangan benar-benar lengkap.
// ---------------------------------------------------------------------------

const BACKUP_MARKER = "tenangin";
const BACKUP_VERSION = 2;

export async function exportAllData(): Promise<string> {
  if (typeof window === "undefined") return "{}";
  await ensureReady();

  const settings: Record<string, string> = {};
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || (!key.startsWith("tenangin:") && !key.startsWith("tenangin-"))) continue;
    const value = window.localStorage.getItem(key);
    if (value !== null) settings[key] = value;
  }

  const docs: Record<string, unknown> = {};
  memoryCache.forEach((value, path) => {
    docs[path] = value;
  });

  return JSON.stringify(
    { app: BACKUP_MARKER, version: BACKUP_VERSION, exportedAt: Date.now(), settings, docs },
    null,
    2
  );
}

export async function importAllData(json: string): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined") return { ok: false, error: "Tidak tersedia." };
  try {
    const parsed = JSON.parse(json);
    if (!parsed || parsed.app !== BACKUP_MARKER) {
      return { ok: false, error: "File cadangan ini sepertinya bukan dari TENANGIN." };
    }
    await ensureReady();

    if (parsed.version === 1 && parsed.data && typeof parsed.data === "object") {
      // Format cadangan lama (v1): semua data (termasuk dokumen) disimpan
      // langsung sebagai key localStorage "tenangin:data:<path>".
      Object.entries(parsed.data as Record<string, string>).forEach(([key, value]) => {
        if (key.startsWith("tenangin:data:")) {
          const path = key.slice("tenangin:data:".length);
          try {
            const data = JSON.parse(value);
            memoryCache.set(path, data);
            persist(path, data);
          } catch {
            /* lewati entri yang rusak */
          }
        } else {
          window.localStorage.setItem(key, value);
        }
      });
    } else {
      if (parsed.settings && typeof parsed.settings === "object") {
        Object.entries(parsed.settings as Record<string, string>).forEach(([key, value]) => {
          window.localStorage.setItem(key, value);
        });
      }
      if (parsed.docs && typeof parsed.docs === "object") {
        Object.entries(parsed.docs as Record<string, unknown>).forEach(([path, data]) => {
          memoryCache.set(path, data);
          persist(path, data);
        });
      }
    }

    // Beritahu semua listener aktif bahwa datanya mungkin sudah berubah total.
    allRunners.forEach((fn) => fn());
    return { ok: true };
  } catch {
    return { ok: false, error: "File cadangan rusak atau formatnya tidak sesuai." };
  }
}

export async function clearAllLocalData() {
  if (typeof window === "undefined") return;

  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith("tenangin:")) keys.push(key);
  }
  keys.forEach((k) => window.localStorage.removeItem(k));

  memoryCache.clear();
  await ensureReady();
  if (idbHandle) {
    try {
      idbHandle.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).clear();
    } catch {
      /* abaikan */
    }
  }
  allRunners.forEach((fn) => fn());
}
