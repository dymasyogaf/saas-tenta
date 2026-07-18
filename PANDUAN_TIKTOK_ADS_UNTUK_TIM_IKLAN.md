# Panduan TikTok Ads API untuk Tim Iklan (Marketing)

Halo Tim Iklan! 👋
Untuk melengkapi trinitas (tiga platform utama) pada dasbor SaaS Tentaklik, tim *Developer* (IT) membutuhkan **2 Kunci Penting** dari akun TikTok Ads (TikTok for Business) Anda.

Sama seperti Meta, pengambilannya sangat cepat! Ikuti langkah-langkah di bawah ini dan siapkan *Notepad* untuk menyalin kuncinya.

---

## TAHAP 1: Membuat Aplikasi di Portal Developer TikTok
*Syarat: Anda harus memiliki akses ke akun TikTok for Business (TikTok Ads Manager).*

1. Buka portal [TikTok for Developers](https://ads.tiktok.com/marketing_api/) dan *Login* menggunakan akun TikTok for Business Anda.
2. Di pojok kanan atas, klik gambar profil/nama Anda, lalu pilih **Developer Portal**.
3. Di halaman Dasbor Aplikasi (My Apps), klik tombol biru **Create App (Buat Aplikasi)**.
4. Akan ada beberapa pilihan API. Silakan pilih jenis **Business API**, lalu klik Next.
5. Isi formulir pembuatan aplikasi dengan jujur:
   - *App Name*: Misal, **Tentaklik Ads Sync**
   - *App Description*: Alat sinkronisasi dashboard pelaporan.
   - *App Type*: Pilih **Custom App** atau **Internal App** (tergantung pilihan yang tersedia).
6. Centang syarat & ketentuan, lalu klik **Create (Buat)**.

---

## TAHAP 2: Mendapatkan "Access Token" (Kunci Kuasa)
*Kunci ini adalah surat izin mesin agar dasbor kita bisa membaca jumlah klik dan uang yang dihabiskan.*

1. Setelah aplikasi terbuat, di dasbor aplikasi tersebut, *scroll* ke bawah untuk menemukan bagian pengaturan **Permissions (Izin)**.
2. Pilih izin minimum yang dibutuhkan:
   - `Reporting` (Wajib, untuk menarik data Ad Spend & impresi)
   - `Ads Management` (Opsional, untuk persiapan alokasi dana iklan)
3. Simpan perubahan izin tersebut.
4. Setelah aplikasi disetujui secara otomatis (biasanya instan untuk tipe *Internal/Custom*), carilah tombol bertuliskan **Generate Access Token**.
5. Akan muncul jendela peringatan, setujui. Kemudian akan muncul teks panjang acak.
6. 📝 **COPY** teks super panjang tersebut, pindahkan ke Notepad Anda, lalu beri nama: `TikTok Access Token`.

---

## TAHAP 3: Dapatkan "Advertiser ID" (ID Pengiklan / Akun Iklan)
*Kunci ini memberi tahu sistem kita akun TikTok Ads mana yang spesifik ingin diintip datanya.*

1. Buka halaman utama [TikTok Ads Manager](https://ads.tiktok.com/).
2. Pastikan Anda sedang melihat akun pengiklan (*Advertiser Account*) yang datanya ingin ditampilkan (bukan akun Business Center induknya).
3. Anda bisa menemukan **Nomor ID** ini paling cepat dengan melihat URL (link) di bagian atas peramban Anda. 
4. Di dalam URL tersebut, cari tulisan `aadvid=` diikuti deretan angka. Angka-angka tersebut adalah ID-nya!
   *(Contoh: Jika URL-nya `...&aadvid=123456789123456...`, maka ID Anda adalah `123456789123456`)*
5. 📝 **COPY** angka tersebut ke Notepad. Beri nama: `Advertiser ID`.

---

## 🎯 SELESAI! TAHAP 4: Serahkan ke Tim IT

Cek kembali Notepad Anda. Anda seharusnya sudah memiliki 2 baris data ini:

1. **TikTok Access Token** *(Contoh: a1b2c3d4e5f6...)*
2. **Advertiser ID** *(Contoh: 123456789123456)*

Kirimkan catatan ini kepada Tim Developer (IT) Anda. Terima kasih, Anda baru saja menyelamatkan ribuan jam waktu rekap manual laporan iklan bulanan! 🎉
