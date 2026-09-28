# 07. Troubleshooting & Known Gotchas

Daftar masalah nyata yang sering ditemui beserta solusinya.

---

## ⚡ 1. Error "CSRF Token Invalid" saat Klik Tombol

### Gejala
Muncul popup error `"CSRF Token Invalid"` atau HTTP 403 Forbidden saat mengklik tombol submit di frontend.

### Penyebab
Composable `useCsrf()` mengembalikan Vue reactive `Ref<string>`. Jika dilewatkan langsung ke header tanpa di-`unref()`, JavaScript mengubahnya menjadi string `"[object Object]"`.

### Solusi

```ts
// ❌ SALAH — menyebabkan CSRF error:
const { csrf } = useCsrf()
await $fetch('/api/data', {
  method: 'POST',
  headers: { 'csrf-token': csrf }
})

// ✅ BENAR — selalu unref() dulu:
import { unref } from 'vue'
const { csrf } = useCsrf()
const csrfToken = unref(csrf) || ''

await $fetch('/api/data', {
  method: 'POST',
  headers: csrfToken ? { 'csrf-token': csrfToken } : {},
  body: payload
})
```

---

## ⚡ 2. Supabase Auth Gagal Total di Cloudflare (Error `{}`)

### Gejala
Login berfungsi normal di `localhost:3000`, namun gagal total setelah di-deploy ke Cloudflare Pages. Error yang muncul di konsol hanya objek kosong `{}`.

### Penyebab
Supabase membutuhkan modul crypto Node.js yang tidak aktif secara default di Cloudflare Edge runtime.

### Solusi

**Pastikan `wrangler.toml` mengandung:**
```toml
compatibility_flags = ["nodejs_compat"]
```

**Dan di Cloudflare Dashboard:**
*Pages → Project → Settings → Functions → Compatibility Flags*
→ Tambahkan `nodejs_compat` untuk Production **dan** Preview environment.

---

## ⚡ 3. Webhook Payment Gateway Ditolak (403 Forbidden)

### Gejala
Duitku atau NOWPayments memanggil endpoint webhook, namun selalu mendapat respon 403 Forbidden.

### Penyebab
Modul `nuxt-security` (CSRF) memblokir semua request POST yang tidak membawa cookie CSRF dari browser.

### Solusi
Pastikan rute webhook ada di `routeRules` dengan `csurf: false` di `nuxt.config.ts`:

```ts
routeRules: {
  '/api/**': {
    csurf: false // Aman karena diverifikasi via HMAC/MD5 signature
  }
}
```

---

## ⚡ 4. Cara Debug Webhook di Lokal (ngrok)

### Masalah
Server Duitku/NOWPayments tidak bisa menjangkau `localhost` — IP lokal tidak accessible dari internet.

### Solusi: Gunakan Tunneling (ngrok)

```bash
# Install & jalankan tunnel ke port Nuxt
npx ngrok http 3000

# Anda akan mendapat URL publik sementara, misalnya:
# https://a1b2-c3d4.ngrok-free.app
```

Set URL ini sebagai Callback/IPN di portal gateway:
- Duitku: `https://a1b2-c3d4.ngrok-free.app/api/duidku/callback`
- NOWPayments: `https://a1b2-c3d4.ngrok-free.app/api/nowpayments/webhook`

---

## ⚡ 5. Format ID Akun Google Ads Salah → Data Tidak Ditemukan

### Gejala
API Google Ads error `CUSTOMER_NOT_FOUND` atau query ke `public.ad_accounts` tidak menemukan baris.

### Penyebab
ID yang disalin dari dashboard mengandung strip/dash: `613-334-6743`.

### Solusi
Bersihkan sebelum simpan atau kirim ke API:
```ts
const cleanId = rawId.replace(/\D/g, '') // → '6133346743'
```

---

## ⚡ 6. Meta Access Token Kedaluwarsa (Error Code 190)

### Gejala
Sinkronisasi spend/akun Meta tiba-tiba berhenti dan muncul `OAuthException 190: Error validating access token`.

### Penyebab
Menggunakan Personal User Token (berlaku hanya 60 hari) yang telah expired.

### Solusi
1. Buat **System User** di Meta Business Manager.
2. Beri role Admin dan sematkan semua aset Ad Account yang dikelola.
3. Generate **System User Token** dengan masa berlaku **Never Expires**.
4. Update `NUXT_META_ACCESS_TOKEN` di Cloudflare Pages Dashboard dan di `.env` lokal.

---

## ⚡ 7. Saldo Tertukar antara IDR dan USD

### Gejala
User di `area.tentaklik.com` melihat saldo Rupiah, atau sebaliknya.

### Penyebab
Lupa memeriksa `appMode` dari `useAppMode()` sebelum menentukan kolom saldo mana yang dipakai.

### Panduan Isolasi Saldo yang Benar

| Kondisi | Kolom yang Dipakai |
|:---|:---|
| Mode `local` (IDR / member.) | `saldo.balance` & `saldo.pending_balance` |
| Mode `global` (USD / area.) | `saldo.usd_balance` & `saldo.usd_pending_balance` |
| Mutasi transaksi IDR | `transactions.currency = 'IDR'` |
| Mutasi transaksi USD | `transactions.currency = 'USD'` |

Selalu mulai logika dengan:
```ts
const { appMode } = useAppMode()
const isGlobal = appMode.value === 'global'
```
