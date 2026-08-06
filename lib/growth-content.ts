// Konten perjalanan belajar "Bertumbuh".
// Statis (tidak dari database) — progres user disimpan terpisah di IndexedDB
// pada users/{uid}/growth/{materiId} lewat lib/types.ts -> GrowthProgress.

export type GrowthSection = {
  heading: string;
  body: string;
};

export type GrowthMaterial = {
  id: string;
  order: number;
  phase: string; // nama babak/etape perjalanan
  icon: string; // nama ikon lucide-react
  title: string;
  teaser: string; // satu kalimat penggoda di kartu perjalanan
  readMinutes: number;
  sections: GrowthSection[];
  highlights: string[]; // poin-poin penting
  summary: string; // ringkasan penutup
  reflection: string; // pertanyaan refleksi
  action: string; // aksi kecil hari ini
};

export const GROWTH_PHASES = [
  "Mengenal Diri",
  "Memahami Anak",
  "Membangun Kedekatan",
  "Bertumbuh Bersama",
] as const;

export const GROWTH_MATERIALS: GrowthMaterial[] = [
  {
    id: "menyapa-amarah",
    order: 1,
    phase: "Mengenal Diri",
    icon: "Flame",
    title: "Menyapa Amarahmu Sendiri",
    teaser: "Amarah bukan musuh. Ia sinyal yang minta didengar.",
    readMinutes: 3,
    sections: [
      {
        heading: "Amarah itu wajar, Ibu",
        body: "Setiap orang tua pernah merasa marah. Bukan karena kamu gagal, tapi karena kamu sedang menjalani salah satu peran paling melelahkan di dunia tanpa istirahat. Amarah bukan tanda kamu orang tua yang buruk, ia tanda kamu manusia yang sedang penuh.",
      },
      {
        heading: "Dari mana amarah itu datang?",
        body: "Seringkali amarah pada anak sebenarnya adalah kelelahan, kekhawatiran, atau rasa gagal yang menumpuk dan mencari jalan keluar. Anak jadi pemicu terakhir, bukan penyebab utama. Menyadari ini adalah langkah pertama untuk lebih tenang.",
      },
      {
        heading: "Yang bisa kamu lakukan, bukan tekan",
        body: "Tujuannya bukan menahan amarah sampai meledak, tapi mengenalinya lebih awal. Rasakan di tubuhmu, dada sesak, rahang mengeras, suara meninggi. Itu sinyal untuk berhenti sejenak, bukan sinyal untuk bertindak cepat.",
      },
    ],
    highlights: [
      "Amarah adalah sinyal, bukan aib.",
      "Pemicu terakhir sering bukan penyebab sebenarnya.",
      "Mengenali tubuh lebih awal membantumu berhenti sejenak.",
    ],
    summary:
      "Amarah yang kamu rasakan sebagai orang tua adalah hal manusiawi. Alih-alih menghakimi diri sendiri, coba kenali dari mana ia datang, biasanya bukan dari anak, tapi dari beban yang sudah lama kamu pikul sendirian.",
    reflection: "Kapan terakhir kali kamu merasa marah? Apa yang sebenarnya kamu butuhkan saat itu?",
    action: "Hari ini, saat kamu mulai kesal, coba tarik napas 3 kali sebelum berkata apa pun.",
  },
  {
    id: "jeda-sebelum-bereaksi",
    order: 2,
    phase: "Mengenal Diri",
    icon: "Wind",
    title: "Jeda Sebelum Bereaksi",
    teaser: "Satu tarikan napas bisa mengubah seluruh percakapan.",
    readMinutes: 3,
    sections: [
      {
        heading: "Jarak kecil, dampak besar",
        body: "Antara kejadian dan reaksimu, selalu ada ruang, meski hanya sepersekian detik. Di ruang itulah kamu bisa memilih untuk merespons dengan tenang, bukan bereaksi karena refleks lelah.",
      },
      {
        heading: "Napas sebagai jangkar",
        body: "Napas dalam bukan trik ajaib, tapi cara sederhana memberi sinyal pada tubuh bahwa kamu aman. Tiga tarikan napas panjang bisa menurunkan detak jantung dan membuat pikiranmu lebih jernih sebelum bicara.",
      },
      {
        heading: "Boleh bilang 'aku butuh sebentar'",
        body: "Kamu tidak harus selalu punya jawaban instan. Mengatakan 'Ibu butuh napas sebentar ya' pada anak justru mengajarkan mereka bahwa mengelola emosi itu boleh, dan perlu waktu.",
      },
    ],
    highlights: [
      "Selalu ada jeda antara kejadian dan responmu.",
      "Napas dalam menenangkan tubuh sebelum pikiran.",
      "Mengambil jeda di depan anak adalah contoh yang baik, bukan kelemahan.",
    ],
    summary:
      "Kamu tidak perlu bereaksi secepat kilat. Memberi diri sendiri jeda, walau hanya beberapa detik, adalah bentuk kasih sayang pada diri sendiri dan anak.",
    reflection: "Situasi apa yang biasanya membuatmu langsung bereaksi tanpa jeda?",
    action: "Coba sesi napas 4-7-8 di aplikasi ini sebelum menghadapi momen yang biasanya bikin kamu tegang.",
  },
  {
    id: "mata-anak",
    order: 3,
    phase: "Memahami Anak",
    icon: "Eye",
    title: "Melihat Dunia dari Mata Anak",
    teaser: "Perilaku 'nakal' sering kali adalah cara anak berkomunikasi.",
    readMinutes: 4,
    sections: [
      {
        heading: "Anak belum punya kata untuk semua rasanya",
        body: "Otak anak masih berkembang. Saat mereka menangis, membangkang, atau berteriak, itu bukan manipulasi, itu satu-satunya cara mereka tahu untuk mengungkapkan sesuatu yang terlalu besar untuk dikatakan dengan kata-kata.",
      },
      {
        heading: "Di balik perilaku, ada kebutuhan",
        body: "Anak yang rewel menjelang tidur mungkin lelah. Anak yang merengek di toko mungkin lapar atau kewalahan dengan keramaian. Bertanya 'apa yang sebenarnya dia butuhkan?' lebih membantu daripada bertanya 'kenapa dia bandel?'",
      },
      {
        heading: "Perilaku bukan penilaian karakter",
        body: "Satu momen sulit tidak mendefinisikan siapa anakmu, sama seperti satu momen kamu marah tidak mendefinisikan siapa kamu sebagai orang tua. Memisahkan perilaku dari identitas membuat keduanya lebih mudah tumbuh.",
      },
    ],
    highlights: [
      "Perilaku sulit sering adalah bahasa yang belum sempurna.",
      "Di balik setiap perilaku, ada kebutuhan yang belum terpenuhi.",
      "Satu momen tidak mendefinisikan karakter anak, atau kamu.",
    ],
    summary:
      "Saat melihat perilaku anak sebagai pesan, bukan pembangkangan, responmu bisa berubah dari menghukum menjadi memahami.",
    reflection: "Perilaku anak apa yang paling sering bikin kamu bingung? Kira-kira kebutuhan apa yang ada di baliknya?",
    action: "Hari ini, saat anak rewel, coba tanya dalam hati: 'apa yang dia butuhkan sekarang?' sebelum menegur.",
  },
  {
    id: "kalimat-menenangkan",
    order: 4,
    phase: "Memahami Anak",
    icon: "MessageCircleHeart",
    title: "Kata-Kata yang Menenangkan, Bukan Menghukum",
    teaser: "Cara kamu bicara membentuk cara anak bicara pada dirinya sendiri.",
    readMinutes: 4,
    sections: [
      {
        heading: "Anak menyerap nada, bukan hanya kata",
        body: "Sebelum anak cukup besar untuk memahami arti kalimat panjang, mereka sudah menyerap nada suara dan ekspresi wajah. Kalimat paling bijak pun bisa terasa menghukum kalau disampaikan dengan nada tajam.",
      },
      {
        heading: "Ganti label dengan deskripsi",
        body: "Daripada 'kamu nakal', coba 'ibu lihat kamu lagi kesal ya'. Label menempel pada identitas anak, sementara deskripsi membantu mereka mengenali perasaannya sendiri, bekal penting untuk mengelola emosi kelak.",
      },
      {
        heading: "Tegas boleh, merendahkan tidak perlu",
        body: "Menenangkan bukan berarti tanpa batasan. Kamu tetap boleh berkata 'tidak boleh' dengan tegas, tanpa perlu mempermalukan atau membandingkan anak dengan orang lain.",
      },
    ],
    highlights: [
      "Nada suara diserap anak lebih dulu daripada makna kata.",
      "Deskripsikan perasaan, jangan melabeli karakter.",
      "Tegas dan hangat bisa berjalan bersamaan.",
    ],
    summary:
      "Kata-kata yang kamu pilih hari ini menjadi suara batin anak di masa depan. Pelan-pelan, ganti kalimat menghukum dengan kalimat yang menenangkan sekaligus tetap tegas.",
    reflection: "Kalimat apa yang sering keluar saat kamu kesal? Adakah versi lain yang lebih hangat untuk maksud yang sama?",
    action: "Coba satu kali hari ini, ganti 'jangan nakal' dengan 'ibu tahu kamu lagi kesal, cerita yuk'.",
  },
  {
    id: "momen-kecil-koneksi",
    order: 5,
    phase: "Membangun Kedekatan",
    icon: "Sparkles",
    title: "Momen Kecil, Koneksi Besar",
    teaser: "Kedekatan tidak butuh waktu lama, hanya kehadiran penuh.",
    readMinutes: 3,
    sections: [
      {
        heading: "Kualitas mengalahkan durasi",
        body: "Kamu tidak perlu menyediakan berjam-jam setiap hari. Lima menit dengan perhatian penuh, tanpa gawai, tanpa memikirkan hal lain, bisa terasa lebih berarti bagi anak daripada satu jam yang terbagi.",
      },
      {
        heading: "Ikuti, jangan selalu memimpin",
        body: "Saat bermain bersama, coba biarkan anak yang memimpin permainan sesekali. Ini mengirim pesan sederhana namun kuat: 'duniamu penting bagiku'.",
      },
      {
        heading: "Koneksi dibangun di hal-hal kecil",
        body: "Menyapa dengan senyum saat anak bangun tidur, mendengarkan cerita ngawurnya tentang kartun kesukaan, atau memeluk sebelum berpisah, semua ini menabung rasa aman yang menopang anak di saat-saat sulit.",
      },
    ],
    highlights: [
      "5 menit penuh perhatian lebih berarti dari 1 jam yang terbagi.",
      "Biarkan anak memimpin sesekali saat bermain.",
      "Rasa aman anak dibangun dari hal-hal kecil yang konsisten.",
    ],
    summary:
      "Kedekatan bukan soal seberapa banyak waktu yang kamu punya, tapi seberapa hadir kamu di waktu yang ada.",
    reflection: "Momen kecil apa bersama anak yang paling kamu syukuri minggu ini?",
    action: "Luangkan 5 menit hari ini untuk bermain sesuai keinginan anak, tanpa gawai di tangan.",
  },
  {
    id: "rutinitas-tenang",
    order: 6,
    phase: "Membangun Kedekatan",
    icon: "Sunrise",
    title: "Rutinitas yang Menenangkan",
    teaser: "Yang bisa diprediksi terasa aman, untuk anak maupun kamu.",
    readMinutes: 3,
    sections: [
      {
        heading: "Anak tumbuh subur dalam prediktabilitas",
        body: "Rutinitas sederhana seperti pola makan, tidur, dan mandi yang konsisten memberi anak rasa aman. Mereka tahu apa yang akan terjadi selanjutnya, sehingga tidak perlu waspada berlebihan.",
      },
      {
        heading: "Rutinitas juga menenangkanmu",
        body: "Saat hari terasa penuh keputusan kecil, rutinitas mengurangi beban mental karena kamu tidak perlu memikirkan ulang semuanya dari nol setiap hari.",
      },
      {
        heading: "Sederhana lebih baik daripada sempurna",
        body: "Rutinitas tidak harus rumit atau sesuai jadwal ahli parenting manapun. Tiga langkah kecil yang konsisten jauh lebih berdampak daripada rencana panjang yang tidak pernah berjalan.",
      },
    ],
    highlights: [
      "Rutinitas memberi anak rasa aman lewat prediktabilitas.",
      "Rutinitas mengurangi kelelahan mengambil keputusan bagi orang tua.",
      "Konsistensi kecil lebih baik daripada rencana besar yang berantakan.",
    ],
    summary:
      "Rutinitas bukan soal kaku, tapi soal memberi anak, dan dirimu sendiri, sesuatu yang bisa diandalkan di tengah hari yang tidak selalu bisa diprediksi.",
    reflection: "Rutinitas kecil apa yang sudah berjalan baik di rumahmu? Mana yang ingin kamu buat lebih tenang?",
    action: "Pilih satu rutinitas (misalnya sebelum tidur) dan jalani dengan langkah yang sama persis hari ini.",
  },
  {
    id: "memaafkan-diri",
    order: 7,
    phase: "Bertumbuh Bersama",
    icon: "HeartHandshake",
    title: "Memaafkan Diri yang Sedang Belajar",
    teaser: "Kamu boleh salah. Kamu tetap orang tua yang baik.",
    readMinutes: 3,
    sections: [
      {
        heading: "Tidak ada orang tua yang sempurna",
        body: "Setiap orang tua pernah membentak, menyesal, atau merasa tidak cukup baik. Itu bukan bukti kegagalan. Itu bukti bahwa kamu peduli cukup dalam untuk merasa menyesal.",
      },
      {
        heading: "Perbaikan lebih penting dari kesempurnaan",
        body: "Anak tidak butuh orang tua yang tidak pernah salah. Mereka butuh melihat bagaimana orang dewasa meminta maaf dan memperbaiki hubungan setelah momen sulit, itu justru pelajaran berharga.",
      },
      {
        heading: "Bicara pada dirimu seperti pada sahabat",
        body: "Saat menyesali sebuah momen, coba bicara pada dirimu sendiri seperti kamu bicara pada teman baik yang sedang kesulitan, dengan pengertian, bukan hakiman.",
      },
    ],
    highlights: [
      "Menyesal setelah salah adalah tanda kepedulian, bukan kegagalan.",
      "Anak belajar dari cara kamu memperbaiki, bukan dari kesempurnaanmu.",
      "Bicaralah pada diri sendiri dengan kelembutan yang sama seperti pada sahabat.",
    ],
    summary:
      "Menjadi orang tua yang tenang bukan berarti tidak pernah salah. Tapi belajar memaafkan diri sendiri dan mencoba lagi esok hari.",
    reflection: "Momen apa yang masih kamu sesali sebagai orang tua? Apa yang ingin kamu katakan pada dirimu saat itu?",
    action: "Tulis satu kalimat maaf untuk dirimu sendiri, lalu ucapkan pelan-pelan seolah bicara pada sahabat.",
  },
  {
    id: "rayakan-langkah-kecil",
    order: 8,
    phase: "Bertumbuh Bersama",
    icon: "PartyPopper",
    title: "Merayakan Langkah Kecil",
    teaser: "Pertumbuhan terjadi diam-diam, lewat hari-hari biasa.",
    readMinutes: 3,
    sections: [
      {
        heading: "Kamu sudah datang sejauh ini",
        body: "Menyelesaikan perjalanan belajar ini adalah bukti nyata bahwa kamu terus berusaha menjadi versi yang lebih tenang untuk anakmu, meski di tengah hari-hari yang melelahkan.",
      },
      {
        heading: "Pertumbuhan bukan garis lurus",
        body: "Akan ada hari-hari baik dan hari-hari yang terasa mundur. Itu bagian normal dari proses, bukan tanda kamu gagal menerapkan semua yang sudah dipelajari.",
      },
      {
        heading: "Rayakan, jangan hanya evaluasi",
        body: "Sesekali berhenti dan mengakui progres, sekecil apa pun, membuatmu punya energi untuk terus melangkah, dibanding hanya fokus pada apa yang belum sempurna.",
      },
    ],
    highlights: [
      "Menyelesaikan perjalanan ini sudah menjadi pencapaian.",
      "Pertumbuhan naik-turun itu wajar, bukan kegagalan.",
      "Merayakan progres kecil menjaga semangat untuk terus bertumbuh.",
    ],
    summary:
      "Terima kasih sudah menempuh perjalanan ini sejauh ini. Bertumbuh sebagai orang tua adalah proses seumur hidup. Kamu sudah melangkah lebih jauh dari kemarin.",
    reflection: "Perubahan kecil apa yang sudah kamu rasakan sejak mulai perjalanan ini?",
    action: "Beri dirimu satu bentuk apresiasi kecil hari ini, secangkir teh, 5 menit duduk tenang, atau sekadar mengakui usahamu.",
  },
];

export function getMaterialById(id: string): GrowthMaterial | undefined {
  return GROWTH_MATERIALS.find((m) => m.id === id);
}

export function getNextMaterial(id: string): GrowthMaterial | undefined {
  const current = getMaterialById(id);
  if (!current) return undefined;
  return GROWTH_MATERIALS.find((m) => m.order === current.order + 1);
}

export const TOTAL_MATERIALS = GROWTH_MATERIALS.length;

export function levelTitle(percent: number): string {
  if (percent <= 0) return "Baru memulai";
  if (percent < 25) return "Mulai bertumbuh";
  if (percent < 50) return "Berkembang dengan tenang";
  if (percent < 75) return "Semakin tenang setiap hari";
  if (percent < 100) return "Hampir sampai";
  return "Orang tua yang terus bertumbuh";
}
