# 🚀 Laporan Progress Harian (23 Juli 2026)

## Fokus Pengerjaan: Backend Support Tickets & Persiapan Go-Live Keamanan

### 1. 🎧 Penyelesaian Modul Pusat Bantuan (Support Tickets) - Fase Backend
- **Pembaruan Skema Database:** Menambahkan kolom `priority` (low, normal, high) ke tabel `support_tickets` dan merancang tabel baru `ticket_replies` untuk menyimpan histori percakapan antara Klien dan Admin.
- **Implementasi RLS (Row Level Security):** Mengunci akses tabel `ticket_replies` secara ketat agar Klien hanya dapat melihat dan membalas tiket yang mereka buat sendiri.
- **Pembuatan API Endpoint:** Merampungkan pembuatan rute *backend* untuk mengambil detail obrolan (`GET /[id].get.ts`), memposting balasan baru (`POST /[id]/reply.post.ts`), dan menutup tiket (`POST /[id]/close.post.ts`).
- **Integrasi Lampiran (Attachments):** Menghubungkan fungsi *upload* file ke *Supabase Storage* (`support_attachments`) dari *frontend* saat pengguna melampirkan gambar/PDF ke dalam balasan tiket, lengkap dengan validasi ukuran file maksimal 5MB.
- **Proteksi XSS (Cross-Site Scripting):** Memasang *library* `sanitize-html` pada proses penambahan tiket dan balasan baru. Hal ini mencegah celah keamanan injeksi *script* berbahaya yang bisa diselipkan dari input *Quill Rich Text Editor*.

### 2. 🛡️ Peningkatan Infrastruktur Keamanan Aplikasi (Nuxt Security)
- **Instalasi Modul Keamanan:** Mengimplementasikan dependensi `@nuxt-security` untuk menyuntikkan pengamanan bawaan (*Security Headers*) secara global seperti *Frame Options* (mencegah klik *hijacking*) dan pengaturan CORP/COEP.
- **Konfigurasi CORS (Cross-Origin Resource Sharing):** Membatasi akses *endpoint* API (di *Environment Production*) agar hanya bisa dipanggil secara sah melalui *domain* utama yaitu `https://member.tentaklik.com`. Jika ada bot dari *domain* asing yang menembak API secara langsung, permintaan tersebut akan ditolak.
- **Rate Limiting:** Menerapkan pembatasan jumlah panggil API sebanyak 150 *request* per menit. Sistem ini memproteksi server dari upaya peretasan kasar (*brute-force*), *spam* tiket massal, ataupun serangan *DDoS*.

### 3. 📦 Standardisasi Deploy & Panduan Post-Deploy
- **Restrukturisasi Environment:** Menyeragamkan kerangka file `.env.example` agar memuat seluruh variabel wajib *Production* (seperti `NUXT_META_TARGET_ACCOUNT_ID`), mempermudah proses input variabel ke *Cloudflare Pages*.
- **Pembuatan Panduan Ceklis (Checklist):** Menulis pedoman *Go-Live* komprehensif bagi Klien (`PRODUCTION_CHECKLIST.md`), mencakup instruksi spesifik untuk memutakhirkan pengaturan Webhook Duidku, *Redirect URLs* Supabase, pengaturan *Custom Domain* Cloudflare, dan *OAuth* Iklan (Google, Meta, TikTok) agar selaras dengan domain `member.tentaklik.com`.

### 4. 🐛 Penyelesaian Bug & Refabilitas Deploy (Hotfixes)
- **Perbaikan Module Resolution:** Memindahkan `utils/ticketHelpers.ts` ke `app/utils/ticketHelpers.ts` untuk mengatasi masalah path alias impor Nuxt yang gagal (crash) pada saat *build* untuk *Production* di Cloudflare.
- **Pembersihan Mock Data:** Menghapus data percobaan (*dummy*) pada modul Kampanye Iklan dan menggantinya dengan integrasi API yang membaca secara langsung data asli (`server/api/ads/*/campaigns.get.ts`), sehingga masalah "Data tidak muncul saat di-deploy" telah teratasi sepenuhnya.
- **Integrasi Iklan Bermasalah:** Membangun titik akhir (API) `issues.get.ts` agar tabel Iklan Bermasalah terhubung secara sukses dengan basis data (Supabase).

### 5. 💳 Sistem Berlangganan (Sewa) Akun Iklan
- **Paket Sewa Bertingkat:** Menambahkan opsi sewa akun (1 bulan, 3 bulan, dan 6 bulan) dengan kalkulasi diskon otomatis pada *Wizard* Pengajuan Akun Baru (`RequestAdAccountModal.vue`).
- **Pembaruan Skema Database:** Menyesuaikan aturan batasan (constraint) pada tabel `ad_account_requests` untuk menerima status `payment_pending`. Menambahkan kolom penyimpan masa sewa dan biaya (`subscription_months`, `rental_fee`), serta rekam jejak kedaluwarsa (`subscription_expires_at`) di `ad_accounts`.
- **Integrasi Webhook Duitku (Langganan):** Membedakan alur pembayaran *Top Up* dengan *Sewa Akun*. Transaksi sewa sekarang menggunakan kode prefix khusus (`SUB-{id}`) dan setelah sukses dibayar, status pengajuan otomatis berpindah ke `pending_review` agar ditindaklanjuti oleh Admin.
- **UI Masa Aktif Sewa:** Dashboard Klien kini mendeteksi dan menampilkan peringatan **Masa Aktif Sewa (Terdekat)** secara dinamis.

### 6. 💰 Penyesuaian Aturan Minimum Pengisian Saldo (Top-Up)
- **Minimum Rp 300.000 Flat:** Batas paling bawah pengisian saldo melalui *Payment Gateway* telah disamakan menjadi Rp 300.000 untuk *semua* tingkatan paket (Starter, Growth, dan Scale), meskipun batas maksimal pengeluaran (*weekly limit*) tetap mengikuti hierarki paket Klien.

## 📌 Kesimpulan & Langkah Selanjutnya
Modul Pusat Bantuan secara paripurna telah terintegrasi (Frontend + Backend), kode aplikasi telah dilindungi standar keamanan yang matang untuk *Production*, dan beberapa kendala (bug) minor pada saat *deploy* pertama berhasil diselesaikan dengan baik. 

Fitur **Sewa Akun Iklan** (Subscription) serta pembaruan logika **Top-Up** juga telah dirampungkan secara _End-to-End_ dan masuk ke _main branch_ (Siap Diluncurkan).

Langkah yang tersisa sepenuhnya bergantung pada Klien untuk mengeksekusi panduan pasca-deploy di dasbor layanan eksternal (Supabase, Duidku, dll.), serta menjalankan _script_ migrasi terbaru (`alter_db_v2.sql`), lalu melanjutkannya dengan Sesi Uji Coba Transaksi *Live*.
