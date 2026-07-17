Untuk memulai pengembangan platform SaaS Tentaklik Anda menggunakan *stack* Nuxt 3 (Vue) dan Supabase dengan *deployment* di Cloudflare, Anda bisa membagi tahap persiapannya menjadi beberapa fase. Berikut adalah daftar persiapan teknis yang perlu Anda lakukan berdasarkan sumber yang ada:

**Fase 1: Registrasi Akun & Persiapan API Pihak Ketiga**
Langkah pertama adalah mengamankan akses ke seluruh layanan eksternal yang akan digunakan oleh sistem Anda.
*   **Layanan OTP (Message Central):** Daftar ke platform Message Central (VerifyNow) untuk mendapatkan akses API atau *drop-in SDK* pengiriman OTP multi-saluran (SMS/WhatsApp). Anda bisa memanfaatkan kredit pengujian gratis tanpa memerlukan kartu kredit untuk uji coba awal. Waktu integrasinya diperkirakan hanya memakan waktu beberapa jam hingga satu hari.
*   **API Meta (Facebook/Instagram Ads):** Masuk ke situs Facebook Developers dan buat **Facebook Business App**. Anda perlu mengatur izin (*permissions*) seperti `ads_read` atau `ads_management` dan menghasilkan *access token* (disarankan membuat *long-lived token* yang bertahan sekitar tiga bulan).
*   **API TikTok Ads:** Kunjungi Beranda API for Business TikTok dan daftarkan diri Anda sebagai developer untuk mendapatkan akses ke endpoint Marketing API mereka.
*   **API Google Ads:** Siapkan proyek di Konsol API Google (Google Cloud) untuk mengatur otorisasi OAuth 2.0 dan dapatkan token developer Anda.
*   **Payment Gateway (Xendit/Pivot):** Buat akun secara gratis (misalnya di Xendit prosesnya hanya memakan waktu sekitar 5 menit) agar Anda mendapatkan kunci API untuk fitur pembayaran otomatis dan manajemen *Virtual Account*.

**Fase 2: Inisialisasi Proyek & Migrasi Frontend**
Karena Anda sudah memiliki aset desain (*mockup* HTML dengan Tailwind), Anda bisa langsung menerapkannya:
*   **Setup Proyek Nuxt 3:** Buat proyek Nuxt 3 baru. *Framework* ini akan sangat menguntungkan karena *engine server* bawaannya (Nitro) mendukung *deployment* ke Cloudflare dengan konfigurasi nol (*zero config*). 
*   **Instalasi Library Utama:** Pasang *library* pendukung yang direkomendasikan untuk *stack* ini, seperti **Pinia** (untuk manajemen *state* seperti data user dan saldo), **@nuxtjs/supabase** (modul resmi Supabase untuk Nuxt), **VeeValidate + Zod** (untuk validasi formulir), serta **ApexCharts** atau **Chart.js** (untuk visualisasi performa iklan di dasbor).
*   **Migrasi Mockup:** Pindahkan kode *mockup* HTML Anda ke dalam struktur Nuxt. Pisahkan bagian *layout* (seperti *sidebar* dan *header*) ke dalam file `layouts/dashboard.vue`, dan buat halaman-halaman individual di folder `pages/dashboard/*.vue`. Struktur *class* Tailwind dari *mockup* Anda akan sepenuhnya kompatibel saat disalin-tempel.

**Fase 3: Konfigurasi Database & Keamanan Backend (Supabase)**
*   **Setup Supabase:** Buat proyek di Supabase. Anda bisa memulai dengan *free tier* yang memberikan kapasitas memadai untuk awal MVP (50K pengguna aktif bulanan, 500MB database, 1GB storage).
*   **Amankan API Keys:** Ini sangat krusial. Kunci API untuk Google, Meta, TikTok, dan Xendit **tidak boleh** diekspos di kode *frontend*. Anda harus membuat **Server Routes** di direktori `/server/api/` Nuxt 3, atau menggunakan **Edge Functions** dari Supabase. Fitur ini akan bertindak sebagai *proxy backend* untuk memproses logika bisnis dan menyembunyikan API key dengan aman.

**Fase 4: Deployment Awal**
*   **Siapkan Cloudflare:** Buat akun Cloudflare dan hubungkan repositori proyek (seperti GitHub/GitLab) ke Cloudflare Pages atau Workers. Dengan begini, setiap kali Anda menyimpan dan mendorong (*push*) kode, sistem dasbor Anda akan otomatis ter-*deploy*.
