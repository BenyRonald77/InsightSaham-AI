# Product Requirements Document (PRD) — FINAL
# InsightSaham — Generator Analisis Teknikal Saham IDX Berbasis AI (Internal Tool)

> **Status:** Final v2.0 — menggantikan draft v1.0 sebelumnya. Seluruh keputusan pada bagian ini sudah dikonfirmasi langsung oleh pemilik produk melalui sesi tanya-jawab, bukan lagi asumsi.

---

## 1. Informasi Dokumen

| Item | Detail |
|---|---|
| Nama Produk | **InsightSaham** — AI Technical Analysis Generator (Internal) |
| Jenis Dokumen | Product Requirements Document (PRD) — Final |
| Versi | 2.0 |
| Tanggal Dibuat | 7 September 2026 |
| Status | Final — siap masuk tahap desain teknis |
| Sifat Penggunaan | **Internal** — bukan untuk publik/media sosial |
| Sumber Data Harga | yfinance (data harian/EOD, delay diterima) |

---

## 2. Ringkasan Eksekutif

InsightSaham adalah tool internal yang mengotomatisasi pembuatan analisis teknikal saham IDX, meniru format kartu analisis manual (referensi: gaya "Trader Swing Saham Indonesia") — namun dengan proses **seleksi saham manual** (bukan seluruh bursa diproses otomatis tiap hari) dan tambahan **modul prediksi berbasis probabilitas historis**.

Alur inti: sistem menyiapkan **pool saham layak analisis** (hasil auto-filter), pengguna **memilih saham mana yang ingin dianalisis**, lalu sistem menjalankan seluruh pipeline (hitung indikator → tentukan bias → hitung probabilitas historis → AI menyusun narasi → render kartu) **secara penuh otomatis** tanpa tahap approval manual — begitu dipilih dan diproses, hasil langsung tayang di dashboard.

---

## 3. Keputusan Kunci Hasil Diskusi (Ringkasan Perubahan dari Draft Awal)

| # | Topik | Keputusan Final |
|---|---|---|
| 1 | Sifat penggunaan | **Internal** — tidak dipublikasikan otomatis ke publik/medsos |
| 2 | Cakupan saham | **Seluruh saham IDX** dijadikan pool, dengan **auto-filter** membuang saham **suspend** dan **harga < Rp 50**. Dari pool tersisa, pengguna **memilih manual** saham mana yang mau dianalisis — analisis hanya jalan untuk saham terpilih |
| 3 | Net Foreign Buy/Sell | **Dihapus dari scope** — tidak akan ada di kartu maupun roadmap manapun |
| 4 | LLM untuk AI Narrative Engine | **Google Gemini API (Flash)** sebagai pilihan utama (gratis, tanpa kartu kredit) — lihat Bagian 12 untuk detail & alternatif |
| 5 | Alur publikasi | **Full otomatis** — tidak ada tahap review/approval manual sebelum kartu tayang |
| 6 (baru) | Fitur tambahan | **Modul Prediksi Analisis Teknikal** ditambahkan sebagai fitur baru di luar "Skenario" yang sudah ada — lihat Bagian 13 |

---

## 4. Latar Belakang & Masalah

*(tidak berubah dari draft awal — lihat konteks bisnis)*

Membuat analisis teknikal manual untuk banyak saham setiap hari memakan waktu, rawan tidak konsisten, dan tidak scalable. InsightSaham menggantikan proses ini dengan pipeline otomatis yang tetap memberi pengguna kendali penuh atas saham mana yang diproses.

---

## 5. Tujuan Produk

| Tujuan Bisnis | Tujuan Produk |
|---|---|
| Efisiensi waktu analisis | Otomasi penuh pipeline setelah saham dipilih |
| Tetap fokus & tidak kebanjiran output | Mekanisme pilih-manual, bukan proses massal seluruh bursa |
| Kualitas & konsistensi narasi | AI Narrative Engine dengan guardrail ketat |
| Nilai tambah di luar analisis manual biasa | Modul Prediksi berbasis probabilitas historis (bukan sekadar skenario kondisional) |
| Biaya operasional terkendali | Pemilihan LLM gratis + volume terkendali karena proses manual per saham |

---

## 6. Target Pengguna

Karena produk ini **internal**, persona disederhanakan menjadi:

| Persona | Peran |
|---|---|
| **Pengguna/Analis (kamu)** | Memilih saham dari pool, memicu analisis, melihat hasil di dashboard, mengelola pengaturan filter |

