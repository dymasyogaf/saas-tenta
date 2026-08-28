# Laporan Progress - 28 Agustus 2026

## Ringkasan Pekerjaan Hari Ini
Fokus utama pekerjaan hari ini meliputi:
1. **Migrasi Gateway Pembayaran Crypto Internasional ke NOWPayments (USDT TRC-20) dengan In-App QR Modal**.
2. **Pemisahan Total & Isosiasi Data Valuta IDR (`member.tentaklik.com`) vs USD (`area.tentaklik.com`)**.
3. **Pemberlakuan Struktur Tier Paket & Fee Berbeda antara Versi Indonesia dan Versi International**.
4. **Lokalisisasi & Penerapan Bahasa Inggris Penuh (Full i18n English) di Mode Area (USD)**.
5. **Perbaikan Bug Kritis, Idempotensi Webhook Anti Double-Credit, & Hardening Keamanan (CSP & Cleanup)**.
6. **Optimasi Performa Web (Parallel Fetching, Tab Visibility Control, Asset Compression) & Verifikasi Typecheck Clean**.

---

### 1. Migrasi Gateway Pembayaran NOWPayments (USDT TRC-20)
- **Modul Server API Baru (`server/api/nowpayments/`)**:
  - `create-payment.post.ts`: Mengirim request order ke NOWPayments API dengan parameter `pay_currency: usdttrc20`, mencatat transaksi ke database dengan `currency: 'USD'`.
  - `webhook.post.ts`: Memvalidasi signature HMAC-SHA512 dari NOWPayments, menambah saldo `usd_balance` secara otomatis, mencatat `user_package_subscriptions` dengan `currency: 'USD'`, dan mensinkronisasi paket tertinggi USD user.
  - `payment-status.get.ts`: Proxy API endpoint untuk memeriksa status real-time pembayaran dari NOWPayments.
- **Komponen Modal QR In-App (`NowPaymentQRModal.vue`)**:
  - Menggantikan sistem redirect eksternal dengan Modal QR Code modern langsung di dalam aplikasi.
  - Dilengkapi fitur copy wallet address & amount, countdown timer 60 menit, peringatan jaringan TRC-20, dan polling otomatis setiap 10 detik.
  - **Optimasi Performa**: Menggunakan `visibilitychange` listener untuk menghentikan (*pause*) polling otomatis saat tab browser diminimize/di-switch untuk menghemat bandwidth dan CPU.

---

### 2. Isosiasi Data & Skema Database Valuta IDR vs USD
- **Migrasi Skema Supabase (`supabase/migrations/add_usd_package_and_currency.sql`)**:
  - Menambahkan kolom `usd_active_package`, `usd_package_expires_at`, dan `usd_package_weekly_limit` pada tabel `users`.
  - Menambahkan kolom `currency` (`IDR` / `USD`) pada tabel `transactions` dan `user_package_subscriptions`.
- **Modul `server/utils/packageSync.ts`**:
  - Diperbarui agar perhitungan tier paket tertinggi (Scale > Growth > Starter), batas limit mingguan, dan tanggal kedaluwarsa dihitung secara independen dan terpisah antara valuta IDR dan USD.
- **Pinia `saldoStore` (`app/stores/saldo.ts`)**:
  - Menambahkan state `usdBalance`, `usdPendingBalance`, `usdActivePackage`, `usdWeeklyLimit`, `usdPackageExpiresAt`.
  - Menyesuaikan `fetchTransactions()` dan `fetchActiveSubscriptions()` agar memfilter data secara otomatis berdasarkan domain aktif (`isGlobal`).

---

### 3. Skema Tier Paket & Fee Berbeda (Lokal vs International)
- **IDR (`member.tentaklik.com`)**:
  - **Starter**: Depo Min Rp 300rb – Rp 5jt, Fee **5%**, Limit Rp 5.000.000 / mgg.
  - **Growth**: Depo Rp 5.5jt – Rp 15jt, Fee **4.5%**, Limit Rp 15.000.000 / mgg.
  - **Scale**: Depo Rp 15.5jt+, Fee **3.5%**, Limit **Unlimited**.
