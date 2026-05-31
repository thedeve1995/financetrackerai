// =========================================
//  BukuMoney — AI (Firebase AI Logic / Gemini)
//  Option A: dijalankan dari client lewat Firebase AI Logic.
//  API key TIDAK diekspos — request diproteksi App Check.
//  SDK modular dimuat lazy dari gstatic CDN (tanpa perubahan package.json).
// =========================================

const SDK = '11.10.0';
const BASE = `https://www.gstatic.com/firebasejs/${SDK}`;
const AI_APP = 'bukumoney-ai';
const MODEL = 'gemini-2.5-flash';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let _ai = null;
let _getGenerativeModel = null;
let _Schema = null;
let _initPromise = null;

// Inisialisasi sekali: muat SDK, buat app khusus AI (terpisah dari app compat
// untuk auth/firestore), aktifkan App Check bila ada site key, lalu getAI().
async function ensureAI() {
  if (_ai) return _ai;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const { initializeApp, getApps } = await import(/* @vite-ignore */ `${BASE}/firebase-app.js`);
    const { getAI, GoogleAIBackend, getGenerativeModel, Schema } =
      await import(/* @vite-ignore */ `${BASE}/firebase-ai.js`);
    _getGenerativeModel = getGenerativeModel;
    _Schema = Schema;

    const app = getApps().find((a) => a.name === AI_APP) || initializeApp(firebaseConfig, AI_APP);

    // App Check (disarankan untuk produksi). Set VITE_RECAPTCHA_SITE_KEY untuk mengaktifkan.
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      try {
        const { initializeAppCheck, ReCaptchaV3Provider } =
          await import(/* @vite-ignore */ `${BASE}/firebase-app-check.js`);
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch (e) {
        console.warn('[AI] App Check gagal diinisialisasi:', e?.message || e);
      }
    } else {
      console.warn('[AI] VITE_RECAPTCHA_SITE_KEY belum di-set — App Check non-aktif (disarankan untuk produksi).');
    }

    _ai = getAI(app, { backend: new GoogleAIBackend() });
    return _ai;
  })();
  return _initPromise;
}

async function model(generationConfig) {
  await ensureAI();
  return _getGenerativeModel(_ai, generationConfig ? { model: MODEL, generationConfig } : { model: MODEL });
}

function cleanText(t) {
  return String(t || '').trim();
}

// ---- #2 Auto-kategori ----------------------------------------------------
// Mengembalikan salah satu label dari `categories`, atau null bila tak yakin.
export async function suggestCategory({ description, type, categories }) {
  if (!description || !categories || !categories.length) return null;
  const m = await model();
  const prompt =
`Kamu asisten keuangan. Tentukan SATU kategori paling tepat untuk transaksi berikut.
Tipe transaksi: ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
Deskripsi: "${description}"
Daftar kategori yang boleh dipilih (pilih PERSIS salah satu): ${categories.join(', ')}
Balas HANYA dengan nama kategorinya, tanpa tanda kutip atau penjelasan.`;
  const res = await m.generateContent(prompt);
  const out = cleanText(res.response.text()).replace(/^["'.\s]+|["'.\s]+$/g, '');
  const low = out.toLowerCase();
  return (
    categories.find((c) => c.toLowerCase() === low) ||
    categories.find((c) => low.includes(c.toLowerCase())) ||
    categories.find((c) => c.toLowerCase().includes(low)) ||
    null
  );
}

// ---- #3 Ringkasan & insight bulanan -------------------------------------
export async function monthlyInsight(stats) {
  const m = await model();
  const prompt =
`Kamu penasihat keuangan keluarga yang ramah, ringkas, dan membangun (Bahasa Indonesia).
Berikut ringkasan keuangan pengguna (angka dalam Rupiah):
${JSON.stringify(stats, null, 2)}

Tulis analisis singkat 3-4 poin. Aturan:
- Gunakan poin berawalan emoji (mis. 💡, 📈, ⚠️, ✅).
- Soroti pola pengeluaran terbesar, bandingkan pemasukan vs pengeluaran, sebut tingkat menabung.
- Beri 1 saran konkret yang bisa langsung dilakukan.
- JANGAN mengarang angka di luar data yang diberikan.
- Maksimal ~70 kata. Langsung ke poin, tanpa pembuka/penutup basa-basi.`;
  const res = await m.generateContent(prompt);
  return cleanText(res.response.text());
}

// ---- #6 Draf pesan tagih hutang / kabar bayar ---------------------------
export async function debtReminder({ name, remaining, type }) {
  const m = await model();
  const role =
    type === 'give'
      ? 'Pengguna MEMINJAMKAN uang ke orang ini, jadi ini pesan menagih piutang dengan halus.'
      : 'Pengguna BERHUTANG ke orang ini, jadi ini pesan memberi kabar/itikad baik untuk membayar.';
  const prompt =
`Buatkan satu pesan WhatsApp (Bahasa Indonesia) yang sopan, hangat, dan tidak menyinggung.
Konteks: ${role}
Nama penerima: ${name || 'Kak'}
Sisa nominal: Rp ${Number(remaining || 0).toLocaleString('id-ID')}
Ketentuan: 2-4 kalimat, sebutkan nominalnya, nada kekeluargaan. Balas HANYA isi pesannya (tanpa tanda kutip).`;
  const res = await m.generateContent(prompt);
  return cleanText(res.response.text());
}

// ---- #7 Scan struk (multimodal) -----------------------------------------
// Menerima File gambar, mengembalikan { merchant, total, date, category }.
export async function extractReceipt(file) {
  await ensureAI();
  const schema = _Schema.object({
    properties: {
      merchant: _Schema.string(),
      total: _Schema.number(),
      date: _Schema.string(),
      category: _Schema.string(),
    },
    optionalProperties: ['date'],
  });
  const m = await model({ responseMimeType: 'application/json', responseSchema: schema });
  const data = await fileToBase64(file);
  const prompt =
`Ekstrak data dari foto struk belanja ini.
- total: jumlah TOTAL akhir yang dibayar, dalam angka Rupiah (tanpa titik/Rp).
- date: tanggal pada struk, format YYYY-MM-DD (kosongkan bila tidak terbaca).
- category: pilih salah satu — Makanan, Transportasi, Belanja, Hiburan, Tagihan, Kesehatan, Pendidikan, Lainnya (Keluar).
- merchant: nama toko/penjual.`;
  const res = await m.generateContent([
    { text: prompt },
    { inlineData: { mimeType: file.type || 'image/jpeg', data } },
  ]);
  return JSON.parse(cleanText(res.response.text()));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
