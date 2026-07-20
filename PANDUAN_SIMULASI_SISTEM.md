# 🎭 Buku Panduan: Simulasi Sistem (End-to-End Roleplay)
**Platform SaaS Agensi Iklan - Tentaklik**

Panduan ini ditujukan bagi Anda (Pemilik Sistem) atau QA Tester untuk menguji coba bahwa seluruh fitur utama (*Auth, Verifikasi, Escrow, dan API*) berjalan dengan lancar tanpa ada kebocoran atau bug sebelum rilis ke publik (Production).

Untuk melakukan uji coba ini secara efektif, Anda disarankan menggunakan **Dua Jendela Browser yang Berbeda**:
1. **Browser Utama (Chrome Biasa):** Berperan sebagai **Klien/Pelanggan**.
2. **Browser Samaran (Incognito / Private):** Berperan sebagai **Tim Internal (Audit/Ads Ops/Finance)**.

---

## 🎬 BAB 1: Klien Mendaftar & Terbentur Tembok Keamanan (KYC)

**Peran: 👤 Klien (Browser Utama)**

1. Buka halaman registrasi: `http://localhost:3000/register`.
2. Buat akun baru layaknya pelanggan biasa (masukkan Email, Nama, No HP, dan Password).
3. Setelah login berhasil, Anda akan dialihkan ke `/dashboard`.
4. Buka menu **"Platform Iklan"** di sidebar sebelah kiri.
5. **Uji Keamanan:** Coba klik tombol "Dapatkan Ads Account" pada kartu Meta, TikTok, atau Google. 
   - **Ekspektasi Hasil:** Tombol tersebut harus **terkunci (Gembok)**. Sistem tidak mengizinkan Klien anonim memiliki akun iklan.
6. Klik *Banner* peringatan berwarna merah/oranye di bagian atas dasbor atau pergi ke menu `/dashboard/profile`.
7. Isi formulir **Verifikasi Profil (KYC)**. Unggah foto KTP dan Pas Foto Anda. Klik Submit.
8. **Ekspektasi Hasil:** Status profil klien berubah menjadi `"Menunggu Review Audit"`.

---

## 🎬 BAB 2: Pengecekan KTP & Persetujuan (Tim Audit)

**Peran: ⚖️ Staf Admin / Audit (Browser Incognito)**

1. Buka jendela Incognito, lalu login ke `http://localhost:3000/admin` menggunakan akun **Super Admin** Anda.
2. Navigasikan ke menu **"Verifikasi KYC"** (`/admin/verifications`).
3. Di tabel antrean, Anda akan melihat pengajuan dari Klien yang mendaftar di Bab 1.
4. **Tugas Staf:** Staf mengeklik nama klien tersebut, memeriksa keaslian foto KTP dan mencocokkan wajahnya dengan Pas Foto.
5. Jika aman, klik tombol **"Approve" (Setujui)**. 
6. (Di latar belakang, Supabase mengubah kolom `profile_verified` klien menjadi `true`).

---

## 🎬 BAB 3: Klien Memesan Akun Iklan (Request Ads)

**Peran: 👤 Klien (Browser Utama)**

1. Kembali ke layar Klien dan *Refresh* halaman Dasbor Anda.
2. **Ekspektasi Hasil:** *Banner* peringatan merah hilang, dan tombol gembok di menu "Platform Iklan" kini telah **Terbuka**.
3. Klik tombol "Dapatkan Ads Account" pada kartu **Meta Ads**.
4. Isi formulir pengajuan (Misal: Nama Bisnis `Toko Baju Muslim`, Target URL `www.tokobaju.com`).
5. Klik Submit.
6. **Ekspektasi Hasil:** Permintaan akun iklan klien masuk ke status `"Diproses"` (Menunggu campur tangan Tim Iklan).

---

## 🎬 BAB 4: Pembuatan Akun Iklan & Injeksi ID (Tim Ads Ops)

**Peran: ⚙️ Staf Ads Ops / Tim Iklan (Browser Incognito)**

1. Kembali ke layar Admin, buka menu **"Operasional Iklan"** (`/admin/ads-ops`).
2. Di tabel "Permintaan Akun Iklan", staf akan melihat permintaan Klien (Toko Baju Muslim).
3. **Tugas Manual (Di Luar Sistem):** Staf membuka Facebook Business Manager yang asli (di tab lain), lalu membuatkan akun Meta Ads baru untuk klien tersebut. Staf lalu menyalin **ID Akun (Misal: 1433497578352569)**.
4. **Tugas Sistem:** Staf kembali ke Dasbor Tentaklik, mengeklik tombol **"Inject ID"** pada baris pesanan milik klien tersebut.
5. Staf mem-*paste* ID Akun `1433497578352569` ke dalam formulir *popup* dan menyimpannya.
6. **Ekspektasi Hasil:** Klien resmi memiliki aset akun iklan aktif yang terhubung ke platform.

