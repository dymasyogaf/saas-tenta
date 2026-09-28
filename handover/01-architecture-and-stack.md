# 01. Architecture & Tech Stack

## 1. 🏢 Model Bisnis & Gambaran Sistem

**SaaS Tenta (TentaKlik)** adalah platform SaaS untuk agensi penyedia sewa akun periklanan digital (*Whitelisted Agency Ad Accounts*) untuk platform **Meta Ads (Facebook & Instagram)**, **Google Ads**, dan **TikTok Ads**.

### Masalah yang Diselesaikan
Pengiklan sering menghadapi pemblokiran akun personal, limit belanja rendah, atau kendala metode pembayaran. TentaKlik menyediakan akun agensi resmi dengan trust score tinggi, limit belanja besar, dan metode pembayaran fleksibel.

### Model Monetisasi
1. **Biaya Langganan / Sewa Akun** — Berdasarkan paket (Monthly, Quarterly, Semiannual) dengan alokasi batas belanja mingguan.
2. **Topup Saldo** — Pengiklan mendepositkan dana lalu mengalokasikannya ke akun iklan sewaan.
3. **Afiliasi / Referral** — Komisi otomatis bagi member yang mereferensikan klien baru.

---

## 2. 💻 Tech Stack Overview

| Layer | Teknologi | Keterangan |
|:---|:---|:---|
| **Framework Utama** | Nuxt 4 | Menggunakan struktur direktori Nuxt 4 (`app/` dan `server/`). |
| **Frontend Engine** | Vue 3 + TypeScript | Composition API, `<script setup lang="ts">`. |
| **CSS & Styling** | Tailwind CSS | `@nuxtjs/tailwindcss` v6, font Inter & Plus Jakarta Sans (Google Fonts). |
| **State Management** | Pinia | `@pinia/nuxt` & `pinia` v2.3. |
| **Form Validation** | VeeValidate + Zod | Validasi form dengan schema Zod. |
| **Backend / Server** | Nitro Engine | Server API routes di `server/api/`, runtime serverless. |
| **Database & Auth** | Supabase | PostgreSQL, Supabase Auth, Row Level Security (RLS), Supabase Storage. |
| **Deployment** | Cloudflare Pages | Nitro preset `cloudflare-pages`, dikonfigurasi via `wrangler.toml`. |
| **Security** | `nuxt-security` + `csurf` | CSRF protection, Content Security Policy, Rate Limiting. |
| **Multilingual** | `@nuxtjs/i18n` | Bahasa Indonesia (`id`) & English (`en`), strategy `no_prefix`. |
| **Charts & Icons** | Lucide + ApexCharts | `lucide-vue-next`, `vue3-apexcharts`. |
| **Type Checker** | `vue-tsc` | Dijalankan manual via `npx vue-tsc --noEmit` sebelum push. |

---

## 3. 🌐 Arsitektur Multi-Domain & Isolasi Ekosistem

Sistem menggunakan **arsitektur dual-domain dalam satu codebase tunggal**:

```
                              Incoming Request
                                    │
                                    ▼
                       [app/plugins/domain-detector.ts]
                                    │
          ┌─────────────────────────┴──────────────────────────┐
          ▼                                                      ▼
  member.tentaklik.com                               area.tentaklik.com
  Mode: Local (Indonesia)                            Mode: Global (International)
  ──────────────────────────────────                ──────────────────────────────────
  Mata Uang: IDR (Rp)                               Mata Uang: USD / USDT (1:1)
  Saldo DB: `balance`                               Saldo DB: `usd_balance`
  Gateway: Duitku (VA & E-Wallet)                   Gateway: NOWPayments (USDT TRC-20)
  KYC: NIK / KTP (8-20 digit)                       KYC: Passport / National ID
  Bahasa: Bahasa Indonesia                           Bahasa: English
  Referral payout: Rekening Bank Lokal              Referral payout: Wallet Tron (TRC-20)
```

### Mekanisme Deteksi Domain
Dikelola melalui plugin `app/plugins/domain-detector.ts` dan composable `useAppMode()`:
- **Server-side**: Membaca request header `host`. Jika mengandung `area.tentaklik.com` atau diawali `area.`, di-set ke mode `global`.
- **Client-side**: Membaca `window.location.hostname` sebagai fallback sinkronisasi reaktif.

> **Isolasi Mutlak**: Setiap kali menulis query saldo atau mutasi transaksi, kode **wajib** memeriksa mode domain agar saldo Rupiah tidak bercampur dengan saldo USDT.

---

## 4. 📂 Peta Struktur Direktori Proyek

