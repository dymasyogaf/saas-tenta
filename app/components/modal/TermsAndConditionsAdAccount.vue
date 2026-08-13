<template>
  <div class="space-y-4">
    <template v-if="$i18n.locale === 'id'">
      <h5 class="font-bold text-sm">1. Definisi</h5>
      <p><strong>1.1 Tentaklik Ads Platform</strong><br/>Tentaklik Ads Platform adalah platform milik Tentaklik yang digunakan oleh Pengguna untuk mengelola layanan periklanan digital, termasuk pengajuan akun iklan, top up saldo, monitoring saldo, histori transaksi, bantuan tiket, serta layanan lainnya yang disediakan oleh Tentaklik.</p>
      <p><strong>1.2 Ads Account</strong><br/>Ads Account adalah akun iklan Meta Ads maupun Google Ads yang disediakan atau dikelola oleh Tentaklik dan diberikan kepada Pengguna melalui Dashboard Tentaklik sesuai dengan layanan yang dipilih.</p>
      <p><strong>1.3 Ad Credit</strong><br/>Ad Credit adalah saldo iklan yang tersedia pada Ads Account berdasarkan Dana Top Up yang telah dibayarkan oleh Pengguna dan digunakan untuk aktivitas periklanan.</p>
      <p><strong>1.4 Dana Top Up</strong><br/>Dana Top Up adalah sejumlah dana yang dibayarkan oleh Pengguna kepada Tentaklik untuk dikonversikan menjadi saldo iklan pada Ads Account.</p>
      <p><strong>1.5 Dashboard</strong><br/>Dashboard adalah halaman akun milik Pengguna pada sistem Tentaklik yang digunakan untuk mengakses seluruh layanan Tentaklik, termasuk namun tidak terbatas pada:<br/>- Dashboard Statistik<br/>- Platform Iklan<br/>- Saldo Iklan<br/>- Riwayat Top Up<br/>- Akun Tambahan<br/>- Akun Pengganti<br/>- Bantuan Tiket</p>
      <p><strong>1.6 Platform Iklan</strong><br/>Platform Iklan adalah halaman pada Dashboard Tentaklik yang digunakan Pengguna untuk mengajukan, mengaktifkan, maupun mengelola layanan Ads Account yang disediakan oleh Tentaklik.</p>
      <p><strong>1.7 Saldo Iklan</strong><br/>Saldo Iklan adalah halaman Dashboard yang menampilkan informasi saldo aktif, penggunaan saldo, limit akun, histori top up, histori akun tambahan, serta histori akun pengganti.</p>
      <p><strong>1.8 Platform Pengiklanan Digital</strong><br/>Platform Pengiklanan Digital adalah penyedia layanan iklan digital yang didukung oleh Tentaklik, termasuk:<br/>- Meta Ads<br/>- Google Ads<br/>serta platform lain yang dapat ditambahkan di kemudian hari.</p>

      <hr class="border-ink-200 my-4" />
      
      <h5 class="font-bold text-sm">2. Layanan Tentaklik Ads</h5>
      <p class="font-semibold">2.1 Ruang Lingkup Layanan</p>
      <p>Tentaklik menyediakan layanan digital advertising yang meliputi namun tidak terbatas pada:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Penyediaan Ads Account Meta Ads.</li>
        <li>Penyediaan Ads Account Google Ads.</li>
        <li>Penyewaan Ads Account.</li>
        <li>Top Up saldo iklan.</li>
        <li>Monitoring saldo iklan melalui Dashboard.</li>
        <li>Monitoring penggunaan akun.</li>
        <li>Penyediaan akun pengganti sesuai ketentuan.</li>
        <li>Penyediaan akun tambahan sesuai persetujuan Tentaklik.</li>
        <li>Bantuan teknis melalui Ticket Support maupun Customer Support.</li>
      </ul>
      
      <p class="font-semibold mt-4">2.2 Dashboard Tentaklik</p>
      <p>Melalui Dashboard Tentaklik Pengguna dapat:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Melihat Total Saldo Aktif.</li>
        <li>Melihat Total Ad Spend.</li>
        <li>Melihat jumlah akun iklan aktif.</li>
        <li>Mengajukan Ads Account.</li>
        <li>Melakukan Top Up saldo.</li>
        <li>Menambahkan akun baru.</li>
        <li>Melihat histori transaksi.</li>
        <li>Melihat histori akun pengganti.</li>
        <li>Mengajukan bantuan melalui Ticket Support.</li>
      </ul>
      
      <p class="font-semibold mt-4">2.3 Persetujuan Layanan</p>
      <p>Dengan membuat akun pada sistem Tentaklik maupun menggunakan layanan Tentaklik, Pengguna dianggap telah membaca, memahami, dan menyetujui seluruh Syarat &amp; Ketentuan yang berlaku.</p>

      <hr class="border-ink-200 my-4" />
      
      <h5 class="font-bold text-sm">3. Tanggung Jawab Tentaklik</h5>
      <p>Tentaklik akan:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Menyediakan Dashboard yang dapat diakses oleh Pengguna.</li>
        <li>Menyediakan Ads Account sesuai paket layanan.</li>
        <li>Memproses Top Up saldo sesuai pembayaran yang diterima.</li>
        <li>Memberikan bantuan teknis selama masa penggunaan layanan.</li>
        <li>Memberikan akun pengganti apabila Ads Account mengalami disable akibat kesalahan teknis platform dan bukan disebabkan oleh pelanggaran Pengguna.</li>
        <li>Memindahkan saldo yang memenuhi ketentuan ke akun pengganti apabila memungkinkan sesuai kebijakan platform.</li>
      </ul>
      <p class="mt-2">Tentaklik berhak melakukan penghentian sementara maupun permanen terhadap layanan apabila ditemukan pelanggaran terhadap kebijakan Platform Pengiklanan Digital maupun ketentuan Tentaklik.</p>

      <hr class="border-ink-200 my-4" />
      
      <h5 class="font-bold text-sm">4. Tanggung Jawab Pengguna</h5>
      <p>Pengguna wajib:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Menjaga keamanan akun Dashboard.</li>
        <li>Menjaga kerahasiaan akses login.</li>
        <li>Menggunakan Ads Account sesuai kebijakan Meta maupun Google.</li>
        <li>Menggunakan Landing Page yang sesuai dengan URL yang telah didaftarkan.</li>
        <li>Melaporkan perubahan domain kepada Tentaklik.</li>
        <li>Bertanggung jawab penuh atas materi iklan, Landing Page, website, serta aktivitas periklanan yang dilakukan.</li>
      </ul>

      <hr class="border-ink-200 my-4" />
      
      <h5 class="font-bold text-sm">5. Akun Tambahan dan Akun Pengganti</h5>
      <p class="font-semibold">5.1 Akun Tambahan</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Pengguna dapat mengajukan penambahan Ads Account melalui Dashboard Tentaklik.</li>
        <li>Persetujuan penambahan akun sepenuhnya menjadi kewenangan Tentaklik dengan mempertimbangkan:<br/>
            - Riwayat penggunaan akun.<br/>
            - Kepatuhan terhadap kebijakan platform.<br/>
            - Aktivitas iklan.<br/>
            - Kebutuhan operasional Pengguna.</li>
      </ul>
      
      <p class="font-semibold mt-4">5.2 Akun Pengganti</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Apabila Ads Account mengalami disable yang bukan disebabkan oleh pelanggaran Pengguna, Tentaklik dapat menyediakan akun pengganti.</li>
        <li>Saldo iklan yang masih tersedia akan dipindahkan sesuai kebijakan platform dan ketentuan Tentaklik.</li>
      </ul>

      <hr class="border-ink-200 my-4" />

      <h5 class="font-bold text-sm">6. Biaya Layanan</h5>
      <p class="font-semibold">6.1 Biaya Sewa Ads Account</p>
      <div class="overflow-x-auto mt-2 mb-4">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-ink-200">
              <th class="py-2 font-semibold">Periode</th>
              <th class="py-2 font-semibold text-right">Biaya</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-ink-100">
              <td class="py-2">1 Bulan</td>
              <td class="py-2 text-right">Rp150.000</td>
            </tr>
            <tr class="border-b border-ink-100">
              <td class="py-2">3 Bulan</td>
              <td class="py-2 text-right">Rp350.000</td>
            </tr>
            <tr class="border-b border-ink-100">
              <td class="py-2">6 Bulan</td>
              <td class="py-2 text-right">Rp792.000</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <p class="font-semibold mt-4">6.2 Fee Top Up</p>
      <div class="overflow-x-auto mt-2 mb-4">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-ink-200">
              <th class="py-2 font-semibold">Nominal Top Up</th>
              <th class="py-2 font-semibold text-right">Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-ink-100">
              <td class="py-2">Rp300.000 – Rp5.000.000</td>
              <td class="py-2 text-right">5%</td>
            </tr>
            <tr class="border-b border-ink-100">
              <td class="py-2">Rp5.000.000 – Rp15.000.000</td>
              <td class="py-2 text-right">4,5%</td>
            </tr>
            <tr class="border-b border-ink-100">
              <td class="py-2">Di atas Rp15.000.000</td>
              <td class="py-2 text-right">3,5%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="font-semibold mt-4">6.3 Ketentuan Top Up</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Minimal Top Up pertama Rp300.000.</li>
        <li>Minimal Top Up berikutnya Rp300.000.</li>
        <li>Saldo diupayakan mencukupi estimasi kebutuhan iklan selama 7 hari.</li>
        <li>Top Up diproses setelah pembayaran dikonfirmasi.</li>
        <li>Dana Top Up tidak dapat direfund, kecuali digunakan untuk beriklan.</li>
      </ul>
    </template>
    
    <template v-else>
      <h5 class="font-bold text-sm">1. Definitions</h5>
      <p><strong>1.1 Tentaklik Ads Platform</strong><br/>Tentaklik Ads Platform is a platform owned by Tentaklik used by Users to manage digital advertising services, including ad account requests, balance top-ups, balance monitoring, transaction history, ticket support, and other services provided by Tentaklik.</p>
      <p><strong>1.2 Ads Account</strong><br/>Ads Account is a Meta Ads or Google Ads advertising account provided or managed by Tentaklik and given to the User through the Tentaklik Dashboard according to the selected service.</p>
      <p><strong>1.3 Ad Credit</strong><br/>Ad Credit is the advertising balance available in the Ads Account based on the Top Up Funds paid by the User and used for advertising activities.</p>
      <p><strong>1.4 Top Up Funds</strong><br/>Top Up Funds are the amount of funds paid by the User to Tentaklik to be converted into advertising balance in the Ads Account.</p>
      <p><strong>1.5 Dashboard</strong><br/>
