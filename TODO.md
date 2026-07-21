# 📋 Tentaklik SaaS — Master To-Do List

> Dokumen ini dihasilkan dari analisis `persiapan.md` + mockup HTML yang sudah ada.
> Terakhir diperbarui: 19 Juli 2026

---

## 🔥 Target Berikutnya (Prioritas Utama Pasca-Deploy)
- [x] **Integrasi Saldo Iklan & Payment Gateway (Duidku)**
  - [x] Pembuatan skema koneksi API untuk Top Up.
  - [x] **Rombak Halaman Saldo (My Balance):** Mengganti UI laporan logistik (COD/Ongkir/Asuransi) menjadi metrik spesifik Ads Agency (Total Saldo Unallocated, Saldo Allocated/Terpakai, Ad Spend, Management Fee, dan Refund).
  - [x] Pembangunan tabel riwayat mutasi saldo (Transaksi Top Up, Alokasi ke Iklan, & Pemotongan Fee).
- [x] **Pembuatan Endpoint Callback Transaksi**
  - [x] Menangkap webhook sukses pembayaran dari Duidku secara *real-time*.
- [x] **Sistem Formulir Pengajuan Akun Iklan (Request Ads Account)**
  - [x] Pembuatan modal form dinamis yang beradaptasi sesuai platform (Meta/Google/TikTok).
  - [x] Menggunakan kolom JSONB Supabase untuk fleksibilitas schema data.
  - [x] UI/UX interaktif di `platform.vue` yang menampilkan badge 'Menunggu Review' otomatis dan mencegah spam klik.
- [x] **Sistem Keamanan & Verifikasi KYC (Know Your Customer)**
  - [x] Mematikan / Lock tombol "Dapatkan Ads Account" di halaman platform iklan jika *user* belum melakukan verifikasi profil (KYC).
  - [x] Memunculkan *banner* / peringatan merah yang mengarahkan *user* baru untuk melakukan pengisian formulir KTP & OTP (termasuk di halaman Beranda).
  - [x] Merancang alur **Persetujuan (Approval)** di mana data verifikasi klien tidak langsung aktif, melainkan berubah menjadi status `pending` dan menunggu *Review* dari Tim Audit.
  - [x] Membuat antarmuka rahasia `/admin/verifications` untuk Tim Audit agar bisa melihat data foto KTP klien dan memencet tombol *Approve/Reject*.
  - [x] Mengirimkan notifikasi (toast/wa) secara otomatis kepada Klien yang akunnya telah disetujui (Gembok Ads Account terbuka).

- [x] **Optimasi UI/UX & Performa Antarmuka**
  - [x] Ekstraksi peringatan verifikasi (merah/oranye) menjadi komponen Vue global (`VerificationBanner.vue`) agar bisa dimasukkan ke dalam Layout Utama.
  - [x] Implementasi fitur **Skeleton Loader / Blur Animation** di seluruh elemen yang bergantung pada penarikan data (Data Fetching).
  - [x] Menerapkan Skeleton Loader untuk Kartu "Total Saldo", "Akun Berjalan", "Iklan Butuh Perhatian", "Laporan Kampanye" (di `index.vue`).
  - [x] Menerapkan Skeleton Loader untuk status pengajuan Akun Iklan (di `platform.vue`).
  - [x] Menerapkan Skeleton Loader model baris (tabel) pada seluruh histori transaksi (di `saldo.vue`).
  - [x] Menerapkan Skeleton Loader model baris (tabel) pada antrean klien yang butuh persetujuan Audit (di `admin/verifications.vue`).

---

## Hasil Analisis `persiapan.md`

### ✅ Yang Sudah Tepat
- Stack decision: Nuxt 3 + Supabase + Cloudflare — solid choice
- Pembagian 4 fase sudah runtut dan realistis
- Library yang dipilih (Pinia, VeeValidate+Zod, ApexCharts) sesuai kebutuhan
- Awareness bahwa API keys harus di-server-side sudah ada