- **USD (`area.tentaklik.com`)**:
  - **Starter**: Spend $0 – $10k, Fee **5%**, Limit **$10,000 / wk**.
  - **Growth**: Spend $11k – $50k, Fee **4%**, Limit **$50,000 / wk**.
  - **Scale**: Spend $51k – $100k, Fee **3%**, Limit **Unlimited**.
- **Perbaikan UI/UX Modal & Tombol**:
  - Membuat kartu paket wizard topup, range deposit, fee, dan fitur list dinamis menyesuaikan domain `isGlobal`.
  - Tombol aksi dibuat dinamis: Tampil **"Beli Paket" / "Get Package"** jika belum ada paket (`None Yet`), dan **"Perpanjang / Upgrade" / "Renew / Upgrade"** jika sudah memiliki paket aktif.
  - **Admin Finance (`admin/finance.vue`)**: Menambahkan toggle filter valuta (`Semua Valuta`, `🇮🇩 IDR`, `🌐 USD`), serta penyesuaian helper `formatCurrency` agar menampilkan simbol `$` saat mode USD.

---

### 4. Full i18n English Localization & Perbaikan Judul Tab
- **Penerapan Bahasa Inggris di Mode Area**:
  - Menerjemahkan seluruh string pada Banner Step 2 Top Up (`SELECTED PACKAGE:`, `DETECTED PACKAGE:`, `Active Duration`, `Select Package`).
  - Menerjemahkan seluruh pesan status dan teks dialog pada `NowPaymentQRModal.vue`.
- **Pembersihan Judul Tab Browser Double**:
  - Memperbaiki logika `titleTemplate` pada `app/app.vue` agar judul tab browser tampil bersih: **`Area Tentaklik`** (atau `Dashboard - Area Tentaklik`), mengeliminasi bug duplikasi nama (`Area Tentaklik - Area Tentaklik`).

---

### 5. Fix Bug Kritis, Idempotensi Webhook, & Hardening Keamanan
- **Anti Double-Credit pada Webhook (`webhook.post.ts`)**:
  - Menambahkan *atomic conditional update* (`.eq('status', 'pending')`) untuk memastikan webhook yang dipanggil berulang kali secara bersamaan tidak akan menambah saldo dua kali (*idempotent*).
- **Auto-Detection Domain Bebas Error `NUXT_E1001` (`useAppMode.ts`)**:
  - Memperbarui composable `useAppMode` dengan guard `tryUseNuxtApp()` dan `try/catch` untuk mencegah warning `NUXT_E1001` di server console.
- **Pembaruan Header CSP (`nuxt.config.ts`)**:
  - Menambahkan `https://api.qrserver.com` ke whitelist `img-src` Content Security Policy agar gambar QR Code USDT tidak diblokir browser.
- **Fix Logo Payment Method**:
  - Membuat file SVG lokal `/logos/usdt.svg` dan menghapus class `mix-blend-multiply` dari tag `<img>` agar logo USDT tampil jernih.
- **Pembersihan File Dummy & Testing**:
  - Menghapus file pengujian lama (`test-jwt.get.ts`, `test-jwt-client.get.ts`, `test-error.vue`, dan folder `binance-pay/`).

---

### 6. Optimasi Performa & Verifikasi Typecheck
- **Paralelisasi Fetching Data (`saldoStore.fetchSaldo`)**:
  - Mengubah pemanggilan `fetchActiveSubscriptions()` dan query data `users` menjadi paralel dengan `Promise.all()`, menghemat 200ms–500ms pada waktu muat dasbor.
- **Kompresi Aset Server-Side**:
  - Mengaktifkan `nitro.compressPublicAssets: true` untuk kompresi Brotli/Gzip otomatis pada Cloudflare Pages.
- **Audit Kompilasi TypeScript**:
  - Menjalankan `npx nuxi typecheck` dengan hasil **Exit Code 0 (Zero Errors)**.
