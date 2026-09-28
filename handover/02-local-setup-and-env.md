# 02. Local Setup & Environment Guide

Panduan ini membawa developer dari **nol (*clean install*)** hingga aplikasi berjalan sempurna di mesin lokal.

---

## 1. ⚙️ Prasyarat Sistem (Prerequisites)

| Kebutuhan | Versi Minimum |
|:---|:---|
| **Node.js** | v20.x LTS (Direkomendasikan: v20.18.0 ke atas) |
| **npm** | v10.x (ikut terinstal bersama Node.js) |
| **Git** | v2.30+ |
| **Browser** | Google Chrome / Edge / Brave (untuk testing Web Push) |

> Jangan ganti `npm` dengan `yarn` atau `bun` sembarangan karena ada `package-lock.json` yang mengunci versi dependensi secara presisi.

---

## 2. 🚀 Langkah Instalasi (Step-by-Step)

### Langkah 1: Clone Repositori
```bash
git clone <URL_REPO_BARU>
cd saas-tenta
```

### Langkah 2: Instal Dependensi
```bash
npm install
```
> Script `postinstall` akan otomatis menjalankan `nuxt prepare` untuk membuat file TypeScript declaration di `.nuxt/`.

### Langkah 3: Buat File `.env`
```bash
# Windows PowerShell:
Copy-Item .env.example .env

# Linux / macOS:
cp .env.example .env
```
Buka file `.env` dan isi semua variabel sesuai **kamus di bawah**. Minimal yang **wajib diisi** untuk bisa menjalankan dev server adalah koneksi Supabase.

### Langkah 4: Jalankan Development Server
```bash
npm run dev
```
Aplikasi aktif di: **`http://localhost:3000`**

---

## 3. 📖 Kamus Variabel Environment (`.env`)

> ⚠️ **Jangan pernah commit file `.env` ke Git.** File ini sudah ada di `.gitignore`.

### Supabase (Wajib untuk fungsi apapun)

| Variabel | Visibilitas | Cara Mendapatkan |
|:---|:---|:---|
| `NUXT_PUBLIC_SUPABASE_URL` | Public | URL project dari *Supabase Dashboard → Project Settings → API* |
| `NUXT_PUBLIC_SUPABASE_KEY` | Public | **Anon/Public Key** dari menu yang sama |
| `NUXT_SUPABASE_SERVICE_KEY` | **Server Only** | **Service Role Key** (Secret) dari menu yang sama. Wajib rahasia — digunakan backend untuk bypass RLS. |

### Payment Gateway — Duitku (Pasar Domestik IDR)

| Variabel | Cara Mendapatkan |
|:---|:---|
| `NUXT_DUIDKU_MERCHANT_CODE` | Dari portal merchant Duitku |
| `NUXT_DUIDKU_API_KEY` | Dari portal merchant Duitku |
| `NUXT_DUIDKU_SECRET_KEY` | Dari portal merchant Duitku — digunakan validasi signature callback |

### Payment Gateway — NOWPayments (Pasar Global USDT)

| Variabel | Cara Mendapatkan |
|:---|:---|
| `NOWPAYMENTS_API_KEY` | Dashboard NOWPayments → API Keys |
| `NOWPAYMENTS_IPN_SECRET` | Dashboard NOWPayments → IPN Settings |
| `NOWPAYMENTS_WEBHOOK_URL` | Set ke: `https://area.tentaklik.com/api/nowpayments/webhook` |

### WhatsApp OTP — Fonnte

| Variabel | Cara Mendapatkan |
|:---|:---|
| `NUXT_FONNTE_API_TOKEN` | Dashboard Fonnte → pilih device aktif → salin API Token |

### Meta Ads API

| Variabel | Cara Mendapatkan |
|:---|:---|
| `NUXT_META_APP_SECRET` | Meta for Developers → App Settings → Basic |
| `NUXT_META_ACCESS_TOKEN` | Buat **System User** di Meta Business Manager → generate token permanen |
| `NUXT_META_TARGET_ACCOUNT_ID` | ID Akun Iklan BM utama (format: `act_XXXXXXXXXX`) |

### Google Ads API

| Variabel | Cara Mendapatkan |
|:---|:---|
| `NUXT_GOOGLE_ADS_DEV_TOKEN` | Google Ads Manager (MCC) → Tools → API Center |
| `NUXT_GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials → OAuth 2.0 Client ID |
| `NUXT_GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials → OAuth 2.0 Client Secret |
| `NUXT_GOOGLE_REFRESH_TOKEN` | Jalankan OAuth flow dan ambil `refresh_token` dari response |

### TikTok Ads API

| Variabel | Cara Mendapatkan |
|:---|:---|
| `NUXT_TIKTOK_APP_SECRET` | TikTok for Business → Developer Portal → App Settings |
| `NUXT_TIKTOK_ACCESS_TOKEN` | TikTok for Business → Developer Portal → Access Token |

### Web Push Notification (VAPID)

| Variabel | Cara Mendapatkan |
|:---|:---|
| `VAPID_PUBLIC_KEY` | Generate dengan perintah di bawah |
| `VAPID_PRIVATE_KEY` | Generate dengan perintah di bawah |
| `VAPID_SUBJECT` | Email admin, format: `mailto:admin@tentaklik.com` |

Cara generate VAPID key baru:
```bash
npx web-push generate-vapid-keys
```

### Misc

| Variabel | Keterangan |
|:---|:---|
| `NUXT_PING_SECRET` | String rahasia untuk endpoint health-check `/api/ping`. Isi bebas. |

---

## 4. 🧪 Testing Mode Domain Global di Lokal

Untuk menguji tampilan **Mode Global (USDT / `area.tentaklik.com`)** tanpa server produksi:

**Tambahkan entri di file `hosts` mesin lokal (hak administrator):**
- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Linux/macOS: `/etc/hosts`

```text
127.0.0.1   area.local.tentaklik.com
127.0.0.1   member.local.tentaklik.com
```

Akses `http://area.local.tentaklik.com:3000` — plugin `domain-detector.ts` akan otomatis mendeteksi awalan `area.` dan beralih ke mode USDT + Bahasa Inggris.

---

## 5. ✅ Validasi Kualitas Sebelum Push

```bash
# Cek type safety TypeScript & komponen Vue
npx vue-tsc --noEmit

# Cek kompilasi bundle produksi Cloudflare Pages
npm run build
```

Kedua perintah di atas harus menghasilkan **Exit Code 0** tanpa error. Detail checklist lengkap ada di `handover/06-deployment-and-devops.md`.
