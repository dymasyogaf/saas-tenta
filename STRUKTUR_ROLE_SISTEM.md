# 🛡️ Struktur Role & Hak Akses (RBAC) - SaaS Tentaklik

Dokumen ini menjabarkan rancangan arsitektur akses kontrol untuk SaaS Tentaklik. Memisahkan hak akses ke dalam beberapa peran (*Role*) ini sangat krusial agar operasional perusahaan dapat diskalakan dan didelegasikan dengan aman tanpa membahayakan data finansial.

Sistem *Role-Based Access Control* (RBAC) ini membagi seluruh entitas di dalam database menjadi 5 kelompok utama:

---

## 1. 👥 Klien (`client`)
*Ini adalah peran bawaan (default) saat seseorang mendaftar di SaaS Tentaklik.*

*   **Tujuan:** Pengiklan/Klien yang menggunakan layanan agensi Anda.
*   **Hak Akses Database:** Hanya bisa melihat, mengubah, dan berinteraksi dengan baris data milik mereka sendiri (di-filter melalui RLS Supabase berdasarkan `user_id`).
*   **Fitur yang Diakses:**
    *   Mengisi saldo (Top Up).
    *   Melihat riwayat transaksi dan membatalkan tagihan.
    *   Mengajukan pembuatan akun iklan (*Request Whitelisted Account*).
    *   Mengalokasikan dana dari Saldo Utama ke Saldo Iklan spesifik.
    *   Melihat metrik performa (*Ad Spend*, impresi) di Dasbor.

---

## 2. 🕵️ Tim Audit / Kepatuhan (`admin_compliance`)
*Garda terdepan perusahaan. Bertugas memastikan keamanan bisnis Anda dari blokir Meta/Google.*

*   **Tujuan:** Menyeleksi semua formulir pengajuan akun iklan yang masuk dari `client`.
*   **Hak Akses Database:** Dapat membaca tabel *Ad Account Requests*, mengubah status pengajuan menjadi `Approved` (Disetujui) atau `Rejected` (Ditolak).
*   **Fitur yang Diakses:**
    *   Dasbor Antrean (*Queue*) Pengajuan Akun.
    *   Sistem untuk memberi catatan penolakan (misal: *"Website mengandung unsur perjudian"*).
*   **Batasan:** Tidak dapat melihat saldo klien, tidak dapat memutasi dana, dan tidak dapat mengubah pengaturan server.

---

## 3. 🚀 Tim Operasional Iklan (`admin_ads_ops`)
*Para eksekutor teknis yang bekerja langsung di dalam platform Facebook Business Manager, Google Ads MCC, dan TikTok Business Center.*

*   **Tujuan:** Membuatkan akun setelah disetujui, dan membantu klien menangani pembatasan (Banned/Restrict).
*   **Hak Akses Database:** Dapat membaca *Request* yang telah disetujui `admin_compliance`, serta memperbarui *ID Akun* (`ad_account_id`) ke dalam profil klien.
*   **Fitur yang Diakses:**
    *   Daftar pengajuan akun yang sudah disetujui dan siap dikerjakan.
    *   Formulir input untuk menyematkan *Ad Account ID* dari Meta/Google/TikTok ke akun SaaS klien.
    *   Sistem *Ticketing/Support* untuk merespons keluhan klien jika akun iklannya bermasalah.
*   **Batasan:** Sama seperti Tim Audit, mereka tidak dapat mencairkan atau melihat perputaran uang.

---

## 4. 💰 Tim Keuangan (`admin_finance`)
*Kasir dan pemegang kunci brankas sirkulasi dana.*

*   **Tujuan:** Memantau sirkulasi Top Up, Withdraw, dan Management Fee.
*   **Hak Akses Database:** Dapat membaca *semua* transaksi di tabel `transactions` dan tabel `users` (hanya bagian saldo). Dapat melakukan *Update* status transaksi penarikan (`withdraw`).
*   **Fitur yang Diakses:**
    *   Dasbor Keuangan Global (Melihat total perputaran uang dan pendapatan dari *Fee*).
    *   Daftar permohonan *Withdraw* (Pencairan sisa dana klien). Mereka bertugas mentransfer uang secara manual di bank asli, lalu mengeklik "Selesai" di dasbor ini.
    *   Melihat mutasi gagal/berhasil untuk pencocokan (rekonsiliasi) dengan mutasi rekening bank perusahaan.

---

## 5. 👑 Super Admin / Pemilik (`super_admin`)
*Dewa di dalam sistem (Founder / CEO).*

*   **Tujuan:** Memantau burung (*Bird's-eye view*) seluruh operasional agensi dan mengatur kunci mesin.
*   **Hak Akses Database:** Memiliki akses `bypass RLS` (bisa membaca, menghapus, mengubah apapun di semua tabel).
*   **Fitur yang Diakses:**
    *   **User Management:** Satu-satunya *Role* yang berhak mengangkat klien menjadi admin (Misal: Menjadikan Budi sebagai `admin_finance`).
    *   **Laporan Eksekutif:** Dasbor khusus melihat Laba Rugi harian perusahaan.
    *   **Pengaturan Sistem:** Mengganti *Webhook Duitku*, mengganti *Token Meta API*, dsb (Mengedit tabel pengaturan server).

---

## Rencana Teknis (Implementation Plan)
Saat kita masuk ke eksekusinya, kita akan:
1. Menambahkan kolom `role` (Tipe Enum/String) di dalam tabel `public.users` Supabase.
2. Mengubah aturan **Row Level Security (RLS)** di Supabase agar `admin_compliance` bisa membaca data klien tertentu, tetapi tidak untuk kolom saldonya.
3. Membangun sebuah antarmuka rahasia (Misal: `app/pages/admin/`) yang dipagari oleh **Nuxt Middleware** (Hanya *user* dengan *role* berawalan `admin_` atau `super_` yang diizinkan masuk).
