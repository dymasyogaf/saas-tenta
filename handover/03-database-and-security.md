# 03. Database, Security & RBAC

---

## 1. 🗄️ Skema Database Utama (Supabase PostgreSQL)

Seluruh tabel aplikasi berada di skema `public` dan berelasi dengan `auth.users` bawaan Supabase.

### Peta Relasi Antar-Tabel

```
auth.users (UUID)
    │ 1-to-1 (via Database Trigger otomatis)
    ▼
public.users ──────┬────── public.saldo (1-to-1)
                   ├────── public.ad_accounts (1-to-N)
                   ├────── public.transactions (1-to-N)
                   ├────── public.support_tickets (1-to-N)
                   ├────── public.referral_codes (1-to-N)
                   ├────── public.bank_accounts (1-to-N)
                   └────── public.push_subscriptions (1-to-N)
```

---

### Kamus Tabel Kunci

#### `public.users`
Profil pengguna, auto-dibuat via trigger saat `auth.users` baru dibuat.

| Kolom | Tipe | Keterangan |
|:---|:---|:---|
| `id` | UUID PK | Mirror dari `auth.users.id` |
| `email` | TEXT | Email login |
| `phone` | TEXT | Nomor WhatsApp untuk OTP |
| `role` | TEXT | Peran: `client`, `admin_compliance`, `admin_ads_ops`, `admin_finance`, `super_admin` |
| `is_2fa_enabled` | BOOLEAN | Status aktif 2FA WhatsApp |
| `phone_verified` | BOOLEAN | Status verifikasi nomor WA |
| `active_package` | TEXT | Paket aktif: `starter`, `growth`, `scale` |
| `package_weekly_limit` | NUMERIC | Batas belanja iklan per minggu sesuai paket |
| `package_expires_at` | TIMESTAMPTZ | Waktu berakhir paket |

#### `public.saldo`
Dompet saldo pengguna — **isolasi ketat antara IDR dan USD**.

| Kolom | Keterangan |
|:---|:---|
| `balance` | Saldo aktif Rupiah (IDR) — untuk `member.tentaklik.com` |
| `pending_balance` | Saldo tertahan IDR (proses topup / alokasi) |
| `usd_balance` | Saldo aktif USD/USDT — untuk `area.tentaklik.com` |
| `usd_pending_balance` | Saldo tertahan USD/USDT |

#### `public.transactions`
Log mutasi finansial yang bersifat **immutable** (append-only, jangan pernah hapus record).

| Kolom | Keterangan |
|:---|:---|
| `type` | `topup`, `withdraw`, `transfer`, `payment`, `refund` |
| `currency` | `IDR` atau `USD` |
| `status` | `pending`, `success`, `failed`, `cancelled` |
| `payment_gateway_ref` | Nomor invoice / referensi dari Duitku atau NOWPayments |
| `fee_amount` | Biaya admin / management fee |

#### `public.ad_accounts`
Akun iklan yang telah disuntikkan ke pengguna.

| Kolom | Keterangan |
|:---|:---|
| `platform` | `meta`, `tiktok`, atau `google` |
| `account_id` | ID akun di platform (hanya angka, **tanpa strip/dash**) |
| `account_name` | Nama akun dari API platform (bukan input manual) |
| `status` | `active`, `inactive`, `pending`, `banned` |
| `limit_amount` | Batas belanja iklan mingguan |
| `subscription_expires_at` | Waktu berakhir masa sewa (per 28 hari) |

#### `public.ad_account_requests`
Formulir permohonan akun baru dari klien sebelum diverifikasi Tim Compliance.

#### `public.support_tickets` & `public.ticket_replies`
Sistem tiket bantuan — percakapan dua arah antara klien dan staf.

---

## 2. 🛡️ Kebijakan Row Level Security (RLS)

**Semua tabel di `public` schema wajib mengaktifkan RLS.**

### Prinsip Utama
1. **Kepemilikan Data**: Klien hanya bisa membaca (`SELECT`) baris dengan `auth.uid() = user_id`.
2. **Larangan Mutasi Finansial Langsung**: Klien **DILARANG KERAS** memiliki hak `INSERT/UPDATE/DELETE` pada tabel `public.saldo` dan `public.ad_accounts`.

### Aturan Pemilihan Supabase Client di Server (Nitro API)

```ts
// A. Context Pengguna Biasa — RLS aktif, data terbatas ke milik user saja
import { serverSupabaseClient } from '#supabase/server'
const client = await serverSupabaseClient(event)

// B. Context Admin / Webhook / Cron — RLS di-bypass sepenuhnya
// Gunakan HANYA di dalam server/api/ (backend), JANGAN di frontend!
import { serverSupabaseServiceRole } from '#supabase/server'
const adminClient = serverSupabaseServiceRole(event)
```

