# TentaKlik — Platform SaaS Manajemen Rental Akun Iklan Digital

TentaKlik adalah platform **Software as a Service (SaaS)** yang dirancang untuk agensi digital yang menyediakan layanan sewa akun periklanan resmi (*Whitelisted Agency Ad Accounts*) di platform **Meta Ads (Facebook & Instagram)**, **Google Ads**, dan **TikTok Ads**.

---

## 🏢 Tentang Sistem Ini

### Masalah yang Diselesaikan

Pengiklan digital sering menghadapi kendala seperti:
- Akun periklanan personal yang mudah diblokir atau dibatasi oleh platform.
- *Daily spend limit* rendah yang menghambat skala kampanye.
- Kendala metode pembayaran, pajak, atau rekening bank lokal.

**TentaKlik menyelesaikan masalah ini** dengan menyediakan akun periklanan dari Business Manager agensi resmi yang memiliki *trust score* tinggi, batas belanja besar, dan metode pembayaran yang fleksibel.

### Model Monetisasi
1. **Biaya Langganan / Sewa Akun** — Berdasarkan paket (Monthly, Quarterly, Semiannual) dengan alokasi batas belanja mingguan (*weekly spend limit*) sesuai paket yang dipilih.
2. **Topup Saldo** — Klien mendepositkan dana ke saldo utama, lalu mengalokasikannya ke akun iklan sewaan.
3. **Afiliasi / Referral** — Komisi otomatis bagi member yang mereferensikan klien baru.

---

## 🌐 Arsitektur Dual-Domain & Dual-Currency

Salah satu keunggulan teknis utama sistem ini adalah **isolasi multi-domain dalam satu codebase** yang sama:

| Aspek | 🇮🇩 Domestik (`member.tentaklik.com`) | 🌐 Global (`area.tentaklik.com`) |
|:---|:---|:---|
| **Mata Uang** | Rupiah (IDR) | USD / USDT (paritas 1:1) |
| **Payment Gateway** | Duitku (VA Bank, QRIS, E-Wallet) | NOWPayments (USDT TRC-20 Crypto) |
| **Saldo Database** | `balance` & `pending_balance` | `usd_balance` & `usd_pending_balance` |
| **Verifikasi Identitas** | NIK / KTP (numerik 8–20 digit) | Paspor / National ID (alfanumerik) |
| **Bahasa Antarmuka** | Bahasa Indonesia | English |
| **Payout Referral** | Rekening Bank Lokal (min. Rp 100.000) | Wallet Tron USDT TRC-20 (min. 10 USDT) |

Sistem mendeteksi domain secara otomatis melalui plugin server-side dan menyesuaikan seluruh logika bisnis, tampilan mata uang, dan metode pembayaran yang tersedia.

---

## 💻 Tech Stack

| Layer | Teknologi |
|:---|:---|
| **Framework** | Nuxt 4 (Vue 3, TypeScript, Nitro Serverless Engine) |
| **Styling** | Tailwind CSS, Google Fonts (Inter, Plus Jakarta Sans) |
| **State Management** | Pinia |
| **Form Validation** | VeeValidate + Zod |
| **Database & Auth** | Supabase (PostgreSQL, Supabase Auth, Row Level Security) |
| **Deployment** | Cloudflare Pages (Nitro preset `cloudflare-pages`) |
| **Security** | `nuxt-security` (CSRF, CSP, Rate Limiting), Middleware Route Guards |
| **Multilingual** | `@nuxtjs/i18n` — Indonesia (`id`) & English (`en`) |
| **Charts & Icons** | ApexCharts, Lucide Icons |

---

## 🔌 Integrasi Pihak Ketiga

| Layanan | Fungsi |
|:---|:---|
| **Duitku** | Payment gateway domestik (Virtual Account, QRIS, E-Wallet) |
| **NOWPayments** | Payment gateway crypto USDT TRC-20 untuk pasar global |
| **Meta Marketing API** | Sinkronisasi akun & monitoring spend Facebook/Instagram Ads |
| **Google Ads API** | Integrasi Google Ads MCC & sinkronisasi data kampanye |
| **TikTok Ads API** | Manajemen akun TikTok Business Center |
| **Fonnte (WhatsApp)** | OTP 2FA login & notifikasi transaksi via WhatsApp |
| **Web Push (VAPID)** | Browser push notification real-time untuk semua perangkat |

---

## 🔐 Sistem Role & Hak Akses (RBAC)

