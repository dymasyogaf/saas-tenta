# 🚀 Rencana Arsitektur Otomatisasi Alokasi Saldo Iklan (V2)

**Tanggal:** 21 Juli 2026
**Fokus Platform:** Meta Ads & Google Ads (TikTok ditunda)
**Tujuan:** Mengeliminasi peran manual "Admin Finance" dalam proses alokasi saldo/top up ke akun iklan klien, memungkinkan skalabilitas layanan 24/7 secara *real-time*.

---

## 1. Pendekatan Teknis (Dua Jalur Utama)

Karena Meta dan Google memiliki ekosistem *billing* yang berbeda, terdapat dua opsi pendekatan arsitektur untuk otomatisasi ini.

### OPSI A: Menggunakan Native Platform API (Agency Credit Line)
Pendekatan ini mengasumsikan bahwa **Tentaklik** berstatus sebagai Agency Partner resmi dan diberikan fasilitas *Invoice* / *Credit Line* bulanan oleh kedua platform.

1. **Meta Ads Automation:**
   *   **Metode:** Menggunakan Meta Graph API (`Business Credit Allocation`).
   *   **Alur:** Saat klien klik alokasi, sistem Tentaklik memotong saldo dompet lokal -> Backend menembak API Meta untuk mentransfer porsi *Credit Line* dari Business Manager (BM) pusat ke Ad Account spesifik milik klien.
2. **Google Ads Automation:**
   *   **Metode:** Menggunakan fitur *Consolidated Billing* pada akun Manager (MCC) dan Google Ads API (`AccountBudgetProposalService`).
   *   **Alur:** Sistem memotong saldo lokal -> Backend menembak API Google untuk menambahkan batas pengeluaran (*spending limit*) pada akun Google Ads klien.

### OPSI B: Menggunakan Virtual Credit Card (VCC) API (Lebih Direkomendasikan)
Ini adalah jalur paling umum yang digunakan oleh SaaS *Ads Agency* modern karena lebih universal (1 sistem untuk semua platform iklan).
*   **Vendor Populer:** Stripe Issuing, Aspire, Jack (di Indonesia), atau layanan *corporate card* API lainnya.
*   **Cara Kerja:**
    1. Setiap kali klien membuat Ad Account baru di platform Tentaklik, sistem via API menerbitkan **1 Kartu Virtual Unik**.
    2. VCC ini didaftarkan sebagai metode pembayaran utama di akun Meta/Google klien tersebut.
    3. Ketika klien klik "Alokasi", Backend Tentaklik akan **memindahkan dana** dari Dompet Induk (*Master Wallet*) SaaS ke VCC milik klien tersebut.
    4. Saldo VCC bertambah *real-time*. Meta dan Google akan men-charge tagihan iklan langsung ke kartu tersebut secara otomatis.

---

## 2. Tantangan & Protokol Keamanan (Security & Mitigation)

Otomatisasi pergerakan uang sungguhan (*real money movement*) memiliki risiko tinggi jika tidak dilindungi dengan ketat.

### A. Risiko Fraud & Pencucian Uang (Chargeback)
*   **Skenario:** *User* nakal top-up menggunakan Kartu Kredit curian melalui payment gateway (Duitku) -> Saldo dompet instan bertambah -> Sistem otomatis mengalokasikan ke Meta -> Iklan langsung berjalan menghabiskan dana. Saat pemilik kartu asli melakukan *chargeback* ke bank, Tentaklik yang harus menanggung kerugian ke Meta/Google.
*   **Mitigasi:** 
    *   Sistem eKYC ketat (sudah diimplementasikan) wajib lulus sebelum menu alokasi terbuka.
    *   **Tiering Limit:** Akun baru (usia < 1 bulan) memiliki batas maksimal alokasi harian (misal Rp 1.000.000). Limit ini perlahan dinaikkan seiring *track record* transaksi yang sehat.

### B. Kegagalan Koneksi (Error Handling & Race Conditions)
*   **Skenario:** Saldo dompet lokal Klien sudah terpotong, tetapi API Meta atau VCC sedang *down* (gangguan), sehingga dana gagal masuk ke akun iklan.
*   **Mitigasi:**
    *   Semua logika pemotongan saldo harus menggunakan **Database Transactions**.
    *   Jika API pihak ketiga (Meta/Google/VCC) merespons dengan *error* atau *timeout*, sistem harus secara otomatis melakukan **Rollback/Auto-Refund** agar saldo dompet Klien kembali utuh.
    *   Mengimplementasikan *Retry Mechanism* (misal antrean *Background Job* yang mencoba ulang tiap 5 menit jika *timeout* jaringan).

### C. Manajemen Fluktuasi Nilai Tukar (Kurs IDR ke USD)
*   **Skenario:** Klien top-up menggunakan Rupiah (IDR), sedangkan tagihan akun iklan Meta/Google menggunakan Dollar (USD). Karena otomatis, perubahan kurs yang cepat bisa menyebabkan SaaS "tekor".
*   **Mitigasi:**
    *   Integrasi *Real-time Exchange Rate API* (misal: OpenExchangeRates atau native dari penyedia VCC).
    *   Menerapkan *Buffer Margin / Spread* (misalnya kurs tengah BI + 2%) saat klien melakukan konversi alokasi, untuk melindungi profitabilitas perusahaan.

---

## 3. Langkah Aksi Berikutnya (Action Plan)

Jika fitur ini akan dieksekusi setelah rilis Fase 1 selesai, berikut urutan pengerjaannya:

1. **Riset & Finalisasi Vendor:** Putuskan apakah akan mengejar status *Agency Partner* untuk akses API Credit Line (Opsi A), atau mendaftar ke provider VCC API (Opsi B).
2. **Penyesuaian Skema Database:** Menambahkan kolom identifikasi di tabel `ad_accounts` (misalnya `vcc_card_id` atau `platform_credit_id`).
3. **Refactoring Endpoint Alokasi:** Mengubah *file* `server/api/saldo/settle.post.ts` dan `transfer.post.ts` untuk tidak lagi berstatus "Pending Admin", melainkan langsung mengeksekusi perpindahan dana (*Hit external API*) dan menerapkan logika DB Transaction (Rollback).
4. **Testing di Sandbox:** Uji coba mutasi dana tiruan menggunakan *Test Token* Meta/Google atau lingkungan *Sandbox* VCC.