Dashboard is the User's account page in the Tentaklik system used to access all Tentaklik services, including but not limited to:<br/>
- Statistics Dashboard<br/>
- Advertising Platforms<br/>
- Ad Balance<br/>
- Top Up History<br/>
- Additional Accounts<br/>
- Replacement Accounts<br/>
- Ticket Support</p>
      <p><strong>1.6 Advertising Platform</strong><br/>Advertising Platform is the page on the Tentaklik Dashboard used by Users to request, activate, or manage the Ads Account services provided by Tentaklik.</p>
      <p><strong>1.7 Ad Balance</strong><br/>Ad Balance is the Dashboard page displaying information on active balance, balance usage, account limits, top-up history, additional account history, and replacement account history.</p>
      <p><strong>1.8 Digital Advertising Platform</strong><br/>Digital Advertising Platform is a digital advertising service provider supported by Tentaklik, including:<br/>- Meta Ads<br/>- Google Ads<br/>and other platforms that may be added in the future.</p>

      <hr class="border-ink-200 my-4" />
      
      <h5 class="font-bold text-sm">2. Tentaklik Ads Services</h5>
      <p class="font-semibold">2.1 Scope of Services</p>
      <p>Tentaklik provides digital advertising services which include but are not limited to:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Provision of Meta Ads Accounts.</li>
        <li>Provision of Google Ads Accounts.</li>
        <li>Ads Account Rental.</li>
        <li>Ad balance Top Up.</li>
        <li>Ad balance monitoring through the Dashboard.</li>
        <li>Account usage monitoring.</li>
        <li>Provision of replacement accounts according to terms.</li>
        <li>Provision of additional accounts subject to Tentaklik's approval.</li>
        <li>Technical assistance via Ticket Support and Customer Support.</li>
      </ul>
      
      <p class="font-semibold mt-4">2.2 Tentaklik Dashboard</p>
      <p>Through the Tentaklik Dashboard, Users can:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>View Total Active Balance.</li>
        <li>View Total Ad Spend.</li>
        <li>View the number of active ad accounts.</li>
        <li>Request an Ads Account.</li>
        <li>Top Up balance.</li>
        <li>Add a new account.</li>
        <li>View transaction history.</li>
        <li>View replacement account history.</li>
        <li>Request assistance via Ticket Support.</li>
      </ul>
      
      <p class="font-semibold mt-4">2.3 Service Agreement</p>
      <p>By creating an account on the Tentaklik system or using Tentaklik services, the User is deemed to have read, understood, and agreed to all applicable Terms &amp; Conditions.</p>

      <hr class="border-ink-200 my-4" />
      
      <h5 class="font-bold text-sm">3. Tentaklik Responsibilities</h5>
      <p>Tentaklik will:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Provide a Dashboard accessible to the User.</li>
        <li>Provide an Ads Account according to the selected service package.</li>
        <li>Process balance Top Ups according to payments received.</li>
        <li>Provide technical assistance during the service usage period.</li>
        <li>Provide a replacement account if the Ads Account is disabled due to platform technical errors and not caused by User violations.</li>
        <li>Transfer eligible balances to a replacement account if possible according to platform policies.</li>
      </ul>
      <p class="mt-2">Tentaklik reserves the right to temporarily or permanently suspend services if violations of the Digital Advertising Platform policies or Tentaklik terms are found.</p>

      <hr class="border-ink-200 my-4" />
      
      <h5 class="font-bold text-sm">4. User Responsibilities</h5>
      <p>The User must:</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Maintain the security of the Dashboard account.</li>
        <li>Keep login access confidential.</li>
        <li>Use the Ads Account in accordance with Meta and Google policies.</li>
        <li>Use a Landing Page that matches the registered URL.</li>
        <li>Report any domain changes to Tentaklik.</li>
        <li>Be fully responsible for advertising materials, Landing Pages, websites, and advertising activities conducted.</li>
      </ul>

      <hr class="border-ink-200 my-4" />
      
      <h5 class="font-bold text-sm">5. Additional and Replacement Accounts</h5>
      <p class="font-semibold">5.1 Additional Accounts</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>Users can request additional Ads Accounts through the Tentaklik Dashboard.</li>
        <li>Approval for additional accounts is entirely at Tentaklik's discretion, taking into account:<br/>
            - Account usage history.<br/>
            - Compliance with platform policies.<br/>
            - Advertising activities.<br/>
            - User's operational needs.</li>
      </ul>
      
      <p class="font-semibold mt-4">5.2 Replacement Accounts</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>If an Ads Account is disabled not due to a User violation, Tentaklik may provide a replacement account.</li>
        <li>Any remaining ad balance will be transferred according to platform policies and Tentaklik terms.</li>
      </ul>

      <hr class="border-ink-200 my-4" />

      <h5 class="font-bold text-sm">6. Service Fees</h5>
      <p class="font-semibold">6.1 Ads Account Rental Fee</p>
      <div class="overflow-x-auto mt-2 mb-4">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-ink-200">
              <th class="py-2 font-semibold">Period</th>
              <th class="py-2 font-semibold text-right">Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-ink-100">
              <td class="py-2">1 Month</td>
              <td class="py-2 text-right">Rp150,000</td>
            </tr>
            <tr class="border-b border-ink-100">
              <td class="py-2">3 Months</td>
              <td class="py-2 text-right">Rp350,000</td>
            </tr>
            <tr class="border-b border-ink-100">
              <td class="py-2">6 Months</td>
              <td class="py-2 text-right">Rp792,000</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <p class="font-semibold mt-4">6.2 Top Up Fee</p>
      <div class="overflow-x-auto mt-2 mb-4">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-ink-200">
              <th class="py-2 font-semibold">Top Up Amount</th>
              <th class="py-2 font-semibold text-right">Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-ink-100">
              <td class="py-2">Rp300,000 – Rp5,000,000</td>
              <td class="py-2 text-right">5%</td>
            </tr>
            <tr class="border-b border-ink-100">
              <td class="py-2">Rp5,000,000 – Rp15,000,000</td>
              <td class="py-2 text-right">4.5%</td>
            </tr>
            <tr class="border-b border-ink-100">
              <td class="py-2">Above Rp15,000,000</td>
              <td class="py-2 text-right">3.5%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="font-semibold mt-4">6.3 Top Up Terms</p>
      <ul class="list-disc pl-4 space-y-1">
        <li>The minimum first Top Up is Rp300,000.</li>
        <li>Subsequent Top Ups are a minimum of Rp300,000.</li>
        <li>Balances should ideally be sufficient for an estimated advertising need of 7 days.</li>
        <li>Top Ups are processed after payment is confirmed.</li>
        <li>Top Up Funds are non-refundable, except when used for advertising.</li>
      </ul>
    </template>
  </div>
</template>
