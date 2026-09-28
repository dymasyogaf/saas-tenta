# 04. Third-Party Integrations

---

## 1. 💳 Payment Gateways

### A. Duitku — Pasar Domestik (IDR)
- **Domain**: `member.tentaklik.com`
- **Metode**: Virtual Account (BCA, Mandiri, BNI, BRI, Permata), QRIS, E-Wallet (OVO, DANA, ShopeePay)
- **Direktori**: `server/api/duidku/`

#### Alur Pembayaran Duitku
```
[User request topup]
      │
      ▼
server/api/duidku/create-payment.post.ts
  → Hitung signature: MD5(merchantCode + orderId + amount + apiKey)
  → POST ke Duitku API → dapat paymentUrl / nomor VA
  → Simpan transaksi di public.transactions (status: 'pending')
      │
      ▼ (User melakukan pembayaran di bank / e-wallet)
      │
      ▼
server/api/duidku/callback.post.ts (Webhook dari Duitku)
  → Verifikasi signature: MD5(merchantCode + amount + orderId + apiKey)
  → Jika valid & lunas (resultCode === '00'):
      → Update transactions → 'success'
      → Tambah saldo: public.saldo.balance += amount
      → Kirim notifikasi WhatsApp via Fonnte
      → Hitung komisi referral (jika ada)
```

#### File Penting
| File | Fungsi |
|:---|:---|
| `create-payment.post.ts` | Membuat invoice & mendapatkan VA/QRIS dari Duitku |
| `callback.post.ts` | Webhook IPN — update saldo setelah pembayaran sukses |
| `check-status.get.ts` | Polling manual status transaksi |
| `create-subscription.post.ts` | Pembuatan invoice khusus paket berlangganan |

---

### B. NOWPayments — Pasar Global (USDT TRC-20)
- **Domain**: `area.tentaklik.com`
- **Mata Uang**: USDT (TRC-20 Network) / USD — Paritas 1:1
- **Direktori**: `server/api/nowpayments/`

#### Alur Pembayaran Crypto
```
[User request topup USDT]
      │
      ▼
server/api/nowpayments/create-payment.post.ts
  → POST ke NOWPayments API (pay_currency: 'usdttrc20')
  → Dapat wallet address unik & jumlah exact yang harus dikirim
  → Simpan transaksi di public.transactions (currency: 'USD', status: 'pending')
      │
      ▼ (User transfer USDT ke wallet address)
      │
      ▼
server/api/nowpayments/webhook.post.ts (IPN dari NOWPayments)
  → Verifikasi signature HMAC-SHA512 dari header x-nowpayments-sig
    (sorted JSON body + IPN Secret Key)
  → Jika payment_status === 'finished' atau 'confirmed':
      → Update transactions → 'success'
      → Tambah saldo: public.saldo.usd_balance += amount
```

> **Catatan**: Pembayaran crypto bisa memakan waktu 10–60 menit untuk konfirmasi jaringan TRC-20. Sistem menunggu status `finished` dari NOWPayments sebelum mengkreditkan saldo.

---

## 2. 📢 Ad Platform APIs

Direktori: `server/api/ads/`

### A. Meta Marketing API (Facebook & Instagram Ads)
- **Auth**: Long-lived **System User Access Token** (bukan Personal User Token — mudah expired).
- **Scope yang dibutuhkan**: `ads_read`, `ads_management`, `business_management`
- **Fungsi**:
  - Ambil daftar Ad Accounts di bawah Business Manager agensi.
  - Baca metrik: `spend`, `impressions`, `cpc`, `ctr`.
  - Atur / baca `Daily Spend Limit` / `Account Spend Cap`.
  - Auto-pause kampanye jika saldo klien habis.

> **Token Maintenance**: Gunakan System User Token (tidak kedaluwarsa). Jangan pakai personal access token yang expire dalam 60 hari.

---

### B. Google Ads API
- **Auth**: OAuth 2.0 (Client ID, Client Secret, Refresh Token) + Developer Token dari Google Ads MCC.
- **Fungsi**:
  - Hubungkan Client Accounts ke Manager Account (MCC).
  - Sinkronisasi nama akun resmi & status kepatuhan iklan.
  - Baca data belanja kampanye.

> **Aturan ID Akun**: ID Google Ads **hanya berupa angka murni**, tanpa strip/dash.
> - ✅ Benar: `6133346743`
> - ❌ Salah: `613-334-6743`

---

### C. TikTok Ads API
- **Auth**: Access Token dari TikTok for Business Developer App.
- **Fungsi**: Kelola akun di TikTok Business Center, monitoring status & saldo akun.
- **Feature Flag**: TikTok Ads bisa diaktifkan/dinonaktifkan via `tiktokAdsEnabled` di `nuxt.config.ts`.

---

## 3. 📱 WhatsApp OTP & Notifikasi — Fonnte

- **Direktori**: `server/api/otp/`
- **Endpoint API Fonnte**: `https://api.fonnte.com/send`
- **Header Auth**: `Authorization: <TOKEN_FONNTE>`

### Use Cases
| Kasus | Keterangan |
|:---|:---|
| **Verifikasi Registrasi** | Kirim OTP 6 digit ke nomor WA baru, berlaku 5 menit |
| **2FA Login** | Setelah login berhasil, tahan sesi dan minta OTP WA di `/verify-2fa` |
| **Notifikasi Transaksi** | Alert saat topup sukses, akun disetujui, atau tiket dijawab |

---

## 4. 🔔 Web Push Notification (VAPID)

- **Library**: `@block65/webcrypto-web-push` (kompatibel Cloudflare Workers/Edge).
- **Tabel**: `public.push_subscriptions` — menyimpan `endpoint`, `p256dh`, dan `auth` per pengguna.

### Alur
1. Frontend meminta izin push: `Notification.requestPermission()`.
2. Browser membuat Subscription Token.
3. Frontend kirim token ke server untuk disimpan di database.
4. Backend push notifikasi saat ada update tiket, peringatan saldo menipis, atau pengumuman broadcast.

> **Generate VAPID Key Baru**: `npx web-push generate-vapid-keys`