*(Tidak ada role publik/customer-facing di Fase 1 — jika di masa depan produk ini dibuka ke pihak lain, Bagian 16 [Kepatuhan & Legal] perlu ditinjau ulang.)*

---

## 7. Lingkup Produk (Scope)

### Dalam Lingkup (In Scope)
- Universe & Auto-Filter Saham (buang suspend & harga < Rp 50)
- Pemilihan Saham Manual (Stock Picker) sebelum analisis dijalankan
- Data Sync Engine (yfinance, `.JK`, data harian/EOD)
- Indicator Calculation Engine (EMA20/50/100, Bollinger Bands, Stochastic, MACD, Volume MA20, A/D)
- Support/Resistance & Bias Engine (rule-based)
- **Modul Prediksi Analisis Teknikal** (probabilitas historis — baru, lihat Bagian 13)
- AI Narrative Engine (Google Gemini Flash)
- Analysis Card Generator + ekspor gambar
- Dashboard Web + Arsip Historis
- Disclaimer & Kepatuhan (template statis)

### Luar Lingkup (Out of Scope)
- **Net Foreign Buy/Sell** — dihapus permanen dari scope produk ini
- Publikasi otomatis ke media sosial/publik
- Aplikasi mobile native
- Eksekusi order/trading otomatis
- Data intraday realtime tick-by-tick
- Model ML forecasting kompleks (black-box) — modul prediksi memakai pendekatan probabilitas historis yang transparan, bukan neural network time-series (lihat Bagian 13 untuk alasan)

---

## 8. Sumber Data & Keterbatasan Teknis

| Kebutuhan Data | Sumber | Catatan |
|---|---|---|
| OHLCV harian | yfinance (`KODE.JK`) | Gratis, tanpa API key, cukup akurat untuk data EOD |
| Status suspend saham | yfinance / perlu validasi tambahan | ⚠️ yfinance tidak punya field "status suspend" resmi — pendekatan praktis: deteksi dari **tidak ada perubahan volume/harga dalam N hari** sebagai proxy, dikombinasikan pengecekan manual berkala. Ini **dicatat sebagai risiko teknis** di Bagian 18 |
| Harga < Rp 50 | yfinance (field `Close`) | Bisa langsung difilter dari data harga penutupan terakhir |
| Indikator teknikal (EMA, BB, Stochastic, MACD, A/D) | Dihitung sendiri dari OHLCV | Tidak butuh sumber eksternal tambahan |
| Data historis untuk Modul Prediksi | yfinance (historical data multi-tahun) | Perlu riwayat cukup panjang (idealnya 2-5 tahun) per saham untuk sampel yang memadai |
| Net Foreign Buy/Sell | ❌ **Tidak diperlukan** (dihapus dari scope) | — |

---

## 9. Arsitektur Sistem (High-Level)

```
[1. Universe Sync] ── tarik daftar seluruh saham IDX aktif (.JK)
        │
        ▼
[2. Auto-Filter] ── buang saham suspend & harga close < Rp 50
        │
        ▼
[3. Halaman Pemilihan Saham] ── pengguna memilih saham dari pool tersisa
        │  (hanya saham yang DIPILIH lanjut ke pipeline di bawah)
        ▼
[4. Data Sync Engine] ── tarik OHLCV historis + terbaru via yfinance
        │
        ▼
[5. Indicator & Bias Engine] ── hitung EMA/BB/Stochastic/MACD/A-D + tentukan Trend & Kondisi
        │
        ▼
[6. Prediction Engine] ── hitung probabilitas historis berbasis pola indikator serupa di masa lalu
        │
        ▼
[7. AI Narrative Engine] ── Google Gemini Flash menyusun narasi Bahasa Indonesia dari hasil 5 & 6
        │
        ▼
[8. Card Renderer] ── render kartu final (chart + panel + narasi + prediksi)
        │
        ▼
[9. Dashboard] ── kartu tayang otomatis, tidak ada tahap approval manual
```

---

## 10. Struktur Menu (Information Architecture)

```
DASHBOARD
└─ Ringkasan hasil analisis terbaru

PEMILIHAN SAHAM
├─ Pool Saham (hasil auto-filter, search & sort)
└─ Riwayat Pemilihan (saham apa saja yang pernah dipilih & kapan)

ANALISIS
├─ Detail Kartu per Saham
│   ├─ Chart & Indikator
│   ├─ Trend & Kondisi
│   ├─ Level Penting (S/R)
│   ├─ Skenario (Intraday/Swing/Teknikal)
│   ├─ Prediksi Analisis Teknikal   ← BARU
│   └─ Disclaimer
└─ Arsip Historis (per tanggal, per saham)

PENGATURAN
├─ Kriteria Auto-Filter (ambang harga, deteksi suspend)
├─ Parameter Indikator (window EMA/BB/dst — jika ingin disesuaikan)
└─ Konfigurasi LLM (API key, model)
```