```text
Saas Tenta/
├── app/                              # Nuxt 4 Application Root
│   ├── components/                   # Komponen UI Vue (Modular & Reusable)
│   │   ├── admin/                    # Komponen khusus halaman admin
│   │   ├── dashboard/                # Komponen dashboard pengguna
│   │   └── ui/                       # Komponen atomik (Button, Modal, Toast, Input)
│   ├── composables/                  # Vue Composables (useAuth, useSaldo, useAppMode)
│   ├── layouts/                      # Layouts (admin.vue, default.vue, auth.vue)
│   ├── locales/                      # Kamus translasi i18n (id.json, en.json)
│   ├── middleware/                   # Nuxt Route Middlewares (auth.ts, admin.ts)
│   ├── pages/                        # File-based Routing
│   │   ├── admin/                    # Halaman portal Admin
│   │   │   ├── ads-ops.vue           # Manajemen & suntik akun iklan
│   │   │   ├── finance.vue           # Dashboard keuangan & approval withdrawal
│   │   │   ├── verifications.vue     # Review KYC klien
│   │   │   ├── clients.vue           # Manajemen data pengguna
│   │   │   ├── broadcast.vue         # Kirim pengumuman massal
│   │   │   └── support/              # Manajemen tiket bantuan admin
│   │   ├── dashboard/                # Halaman portal Pengguna
│   │   │   ├── index.vue             # Halaman utama / overview
│   │   │   ├── saldo.vue             # Manajemen saldo & topup
│   │   │   ├── platform.vue          # Daftar akun iklan aktif & request
│   │   │   ├── referral.vue          # Sistem afiliasi & pencairan komisi
│   │   │   ├── verification.vue      # Upload dokumen KYC
│   │   │   ├── profile.vue           # Pengaturan profil & 2FA
│   │   │   └── support/              # Tiket bantuan pengguna
│   │   ├── login.vue                 # Halaman login
│   │   ├── register.vue              # Halaman pendaftaran
│   │   └── verify-2fa.vue            # Verifikasi OTP WhatsApp
│   └── plugins/                      # Nuxt Plugins
│       └── domain-detector.ts        # Deteksi multi-domain otomatis
│
├── server/                           # Nitro Engine (Serverless Backend)
│   └── api/                          # REST API Endpoints
│       ├── admin/                    # Endpoint khusus admin
│       ├── ads/                      # Integrasi platform iklan (meta, google, tiktok)
│       ├── cron/                     # Scheduled worker tasks
│       ├── duidku/                   # Handler pembayaran Duitku
│       ├── nowpayments/              # Handler pembayaran crypto NOWPayments
│       ├── notifications/            # Push notification & subscriptions
│       ├── otp/                      # OTP WhatsApp via Fonnte
│       └── support/                  # Ticketing & attachments
│
├── supabase/
│   └── migrations/                   # File SQL migrasi database berurutan
│
├── handover/                         # Dokumen serah terima proyek (dokumen ini)
├── docs/                             # Dokumentasi internal teknis tambahan
├── SOP/                              # Standar Operasional Prosedur
├── nuxt.config.ts                    # Konfigurasi induk Nuxt
├── wrangler.toml                     # Konfigurasi Cloudflare Pages deployment
├── .env.example                      # Template variabel environment
└── package.json                      # Daftar dependensi & npm scripts
```

---

## 5. 🛡️ Arsitektur Keamanan (Security Architecture)

Konfigurasi keamanan diatur secara ketat melalui `nuxt-security` di `nuxt.config.ts`:

1. **CSRF Protection (`csurf`)**:
   - Aktif di seluruh rute mutasi state (`POST`, `PUT`, `DELETE`).
   - **Pengecualian**: Rute webhook publik (`/api/**`) dikecualikan karena request datang dari server eksternal (Duitku, NOWPayments). Webhook aman karena diverifikasi menggunakan signature kriptografi (MD5 / HMAC-SHA512).
   - **Aturan Frontend**: Wajib membuka *ref* CSRF menggunakan `unref(csrf)` sebelum dikirim di header request. Lihat detail di `handover/07-troubleshooting-and-gotchas.md`.

2. **Content Security Policy (CSP)**:
   - Mengizinkan gambar dari domain sendiri, Supabase Storage, `flagcdn.com`, dan QR code generator (`api.qrserver.com`).

3. **CORS Isolation**:
   - Di produksi, hanya origin `member.tentaklik.com` dan `area.tentaklik.com` yang diizinkan.

4. **Rate Limiting**:
   - 150 token per 60 detik untuk mencegah brute force dan DDoS ringan.
