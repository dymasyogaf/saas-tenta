# 🚀 Laporan Progress Pengembangan: Tentaklik SaaS
**Tanggal:** 18 Juli 2026

Berikut adalah rangkuman penyelesaian tugas pada hari ini, di mana kita berhasil mengaktifkan urat nadi keuangan aplikasi yaitu sistem Top Up Saldo Iklan via Duitku Payment Gateway.

---

## 💸 1. Integrasi Duitku Payment Gateway (End-to-End)
Sistem *Top-Up* saldo berhasil diintegrasikan dengan Duitku Sandbox secara penuh.
*   **Pembuatan API Rute Tagihan (`create-payment.post.ts`):** 
    *   Sistem mampu menangkap data pengguna dan mencetak tagihan berbekal *signature* `MD5`.
    *   Telah dipasang *fallback* menggunakan metode Virtual Account BCA (`BC`) agar pengujian lolos dari blokir/limit *Credit Card* bawaan *Sandbox*.
*   **Pembuatan API Webhook (`callback.post.ts`):** 
    *   Merancang jalur belakang (*callback*) untuk mendengarkan notifikasi sukses dari Duitku secara *real-time*.
    *   Dilengkapi validasi *signature* MD5 yang ketat agar kebal peretasan.
    *   Menggunakan *Supabase Service Role* untuk menembus *Row Level Security (RLS)* dan menyuntikkan saldo pengguna secara paksa setelah pembayaran dikonfirmasi lunas.

## 🎨 2. Peningkatan UI Dashboard (Top Up Modal)
*   Mengganti alur *input nominal* `window.prompt` yang kaku menjadi **Modal UI Premium** berdesain modern (Glassmorphism).
*   Menyediakan tombol nominal cepat (50 Ribu, 100 Ribu, 500 Ribu) untuk kelancaran *User Experience* (UX).
*   Mengimplementasikan *Spinner Loading State* yang elegan di tombol aksi.

## 🛠 3. Pinia State Management & Typescript Fixes
*   Membangun `stores/saldo.ts` untuk mengatur lalu lintas data saldo secara reaktif.
*   Memperbaiki arsitektur komunikasi data pengguna (passing `userValue` dari komponen Vue ke Pinia Store) untuk menghindari kegagalan otentikasi.
*   Memperbaiki masalah ketidakcocokan tipe (Type `never`) pada hasil pemanggilan Supabase dengan meng- *casting* `<any>`, serta memperbaiki instalasi pustaka `@types/node` secara paksa (via `--force`).
*   Memperbaiki konflik pengikatan konteks Vue (hilangnya UI *Toast Notification*) saat `await` berjalan dengan menangkap instance *useToast* lebih awal.

## 🔒 4. Manajemen Keamanan Kunci Rahasia
*   Menghapus risiko kebocoran data dengan memperbaiki penamaan variabel `.env` dari `NUXT_PUBLIC_SUPABASE_SERVICE_KEY` menjadi `SUPABASE_SERVICE_KEY`. Variabel tersebut sekarang tersimpan dengan aman khusus di level *server-side*.

## 🚀 5. Penyempurnaan Tambahan (Fitur Pro & Fix)
*   **Dynamic URL Redirect:** Mengubah *hardcode* domain pengalihan Duitku di backend menjadi dinamis (`getRequestHost`), sehingga aplikasi otomatis mendeteksi penggunaan di *Localhost* maupun *Live Domain*.
*   **Pilihan Metode Pembayaran ala Pro:** Menambahkan *Dropdown* pilihan metode pembayaran (BCA, Mandiri, BRI, OVO, ShopeePay, DANA, QRIS) di dalam UI Modal Tambah Saldo. Pelanggan kini dapat memilih cara bayar langsung dari dalam aplikasi.
*   **Branding (Favicon):** Mengganti `favicon.ico` bawaan Nuxt menjadi logo resmi aplikasi (dari `icon-512.png`).