### ⚠️ Gap / Yang Perlu Ditambah
1. **OTP Provider** — ✅ Sudah diputuskan pakai **Fonnte** (WhatsApp native, murah, populer di Indonesia)
2. **Escrow system** — Disebut di requirement awal tapi belum ada di fase manapun
3. **Admin panel** — Tidak disebut sama sekali, padahal ada flow "approve akun iklan" yang butuh sisi admin
4. **Database schema** — Belum ada rencana tabel Supabase
5. **Testing strategy** — Belum disebut
6. **CI/CD pipeline** — Hanya sebatas "push auto-deploy", belum ada linting/preview deploy
7. **Rate limiting & queue** — Ads API punya rate limit ketat, belum direncanakan
8. **Multi-tenant RLS** — Belum direncanakan detail policy-nya

---

## 📦 FASE 0: Pre-Development (Sebelum Ngoding)

### 0.1 Finalisasi Keputusan Arsitektur
- [x] ~~Pilih OTP provider~~ → **Fonnte** ✅
- [x] ~~Tentukan payment gateway~~ → **Duidku** ✅
- [ ] Putuskan deployment: Cloudflare Pages + Workers vs Vercel
- [ ] Tentukan apakah admin panel terpisah atau di-route yang sama
- [ ] Tentukan domain & subdomain structure (app.tentaklik.com? dashboard.tentaklik.com?)

### 0.2 Buat Desain Database Schema
- [ ] Tabel `users` — profil, email, phone, 2fa_enabled, pin_hash
- [ ] Tabel `bank_accounts` — pemilik, nama bank, nomor rekening (FK ke users)
- [ ] Tabel `ad_accounts` — platform (meta/tiktok/google), status, user_id
- [ ] Tabel `saldo` — balance, pending_balance, user_id
- [ ] Tabel `transactions` — type (topup/withdraw/transfer), amount, status, xendit_ref
- [ ] Tabel `ad_issues` — campaign_id, platform, issue_type, status
- [ ] Tabel `notifications` — user_id, type, message, read, created_at
- [ ] Tabel `referral_codes` — code, user_id, usage_count, expires_at
- [ ] Siapkan RLS policies per tabel (user hanya bisa akses data sendiri)

---

## 🔑 FASE 1: Registrasi Akun & API Keys