---

## 11. Rincian Fitur

### 11.1 Universe & Auto-Filter Saham
**Deskripsi:** Menyiapkan pool saham yang layak masuk tahap pemilihan.

**Logika filter:**
- Buang saham dengan harga `Close` terakhir < Rp 50
- Buang saham yang terdeteksi suspend (proxy: tidak ada aktivitas volume/harga bergerak dalam N hari terakhir — lihat catatan risiko di Bagian 8 & 18)

**Acceptance criteria:**
- Pool ter-refresh otomatis setiap hari sebelum jam pemilihan
- Saham yang tidak lolos filter **tidak muncul sama sekali** di halaman pemilihan (bukan sekadar disabled)

---

### 11.2 Pemilihan Saham Manual (Stock Picker)
**Deskripsi:** Halaman tempat pengguna menentukan saham mana dari pool yang akan diproses.

**Fitur:**
- Search by kode/nama saham
- Filter by sektor
- Multi-select (checkbox)
- Tombol "Jalankan Analisis untuk Saham Terpilih"

**Acceptance criteria:**
- Pipeline (11.4 – 11.7) **hanya** berjalan untuk saham yang dicentang, tidak untuk seluruh pool
- Setelah ditekan, pengguna bisa melihat progress (misal "3 dari 5 saham selesai diproses")

---

### 11.3 Data Sync Engine
*(tidak berubah dari draft awal)* — menarik OHLCV via yfinance untuk saham yang dipilih, termasuk histori multi-tahun (dibutuhkan Modul Prediksi).

---

### 11.4 Indicator Calculation Engine
*(tidak berubah)* — EMA20/50/100, Bollinger Bands(20,2), Stochastic(14,3,3), MACD(12,26,9), Volume MA20, Accumulation/Distribution.

---

### 11.5 Support/Resistance & Bias Engine
*(tidak berubah)* — rule-based, hasil bisa diaudit, menghasilkan Trend & Kondisi (Bullish/Bearish/Konsolidasi) serta level R1-R4/S1-S5.

---

### 11.6 Modul Prediksi Analisis Teknikal *(BARU)*
Lihat detail lengkap di **Bagian 13** — bagian tersendiri karena kompleksitas metodologi & pertimbangan disclaimer-nya.

---

### 11.7 AI Narrative Engine
Lihat detail lengkap termasuk pemilihan LLM di **Bagian 12**.

---

### 11.8 Analysis Card Generator
*(tidak berubah, minus section Net Foreign Buy/Sell yang dihapus)* — merender kartu final: header, info box, chart + overlay, sub-chart (Volume/Stochastic/MACD/A-D), panel data & indikator, Trend & Kondisi, Level Penting, Skenario, **Prediksi (baru)**, Manajemen Risiko, Disclaimer.

---

### 11.9 Dashboard Web
*(tidak berubah)* — daftar hasil analisis, filter by trend/sektor, klik untuk detail kartu. Karena full otomatis, tidak ada status "draft" — begitu diproses, kartu langsung berstatus "Selesai/Tayang".

---

### 11.10 Arsip Historis
*(tidak berubah)* — menyimpan seluruh hasil analisis per saham per tanggal, termasuk hasil Modul Prediksi untuk keperluan evaluasi akurasi di masa depan.

---

### 11.11 Disclaimer & Kepatuhan (Template Statis)
Tetap dipertahankan meski internal, sebagai praktik baik:
> *"Analisis ini dibuat untuk tujuan edukasi dan pembelajaran analisis teknikal. Bukan merupakan ajakan atau rekomendasi untuk membeli/menjual saham."*

**Tambahan khusus untuk Modul Prediksi** (karena kata "prediksi" secara persepsi lebih kuat dari "skenario"):
> *"Angka probabilitas di atas dihitung dari pola historis dan TIDAK menjamin hasil di masa depan. Kinerja masa lalu bukan indikator kinerja masa depan."*

---

## 12. AI Narrative Engine — Pemilihan LLM (Detail)

