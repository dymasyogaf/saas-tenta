# Panduan Meta Ads API untuk Tim Iklan (Marketing)

Halo Tim Iklan! 👋
Sama halnya seperti Google, untuk menarik data pengeluaran (Ad Spend) Facebook & Instagram Ads langsung ke dalam dasbor SaaS Tentaklik, tim *Developer* (IT) membutuhkan **2 Kunci Penting** dari akun Meta (Facebook) Anda.

Kabar baiknya, proses di Meta jauh lebih sederhana daripada Google! Siapkan aplikasi *Notepad* untuk menyalin-tempel kuncinya. Ikuti panduan klik-demi-klik di bawah ini.

---

## TAHAP 1: Membuat Aplikasi di Meta Developer
*Syarat: Anda harus masuk menggunakan akun Facebook yang mengelola halaman atau akun iklan perusahaan (Business Manager).*

1. Buka [developers.facebook.com](https://developers.facebook.com/) dan *Login* menggunakan akun Facebook Anda.
2. Di pojok kanan atas, klik tombol **My Apps (Aplikasi Saya)**, lalu klik tombol hijau **Create App (Buat Aplikasi)**.
3. Pada pilihan jenis aplikasi, pilih **Other (Lainnya)** ➔ lalu klik Next (Selanjutnya).
4. Pilih **Business (Bisnis)** ➔ lalu klik Next (Selanjutnya).
5. Beri nama aplikasi Anda (misal: *Tentaklik Ads Sync*), isi email kontak, lalu pilih *Business Account* Anda (jika ada). Klik **Create app (Buat aplikasi)**.
*(Jika dimintai kata sandi Facebook, masukkan untuk konfirmasi keamanan).*

---

## TAHAP 2: Mendapatkan "Access Token" (Kunci Utama)
*Kunci ini adalah surat kuasa agar sistem kita bisa membaca data iklan.*

1. Setelah aplikasi terbuat, Anda akan dialihkan ke halaman Dasbor Aplikasi. *Scroll* ke bawah dan cari kotak bertuliskan **Marketing API**.
2. Klik tombol **Set up (Siapkan)** pada kotak Marketing API tersebut.
3. Lihat menu navigasi di sisi kiri layar. Di bawah menu *Marketing API*, klik tulisan **Tools (Alat)**.
4. Di bagian *Select Token Permissions (Pilih Izin)*, beri tanda centang pada dua kotak berikut:
   - `ads_read` *(Agar dasbor bisa membaca data pengeluaran dan impresi iklan)*
   - `ads_management` *(Disiapkan untuk fitur top-up/alokasi saldo dari dasbor)*
5. Klik tombol biru **Get Token (Dapatkan Token)**.
6. Akan muncul sebuah rentetan teks acak yang sangat panjang (dimulai dengan huruf `EAA...`).
7. 📝 **COPY** teks super panjang tersebut, pindahkan ke Notepad Anda, lalu beri nama: `Meta Access Token`.

---

## TAHAP 3: Dapatkan "ID Akun Iklan" (Ad Account ID)
*Kunci ini memberi tahu sistem kita akun iklan mana yang spesifik ingin kita tampilkan.*

1. Buka [Meta Ads Manager](https://adsmanager.facebook.com/).
2. Pastikan Anda sedang melihat akun iklan yang benar (cek nama bisnis di pojok kiri atas).
3. Anda bisa menemukan **Nomor ID** akun iklan Anda di ujung nama akun (contoh: *Nama Bisnis (123456789)*), atau dengan melihat URL bar peramban (contoh: `act=123456789`).
4. 📝 **COPY** angka tersebut ke Notepad, dan pastikan menambahkan awalan `act_` di depannya. 
   *(Contoh: Jika angkanya `123456789`, maka format yang benar adalah `act_123456789`)*.
5. Beri nama di Notepad: `Ad Account ID`.

---

## 🎯 SELESAI! TAHAP 4: Serahkan ke Tim IT

Lihat kembali Notepad Anda. Anda seharusnya sudah memiliki 2 baris data ini:

1. **Meta Access Token** *(Contoh: EAABx3...)*
2. **Ad Account ID** *(Contoh: act_1234567890)*

Tolong kirimkan kedua baris kunci tersebut ke Tim Developer (IT). Pekerjaan Tim Iklan untuk platform Meta Ads sudah beres! 🎉