> **PERINGATAN**: Service Role Key memberikan akses penuh tanpa filter ke seluruh database. Jangan pernah paparkan ke sisi frontend (`app/`).

---

## 3. 👥 Matriks Role & Hak Akses (RBAC)

| Role | Kode Database | Wewenang Utama | Batasan Kritis |
|:---|:---|:---|:---|
| **Klien** | `client` | Dashboard, topup, request akun, tiket bantuan | Hanya bisa baca data miliknya via RLS |
| **Tim Kepatuhan** | `admin_compliance` | Review & audit pengajuan akun iklan, verifikasi KYC | Tidak dapat akses saldo klien atau mutasi finansial |
| **Tim Ads Ops** | `admin_ads_ops` | Suntik akun iklan, handle ban/restrict, respons tiket | Tidak punya akses pencairan dana |
| **Tim Keuangan** | `admin_finance` | Dashboard keuangan, approval withdrawal, rekonsiliasi | Fokus pada audit finansial saja |
| **Super Admin** | `super_admin` | Akses tak terbatas: manajemen staf, konfigurasi sistem, laporan eksekutif | Wajib dilindungi 2FA aktif |

### Proteksi Halaman Admin
Semua halaman `app/pages/admin/` dipagari oleh `app/middleware/admin.ts` yang memeriksa apakah `user.role` diawali `admin_` atau bernilai `super_admin`.

---

## 4. ⚡ Trigger & Supabase Storage

### Trigger Otomatis saat User Baru Daftar (`handle_new_user`)
Setiap kali ada akun baru di `auth.users`, trigger otomatis:
1. Membuat baris baru di `public.users`.
2. Menginisialisasi saldo `0` di `public.saldo`.
3. Mengecek apakah ada kode referral di metadata pendaftaran, lalu mencatat di `public.referrals`.

### Storage Buckets
| Bucket | Tipe | Kegunaan |
|:---|:---|:---|
| `support_attachments` | **Public** | Screenshot / bukti transfer di tiket support |
| `kyc_documents` | **Private** | Foto KTP / Paspor untuk verifikasi identitas — hanya admin yang dapat akses via Signed URL |

---

## 5. 📂 Urutan Eksekusi File Migrasi Database

Semua file SQL ada di folder `supabase/migrations/`. Karena tidak menggunakan Supabase CLI dengan timestamp otomatis, **eksekusi manual harus mengikuti urutan berikut** di Supabase Dashboard → SQL Editor:

| Urutan | File | Keterangan |
|:---|:---|:---|
| 1 | `supabase_schema.sql` | **WAJIB PERTAMA** — Base schema: semua tabel utama, RLS, trigger, storage buckets |
| 2 | `alter_db_v2.sql` | Tambah kolom sewa akun & update status pengajuan |
| 3 | `supabase_updates.sql` | Tambah `weekly_spend` ke ad_accounts & fungsi broadcast pertama |
| 4 | `supabase_updates_2.sql` | Tambah tabel `broadcasts`, update fungsi broadcast dengan history |
| 5 | `add_is_sandbox_column.sql` | Tambah kolom `is_sandbox` ke transactions |
| 6 | `add_payment_data_column.sql` | Tambah `payment_url` & `payment_data` ke transactions |
| 7 | `add_notifications_realtime.sql` | Enable Supabase Realtime untuk tabel notifications |
| 8 | `add_usd_balance.sql` | Tambah `usd_balance` & `usd_pending_balance` ke saldo (fitur global) |
| 9 | `add_usd_package_and_currency.sql` | Tambah kolom `currency` ke transactions & field USD ke users |
| 10 | `budget_requests_migration.sql` | Buat tabel `ad_budget_requests` |
| 11 | `referral_update.sql` | Buat sequence & fungsi generate kode referral |
| 12 | `finance_referral_migration.sql` | Buat tabel `affiliate_profiles` & `referrals` |
| 13 | `referral_trigger_update.sql` | Update trigger `handle_new_user` untuk auto-track referral saat registrasi |
| 14 | `package_expiration_migration.sql` | Tambah `package_expires_at` ke users & logika stacking paket |
| 15 | `supabase_rpc_functions.sql` | Semua RPC functions untuk atomic balance operations |
| 16 | `supabase_audit_logs.sql` | Sistem audit log perubahan data |
| 17 | `add_push_subscriptions.sql` | Tabel `push_subscriptions` untuk Web Push Notification |
| 18 | `system_health_setup.sql` | Tabel `system_health` untuk keepalive/monitoring |

> **Catatan**: Semua SQL aman dijalankan berulang karena menggunakan klausa `IF NOT EXISTS` dan `ADD COLUMN IF NOT EXISTS`. File duplikat `add_weekly_spend.sql` telah dihapus karena sudah tercakup di `supabase_updates.sql`.