**Peran AI dalam sistem:** AI **tidak menghitung angka apapun** — seluruh angka (harga, level, probabilitas) berasal dari Engine rule-based (11.4, 11.5, 13). AI hanya menyusun kalimat naratif Bahasa Indonesia dari data terstruktur tersebut, mengikuti gaya kartu referensi.

### Perbandingan Opsi LLM Gratis (per Sept 2026)

| Provider | Kuota Gratis (indikatif) | Kelebihan | Cocok untuk InsightSaham? |
|---|---|---|---|
| **Google Gemini API (Flash)** ✅ *Rekomendasi* | ±1.500 request/hari, tanpa kartu kredit | Kualitas Bahasa Indonesia baik, setup mudah (Google AI Studio) | ✅ Cocok — volume rendah karena proses manual per saham, kuota jauh lebih dari cukup |
| **Groq** | ±1.000 request/hari, ~30 req/menit (tergantung model) | Sangat cepat (hardware LPU) | Alternatif jika butuh throughput tinggi (misal analisis puluhan saham sekaligus) |
| **OpenRouter** | 20+ model gratis lewat 1 API key | Mudah bandingkan gaya bahasa berbagai model | Alternatif eksplorasi jika hasil Gemini kurang pas gaya bahasanya |

**Keputusan:** Mulai dengan **Google Gemini API (Flash)**.

⚠️ **Catatan penting untuk tim development:** kebijakan free-tier LLM **berubah cukup sering** (Google sendiri mengubah free tier-nya di April 2026). PRD ini **tidak mengunci** provider secara permanen di kode — desain AI Narrative Engine harus **abstrak terhadap provider** (mudah ganti ke Groq/OpenRouter jika kuota Gemini berubah), bukan hard-coded ke satu SDK tertentu.

### Guardrail Prompt (tidak berubah dari draft awal)
- AI dilarang mengarang angka baru di luar yang disediakan sistem
- AI dilarang memakai kalimat imperatif ajakan transaksi
- Output AI harus lolos validasi schema sebelum ditampilkan; jika gagal, fallback ke template rule-based

---

## 13. Modul Prediksi Analisis Teknikal — Detail Desain *(BARU)*

Ini fitur baru yang berbeda dari "Skenario" yang sudah ada di kartu (yang sifatnya kondisional: *"JIKA harga tembus level X, maka target Y"*). Modul ini memberi **angka probabilitas** berdasarkan data historis — jadi butuh desain lebih ketat agar tidak menyesatkan.

### Metodologi yang Dipilih: **Historical Pattern-Probability** (bukan ML black-box)

**Alasan memilih pendekatan ini** (bukan model machine learning time-series):
- **Transparan & bisa diaudit** — setiap angka probabilitas bisa ditelusuri balik ke kejadian historis konkret
- Model ML forecasting untuk saham individual jangka pendek secara umum punya akurasi rendah dan cenderung overfitting pada data historis terbatas — ini diakui luas di dunia riset kuantitatif
- Cocok untuk tim internal yang ingin memahami *mengapa* sistem memberi angka tertentu, bukan sekadar menerima output black-box

### Cara Kerja
1. Sistem mengidentifikasi kondisi indikator saham pada hari analisis (contoh: Bias = Bullish, Stochastic di zona X, MACD histogram positif, harga vs EMA20 dalam rentang tertentu)
2. Sistem mencari di data historis — kapan kombinasi kondisi yang **serupa** ini pernah terjadi sebelumnya
3. Sistem menghitung, dari seluruh kejadian historis serupa yang ditemukan (**N** kejadian): berapa persen yang harganya naik/turun/sideways dalam periode X hari ke depan (misal 3 atau 5 hari), dan rata-rata besaran perubahannya
4. Hasil ditampilkan sebagai: *"Berdasarkan N kejadian historis dengan kondisi indikator serupa, harga bergerak naik pada P% kasus dalam 3 hari berikutnya (rata-rata perubahan +X%)."*

### Keputusan Desain Penting yang Perlu Divalidasi
- **Sumber sampel historis:** per-saham individual (riwayat spesifik saham itu saja) vs. cross-saham (gabungan semua saham dengan kondisi serupa). Per-saham lebih relevan tapi sampelnya sedikit; cross-saham lebih banyak sampel tapi kurang spesifik. **Rekomendasi awal:** mulai dengan pendekatan cross-saham (pool gabungan) untuk keandalan statistik, dengan opsi menyaring per-sektor jika ingin lebih relevan — ini didiskusikan lebih lanjut sebelum implementasi (lihat Bagian 19)
- **Ambang jumlah sampel minimum (N):** jika kejadian serupa historis terlalu sedikit (misal N < 10), sistem **tidak menampilkan angka probabilitas** dan sebagai gantinya menampilkan keterangan "Data historis tidak cukup untuk estimasi probabilitas" — mencegah angka yang menyesatkan dari sampel kecil

