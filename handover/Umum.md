# 📘 Handover Guide Book — TentaKlik SaaS

Dokumen ini adalah **panduan serah terima (handover)** resmi proyek **SaaS Tenta (TentaKlik)**, disusun untuk developer atau tim engineering yang akan mengambil alih pengelolaan proyek ini.

Baca dokumen secara **berurutan** agar tidak ada konteks yang terlewat.

---

## 📋 Daftar Isi Modul

| # | Dokumen | Ringkasan |
|:---|:---|:---|
| 01 | [Architecture & Tech Stack](./01-architecture-and-stack.md) | Model bisnis, arsitektur sistem, isolasi dual-domain, dan peta struktur folder. |
| 02 | [Local Setup & Environment](./02-local-setup-and-env.md) | Prasyarat sistem, panduan instalasi dari nol, kamus variabel `.env`, dan cara menjalankan dev server. |
| 03 | [Database, Security & RBAC](./03-database-and-security.md) | Skema tabel Supabase, isolasi saldo IDR vs USD, kebijakan RLS, dan matriks hak akses 5 role. |
| 04 | [Third-Party Integrations](./04-third-party-integrations.md) | Detail integrasi payment gateway, Ad Platform APIs, WhatsApp Fonnte, dan Web Push VAPID. |
| 05 | [Core Business Workflows](./05-business-workflows.md) | Alur topup & transaksi, SOP suntik akun, sistem referral, support ticket, dan cron jobs. |
| 06 | [Deployment & DevOps Runbook](./06-deployment-and-devops.md) | Build & deploy ke Cloudflare Pages, konfigurasi `wrangler.toml`, dan SOP pre-push. |
| 07 | [Troubleshooting & Known Gotchas](./07-troubleshooting-and-gotchas.md) | Daftar masalah umum dan cara mengatasinya. |

---

## 🔑 Checklist Serah Terima Kredensial

Tim baru akan menggunakan kredensial (API key, token) yang sudah berjalan di produksi — **tidak perlu generate ulang** dari nol. Cukup serahkan akses berikut:

- [ ] **File `.env` produksi** — Berikan file ini secara langsung (via chat terenkripsi / password manager). Jangan kirim via email atau commit ke Git.
- [ ] **Akses Repositori GitHub** — Tambahkan akun tim baru sebagai Collaborator/Admin di repo ini.
- [ ] **Cloudflare Dashboard** — Undang akun tim baru ke Cloudflare Pages project `tentaklik-saas` (termasuk DNS management untuk `member.tentaklik.com` dan `area.tentaklik.com`).
- [ ] **Supabase Dashboard** — Undang email tim baru di *Supabase Dashboard → Project Settings → Team*.
- [ ] **Cloudflare Pages Environment Variables** — Pastikan semua env var sudah terset di *Settings → Environment Variables* agar build produksi tidak error.

---

## ⚠️ Catatan Penting Setelah Handover

1. **Jangan commit `.env`** ke Git dalam kondisi apapun. File ini sudah ada di `.gitignore`.
2. Simpan file `.env` produksi di **password manager** tim (seperti 1Password, Bitwarden, atau Notion dengan enkripsi) — bukan di chat atau email biasa.
3. Baca minimal **Bab 03 (Database)** dan **Bab 07 (Troubleshooting)** sebelum menyentuh kode produksi.
4. Setelah tim lama tidak lagi terlibat, pertimbangkan untuk **rotate semua secret key** sebagai langkah keamanan jangka panjang.