### 1.1 Ads Platform APIs
- [ ] **Meta/Facebook Ads**
  - [ ] Buat Facebook Business App di [developers.facebook.com](https://developers.facebook.com)
  - [ ] Atur permissions: `ads_read`, `ads_management`
  - [ ] Generate long-lived access token (~3 bulan)
  - [ ] Catat App ID, App Secret, Access Token → simpan di env
- [ ] **TikTok Ads**
  - [ ] Daftar di [TikTok API for Business](https://business-api.tiktok.com)
  - [ ] Apply untuk Marketing API access
  - [ ] Catat App ID, Secret → simpan di env
- [ ] **Google Ads**
  - [ ] Buat project di [Google Cloud Console](https://console.cloud.google.com)
  - [ ] Enable Google Ads API
  - [ ] Setup OAuth 2.0 credentials
  - [ ] Apply untuk Developer Token
  - [ ] Catat Client ID, Client Secret, Developer Token, Refresh Token → simpan di env

### 1.2 Payment Gateway
- [ ] **Duidku**
  - [ ] Daftar di [duidku.com](https://duidku.com)
  - [ ] Dapatkan API keys (sandbox mode dulu)
  - [ ] Setup payment channels (VA, QRIS, e-wallet)
  - [ ] Konfigurasi callback URL (akan diisi setelah deploy)
  - [ ] Catat Merchant Code, API Key, Secret Key → simpan di env

### 1.3 OTP / WhatsApp (Fonnte) ✅
- [x] ~~Daftar di fonnte.com~~
- [x] ~~Hubungkan device WhatsApp (scan QR)~~
- [x] ~~Dapatkan API token dari dashboard Fonnte~~
- [x] ~~Test kirim OTP ke nomor sendiri~~
- [x] ~~Catat API Token → simpan di env~~

### 1.4 Cloudflare
- [ ] Buat akun Cloudflare (jika belum)
- [ ] Setup domain tentaklik.com (atau subdomain)
- [ ] Siapkan Cloudflare Pages project

### 1.5 Supabase ✅
- [x] ~~Buat project baru di [supabase.com](https://supabase.com)~~
- [x] ~~Catat: Project URL, anon key, service_role key~~
- [ ] Enable Auth providers yang dibutuhkan (Email, Phone)
- [ ] Setup Storage bucket untuk dokumen KYC

---

## 🏗️ FASE 2: Inisialisasi Proyek & Migrasi Frontend

### 2.1 Setup Nuxt 3 Project ✅
- [x] ~~`npx nuxi@latest init`~~ — Nuxt 4.4.8 (Nitro 2.13.4, Vite 7.3.6, Vue 3.5.40)
- [x] ~~Install dependencies~~ — @nuxtjs/supabase, @pinia/nuxt, @nuxtjs/tailwindcss, @vee-validate/nuxt, zod, apexcharts, vue3-apexcharts, date-fns, lucide-vue-next
- [x] ~~Konfigurasi `nuxt.config.ts`~~ — modules, runtimeConfig (Duidku, Fonnte, Meta, TikTok, Google), app head
- [x] ~~Setup Tailwind config~~ — migrasi ke `tailwind.config.ts`
- [x] ~~Copy fonts setup~~ — Inter + Plus Jakarta Sans via Google Fonts
- [x] ~~Copy color system~~ — ink-*, orange-* palette + custom shadows
- [x] ~~Setup `app.vue`~~ — NuxtLayout + NuxtPage
- [x] ~~`.env.example`~~ — template semua API keys
- [x] ~~Dev server tested~~ — berjalan di localhost:3000 ✅

### 2.2 Buat Layout Structure ✅
- [x] ~~`layouts/default.vue`~~ — untuk landing page / auth pages
- [x] ~~`layouts/dashboard.vue`~~ — migrasi dari mockup:
  - [x] ~~Sidebar (nav items, logo, mobile toggle)~~
  - [x] ~~Header (title, notification dropdown, top-up button, profile dropdown)~~
  - [x] ~~Mobile overlay & responsive behavior~~

### 2.3 Migrasi Halaman dari Mockup HTML ✅
Setiap view di `index.html` menjadi halaman Vue terpisah:

| Mockup View ID | Target File | Komponen Yang Perlu Dipecah |
|---|---|---|
| `view-dashboard` | `pages/dashboard/index.vue` | StatsCard, CampaignRow |
| `view-platform` | `pages/dashboard/platform.vue` | HeroBanner, PlatformCard, StepsAccordion |
| `view-saldo` | `pages/dashboard/saldo.vue` | SaldoTabs, SearchFilter, DataTable |
| `view-bermasalah` | `pages/dashboard/bermasalah.vue` | FilterBar, IssueTable |
| `view-notifikasi` | `pages/dashboard/notifikasi.vue` | NotifTabs, EmptyState |
| `view-topup` | `pages/dashboard/topup.vue` | BalanceCard, ReportCard, MutationTabs, MutationTable |
| `view-profile` | `pages/dashboard/profile.vue` | UserCard, ProfileNav, ProfileForm, BankForm, LayananCard, ReferralCard |

- [x] ~~**Dashboard**~~ — port `view-dashboard` (stats cards + campaign table)
- [x] ~~**Platform Iklan**~~ — port `view-platform` (hero + 3 platform cards + steps accordion)
- [x] ~~**Saldo Iklan**~~ — port `view-saldo` (5 sub-tabs + filters + tables)
- [x] ~~**Iklan Bermasalah**~~ — port `view-bermasalah` (Meta/TikTok tabs + filter bar)
- [x] ~~**Notifikasi**~~ — port `view-notifikasi` (tabs + empty state)
- [x] ~~**Top Up / My Balance**~~ — port `view-topup` (balance summary + report + 5 mutation tabs)
- [x] ~~**Profile**~~ — port `view-profile` (sidebar nav + 4 sub-sections)

### 2.4 Migrasi Modals → Vue Components ✅
- [x] ~~`components/modal/PasswordModal.vue`~~ — dari `modal-password`
- [x] ~~`components/modal/PinModal.vue`~~ — dari `modal-pin`
- [x] ~~`components/modal/VerifyPhoneModal.vue`~~ — dari `modal-verify-phone`

### 2.5 Migrasi Auth Pages ✅
- [x] ~~`pages/login.vue`~~ — dari `login.html`
- [x] ~~`pages/register.vue`~~ — dari `register.html`

### 2.6 Shared Components ✅
- [x] ~~`components/shared/Toast.vue`~~ — migrasi showToast()
- [x] ~~`components/shared/EmptyState.vue`~~ — reusable "Data tidak ditemukan"
- [x] ~~`components/shared/DataTable.vue`~~ — reusable table component
- [x] ~~`components/shared/SearchInput.vue`~~
- [x] ~~`components/shared/FilterDropdown.vue`~~

### 2.7 Migrasi JavaScript → Composables & Stores ✅
| Fungsi di `script.js` | Target | Status |
|---|---|---|
| `switchTab()` | Vue Router navigation | ✅ Done |
| `toggleSidebar()` | Local component state di layout | ✅ Done |
| `showToast()` | `composables/useToast.ts` | ✅ Done |
| `toggleSteps()` | Local component state (ref) | ✅ Done |
| `switchSaldoTab()` | Local component state | ✅ Done |
| `switchBermasalahTab()` | Local component state | ✅ Done |
| `switchProfileTab()` | Local component state | ✅ Done |
| `toggleModal()` | Vue v-model components | ✅ Done |
| `switchBalanceTab()` | Local component state | ✅ Done |
| `toggleProfileMenu()` | Local component state | ✅ Done |
| `toggleNotificationMenu()` | Local component state | ✅ Done |

### 2.8 Fitur Verifikasi Akun / eKYC (Alur MVP Webhook)
- [x] ~~Buat halaman utuh (full page) untuk `/dashboard/verification`.~~
- [x] ~~Sesuaikan warna UI menjadi **Oranye** dan ubah copywriting "Benefit" ke ranah Ads.~~
- [x] ~~**Rombak Alur Wizard (Menjadi 3 Langkah Saja):**~~
  - ~~**Langkah 1 (Data Diri):** Input Upload KTP, **Upload Pas Photo** (baru), Nama, NIK, Tgl Lahir, Email, No HP. Hapus kewajiban Ambil Foto Selfie kamera.~~
  - ~~**Langkah 2 (Ringkasan):** Review data sebelum dikirim.~~
  - ~~**Langkah 3 (Verifikasi OTP):** Gembok keamanan. Kirim kode OTP via Fonnte ke No HP pengguna saat mereka memencet "Kirim".~~
- [x] ~~**Integrasi Webhook & Status:**~~
  - ~~Jika OTP divalidasi dengan benar, tembakkan data teks ke URL Webhook (Google Sheet) lengkap beserta Foto KTP dan Pas Photo Base64.~~
  - ~~Simpan status `profile_verified: true` ke dalam Supabase `user_metadata`.~~
  - ~~Arahkan pengguna (redirect) kembali ke `/dashboard`.~~
- [x] ~~**Update UI Profil (`profile.vue`):**~~
  - ~~Tampilkan badge hijau "Profile Terverifikasi" (menggantikan tombol oranye) jika `user_metadata.profile_verified` bernilai `true`.~~

### 2.9 Bug Fixes & Refinements (17-18 Juli) ✅
- [x] ~~Bypass limit SMTP Supabase (Disable Confirm Email) untuk mencegah Error 500 saat registrasi.~~
- [x] ~~Perbaiki penanganan error 500 (`AuthRetryableFetchError`) dari Supabase di `useAuth.ts` agar tidak disalahartikan sebagai error koneksi.~~
- [x] ~~Sinkronisasi update email dari `auth.users` ke `public.users` saat user mengganti email di `EmailModal.vue`.~~
- [x] ~~Pembersihan data hantu (*ghost users*) menggunakan mekanisme `ON DELETE CASCADE` dari Supabase Auth.~~

---

## 🔒 FASE 3: Backend — Supabase & Server Routes

### 3.1 Supabase Database Setup ✅
- [x] ~~Buat semua tabel sesuai schema di Fase 0.2~~
- [x] ~~Setup RLS policies:~~
  - [x] ~~Users: `auth.uid() = id`~~
  - [x] ~~Transactions: `auth.uid() = user_id`~~
  - [x] ~~Ad accounts: `auth.uid() = user_id`~~
  - [x] ~~Notifications: `auth.uid() = user_id`~~
- [x] ~~Buat database functions (jika perlu calculated fields)~~
- [x] ~~Enable Realtime pada tabel `notifications`~~

### 3.2 Supabase Auth ✅
- [ ] Konfigurasi email auth (confirm email flow)
- [ ] Konfigurasi phone auth (untuk OTP)
- [x] ~~Setup auth middleware di Nuxt (`middleware/auth.global.ts`)~~
- [x] ~~Buat `composables/useAuth.ts` (login, register, logout, getUser)~~
- [x] ~~Implementasi fungsi auth ke `pages/login.vue` & `pages/register.vue`~~

### 3.3 Nuxt Server Routes — Payment (Duidku)
- [x] ~~`server/api/duidku/create-payment.post.ts` — buat request pembayaran (VA/QRIS/e-wallet)~~
- [x] ~~`server/api/duidku/callback.post.ts` — terima callback pembayaran dari Duidku~~
- [x] ~~`server/api/duidku/check-status.get.ts` — cek status transaksi~~
- [ ] Implementasi idempotency key untuk callback
- [x] ~~Setup callback signature verification (Merchant Code + API Key hash)~~

### 3.4 Nuxt Server Routes — Ads API Proxy
- [x] ~~`server/api/ads/meta/accounts.get.ts` — list Meta ad accounts~~
- [x] `server/api/ads/meta/campaigns.get.ts` — campaign performance (Dummy Removed)
- [x] `server/api/ads/tiktok/accounts.get.ts` — list TikTok ad accounts
- [x] `server/api/ads/tiktok/campaigns.get.ts` — campaign performance (Dummy Removed)
- [x] `server/api/ads/google/accounts.get.ts` — list Google ad accounts (OAuth2 Integrated + GAQL for MCC Client Accounts)
- [x] `server/api/ads/google/campaigns.get.ts` — campaign performance (OAuth2 Integrated + Root MCC Login-Customer-Id Header)
- [ ] Implementasi caching (Redis / in-memory) untuk API responses
- [ ] Handle rate limiting per platform

### 3.5 Nuxt Server Routes — OTP ✅
- [x] ~~`server/api/otp/send.post.ts` — kirim OTP via SMS/WhatsApp~~
- [x] ~~`server/api/otp/verify.post.ts` — verifikasi OTP~~
- [x] ~~Rate limit: max 5 attempt per session~~
- [x] ~~Implementasi countdown (350 detik sesuai mockup)~~

### 3.6 Nuxt Server Routes — Saldo & Escrow
- [x] ~~`server/api/saldo/balance.get.ts` — ambil saldo user~~ (via Supabase client frontend)
- [x] ~~`server/api/saldo/topup.post.ts` — request top-up~~ (di-handle oleh Duitku create-payment)
- [x] ~~`server/api/saldo/transfer.post.ts` — pindah saldo antar akun~~ (Alokasi ke Akun Iklan)
- [x] ~~Implementasi escrow logic (hold → release → refund)~~
- [x] ~~Riset & Implementasi Otomatisasi Alokasi Saldo Iklan (Opsi 2) tanpa intervensi Admin Finance.~~

---

## 🧪 FASE 4: Pinia Stores & Data Flow

### 4.1 Stores
- [x] ~~`stores/user.ts` — user profile, auth state~~
- [x] ~~`stores/saldo.ts` — balance, transactions, mutations~~
- [x] ~~`stores/ads.ts` — ad accounts, campaigns, issues~~
- [x] ~~`stores/notification.ts` — notifikasi list, unread count, realtime subscription~~

### 4.2 Composables
- [x] ~~`composables/useAuth.ts` — login, register, logout, check session~~
- [x] ~~`composables/useSaldo.ts` — top-up flow, withdraw flow~~
- [x] ~~`composables/useAds.ts` — fetch campaigns, request new account~~
- [x] ~~`composables/useToast.ts` — toast notification system~~
- [x] ~~`composables/useModal.ts` — modal open/close management~~
- [x] ~~`composables/useSidebar.ts` — sidebar toggle (mobile)~~

---

## 🚀 FASE 5: Deployment & Go-Live

### 5.1 Environment Setup
- [ ] Buat `.env` file dengan semua API keys
- [ ] Setup Cloudflare Pages environment variables
- [ ] Pastikan semua secrets TIDAK ada di frontend code

### 5.2 Deploy ke Cloudflare
- [x] ~~Connect GitHub repo ke Cloudflare Pages~~
- [x] ~~Set build command: `npm run build`~~
- [x] ~~Set preset ke `cloudflare-pages`~~
- [x] ~~Test preview deployment~~
- [ ] Setup custom domain

### 5.3 Post-Deploy Config
- [ ] Update Duidku callback URL ke production URL
- [ ] Update Meta/TikTok/Google OAuth redirect URLs
- [ ] Update Supabase allowed redirect URLs
- [ ] Test semua flow end-to-end di production

### 5.4 Monitoring & Security
- [ ] Setup error tracking (Sentry atau Cloudflare Analytics)
- [ ] Implementasi rate limiting di server routes
- [ ] Review semua RLS policies
- [ ] CORS config untuk production domain only

---

## 🚀 FASE 6: Dasbor Admin & Role Management (RBAC)

### 6.1 Database & Security (Supabase)
- [x] ~~Tambahkan kolom `role` di tabel `users` (client, admin_compliance, admin_ads_ops, admin_finance, super_admin)~~
- [x] ~~Konfigurasi ulang kebijakan *Row Level Security* (RLS) di setiap tabel berdasarkan `role`~~
- [x] ~~Pembuatan middleware Nuxt untuk memblokir akses ke URL `/admin` bagi user biasa~~

### 6.2 UI & Logika Dasbor Admin
- [x] ~~Layout khusus Admin (Navigasi berbeda dengan dasbor Klien)~~
- [x] ~~Halaman Beranda (`admin/index.vue`): Metrik riil (Total Klien, Total Akun, Estimasi Fee), grafik ApexCharts, tabel aktivitas terbaru.~~
- [x] ~~Halaman `admin/verifications` (Tim Audit: Verifikasi eKYC, bypass RLS, sinkronisasi Supabase Storage & UI)~~
- [x] ~~Halaman `admin/clients` (CRM Daftar Klien): Tabel pemantauan seluruh klien (Profil, KYC, Saldo Dompet, Jml Akun Iklan) beserta fitur Filter/Pencarian.~~
- [x] ~~Halaman `admin/ads-ops` (Tim Iklan: Memasukkan ID Akun Meta/Google ke profil Klien)~~
- [x] ~~Halaman `admin/finance` (Tim Keuangan: Memverifikasi Pencairan (Withdraw), Mutasi Top-up, dan Eksekusi Alokasi Iklan)~~
- [x] ~~Halaman `admin/users` (Super Admin - Manajemen Staf Internal): Tabel karyawan dan fitur "Tambah Data Staf" (Opsi A: Cari dari Daftar Klien lalu ubah role, Opsi B: Buat Akun Baru via API bypass auth).~~

---

## 🔮 FASE 7: Pengembangan Lanjutan (V2)

### 7.1 Otomatisasi Saldo & Akun Iklan (SELESAI)
- [x] **Integrasi API (Mock/VCC):** Otomatisasi pemindahan dana (*top up* saldo iklan) secara *real-time* tanpa intervensi Admin Finance.
- [x] **Pembaruan UI/UX Tabel Saldo:** Menampilkan Limit dan menghitung Saldo instan (Limit - Penggunaan). UI diperbersih dengan membuang kolom statis (Penanggung Jawab & Notif).
- [x] **Auto-Generate Data Akun:** Mengotomatiskan pembuatan **Nama Kredit** (contoh: `TENTA-GA-Nama User-1`) yang terhubung langsung dengan sistem/API di Dasbor Ads Ops.

---

## 📌 Status Saat Ini — 21 Juli 2026

Pengembangan **Infrastruktur API Iklan (Google, Meta, TikTok)** telah berstatus *Production-Ready* dengan 100% *clean data* (tanpa data simulasi/dummy). Sistem penamaan otomatis (Naming Convention) juga telah aktif.

Urutan yang disarankan untuk target *Go-Live* berikutnya:

1. **[1 jam]** Konfigurasi *Environment* Production untuk Cloudflare Pages & Proteksi Secrets.
2. **[1 jam]** *Setup* URL Webhook / Callback Duitku agar Saldo Top Up otomatis masuk.
3. **[1 jam]** Penerapan Keamanan Lanjutan: CORS, pembatasan Rate Limit di server routes, Nuxt Security.
4. **[2 jam]** Uji coba transaksi nyata (*End-to-end Live Testing*) di *Production*.

> Total estimasi menuju rilis publik: ~5 jam untuk penyempurnaan infrastruktur *Deployment* & Keamanan (di luar pengembangan otomatisasi)! ✊