**Acceptance criteria:**
- Setiap angka probabilitas yang tampil harus menyertakan **N** (jumlah kejadian historis yang mendasarinya) — transparansi wajib, tidak boleh hanya tampil persentase tanpa konteks jumlah sampel
- Disclaimer khusus (Bagian 11.11) wajib tampil berdampingan dengan hasil modul ini

---

## 14. Alur Pengguna Utama (Key User Flows)

**Flow A — Siklus harian**
1. Universe & Auto-Filter berjalan otomatis (pagi/setelah market tutup)
2. Pengguna membuka halaman Pemilihan Saham, melihat pool yang sudah bersih dari suspend & harga <Rp50
3. Pengguna mencentang saham yang diminati, tekan "Jalankan Analisis"
4. Pipeline (Data Sync → Indicator → Bias → Prediksi → AI Narrative → Card) berjalan **otomatis penuh** tanpa approval manual
5. Kartu langsung tayang di Dashboard begitu pipeline selesai per saham

**Flow B — Melihat hasil**
1. Pengguna membuka Dashboard atau Arsip Historis
2. Klik saham → melihat kartu lengkap termasuk section Prediksi
3. (Opsional ke depan) Pengguna membandingkan prediksi masa lalu vs. pergerakan harga aktual, secara manual dari Arsip

---

## 15. Model Data / Entitas Utama

| Entitas | Atribut Kunci | Relasi |
|---|---|---|
| StockUniverse | kode, nama, sektor, harga terakhir, status filter (lolos/tidak) | sumber untuk StockPicker |
| Selection | tanggal, daftar saham dipilih | trigger untuk AnalysisRun |
| AnalysisRun | tanggal, status, saham terkait | menghasilkan 1 AnalysisReport |
| IndicatorSnapshot | EMA, BB, Stochastic, MACD, A/D | milik 1 AnalysisRun |
| PredictionResult | N sampel, window hari, probabilitas naik/turun/sideways, rata-rata perubahan | milik 1 AnalysisRun |
| AnalysisReport | narasi AI, level S/R, bias, kartu final | gabungan dari IndicatorSnapshot + PredictionResult + narasi |

---

## 16. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| **Performa** | Pipeline untuk 1 saham (dari klik "Jalankan Analisis" sampai kartu tayang) selesai dalam waktu wajar (target < 1-2 menit per saham, termasuk panggilan LLM) |
| **Auditability** | Setiap angka (indikator, level, probabilitas) harus bisa ditelusuri ke perhitungan rule-based — AI hanya menyusun kalimat |
| **Fleksibilitas Provider** | AI Narrative Engine tidak boleh hard-coded ke satu LLM provider — abstraksi API wajib, mengingat kebijakan free-tier sering berubah |
| **Keamanan** | API key LLM disimpan sebagai secret, tidak hardcoded di kode |
| **Skalabilitas** | Mendukung penambahan saham ke pool tanpa perlu rombak arsitektur, meski proses tetap manual-pilih |

---

## 17. Pertimbangan UI/UX

- Halaman Pemilihan Saham perlu UX yang efisien untuk menyaring dari ratusan saham (search instan, filter sektor, mungkin tampilkan indikator ringkas seperti "% perubahan hari ini" untuk membantu keputusan pilih)
- Section Prediksi pada kartu perlu visual yang jelas membedakan dirinya dari Skenario (misal: badge "Probabilitas Historis" dengan warna berbeda), supaya tidak tercampur persepsi dengan "kepastian"
- Tema visual gelap konsisten dengan referensi asli

---

## 18. Kepatuhan & Legal

> Pertimbangan produk, bukan nasihat hukum.

- Karena **internal**, risiko regulasi terkait rekomendasi investasi publik jauh berkurang dibanding jika dipublikasikan — namun disclaimer tetap dipertahankan sebagai kebiasaan baik, terutama jika suatu saat hasil dibagikan ke luar tim
- **Modul Prediksi** butuh perhatian ekstra: kata "prediksi" + angka probabilitas lebih mudah disalahartikan sebagai jaminan dibanding "skenario kondisional" biasa. Disclaimer khusus (Bagian 11.11) **wajib**, bukan opsional, meski untuk pemakaian internal — supaya kebiasaan yang terbentuk tetap sehat kalau nanti produk ini berkembang ke luar tim

