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

Detail lengkap ada di `docs/SOP_PRE_COMMIT_PUSH.md`. Ringkasan:

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