## 💸 6. Sistem Alokasi Saldo & Rombak UI Manajemen Saldo
*   **Perombakan Metrik:** Mengganti tampilan metrik logistik COD yang tidak relevan dengan metrik SaaS *Ads Agency* (Saldo Utama Belum Dialokasikan, *Ad Spend*, *Management Fee*, dan *Refund*).
*   **Filter Kalender Reaktif:** Mengaktifkan tombol rentang tanggal (kalender) dengan popover kustom yang otomatis memfilter daftar mutasi transaksi berdasarkan tanggal tanpa me-refresh halaman.
*   **Modal Alokasi Saldo:** Menambahkan fitur popup UI untuk memindahkan uang dari "Saldo Utama" ke platform iklan pilihan (Meta/TikTok/Google Ads) dengan validasi batas saldo (*Type Casting Fix*).
*   **API Transfer Server-Side:** Membangun `api/saldo/transfer.post.ts` yang dikawal oleh *Supabase Service Role* untuk mengeksekusi pemotongan uang dan mencatat riwayat transaksi (`transfer`) dengan aman di *backend*.

## 📊 7. Integrasi Proxy API 3 Platform Iklan (Fase 3.4)
*   **Pembuatan API Proxy:** Membangun tiga jalur *backend* yang aman untuk menarik data performa (Ad Spend, Impresi, Klik) dari **Meta Graph API**, **Google Ads API (RESTful)**, dan **TikTok Business API**.
*   **Mekanisme Mock (Dummy Data):** Menerapkan sistem *fallback* cerdas di mana jika token rahasia dari tim iklan belum tersedia di dalam file `.env`, *backend* akan otomatis menyemburkan data simulasi agar tabel dasbor tetap dapat diuji coba tanpa macet (*error*).
*   **Penggabungan Data Multi-Platform:** Menulis fungsi cerdik di dalam *Pinia Store (`stores/ads.ts`)* yang mampu memanggil ketiga API raksasa tersebut secara asinkron, lalu menjumlahkan dan merapikan seluruh daftar kampanye menjadi satu kesatuan laporan yang utuh.
*   **Sinkronisasi Layar Dasbor:** Metrik statis "Rp 0" dan daftar statis di halaman `index.vue` serta `topup.vue` kini sudah ditenagai oleh mesin *Ads Store* ini. Terdapat juga logika cerdas yang otomatis memilih logo yang tepat (Meta/Google/TikTok) berdasarkan awalan ID kampanyenya.
*   **Dokumentasi Tim Iklan:** Berhasil menulis 3 buah dokumen panduan (*Markdown*) langkah demi langkah berbahasa non-teknis agar tim Pemasaran mudah mencari kunci API yang dibutuhkan:
    1. `PANDUAN_META_ADS_UNTUK_TIM_IKLAN.md`
    2. `PANDUAN_GOOGLE_ADS_UNTUK_TIM_IKLAN.md`
    3. `PANDUAN_TIKTOK_ADS_UNTUK_TIM_IKLAN.md`

## 🛡️ 8. Perancangan Arsitektur Role-Based Access Control (RBAC)
*   **Struktur Hirarki Perusahaan:** Mengonsep dan mendokumentasikan 5 peran (*role*) vital yang dibutuhkan untuk operasional agensi skala besar di file `STRUKTUR_ROLE_SISTEM.md`.
*   **Pemisahan Tugas:** Merinci hak akses *database* spesifik untuk Klien (Pengguna), Tim Audit (*Compliance*), Tim Iklan (*Ads Ops*), Tim Keuangan (*Finance*), dan Pemilik (*Super Admin*).
*   **Pembaruan Roadmap:** Memasukkan "Fase 6: Dasbor Admin & Role Management" ke dalam struktur besar `TODO.md` sebagai panduan pengembangan jangka panjang.