---

## 🎬 BAB 5: Mengunci Saldo Iklan (Sistem Escrow / Hold)

**Peran: 👤 Klien (Browser Utama)**

1. Klien menerima notifikasi bahwa Akun Meta Ads mereka sudah aktif.
2. Klien menuju menu **"Top Up"** dan mengisi dompet utama mereka (Misal: **Rp 5.000.000** menggunakan Virtual Account BCA via Duidku).
3. Setelah saldo masuk, Klien pergi ke menu **"Saldo Iklan"**.
4. Klien mengeklik tombol **"Alokasikan Dana"**. Klien memilih akun "Toko Baju Muslim" dan memasukkan nominal **Rp 1.000.000**. Klien menekan tombol Konfirmasi.
5. **Ekspektasi Hasil (Sistem Bekerja):** 
   - Saldo Utama klien berkurang menjadi **Rp 4.000.000**.
   - Sistem tidak menghilangkan uangnya, melainkan memindahkannya ke dalam kantong **Saldo Ditahan (Pending Balance) sebesar Rp 1.000.000**.
   - Muncul transaksi baru di riwayat mutasi dengan status **"Pending"** (Uang diamankan oleh platform).

---

## 🎬 BAB 6: Eksekusi Alokasi Saldo & Pencairan (Tim Finance)

**Peran: 💰 Staf Keuangan / Tim Finance (Browser Incognito)**

1. Buka Dasbor Admin, navigasikan ke menu **"Tim Finance"** (`/admin/finance`).
2. Di tabel "Tugas Eksekusi", staf akan melihat permintaan Klien untuk "Alokasi Iklan" sebesar Rp 1.000.000.
3. **Tugas Manual (Di Luar Sistem):** Uang fisik Rp 1.000.000 milik klien saat ini ada di Rekening Bank Utama Tentaklik. Staf Finance harus login ke platform Meta/Google klien (Business Manager), lalu mengisikan plafon kredit atau menggesek Kartu Kredit Perusahaan senilai Rp 1.000.000 agar iklan klien bisa segera tayang.
4. **Tugas Sistem:** Setelah pengisian saldo riil berhasil, staf kembali ke Dasbor Tentaklik dan mengeklik tombol **"Setujui (Approve)"** pada transaksi tersebut.
5. **Ekspektasi Hasil:** 
   - Status transaksi klien berubah menjadi **"Success"**.
   - Saldo Ditahan (Pending Balance) klien terpotong (menjadi Rp 0) dan hangus dari aplikasi karena sudah dipindahkan menjadi saldo di dalam platform Meta/Google.

---

## 🎬 BAB 7: Peran Integrasi API (Sinkronisasi Otomatis)

Karena pengisian saldo riil dilakukan secara manual oleh Tim Finance (Bab 6), apa fungsi dari integrasi API Meta, Google, dan TikTok yang ditanamkan di Backend (`server/api/ads/`)?

Integrasi API tidak bertugas untuk mentransfer uang, melainkan sebagai **Mesin Sinkronisasi Data Otomatis**:
1. **Reporting Real-Time:** API secara otomatis menarik data *Ad Spend* (Pengeluaran Iklan Harian) dari Meta/Google. Klien tidak perlu repot login ke Business Manager, mereka bisa memantau semuanya (Impressions, Clicks, dll) langsung dari satu layar Dasbor Tentaklik.
2. **Keamanan Status Akun:** API bertindak sebagai pengawas 24/7. Jika akun iklan klien tiba-tiba terkena *Banned* (Restricted/Disabled) oleh platform, API akan langsung memunculkan peringatan merah di Dasbor klien agar mereka bisa segera bertindak.
3. **Otomatisasi Akun (Advanced):** Di tahap selanjutnya, API akan digunakan untuk mengeksekusi Bab 4 secara otomatis (membuat ID Akun Iklan dan mengirim undangan email) tanpa perlu campur tangan manual Tim Ads Ops.

> 🏆 **Kesimpulan:** Jika seluruh bab ini dapat dipraktikkan tanpa *Error* atau kebocoran logika, maka SaaS Agensi Iklan Tentaklik sudah memiliki infrastruktur kelas *Enterprise* dan sangat layak untuk *Go-Live*!