Sistem membagi pengguna ke dalam **5 level peran** dengan wewenang yang terisolasi:

| Role | Fungsi Utama |
|:---|:---|
| `client` | Pengguna/advertiser — topup saldo, request akun iklan, support ticket |
| `admin_compliance` | Verifikasi & audit kelayakan pengajuan akun iklan baru |
| `admin_ads_ops` | Suntik (inject) akun iklan, monitoring ban/restrict, jawab tiket |
| `admin_finance` | Monitoring transaksi keuangan, approval pencairan saldo (withdraw) |
| `super_admin` | Akses tak terbatas — manajemen staf, konfigurasi sistem, laporan eksekutif |

Seluruh tabel database menggunakan **Row Level Security (RLS)** Supabase, memastikan setiap pengguna hanya dapat mengakses data miliknya sendiri.

---

## 📦 Fitur Utama Per Modul

### Portal Klien (`/dashboard`)
- **Saldo & Topup** — Isi saldo melalui berbagai metode pembayaran.
- **Platform Iklan** — Lihat daftar akun sewa aktif, status, batas belanja, dan alokasi dana.
- **Akun Bermasalah** — Laporan dan monitor status penanganan kendala akun.
- **Referral** — Lihat komisi referral, statistik, dan ajukan pencairan.
- **Verifikasi** — Upload dokumen KYC untuk aktivasi fitur lanjutan.
- **Support** — Buat tiket keluhan dan ikuti percakapan dengan tim.
- **Notifikasi** — Pusat notifikasi in-app dan push notification.

### Portal Admin (`/admin`)
- **Dashboard Utama** — Statistik global: pengguna aktif, total transaksi, akun aktif, dan peringatan.
- **Ads Operations** — Antrian pengajuan akun, suntik manual, dan monitoring akun aktif.
- **Keuangan (Finance)** — Rekap pendapatan, daftar withdrawal, dan approval pencairan.
- **Klien** — Manajemen data pengguna dan saldo.
- **Verifikasi** — Review dokumen KYC yang diajukan klien.
- **Broadcast** — Kirim pengumuman massal ke seluruh pengguna.
- **Support** — Kelola dan respons semua tiket keluhan yang masuk.

### Sistem Otomatis (Cron Jobs)
- **Deteksi Akun Kedaluwarsa** — Otomatis nonaktifkan akun iklan yang masa sewanya habis dan kirim notifikasi perpanjangan.
- **Monitor Overspend** — Cek belanja iklan secara berkala dan pause kampanye otomatis jika saldo/limit habis.
- **Pembersihan Transaksi Pending** — Cancel transaksi topup yang tidak diselesaikan lebih dari 24 jam.

---

## 🚀 Quick Start (Untuk Developer)

> Panduan lengkap tersedia di folder [`handover/`](./handover/README.md).

### Prasyarat
- Node.js `v20.x` LTS atau lebih tinggi
- npm `v10.x` atau lebih tinggi

### Instalasi & Menjalankan Server Lokal

```bash
# 1. Instal dependensi
npm install

# 2. Salin template konfigurasi
cp .env.example .env
# Kemudian isi kredensial di file .env sesuai panduan di handover/02-local-setup-and-env.md

# 3. Jalankan development server
npm run dev
# Akses di http://localhost:3000
```

### Validasi Sebelum Push ke Git

```bash
# Cek type safety TypeScript & komponen Vue
npx vue-tsc --noEmit

# Cek kompilasi build produksi
npm run build
```

---

## 📚 Dokumentasi & Panduan Serah Terima

Seluruh panduan teknis dan alur bisnis untuk developer baru tersedia di folder **`handover/`** di repositori ini:

| Panduan | Isi |
|:---|:---|
| `handover/README.md` | Index panduan + checklist serah terima |
| `handover/01-architecture-and-stack.md` | Arsitektur, tech stack, dan peta direktori |
| `handover/02-local-setup-and-env.md` | Setup lokal, kamus variabel `.env`, dan pengujian |
| `handover/03-database-and-security.md` | Skema database, RLS, dan matriks role |
| `handover/04-third-party-integrations.md` | Detail semua integrasi API pihak ketiga |
| `handover/05-business-workflows.md` | Alur bisnis: topup, suntik akun, referral, tiket |
| `handover/06-deployment-and-devops.md` | Deployment Cloudflare Pages & runbook DevOps |
| `handover/07-troubleshooting-and-gotchas.md` | Daftar pitfall teknis dan solusinya |

---

*© TentaKlik. All rights reserved.*
