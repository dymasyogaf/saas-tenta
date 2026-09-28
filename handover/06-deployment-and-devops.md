# 06. Deployment & DevOps Runbook

---

## 1. ☁️ Arsitektur Deployment (Cloudflare Pages)

Sistem dijalankan di atas infrastruktur serverless **Cloudflare Pages / Workers**.

| Aspek | Detail |
|:---|:---|
| **Nitro Preset** | `cloudflare-pages` (dikonfigurasi di `nuxt.config.ts`) |
| **Output Direktori** | `dist/` (sesuai `wrangler.toml`) |
| **Project Name** | `tentaklik-saas` |
| **Domain Mapping** | `member.tentaklik.com` & `area.tentaklik.com` → Cloudflare Pages |

---

## 2. ⚠️ FLAG WAJIB: `nodejs_compat` di Cloudflare

Ini adalah **hal paling kritis** yang harus dipastikan saat pertama kali setup Cloudflare Pages.

Periksa file `wrangler.toml` — baris ini harus ada:
```toml
compatibility_flags = ["nodejs_compat"]
```

> **Kenapa kritis?** Library `@nuxtjs/supabase` dan JWT handler membutuhkan modul crypto Node.js. Tanpa flag ini, seluruh request autentikasi Supabase di server akan **gagal secara senyap** dan hanya mengembalikan error kosong `{}` — sangat sulit di-debug.

**Cek di Cloudflare Dashboard juga:**
Masuk ke *Pages → Project → Settings → Functions → Compatibility Flags*
Tambahkan `nodejs_compat` untuk environment **Production** dan **Preview**.

---

## 3. 🛠️ Prosedur Deployment

### Cara A: Otomatis via Git Push (Recommended)
Cloudflare Pages terhubung langsung ke GitHub repo:
- Push ke branch `main` → otomatis trigger build & deploy.
- Pastikan setting berikut di Cloudflare Pages Dashboard:
  - **Framework Preset**: `Nuxt`
  - **Build Command**: `npm run build`
  - **Build Output Directory**: `dist`
  - **Environment Variable**: Tambahkan `NODE_VERSION = 20`

### Cara B: Manual via Wrangler CLI
```bash
# 1. Build lokal
npm run build

# 2. Deploy ke Cloudflare Pages
npx wrangler pages deploy dist --project-name=tentaklik-saas
```

---

## 4. 🔐 Setup Environment Variables di Cloudflare Dashboard

Semua variabel dari `.env` produksi harus di-set di:
**Cloudflare Dashboard → Pages → Project → Settings → Environment Variables**

Tambahkan semua variabel dari `.env.example` (tanpa nilai yang sudah ada di `wrangler.toml`).

---

## 5. 🗄️ Prosedur Migrasi Database Supabase

Jika ada penambahan tabel atau kolom baru:

### Aturan Zero-Downtime
- **JANGAN DROP kolom** yang masih digunakan kode produksi.
- Gunakan `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... DEFAULT ...` untuk penambahan aman.
- Selalu test di database lokal / staging sebelum jalankan di produksi.

### Langkah Eksekusi
1. Simpan file SQL migrasi baru di `supabase/migrations/` dengan nama deskriptif.
2. Buka **Supabase Dashboard → SQL Editor** di project produksi.
3. Paste isi script, lalu klik **Run**.
4. Verifikasi tabel: pastikan kolom, index, dan RLS policy sudah terpasang benar.

---

## 6. 🛡️ SOP Pre-Push Quality Gate (5 Layer)

> **Tujuan**: Memastikan setiap baris kode yang masuk ke branch utama telah melewati 5 lapis filter kualitas, bebas bug logika, bebas deadcode, bebas CSRF token error, dan menjamin pemisahan data 100% mutlak antara domain global (`area.tentaklik.com`) dan domestik (`member.tentaklik.com`).

```
┌──────────────────────────────────────────────────────────────┐
│                   5-LAYER PRE-PUSH FILTER                    │
├──────────────────────────────────────────────────────────────┤
│  Layer 1: Type Safety & Static Analysis (vue-tsc)           │
│  Layer 2: CSRF Token & Security Integrity Audit             │
│  Layer 3: Multi-Domain & Currency Isolation Check           │
│  Layer 4: Production Build Verification (npm run build)      │
│  Layer 5: Git Hygiene & Conventional Commit Standard        │
└──────────────────────────────────────────────────────────────┘
```

### 🛡️ Layer 1: Type Safety & Static Code Analysis
```bash
npx vue-tsc --noEmit
```
**Kriteria Lolos:** Exit Code 0 — 0 Errors, 0 Warnings. Tidak ada unused import atau deadcode.

### 🔒 Layer 2: CSRF Token Audit
Pastikan setiap komponen yang melakukan `POST`, `PUT`, `DELETE`, atau `PATCH` menggunakan `unref(csrf)`:
```ts
// ❌ SALAH — menyebabkan error CSRF:
headers: { 'csrf-token': csrf }

// ✅ BENAR:
const csrfToken = unref(csrf) || ''
headers: csrfToken ? { 'csrf-token': csrfToken } : {}
```

### 🌐 Layer 3: Isolasi Domain & Mata Uang

| Parameter | `area.tentaklik.com` (Global) | `member.tentaklik.com` (Domestik) |
|:---|:---|:---|
| **Saldo** | `usd_balance` & `usd_pending_balance` | `balance` & `pending_balance` |
| **Mata Uang** | `$ / USDT` (Paritas 1:1) | `Rp / IDR` |
| **Gateway** | NOWPayments (USDT TRC-20) | Duitku (VA Bank & E-Wallet) |
| **Transaksi** | `currency: 'USD'` | `currency: 'IDR'` |
| **Referral** | Wallet Tron USDT, min 10 USDT | Rekening Bank Lokal, min Rp 100.000 |
| **KYC** | Passport / National ID (5-20 char) | KTP / NIK (8-20 digit) |
| **Bahasa** | 100% English | Bahasa Indonesia |

### 📦 Layer 4: Production Build Verification
```bash
npm run build
```
Kriteria: Bundle `dist/` berhasil terbuat tanpa error SSR atau bundling.

### 🌿 Layer 5: Git Hygiene & Semantic Commit

```bash
# Layer 1: Type Safety
npx vue-tsc --noEmit

# Layer 2: Cek status Git (jangan ada .env atau token yang ikut terstage)
git status

# Layer 3: Build produksi
npm run build
```

### Checklist Sebelum Push

- [ ] Semua tombol `POST/PUT/DELETE` di frontend menggunakan `unref(csrf)` (bukan objek Ref mentah).
- [ ] Logika saldo tidak tertukar: `balance` (IDR) hanya untuk `member.`, `usd_balance` (USD) untuk `area.`.
- [ ] Tidak ada file `.env`, kunci API, atau token rahasia dalam `git status`.
- [ ] Pesan commit mengikuti format Conventional Commits.

### Format Conventional Commits
```
feat(finance): add automatic withdrawal audit log
fix(csrf): unwrap useCsrf token across all POST forms
refactor(topup): enforce 1:1 USDT parity for NOWPayments flow
docs: update handover guide with cron job notes
```
