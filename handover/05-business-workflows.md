# 05. Core Business Workflows & State Machines

---

## 1. 💰 Alur Topup Saldo & State Machine Transaksi

### Diagram Alur

```
[User pilih nominal & metode topup]
          │
          ▼
   Simpan transaksi → status: 'pending'
          │
          ├── Mode Domestik (IDR) ──► Duitku → VA/QRIS/E-Wallet
          └── Mode Global (USD)   ──► NOWPayments → Invoice USDT TRC-20
                                                │
                              [User melakukan pembayaran]
                                                │
                                    [Webhook IPN dari Gateway]
                                                │
                    ┌───────────────────────────┴────────────────────────────┐
                    ▼ Signature Valid & Lunas                                  ▼ Expired / Ditolak
         status: 'success'                                          status: 'failed'/'cancelled'
                    │
                    ▼ (atomic)
          +balance / +usd_balance
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
  Notif WA Fonnte       Hitung Komisi Referral
```

### Status Lifecycle Transaksi
| Status | Keterangan |
|:---|:---|
| `pending` | Invoice aktif, menunggu pembayaran user (maks 24 jam) |
| `success` | Pembayaran dikonfirmasi via webhook; saldo dikreditkan permanen |
| `failed` | Kedaluwarsa atau ditolak gateway/bank |
| `cancelled` | Dibatalkan manual user atau dibersihkan cron worker |

---

## 2. 🎯 Alur Pengajuan & Suntik Akun Iklan

### Jalur A — Pengajuan Normal via Form Klien

```
[Klien isi form platform.vue]
  platform, nama akun, URL target
          │
          ▼ status: 'pending_review'
[Tim Compliance — verifications.vue]
  Cek landing page & produk
          │
  ┌───────┴───────┐
  ▼               ▼
approved         rejected (dengan catatan alasan)
  │
  ▼ status: 'approved'
[Tim Ads Ops — ads-ops.vue]
  Siapkan akun di BM / Google MCC
  Input account_id + tetapkan paket
          │
          ▼ status: 'active'
[Akun muncul di dashboard klien]
```

---

### Jalur B — SOP "Suntik Akun" Manual (Oleh Staf Admin Langsung)

Berlaku untuk klien prioritas atau migrasi akun. Detail lengkap ada di `SOP/SOP_SUNTIK_AKUN.md`.

#### Aturan Wajib yang HARUS Dipatuhi:

**1. Format ID Akun — Tanpa Strip/Dash**
- ✅ Benar: `6133346743`
- ❌ Salah: `613-334-6743`
- Gunakan string yang hanya mengandung angka. Jika mendapat ID dengan strip dari dashboard, bersihkan dengan: `id.replace(/\D/g, '')`

**2. Nama Akun Harus dari API, Bukan Ketik Manual**
- Jangan ketik nama sembarangan (misal: "Akun Meta Klien Baru").
- Ambil nama resmi dari endpoint internal: `/api/ads/meta/accounts` atau `/api/ads/google/accounts`, lalu cocokkan dengan account_id.

**3. Sinkronisasi Paket & Limit (2 Update Wajib)**
- Update `users`: `active_package` dan `package_weekly_limit`
- Update `ad_accounts`: `limit_amount`

Contoh nilai paket:
| Paket | `active_package` | `package_weekly_limit` | `limit_amount` |
|:---|:---|:---|:---|
| Starter | `starter` | `5000000` | `5000000` |
| Growth | `growth` | `15000000` | `15000000` |
| Scale | `scale` | `50000000` | `50000000` |

**4. Perhitungan Masa Sewa (Siklus 28 Hari)**
- 1 bulan sewa = **28 hari** (4 siklus mingguan penuh).
- Isi `subscription_expires_at` dalam format ISO UTC: `2026-10-03T00:00:00Z`
- Jika suntik dilakukan terlambat (klien mulai sewa tanggal 6, disuntik tanggal 14): **wajib backdate** `created_at` ke tanggal mulai sewa asli (contoh: `2026-08-06T00:00:00Z`) agar siklus reset limit mingguan terhitung presisi dari tanggal 6.

---

## 3. 👥 Alur Referral & Payout Komisi

```
[User mendaftar via link ?ref=KODE]
          │
          ▼ (Trigger otomatis)
  Catat di public.referrals
          │
          ▼ (Setiap kali referee topup/berlangganan)
  Hitung komisi → tambah ke saldo reward referrer
          │
          ▼ (User ajukan pencairan)
    ┌─────┴──────┐
    ▼            ▼
Pasar Domestik  Pasar Global
Rekening Bank   Wallet Tron TRC-20
Min: Rp 100.000 Min: 10 USDT
    │            │
    └─────┬──────┘
          ▼
[Antrean withdrawal → Admin Finance]
  Transfer manual di bank/kripto
  Klik "Approve" → status selesai
```

---

## 4. 🎫 Alur Support Ticket

```
[Klien buat tiket]         status: 'open'
          │
[Admin buka & respons]     status: 'in_progress'
          │
[Percakapan via ticket_replies]
          │
[Masalah selesai]          status: 'resolved'
          │
[Tiket ditutup]            status: 'closed'
```

- **Lampiran**: Diunggah ke Supabase Storage bucket `support_attachments`, disimpan sebagai array URL di kolom `attachments` (JSONB).
- **Notifikasi**: Setiap balasan staf memicu push notification ke browser klien.

---

## 5. ⏰ Cron Jobs & Scheduled Tasks

Direktori: `server/api/cron/`

| Worker | Frekuensi Ideal | Tugas |
|:---|:---|:---|
| `check-expired-accounts.ts` | Tiap 1 jam | Cek `subscription_expires_at` yang lewat → ubah status ke `inactive` → kirim notif perpanjangan ke klien |
| `check-overspend-accounts.ts` | Tiap 15 menit | Tarik spend terbaru dari Meta & Google Ads API → jika melebihi `package_weekly_limit` atau saldo habis → auto-pause kampanye |
| `cleanup-pending-transactions.ts` | Tiap 6 jam | Ubah transaksi `pending` yang berusia > 24 jam menjadi `cancelled` |

> **Catatan**: Cron jobs ini bukan scheduler bawaan Nuxt/Cloudflare. Mereka adalah endpoint API biasa yang harus dipanggil oleh external scheduler (misalnya Cloudflare Cron Triggers, atau ping berkala dari layanan monitoring seperti UptimeRobot / BetterStack).
