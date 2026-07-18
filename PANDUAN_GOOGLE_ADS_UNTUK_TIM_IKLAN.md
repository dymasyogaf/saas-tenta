# Panduan Google Ads API untuk Tim Iklan (Marketing)

Halo Tim Iklan! 👋
Untuk memunculkan data pengeluaran (Ad Spend) dan performa kampanye Google Ads langsung ke dalam dasbor SaaS Tentaklik kita, tim *Developer* (IT) membutuhkan **4 Kunci Rahasia** dari akun Google Ads Anda.

Jangan khawatir, Anda tidak perlu tahu cara *coding* untuk mendapatkan 4 kunci ini. Cukup ikuti panduan klik-demi-klik di bawah ini. Target kita adalah mengumpulkan 4 teks (Kunci) untuk diserahkan ke tim IT. Siapkan *Notepad* untuk menyalin-tempel kuncinya!

---

## TAHAP 1: Mendapatkan "Developer Token" (Kunci 1)
*Syarat: Anda harus masuk menggunakan akun Google yang berstatus sebagai **Manager Account (MCC)** di Google Ads.*

1. Buka [Google Ads Manager](https://ads.google.com/) dan pastikan Anda berada di tingkat akun Induk (MCC).
2. Di menu bagian atas, klik **Alat & Setelan (Tools & Settings)** yang berikon kunci pas.
3. Di bawah menu **Penyiapan (Setup)**, klik **Pusat API (API Center)**.
4. Anda akan diminta mengisi formulir singkat terkait data perusahaan. Isi saja dengan jujur (Kategori: "I'm a tool provider" atau sejenisnya).
5. Setelah formulir di-submit, Anda akan langsung melihat deretan kode bernama **Developer Token** dengan status *Test Account* (ini sudah cukup).
6. 📝 **COPY** token tersebut ke Notepad Anda, beri nama: `Developer Token`.

---

## TAHAP 2: Mendapatkan "Client ID" & "Client Secret" (Kunci 2 & 3)
*Kita akan menggunakan platform Cloud milik Google. Anda bisa masuk dengan akun email yang sama.*

1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Di pojok kiri atas (sebelah tulisan Google Cloud), klik menu *dropdown* proyek, lalu klik **New Project (Proyek Baru)**. Beri nama "SaaS Tentaklik", klik *Create*.
3. Setelah proyek dibuat, ketik di bilah pencarian atas: **"Google Ads API"**. Klik hasil pencariannya, lalu klik tombol biru **Enable (Aktifkan)**.
4. Di menu sebelah kiri, klik **Credentials (Kredensial)**. 
5. *(Jika diminta)* Klik *Configure Consent Screen*, pilih *External*, lalu isi nama aplikasi dan email (isi yang wajib-wajib saja berlambang bintang merah). Simpan hingga selesai.
6. Kembali ke menu **Credentials**, klik tombol **+ CREATE CREDENTIALS** di bagian atas, pilih **OAuth client ID**.
7. Pada pilihan tipe aplikasi (*Application type*), pilih **Desktop App** atau **Web Application** (sama saja).
8. Klik Create/Buat. Akan muncul jendela pop-up yang berisi dua kode penting!
9. 📝 **COPY** kedua kode tersebut ke Notepad Anda, beri nama: `Client ID` dan `Client Secret`.

---

## TAHAP 3: Mendapatkan "Refresh Token" (Kunci 4)
*Ini adalah langkah terakhir untuk mendapatkan surat kuasa agar dasbor kita bebas menarik data iklan kapan saja.*

1. Buka halaman rahasia Google ini: [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Di pojok kanan atas, klik ikon **Gerigi (Settings)**.
3. Centang kotak bertuliskan **Use your own OAuth credentials**.
4. Tempelkan `Client ID` dan `Client Secret` dari Notepad Anda tadi ke dalam dua kolom yang muncul. Klik *Close*.
5. Di menu sisi kiri (Step 1), abaikan daftarnya, langsung *scroll* ke paling bawah. Masukkan teks ini persis ke kolom input *Input your own scopes*: 
   `https://www.googleapis.com/auth/adwords`
6. Klik tombol biru **Authorize APIs**.
7. Anda akan diarahkan ke halaman login Google. Login dengan akun email yang mengelola Google Ads Anda. Izinkan/Setujui semua peringatan (Continue/Allow).
8. Anda akan dikembalikan ke Playground tadi. Di menu sebelah kiri (Step 2), klik tombol **Exchange authorization code for tokens**.
9. Voila! Di layar sebelah kanan, Anda akan melihat baris kode bertuliskan `"refresh_token": "...."`.
10. 📝 **COPY** teks token panjang itu (tanpa tanda kutipnya) ke Notepad, beri nama: `Refresh Token`.

---

## 🎯 SELESAI! TAHAP 4: Serahkan ke Tim IT

Sekarang lihat Notepad Anda. Anda seharusnya sudah memiliki 4 baris data berikut beserta 1 data tambahan:

1. **Developer Token** *(Contoh: aBcDeF123456)*
2. **Client ID** *(Contoh: 123456.apps.googleusercontent.com)*
3. **Client Secret** *(Contoh: GOCSPX-abc1234)*
4. **Refresh Token** *(Contoh: 1//0eF...)*
5. **Customer ID (ID Akun Iklan)**: Minta Tim Iklan menuliskan 10 digit angka ID akun iklan spesifik yang datanya ingin dimunculkan (Contoh: `123-456-7890` atau `1234567890`).

Kirimkan catatan ini ke Tim Developer (IT). Pekerjaan Tim Iklan sudah selesai! 🎉