---

## 19. Pertanyaan Terbuka yang Masih Perlu Divalidasi

Sebagian besar pertanyaan dari draft sebelumnya sudah terjawab. Sisa yang perlu diputuskan sebelum/selama implementasi:

1. **Deteksi status suspend** — yfinance tidak punya field resmi untuk ini (lihat Bagian 8). Perlu diputuskan: pakai proxy otomatis (deteksi tidak ada gerakan harga/volume N hari), tambah pengecekan manual berkala, atau cari sumber tambahan hanya untuk status suspend saja (tanpa perlu data Net Foreign yang sudah dihapus)?
2. **Sumber sampel Modul Prediksi** — per-saham individual atau cross-saham/pool gabungan? (Rekomendasi awal: cross-saham, tapi perlu validasi setelah dicoba dengan data nyata)
3. **Window prediksi** — berapa hari ke depan yang paling relevan untuk ditampilkan (3 hari? 5 hari? bisa pilih keduanya)?
4. **Ambang N minimum sampel** — berapa jumlah kejadian historis minimum sebelum sistem berani menampilkan angka probabilitas (contoh di draft: 10, tapi ini perlu dites dengan data nyata)?

---

## 20. Roadmap / Fase Rilis

| Fase | Fokus | Modul |
|---|---|---|
| **Fase 1 — MVP** | Pipeline inti + seleksi manual | Universe & Auto-Filter, Stock Picker, Data Sync, Indicator Engine, Bias Engine, AI Narrative Engine (Gemini Flash), Card Generator, Dashboard, Disclaimer |
| **Fase 2 — Prediksi** | Menambahkan nilai analitis baru | Modul Prediksi (Historical Pattern-Probability), validasi ambang N minimum, Arsip Historis untuk evaluasi akurasi |
| **Fase 3 — Penyempurnaan** | Berdasarkan pemakaian nyata | Penyesuaian metodologi prediksi (per-saham vs cross-saham) berdasar hasil Fase 2, evaluasi apakah perlu ganti/tambah LLM provider |

---

## 21. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Free tier LLM berubah kebijakan/kuota tiba-tiba | AI Narrative Engine berhenti berfungsi | Desain abstraksi provider (Bagian 12), siapkan fallback ke provider lain |
| yfinance tidak punya sinyal status suspend resmi | Saham suspend lolos filter, masuk pool pemilihan | Proxy deteksi + pengecekan berkala manual (lihat Pertanyaan Terbuka #1) |
| Sampel historis terlalu kecil untuk Modul Prediksi | Probabilitas ditampilkan tapi tidak reliable, menyesatkan | Ambang N minimum wajib (Bagian 13), tampilkan N secara transparan |
| Kata "prediksi" disalahartikan sebagai jaminan | Ekspektasi salah, potensi keputusan finansial gegabah meski internal | Disclaimer khusus wajib tampil berdampingan (Bagian 11.11) |
| Full otomatis tanpa review manual → kesalahan langsung tayang | Data/narasi salah bisa terlihat oleh pengguna sebelum ada yang sadar | Validasi schema output AI (Bagian 12) sebagai lapisan pengecekan otomatis pengganti review manual |

---

## 22. Lampiran: Glosarium

| Istilah | Definisi |
|---|---|
| **Pool Saham** | Daftar saham yang sudah lolos auto-filter (bukan suspend, harga ≥ Rp50), siap dipilih untuk dianalisis |
| **Skenario** | Narasi kondisional ("jika X maka Y") — sudah ada di kartu referensi asli |
| **Prediksi (Modul Baru)** | Estimasi probabilitas arah harga berdasarkan frekuensi kejadian historis dengan kondisi indikator serupa |
| **N (dalam Modul Prediksi)** | Jumlah kejadian historis serupa yang menjadi dasar perhitungan probabilitas — wajib ditampilkan untuk transparansi |
| **EOD (End of Day)** | Data harga penutupan harian |

---

*Dokumen ini adalah versi final (v2.0) berdasarkan seluruh keputusan yang telah dikonfirmasi. Empat pertanyaan pada Bagian 19 direkomendasikan diputuskan bersamaan dengan proses development/prototyping awal Modul Prediksi, karena jawabannya paling baik divalidasi dengan data nyata, bukan diputuskan di atas kertas.*