## 📝 9. Sistem Formulir Pengajuan Akun Iklan (Request Ads Account)
*   **Modal Form Dinamis:** Membangun UI berpusat di `RequestAdAccountModal.vue` yang beradaptasi secara otomatis dengan platform. Contoh: mode Google meminta "Shared Email", sedangkan mode TikTok meminta "ID Business Center".
*   **Penyimpanan Database Fleksibel:** Menyimpan data formulir pendaftaran dinamis (seperti `shared_email` atau `bm_id`) menggunakan kolom `JSONB details` pada tabel `ad_account_requests`.
*   **Native HTML5 Validation:** Mengalihkan logika pencegahan *spam* ke validasi bawaan *browser* (tooltip peringatan form) ketimbang mengunci tombol, memberikan *User Experience* (UX) yang lebih intuitif.
*   **Status Dashboard Real-time:** Merekayasa ulang file `platform.vue` untuk menarik riwayat dari Supabase. Jika *user* sudah mendaftar, UI akan mematikan tombol pengajuan dan memunculkan *badge* "Menunggu Review" secara otomatis.
*   **Pembaruan Teks UI:** Memperbarui konten antarmuka "Tahapan Pembuatan Akun" (`PlatformCard.vue`) agar mencerminkan proses internal Tentaklik terkini (sudah menghapus wajib eKYC).

## 🔐 10. Sistem Keamanan & Verifikasi (eKYC)
*   **Alur Peninjauan Otomatis:** Menghubungkan proses registrasi *User* dengan status `unverified`. Pendaftaran mewajibkan pengisian formulir data diri (KTP & Wajah), yang lalu mengubah status menjadi `pending`.
*   **Validasi Formulir Ketat:** Menambahkan fitur otomatis *formatting* tanggal lahir di frontend, pembatasan ketat nomor NIK menjadi 16-20 digit, serta melimitasi berat unggahan KTP ke maksimal 2MB (dengan format JPG/PNG).
*   **Dasbor Rahasia Tim Audit:** Berhasil menciptakan halaman `admin/verifications.vue` yang mencetak daftar tabel klien berstatus `pending`. Tersedia Modal popup elegan berisikan data NIK/Nama untuk dicocokkan, lengkap dengan opsi *Approve* (Setujui) dan *Reject* (Tolak).
*   **Notifikasi In-App:** Mengotomatisasi sistem agar ketika Tim Audit mengeklik 'Approve/Reject', secara *real-time* sistem juga menginjeksikan data pesan ke tabel database `notifications` milik pengguna yang bersangkutan.

## ✨ 11. Optimasi Antarmuka Kelas Enterprise (Skeleton Loader UI)
*   **Komponen Banner Dinamis:** Mengekstrak *banner* peringatan merah "Unverified" menjadi satu buah Komponen Universal bernama `VerificationBanner.vue`. Disisipkan pada tingkat *Layout* (Bapak) sehingga tampil otomatis di seluruh halaman Dasbor, bebas kode redundan!
*   **Animasi Ghost Loading (Skeleton):** Membasmi kutukan "Layout Shift" (halaman berkedip atau memunculkan tulisan *default* "Rp 0" saat ditarik data dari server).
*   **Implementasi Menyeluruh:** Teknik "Blur/Shimmering" animasi abu-abu ini resmi dipasang di seantero sistem:
    - *Card* Saldo & Kampanye Berjalan (`index.vue` dan `topup.vue`)
    - Tabel Laporan Transaksi (`saldo.vue`)
    - Daftar Pilihan Platform Iklan (`platform.vue`)
    - Hingga Tabel dasbor antrean audit Tim Internal (`admin/verifications.vue`).

---

### ⏭️ Target Selanjutnya
1. ~~Pembuatan API proaktif untuk mengecek status transaksi Duitku (`check-status.get.ts`).~~ (Selesai)
2. Pembuatan antarmuka **Dashboard Admin** spesifik untuk Tim Ads Ops (menyalurkan Ad Account ID) dan Finance (mengaudit *Withdrawal*).
