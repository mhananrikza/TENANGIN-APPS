// Kutipan harian untuk kartu "Renungan Hari Ini" di Beranda.
// Dipilih deterministik berdasarkan tanggal (bukan acak) supaya:
// - tetap sama sepanjang hari walau halaman dibuka berkali-kali
// - terasa "baru" tiap hari tanpa perlu koneksi/API
export const DAILY_QUOTES: string[] = [
  "Kamu tidak harus jadi orang tua yang sempurna. Kamu hanya perlu jadi yang hadir.",
  "Hari yang berat bukan berarti kamu gagal. Itu berarti kamu sedang berusaha keras.",
  "Anakmu tidak butuh ibu yang selalu tenang. Ia butuh ibu yang mencoba, jatuh, lalu mencoba lagi.",
  "Istirahat sejenak bukan kemalasan. Itu caramu tetap bisa mencintai dengan penuh.",
  "Setiap kali kamu menahan diri untuk tidak membentak, itu adalah kemenangan kecil yang layak dirayakan.",
  "Kamu boleh lelah. Kamu boleh menangis. Kamu tetap ibu yang baik.",
  "Anak-anak tidak mengingat rumah yang selalu rapi. Mereka mengingat rasa dicintai.",
  "Pelan-pelan saja. Bertumbuh sebagai orang tua bukan lomba, dan kamu tidak sedang tertinggal.",
  "Kesalahan hari ini bukan akhir cerita. Besok selalu ada kesempatan untuk memperbaiki.",
  "Cinta yang kamu berikan hari ini, sekecil apa pun, tetap sampai ke hati anakmu.",
  "Tidak apa-apa kalau hari ini terasa berantakan. Kamu masih ibu yang sama, yang mencoba sebaik mungkin.",
  "Kesabaran bukan sesuatu yang kamu punya atau tidak. Ia sesuatu yang kamu latih, sedikit demi sedikit.",
  "Kamu sedang membesarkan manusia baru sambil terus menyembuhkan dirimu sendiri. Itu bukan hal kecil.",
  "Momen tenang yang kamu ciptakan hari ini akan diingat anakmu lebih lama dari yang kamu kira.",
  "Tidak perlu jadi ibu paling sabar sedunia. Cukup jadi ibu yang mau terus mencoba.",
  "Setiap napas yang kamu tarik sebelum bereaksi adalah hadiah yang kamu berikan untuk kalian berdua.",
  "Kamu boleh butuh waktu untuk diri sendiri. Itu bukan mementingkan diri, itu mengisi ulang cinta yang kamu berikan.",
  "Perjalanan ini panjang. Kamu tidak perlu menyelesaikannya hari ini, cukup melangkah satu langkah.",
  "Anakmu belajar tenang dengan melihatmu mencoba tenang, bukan dengan melihatmu sempurna.",
  "Hari ini mungkin berat, tapi kamu tetap memilih untuk hadir. Itu sudah cukup luar biasa.",
];

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function quoteOfTheDay(date: Date = new Date()): string {
  const idx = dayOfYear(date) % DAILY_QUOTES.length;
  return DAILY_QUOTES[idx];
}
