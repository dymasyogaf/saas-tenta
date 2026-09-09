<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Audit Keuangan & Mutasi (Finance)</h2>
        <p class="text-slate-500 text-sm mt-1">Pantau perputaran uang (Top Up) dan proses permintaan pencairan dana klien.</p>
      </div>
      <button @click="refreshAll" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': pending || pendingWd }" /> Segarkan Data
      </button>
    </div>

    <!-- Alert Info -->
    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
      <WalletCards class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-bold text-emerald-900">Brankas Utama Agensi</h3>
        <p class="text-xs text-emerald-700 mt-1">Halaman ini adalah pusat rekonsiliasi. Tugas utama Tim Keuangan adalah mencocokkan mutasi Bank riil dengan data di Dasbor ini, serta memproses (mentransfer secara manual lalu klik <b>Setujui</b>) untuk setiap permintaan <b>Pencairan Dana</b> (Withdraw) yang masuk.</p>
      </div>
    </div>

    <!-- Revenue Card -->
    <div class="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 shadow-md mt-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <p class="text-sm font-medium text-slate-400">Total Pendapatan Fee (Gross)</p>
            <span v-if="envFilter === 'sandbox'" class="px-2 py-0.5 text-[9px] font-bold rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">SANDBOX</span>
            <span v-else-if="envFilter === 'production'" class="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PRODUKSI</span>
          </div>
          <p class="text-3xl font-display font-bold text-white">{{ formatCurrency(totalFeeRevenue) }}</p>
          <p class="text-xs text-slate-500 mt-1">Akumulasi dari seluruh potongan fee sesuai paket klien (Starter/Growth/Scale) untuk transaksi Top Up yang sukses.</p>
        </div>
        <div class="flex overflow-x-auto whitespace-nowrap items-center gap-2 shrink-0 max-w-full scrollbar-hide">
          <div class="flex items-center gap-0 bg-slate-800 border border-slate-600 rounded-lg p-1">
            <button @click="currencyFilter = 'all'" 
              class="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
              :class="currencyFilter === 'all' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'">
              Semua Valuta
            </button>
            <button @click="currencyFilter = 'IDR'" 
              class="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
              :class="currencyFilter === 'IDR' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'">
              🇮🇩 IDR
            </button>
            <button @click="currencyFilter = 'USD'" 
              class="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
              :class="currencyFilter === 'USD' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'">
              🌐 USD
            </button>
          </div>
          <div class="flex items-center gap-0 bg-slate-800 border border-slate-600 rounded-lg p-1">
            <button @click="envFilter = 'production'" 
              class="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
              :class="envFilter === 'production' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'">
              🟢 Produksi
            </button>
            <button @click="envFilter = 'sandbox'" 
              class="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
              :class="envFilter === 'sandbox' ? 'bg-yellow-500 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'">
              🟡 Sandbox
            </button>
            <button @click="envFilter = 'all'" 
              class="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
              :class="envFilter === 'all' ? 'bg-slate-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'">
              Semua
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs/Filter -->
    <div class="flex border-b border-slate-200 mt-6 gap-6 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">

      <button 
        @click="activeTab = 'history'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2"
        :class="activeTab === 'history' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Riwayat Mutasi Global
      </button>
      <button 
        @click="activeTab = 'fee-summary'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2"
        :class="activeTab === 'fee-summary' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Rekap Fee Klien
      </button>
      <button 
        @click="activeTab = 'referral'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2"
        :class="activeTab === 'referral' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Pencairan Referral
        <span v-if="pendingReferralWithdraws.length > 0" class="bg-red-500 text-white py-0.5 px-2 rounded-full text-[10px] animate-pulse">{{ pendingReferralWithdraws.length }}</span>
      </button>
      <button 
        @click="activeTab = 'affiliates'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2"
        :class="activeTab === 'affiliates' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Data Rekening
      </button>
    </div>


    <!-- Tab 4: Rekap Fee Klien -->
    <div v-if="activeTab === 'fee-summary'" class="bg-white border border-slate-200 rounded-xl shadow-sm mt-4">
      <!-- Search & Filter -->
      <div class="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-xl">
        <div class="relative w-64">
          <input v-model="feeSearchQuery" type="text" placeholder="Cari nama klien..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative">
            <button @click="isFeeExportMenuOpen = !isFeeExportMenuOpen" @blur="closeFeeExportMenu" class="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <Download class="w-4 h-4" /> Export
              <ChevronDown class="w-4 h-4 text-slate-400" />
            </button>
            <div v-if="isFeeExportMenuOpen" class="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50 origin-top-left sm:origin-top-right transition-all" @mousedown.prevent>
              <button @click="openFeeReportModal" class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                <PieChart class="w-4 h-4 text-emerald-600" /> Laporan Visual
              </button>
              <button @click="exportFeeToCSV" class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <FileSpreadsheet class="w-4 h-4 text-blue-600" /> Export Excel
              </button>
            </div>
          </div>
          <SharedDateRangePicker v-model="feeDateRange" />
          <button 
            v-if="isSuperAdmin"
            @click="hideTestingAccounts = !hideTestingAccounts"
            type="button"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-2xs shrink-0"
            :class="hideTestingAccounts ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'"
            :title="hideTestingAccounts ? 'Akun testing (Dymas Yoga & Super Admin Dymas) disembunyikan' : 'Klik untuk menyembunyikan akun testing'"
          >
            <EyeOff v-if="hideTestingAccounts" class="w-3.5 h-3.5 text-emerald-600" />
            <Eye v-else class="w-3.5 h-3.5 text-slate-400" />
            <span>{{ hideTestingAccounts ? 'Testing Dihide' : 'Tampilkan Testing' }}</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto rounded-b-xl">
        <table class="w-full text-left text-sm min-w-[800px] whitespace-nowrap">
          <thead class="bg-white border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-4 py-4 w-12 text-center">No</th>
              <th class="px-6 py-4">Klien</th>
              <th class="px-6 py-4 text-center">Frekuensi Top Up</th>
              <th class="px-6 py-4 text-right">Total Fee Dihasilkan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredFeeSummary.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                <Receipt class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Tidak ada data fee untuk rentang tanggal ini.</p>
              </td>
            </tr>
            <tr v-else v-for="(item, index) in filteredFeeSummary" :key="item.user_id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-4 text-center text-xs text-slate-400 font-mono">{{ index + 1 }}</td>
              <td class="px-6 py-4 font-bold text-slate-900">
                {{ item.full_name }}
              </td>
              <td class="px-6 py-4 text-center text-slate-600 font-medium">
                {{ item.count }}x
              </td>
              <td class="px-6 py-4 text-right font-display font-bold text-emerald-600">
                {{ formatCurrency(item.totalFee) }}
              </td>
            </tr>
          </tbody>
          <tfoot v-if="filteredFeeSummary.length > 0" class="bg-slate-50 border-t border-slate-200">
            <tr>
              <td colspan="2" class="px-6 py-4 font-bold text-slate-900 text-right">TOTAL:</td>
              <td class="px-6 py-4 text-center font-bold text-slate-900">{{ filteredFeeSummary.reduce((sum, item) => sum + item.count, 0) }}x</td>
              <td class="px-6 py-4 text-right font-display font-bold text-emerald-600 text-lg">{{ formatCurrency(filteredFeeSummary.reduce((sum, item) => sum + item.totalFee, 0)) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>


    <!-- Tab 2: Riwayat Mutasi -->
    <div v-if="activeTab === 'history'" class="bg-white border border-slate-200 rounded-xl shadow-sm mt-4">
      <!-- Search & Filter -->
      <div class="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-xl">
        <div class="relative w-64">
          <input v-model="searchQuery" type="text" placeholder="Cari nama klien..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative">
            <button @click="isExportMenuOpen = !isExportMenuOpen" @blur="closeExportMenu" class="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              <Download class="w-4 h-4" /> Export
              <ChevronDown class="w-4 h-4 text-slate-400" />
            </button>
            <div v-if="isExportMenuOpen" class="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50 origin-top-left sm:origin-top-right transition-all" @mousedown.prevent>
              <button @click="openReportModal" class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                <PieChart class="w-4 h-4 text-emerald-600" /> Laporan Visual
              </button>
              <button @click="exportToCSV" class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                <FileSpreadsheet class="w-4 h-4 text-blue-600" /> Export Excel
              </button>
            </div>
          </div>
          <SharedDateRangePicker v-model="historyDateRange" />
          <button 
            v-if="isSuperAdmin"
            @click="hideTestingAccounts = !hideTestingAccounts"
            type="button"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-2xs shrink-0"
            :class="hideTestingAccounts ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'"
            :title="hideTestingAccounts ? 'Akun testing (Dymas Yoga & Super Admin Dymas) disembunyikan dari rekap' : 'Klik untuk menyembunyikan akun testing'"
          >
            <EyeOff v-if="hideTestingAccounts" class="w-3.5 h-3.5 text-emerald-600" />
            <Eye v-else class="w-3.5 h-3.5 text-slate-400" />
            <span>{{ hideTestingAccounts ? 'Testing Dihide' : 'Tampilkan Testing' }}</span>
          </button>
          <div class="w-56 relative z-10">
            <BaseSelect 
              v-model="typeFilter" 
              :options="typeFilterOptions"
              wrapperClass="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 w-full focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div class="overflow-x-auto rounded-b-xl">
        <table class="w-full text-left text-sm min-w-[800px] whitespace-nowrap">
          <thead class="bg-white border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-4 py-4 w-12 text-center">No</th>
              <th class="px-6 py-4">Tgl & Waktu</th>
              <th class="px-6 py-4">Klien</th>
              <th class="px-6 py-4">Jenis Transaksi</th>
              <th class="px-6 py-4 text-right">Nominal</th>
              <th class="px-6 py-4 text-right">Fee</th>
              <th class="px-6 py-4 text-center">Status</th>
              <th v-if="isSuperAdmin" class="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredHistory.length === 0">
              <td :colspan="isSuperAdmin ? 8 : 7" class="px-6 py-12 text-center text-slate-500">
                <Receipt class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Tidak ada riwayat mutasi yang sesuai.</p>
              </td>
            </tr>
            <tr v-else v-for="(tx, index) in filteredHistory" :key="tx.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-4 text-center text-xs text-slate-400 font-mono">{{ index + 1 }}</td>
              <td class="px-6 py-4 text-slate-600 text-xs">
                {{ new Date(tx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) }}
              </td>
              <td class="px-6 py-4 font-bold text-slate-900">
                {{ tx.users?.full_name || 'Tanpa Nama' }}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1.5 items-start">
                  <!-- Badges Kategori & Platform Iklan -->
                  <div class="flex flex-wrap items-center gap-1.5">
                    <!-- Badge Jenis Transaksi -->
                    <span 
                      class="px-2 py-0.5 text-[10px] font-bold rounded-md tracking-wide"
                      :class="getCategoryBadgeClass(tx)"
                    >
                      {{ getTransactionMeta(tx).categoryLabel }}
                    </span>

                    <!-- Badge Platform Iklan (Google Ads / Facebook Ads / etc.) -->
                    <span 
                      v-if="getTransactionMeta(tx).platformLabel"
                      class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded shadow-2xs"
                      :class="getPlatformBadgeClass(tx)"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="getPlatformDotClass(tx)"></span>
                      {{ getTransactionMeta(tx).platformLabel }}
                    </span>
                  </div>

                  <!-- Keterangan Nama Akun & Referensi -->
                  <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span 
                      v-if="getTransactionMeta(tx).accountName" 
                      class="text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[190px]" 
                      :title="'Akun: ' + getTransactionMeta(tx).accountName"
                    >
                      {{ getTransactionMeta(tx).accountName }}
                    </span>
                    <span 
                      v-if="tx.payment_gateway_ref" 
                      class="text-[10px] text-slate-400 font-mono truncate max-w-[130px]" 
                      :title="tx.payment_gateway_ref"
                    >
                      {{ tx.payment_gateway_ref }}
                    </span>
                    <span 
                      v-else-if="!getTransactionMeta(tx).accountName" 
                      class="text-[10px] text-slate-400"
                    >
                      Internal
                    </span>
                    <span 
                      v-if="tx.is_sandbox" 
                      class="px-1.5 py-0.2 text-[8px] font-bold rounded bg-yellow-100 text-yellow-700 border border-yellow-300"
                    >
                      SANDBOX
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-right font-bold"
                  :class="{
                    'text-emerald-600': tx.type === 'topup',
                    'text-slate-900': tx.type !== 'topup',
                  }">
                {{ tx.type === 'topup' ? '+' : '-' }} {{ formatCurrency(tx.amount || 0, tx.currency) }}
              </td>
              <td class="px-6 py-4 text-right font-medium">
                <span v-if="Number(tx.fee_amount) > 0" class="text-emerald-600 font-bold">
                  {{ formatCurrency(tx.fee_amount, tx.currency) }}
                </span>
                <span v-else class="text-slate-400">
                  -
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-full"
                  :class="{
                    'bg-emerald-100 text-emerald-700': tx.status === 'success',
                    'bg-orange-100 text-orange-700': tx.status === 'pending',
                    'bg-red-100 text-red-700': tx.status === 'failed',
                  }">
                  {{ (tx.status || 'unknown').toUpperCase() }}
                </span>
              </td>
              <td v-if="isSuperAdmin" class="px-4 py-4 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button 
                    @click="manageTransaction(tx.id, tx.is_sandbox ? 'to_production' : 'to_sandbox')"
                    :disabled="managingTxId === tx.id"
                    class="p-1.5 rounded-lg text-xs font-bold transition-colors"
                    :class="tx.is_sandbox 
                      ? 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200' 
                      : 'text-yellow-600 hover:bg-yellow-50 border border-yellow-200'"
                    :title="tx.is_sandbox ? 'Pindah ke Produksi' : 'Pindah ke Sandbox'">
                    <ArrowLeftRight class="w-3.5 h-3.5" />
                  </button>
                  <button 
                    @click="manageTransaction(tx.id, 'delete')"
                    :disabled="managingTxId === tx.id"
                    class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-red-200 transition-colors"
                    title="Hapus Transaksi">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 3: Pencairan Referral -->
    <div v-if="activeTab === 'referral'" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[800px] whitespace-nowrap">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Afiliator & Tanggal</th>
              <th class="px-6 py-4">Rekening Tujuan</th>
              <th class="px-6 py-4 text-right">Nominal Pencairan</th>
              <th class="px-6 py-4 text-center">Status / Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="pendingWd" v-for="i in 2" :key="'skel-ref'+i" class="animate-pulse bg-white">
              <td class="px-6 py-4"><div class="h-4 w-32 bg-ink-200 rounded mb-2"></div><div class="h-3 w-24 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-4 w-48 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-5 w-24 bg-ink-200 rounded ml-auto"></div></td>
              <td class="px-6 py-4"><div class="h-8 w-32 bg-ink-200 rounded-lg mx-auto"></div></td>
            </tr>
            <tr v-else-if="referralWithdrawals.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                <CheckCircle2 class="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p class="font-medium text-slate-600">Tidak ada pengajuan pencairan komisi.</p>
              </td>
            </tr>
            <tr v-else v-for="wd in referralWithdrawals" :key="wd.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-slate-900">{{ wd.affiliate_profiles?.full_name || wd.users?.email || 'Tanpa Nama' }}</p>
                <p class="text-[10px] text-slate-400 mt-1">{{ new Date(wd.created_at).toLocaleString('id-ID') }}</p>
              </td>
              <td class="px-6 py-4">
                <template v-if="wd.affiliate_profiles">
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-semibold text-slate-800">{{ wd.affiliate_profiles.bank_name }} - {{ wd.affiliate_profiles.bank_account }}</p>
                    <button @click="copyToClipboard(wd.affiliate_profiles.bank_account)" class="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Salin Rekening">
                      <Copy class="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">a.n {{ wd.affiliate_profiles.account_name }}</p>
                </template>
                <template v-else>
                  <p class="text-xs text-red-500 italic">Data bank tidak ditemukan</p>
                </template>
              </td>
              <td class="px-6 py-4 text-right">
                <p class="font-display font-bold text-emerald-600 text-lg">{{ formatCurrency(wd.amount || 0) }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <div v-if="wd.status === 'pending'" class="flex items-center justify-center gap-2">
                  <button 
                    @click="openRejectReferralModal(wd.id)"
                    :disabled="isSubmittingWd === wd.id"
                    class="px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                  >
                    Tolak
                  </button>
                  <button 
                    @click="approveReferralWithdraw(wd.id)"
                    :disabled="isSubmittingWd === wd.id"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span v-if="isSubmittingWd === wd.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Transfer & Setujui
                  </button>
                </div>
                <div v-else>
                  <span class="px-2.5 py-1 text-[10px] font-bold rounded-full uppercase"
                    :class="wd.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'">
                    {{ wd.status === 'approved' ? 'Disetujui' : 'Ditolak' }}
                  </span>
                  <p v-if="wd.status === 'rejected'" class="text-[10px] text-red-600 mt-1 truncate max-w-[150px] mx-auto" :title="wd.rejection_reason">{{ wd.rejection_reason }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 4: Data Rekening (Affiliates) -->
    <div v-if="activeTab === 'affiliates'" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <div class="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 class="font-bold text-slate-800">Daftar Rekening Afiliator</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[800px] whitespace-nowrap">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Tgl Daftar</th>
              <th class="px-6 py-4">Nama Sesuai KTP</th>
              <th class="px-6 py-4">Bank</th>
              <th class="px-6 py-4">No. Rekening</th>
              <th class="px-6 py-4">Atas Nama</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="pendingAff" v-for="i in 3" :key="'skel-aff'+i" class="animate-pulse bg-white">
              <td class="px-6 py-4"><div class="h-4 w-24 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-4 w-32 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-4 w-20 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-4 w-32 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-4 w-32 bg-ink-200 rounded"></div></td>
            </tr>
            <tr v-else-if="affiliates.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                <Users class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Belum ada afiliator yang terdaftar.</p>
              </td>
            </tr>
            <tr v-else v-for="aff in affiliates" :key="aff.user_id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-slate-600 text-xs">
                {{ new Date(aff.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </td>
              <td class="px-6 py-4">
                <p class="font-bold text-slate-900">{{ aff.full_name }}</p>
                <p class="text-[10px] text-slate-400">{{ aff.users?.email }}</p>
              </td>
              <td class="px-6 py-4 font-semibold text-slate-800">{{ aff.bank_name }}</td>
              <td class="px-6 py-4 font-mono text-slate-600">
                <div class="flex items-center gap-2">
                  <span>{{ aff.bank_account }}</span>
                  <button @click="copyToClipboard(aff.bank_account)" class="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Salin Rekening">
                    <Copy class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-700">{{ aff.account_name }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Custom Confirmation Modal for Withdraw Top Up -->
    <Teleport to="body">
<div v-if="isConfirmModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative border border-ink-100 transform transition-all">
        <div class="p-6 text-center">
          <div class="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4"
               :class="confirmAction === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'">
            <CheckCircle2 v-if="confirmAction === 'approve'" class="w-8 h-8" />
            <WalletCards v-else class="w-8 h-8" />
          </div>
          <h3 class="text-xl font-display font-bold text-ink-900 mb-2">
            {{ confirmAction === 'approve' ? 'Konfirmasi Persetujuan' : 'Tolak Permintaan' }}
          </h3>
          <p class="text-ink-500 text-sm mb-6">{{ confirmMessage }}</p>
          
          <div class="flex gap-3">
            <button @click="isConfirmModalOpen = false" class="flex-1 bg-white border border-ink-200 text-ink-700 hover:bg-ink-50 font-bold py-2.5 rounded-xl transition-colors text-sm">
              Batal
            </button>
            <button @click="executeProcessWithdraw" class="flex-1 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm text-sm"
                    :class="confirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'">
              Ya, Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
    </Teleport>


    <!-- Reject Referral Modal -->
    <Teleport to="body">
<div v-if="isRejectRefModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-ink-100 transform transition-all">
        <div class="px-6 py-4 border-b border-ink-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-900 flex items-center gap-2">
            <WalletCards class="w-5 h-5 text-red-500" />
            Tolak Pencairan Komisi
          </h3>
          <button @click="isRejectRefModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <div class="p-6">
          <p class="text-sm text-slate-600 mb-4">Pilih alasan penolakan pencairan. Alasan ini akan dikirimkan ke pengguna, dan saldo komisi akan dikembalikan agar pengguna bisa memperbaiki datanya.</p>
          
          <div class="space-y-3 mb-6">
            <label class="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" :class="{'border-orange-500 bg-orange-50/30': rejectReasonTemplate === 'Data rekening tidak valid/tidak ditemukan'}">
              <input type="radio" v-model="rejectReasonTemplate" value="Data rekening tidak valid/tidak ditemukan" class="mt-0.5 text-orange-500 focus:ring-orange-500" />
              <div>
                <p class="text-sm font-bold text-slate-800">Rekening Tidak Valid</p>
                <p class="text-xs text-slate-500 mt-0.5">Bank menolak transfer / nomor rekening salah.</p>
              </div>
            </label>
            
            <label class="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" :class="{'border-orange-500 bg-orange-50/30': rejectReasonTemplate === 'Nama pemilik rekening tidak sesuai dengan identitas KTP pendaftar'}">
              <input type="radio" v-model="rejectReasonTemplate" value="Nama pemilik rekening tidak sesuai dengan identitas KTP pendaftar" class="mt-0.5 text-orange-500 focus:ring-orange-500" />
              <div>
                <p class="text-sm font-bold text-slate-800">Nama Tidak Sesuai</p>
                <p class="text-xs text-slate-500 mt-0.5">Nama di rekening berbeda dengan nama lengkap.</p>
              </div>
            </label>
            
            <label class="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50" :class="{'border-orange-500 bg-orange-50/30': rejectReasonTemplate === 'Lainnya'}">
              <input type="radio" v-model="rejectReasonTemplate" value="Lainnya" class="mt-0.5 text-orange-500 focus:ring-orange-500" />
              <div>
                <p class="text-sm font-bold text-slate-800">Lainnya</p>
                <p class="text-xs text-slate-500 mt-0.5">Ketik alasan kustom.</p>
              </div>
            </label>
          </div>
          
          <div v-if="rejectReasonTemplate === 'Lainnya'" class="mb-4">
            <label class="block text-xs font-bold text-slate-700 mb-1">Alasan Penolakan Kustom</label>
            <textarea v-model="customRejectReason" rows="3" class="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500" placeholder="Ketik alasan penolakan..."></textarea>
          </div>

          <div class="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button @click="isRejectRefModalOpen = false" class="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Batal
            </button>
            <button @click="executeRejectReferralWithdraw" :disabled="!finalRejectReason || isSubmittingWd === confirmIdRef" class="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
              <span v-if="isSubmittingWd === confirmIdRef" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Tolak Pencairan
            </button>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Visual Report Modal -->
    <Teleport to="body">
    <div v-if="isReportModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:relative print:z-auto print:inset-auto print:block">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative border border-ink-100 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-ink-100 flex justify-between items-center bg-slate-50 print:bg-white print:border-b-2 print:border-slate-800 shrink-0">
          <div>
            <h3 class="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Receipt class="w-5 h-5 text-emerald-600 print:hidden" />
              Riwayat Mutasi Global
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Periode: {{ formatDateOnly(historyDateRange.start) }} s/d {{ formatDateOnly(historyDateRange.end) }}
              <span class="ml-2 font-bold" :class="envFilter === 'sandbox' ? 'text-yellow-600' : 'text-emerald-600'">• {{ envFilter === 'sandbox' ? 'Sandbox' : envFilter === 'all' ? 'Semua' : 'Produksi' }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2 print:hidden">
            <button 
              v-if="isSuperAdmin"
              @click="hideTestingAccounts = !hideTestingAccounts"
              type="button"
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-2xs"
              :class="hideTestingAccounts ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'"
              :title="hideTestingAccounts ? 'Akun testing (Dymas Yoga) dikecualikan dari rekap' : 'Akun testing disertakan'"
            >
              <EyeOff v-if="hideTestingAccounts" class="w-3.5 h-3.5 text-emerald-600" />
              <Eye v-else class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ hideTestingAccounts ? 'Testing Dikecualikan' : 'Semua Akun' }}</span>
            </button>
            <button @click="exportReportSummaryToCSV" class="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-2xs">
              <FileSpreadsheet class="w-4 h-4 text-emerald-600" /> Export Excel
            </button>
            <button @click="printPDF" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 shadow-2xs">
              <FileText class="w-4 h-4" /> Cetak / PDF
            </button>
            <button @click="isReportModalOpen = false" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Mini Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50/70 border-b border-slate-100 print:bg-white print:border-b-2 print:border-slate-300 shrink-0">
          <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs print:border-slate-300">
            <p class="text-[11px] font-medium text-slate-500">Total Top Up</p>
            <p class="text-base font-bold text-emerald-600 mt-0.5">{{ formatCurrency(reportClientSummary.reduce((sum, c) => sum + c.totalTopup, 0)) }}</p>
          </div>
          <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs print:border-slate-300">
            <p class="text-[11px] font-medium text-slate-500">Dialokasikan</p>
            <p class="text-base font-bold text-red-600 mt-0.5">{{ formatCurrency(reportClientSummary.reduce((sum, c) => sum + c.totalInternal, 0)) }}</p>
          </div>
          <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs print:border-slate-300">
            <p class="text-[11px] font-medium text-purple-600">Total Fee</p>
            <p class="text-base font-bold text-purple-700 mt-0.5">{{ formatCurrency(reportClientSummary.reduce((sum, c) => sum + c.totalFee, 0)) }}</p>
          </div>
          <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs print:border-slate-300">
            <p class="text-[11px] font-medium text-slate-500">Sisa Saldo</p>
            <p class="text-base font-bold text-blue-600 mt-0.5">{{ formatCurrency(reportClientSummary.reduce((sum, c) => sum + c.totalTopup - c.totalInternal, 0)) }}</p>
          </div>
        </div>

        <!-- Scrollable Content -->
        <div class="overflow-y-auto flex-1">

          <!-- Tabel Ringkasan per Klien -->
          <table class="w-full text-left text-sm min-w-[800px] whitespace-nowrap">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
              <tr>
                <th class="px-4 py-3 w-10 text-center text-xs">No</th>
                <th class="px-4 py-3 text-xs">Klien</th>
                <th class="px-4 py-3 text-center text-xs">Frekuensi</th>
                <th class="px-4 py-3 text-right text-xs">Total Top Up</th>
                <th class="px-4 py-3 text-right text-xs">Dialokasikan</th>
                <th class="px-4 py-3 text-right text-xs">Total Fee</th>
                <th class="px-4 py-3 text-right text-xs">Sisa Saldo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(client, index) in reportClientSummary" :key="client.user_id" class="hover:bg-slate-50/50">
                <td class="px-4 py-3 text-center text-xs text-slate-400 font-mono">{{ index + 1 }}</td>
                <td class="px-4 py-3 font-bold text-slate-800 text-sm">{{ client.full_name }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{{ client.count }}x</span>
                </td>
                <td class="px-4 py-3 text-right font-bold text-sm text-emerald-600">
                  {{ formatCurrency(client.totalTopup) }}
                </td>
                <td class="px-4 py-3 text-right font-bold text-sm text-red-600">
                  {{ formatCurrency(client.totalInternal) }}
                </td>
                <td class="px-4 py-3 text-right font-bold text-sm text-purple-600">
                  {{ formatCurrency(client.totalFee) }}
                </td>
                <td class="px-4 py-3 text-right font-bold text-sm" :class="client.totalTopup - client.totalInternal >= 0 ? 'text-blue-700' : 'text-red-700'">
                  {{ formatCurrency(client.totalTopup - client.totalInternal) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td class="px-4 py-3 font-bold text-slate-900 text-right text-sm" colspan="2">TOTAL</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">{{ filteredHistory.length }}x</span>
                </td>
                <td class="px-4 py-3 text-right font-bold text-sm text-emerald-600">
                  {{ formatCurrency(reportClientSummary.reduce((sum, c) => sum + c.totalTopup, 0)) }}
                </td>
                <td class="px-4 py-3 text-right font-bold text-sm text-red-600">
                  {{ formatCurrency(reportClientSummary.reduce((sum, c) => sum + c.totalInternal, 0)) }}
                </td>
                <td class="px-4 py-3 text-right font-bold text-sm text-purple-600">
                  {{ formatCurrency(reportClientSummary.reduce((sum, c) => sum + c.totalFee, 0)) }}
                </td>
                <td class="px-4 py-3 text-right font-bold text-sm text-blue-700">
                  {{ formatCurrency(reportClientSummary.reduce((sum, c) => sum + c.totalTopup - c.totalInternal, 0)) }}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- Diagram Visual -->
          <div class="px-6 py-6 border-t border-slate-100 bg-white">
            <h4 class="text-sm font-bold text-slate-700 mb-4 text-center">Perbandingan Top Up vs Dialokasikan vs Fee per Klien</h4>
            <ClientOnly>
              <apexchart type="bar" :height="Math.max(220, reportClientSummary.length * 55)" :options="reportGroupedBarOptions" :series="reportGroupedBarOptions.series"></apexchart>
            </ClientOnly>
          </div>

        </div>
      </div>
    </div>
    </Teleport>

    <!-- Fee Report Modal -->
    <Teleport to="body">
    <div v-if="isFeeReportModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:relative print:z-auto print:inset-auto print:block">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative border border-ink-100 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        <!-- Header Modal -->
        <div class="px-6 py-4 border-b border-ink-100 flex justify-between items-center bg-slate-50 print:bg-white print:border-b-2 print:border-slate-800">
          <div>
            <h3 class="font-bold text-slate-900 text-lg flex items-center gap-2">
              <PieChart class="w-5 h-5 text-emerald-600 print:hidden" />
              Rekap Fee Klien
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              Periode: {{ formatDateOnly(feeDateRange.start) }} s/d {{ formatDateOnly(feeDateRange.end) }}
            </p>
          </div>
          <div class="flex gap-2 print:hidden">
            <button @click="printPDF" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
              <FileText class="w-4 h-4" /> Cetak / PDF
            </button>
            <button @click="isFeeReportModalOpen = false" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 bg-slate-50/50 print:bg-white">
          
          <!-- Bar Chart Fee per Klien -->
          <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm print:shadow-none print:border-slate-300 mb-6">
            <h4 class="text-sm font-bold text-slate-700 mb-4 text-center">Pendapatan Fee per Klien</h4>
            <ClientOnly>
              <apexchart type="bar" :height="Math.max(200, filteredFeeSummary.length * 45)" :options="feeBarChartOptions" :series="feeBarChartOptions.series"></apexchart>
            </ClientOnly>
          </div>

          <!-- Statistik -->
          <div class="bg-white p-5 rounded-xl border border-slate-100 shadow-sm print:shadow-none print:border-slate-300">
            <h4 class="text-sm font-bold text-slate-700 mb-4">Statistik Total</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div class="p-4 bg-slate-50 rounded-lg border border-slate-100 print:border-slate-300">
                <p class="text-xs text-slate-500 mb-1">Jumlah Klien</p>
                <p class="text-lg font-bold text-slate-900">{{ filteredFeeSummary.length }} Klien</p>
              </div>
              <div class="p-4 bg-emerald-50 rounded-lg border border-emerald-100 print:border-slate-300">
                <p class="text-xs text-emerald-600 mb-1">Total Frekuensi Top Up</p>
                <p class="text-lg font-bold text-emerald-700">{{ filteredFeeSummary.reduce((sum, item) => sum + item.count, 0) }}x</p>
              </div>
              <div class="p-4 bg-purple-50 rounded-lg border border-purple-100 print:border-slate-300">
                <p class="text-xs text-purple-600 mb-1">Total Pendapatan Fee</p>
                <p class="text-lg font-bold text-purple-700">{{ formatCurrency(filteredFeeSummary.reduce((sum, item) => sum + item.totalFee, 0)) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  /* Hide nuxt devtools when printing */
  #nuxt-devtools-container { display: none !important; }
  
  .print\:relative, .print\:relative * {
    visibility: visible;
  }
  .print\:relative {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
}
</style>

<script setup lang="ts">
import { RefreshCw, WalletCards, Search, Receipt, ChevronDown, Download, PieChart, FileSpreadsheet, FileText, X, Eye, EyeOff } from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'
import { useSupabaseUser, useCsrf, useToast, useConfirm } from '#imports'
import BaseSelect from '~/components/ui/BaseSelect.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const route = useRoute()
const { csrf } = useCsrf()
const toast = useToast()
const user = useSupabaseUser()
const isSuperAdmin = computed(() => user.value?.user_metadata?.role === 'super_admin')
const managingTxId = ref<string | null>(null)

// Mode filter sembunyikan akun testing (Dymas Yoga & Super Admin Dymas)
// Hanya Super Admin yang bisa melihat tombol dan mengatur toggle ini; untuk mode finance biasa, testing SELALU disembunyikan secara mutlak
const hideTestingAccounts = ref(true)
const shouldHideTesting = computed(() => {
  if (!isSuperAdmin.value) return true
  return hideTestingAccounts.value
})

const isTestingAccount = (userId?: string, fullName?: string, email?: string) => {
  if (userId === 'a978c0ff-8959-4dd7-b641-42e4f5103d15' || userId === 'f6f1883f-252d-484e-bfcb-ef648a677f28') {
    return true
  }
  const name = (fullName || '').toLowerCase()
  const mail = (email || '').toLowerCase()
  if (name.includes('dymas') || mail.includes('dymasyoga11') || mail.includes('dymas@alfatihah')) {
    return true
  }
  return false
}

const validTabs = ['history', 'fee-summary', 'referral', 'affiliates']
const initialTab = typeof route.query.tab === 'string' && validTabs.includes(route.query.tab) ? route.query.tab : 'history'
const activeTab = ref(initialTab)

watch(activeTab, (newTab) => {
  if (route.query.tab !== newTab) {
    navigateTo({ query: { ...route.query, tab: newTab } }, { replace: true })
  }
})

watch(() => route.query.tab, (newQueryTab) => {
  if (typeof newQueryTab === 'string' && validTabs.includes(newQueryTab) && newQueryTab !== activeTab.value) {
    activeTab.value = newQueryTab
  }
})
const searchQuery = ref('')
const typeFilter = ref('all')

const typeFilterOptions = [
  { label: 'Semua Jenis Transaksi', value: 'all' },
  { label: 'Top Up Saldo', value: 'topup' },
  { label: 'Alokasi Anggaran', value: 'allocation' },
  { label: 'Sewa Akun Iklan', value: 'rental' },
  { label: 'Google Ads (Gads)', value: 'google' },
  { label: 'Facebook Ads (Meta)', value: 'meta' },
  { label: 'Pencairan Keluar', value: 'withdraw' },
  { label: 'Pencairan Komisi', value: 'affiliate_commission' },
  { label: 'Refund Saldo', value: 'refund' },
]

// --- Helper Deteksi Metadata Transaksi & Platform Iklan ---
const getTransactionMeta = (tx: any) => {
  if (tx.category_label && tx.ad_platform_label !== undefined) {
    return {
      category: tx.transaction_category || tx.type,
      categoryLabel: tx.category_label || tx.type.toUpperCase(),
      platform: tx.ad_platform,
      platformLabel: tx.ad_platform_label,
      accountName: tx.ad_account_name
    }
  }
  
  const rawDesc = tx.description || ''
  const desc = rawDesc.toLowerCase()
  let category = tx.type
  let categoryLabel = tx.type.toUpperCase()
  let platform: 'google' | 'meta' | 'tiktok' | null = null
  let platformLabel: string | null = null
  let accountName: string | null = null

  if (tx.type === 'topup') {
    category = 'topup'
    categoryLabel = 'Top Up Saldo'
  } else if (tx.type === 'withdraw') {
    category = 'withdraw'
    categoryLabel = 'Pencairan Saldo'
  } else if (tx.type === 'affiliate_commission') {
    category = 'affiliate_commission'
    categoryLabel = 'Komisi Afiliasi'
  } else if (tx.type === 'refund' || desc.includes('refund')) {
    category = 'refund'
    categoryLabel = 'Refund Saldo'
  } else if (tx.type === 'payment' || desc.includes('alokasi') || desc.includes('sewa') || desc.includes('tagihan')) {
    if (desc.includes('alokasi') || desc.includes('budget allocation')) {
      category = 'allocation'
      categoryLabel = 'Alokasi Anggaran'
    } else if (desc.includes('perpanjangan sewa')) {
      category = 'extension'
      categoryLabel = 'Perpanjangan Sewa'
    } else if (desc.includes('sewa akun')) {
      category = 'rental'
      categoryLabel = 'Sewa Akun Iklan'
    } else if (desc.includes('tagihan') || desc.includes('release')) {
      category = 'release'
      categoryLabel = 'Tagihan Iklan'
    }

    if (desc.includes('(google)') || desc.includes('google ads') || desc.includes('gads') || desc.includes('google')) {
      platform = 'google'
      platformLabel = 'Google Ads'
    } else if (desc.includes('(meta)') || desc.includes('facebook') || desc.includes('meta ads') || desc.includes('fb ads') || desc.includes('(fb)')) {
      platform = 'meta'
      platformLabel = 'Facebook Ads'
    } else if (desc.includes('(tiktok)') || desc.includes('tiktok')) {
      platform = 'tiktok'
      platformLabel = 'TikTok Ads'
    }

    const match = rawDesc.match(/-\s*([^()]+?)\s*\((google|meta|facebook|tiktok)/i)
    if (match && match[1]) {
      accountName = match[1].trim()
    }
  }

  return { category, categoryLabel, platform, platformLabel, accountName }
}

const getCategoryBadgeClass = (tx: any) => {
  const meta = getTransactionMeta(tx)
  switch (meta.category) {
    case 'allocation':
      return 'bg-blue-50 text-blue-700 border border-blue-200'
    case 'rental':
      return 'bg-purple-50 text-purple-700 border border-purple-200'
    case 'extension':
      return 'bg-amber-50 text-amber-700 border border-amber-200'
    case 'topup':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    case 'withdraw':
      return 'bg-orange-50 text-orange-700 border border-orange-200'
    case 'affiliate_commission':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    case 'refund':
      return 'bg-cyan-50 text-cyan-700 border border-cyan-200'
    case 'release':
      return 'bg-slate-100 text-slate-700 border border-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

const getPlatformBadgeClass = (tx: any) => {
  const meta = getTransactionMeta(tx)
  if (meta.platform === 'google') {
    return 'bg-sky-600 text-white'
  } else if (meta.platform === 'meta') {
    return 'bg-indigo-600 text-white'
  } else if (meta.platform === 'tiktok') {
    return 'bg-slate-900 text-white'
  }
  return 'bg-slate-700 text-white'
}

const getPlatformDotClass = (tx: any) => {
  const meta = getTransactionMeta(tx)
  if (meta.platform === 'google') {
    return 'bg-sky-200'
  } else if (meta.platform === 'meta') {
    return 'bg-indigo-200'
  }
  return 'bg-slate-300'
}

const envFilter = ref('production')
const currencyFilter = ref('all')
const isSubmitting = ref<string | null>(null)
const isSubmittingWd = ref<string | null>(null)



// --- Export & Report Logic ---
const isExportMenuOpen = ref(false)
const closeExportMenu = () => { isExportMenuOpen.value = false }
const isFeeExportMenuOpen = ref(false)
const closeFeeExportMenu = () => { isFeeExportMenuOpen.value = false }
const isReportModalOpen = ref(false)
const isFeeReportModalOpen = ref(false)

const openReportModal = () => {
  isExportMenuOpen.value = false
  isFeeExportMenuOpen.value = false
  isReportModalOpen.value = true
}

const openFeeReportModal = () => {
  isFeeExportMenuOpen.value = false
  isFeeReportModalOpen.value = true
}

const formatDateOnly = (dateStr: string | Date | null) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear()}`
}

const exportToCSV = () => {
  isExportMenuOpen.value = false
  if (filteredHistory.value.length === 0) {
    alert('Tidak ada data untuk diexport pada rentang tanggal ini.')
    return
  }
  
  const headers = ['Tgl & Waktu', 'Klien', 'Jenis Transaksi', 'Platform Iklan', 'Nama Akun / Ref', 'Nominal (Rp)', 'Fee (Rp)', 'Status']
  const rows = filteredHistory.value.map(tx => {
    const meta = getTransactionMeta(tx)
    const isMinus = (tx.type === 'withdraw' || tx.type === 'affiliate_commission' || tx.type === 'payment')
    return [
      `"${new Date(tx.created_at).toLocaleString('id-ID')}"`,
      `"${tx.users?.email || 'N/A'}"`,
      `"${meta.categoryLabel}"`,
      `"${meta.platformLabel || '-'}"`,
      `"${meta.accountName || tx.payment_gateway_ref || 'Internal'}"`,
      `"${isMinus ? '-' : ''}${tx.amount}"`,
      `"${tx.fee_amount || 0}"`,
      `"${tx.status}"`
    ]
  })
  
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `Mutasi_${formatDateOnly(historyDateRange.value.start)}_to_${formatDateOnly(historyDateRange.value.end)}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const printPDF = () => {
  window.print()
}

const reportClientSummary = computed(() => {
  const map = new Map()
  filteredHistory.value.forEach(tx => {
    const uid = tx.user_id
    // Sembunyikan akun testing dari rekap (mutlak untuk mode finance)
    if (shouldHideTesting.value && isTestingAccount(uid, tx.users?.full_name, tx.users?.email)) {
      return
    }
    if (!map.has(uid)) {
      map.set(uid, {
        user_id: uid,
        full_name: tx.users?.full_name || 'Tanpa Nama',
        count: 0,
        totalTopup: 0,
        totalInternal: 0,
        totalFee: 0,
      })
    }
    const data = map.get(uid)
    data.count += 1
    if (tx.type === 'topup') {
      data.totalTopup += tx.amount || 0
      data.totalFee += Number(tx.fee_amount) || 0
    } else {
      data.totalInternal += tx.amount || 0
      data.totalFee += Number(tx.fee_amount) || 0
    }
  })
  return Array.from(map.values())
    .sort((a, b) => b.totalTopup - a.totalTopup)
})

const reportGroupedBarOptions = computed(() => {
  const clients = reportClientSummary.value
  const categories = clients.map(c => c.full_name)
  
  return {
    chart: { type: 'bar', toolbar: { show: false }, stacked: false },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, barHeight: '65%' } },
    colors: ['#10b981', '#ef4444', '#a855f7'],
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: { formatter: (val: number) => val >= 1000000 ? (val / 1000000).toFixed(1) + ' Jt' : val >= 1000 ? (val / 1000).toFixed(0) + ' Rb' : val.toString() }
    },
    yaxis: { labels: { style: { fontSize: '12px', fontWeight: 600 } } },
    tooltip: { y: { formatter: (val: number) => 'Rp ' + val.toLocaleString('id-ID') } },
    legend: { position: 'top', fontSize: '12px', fontWeight: 600 },
    grid: { borderColor: '#f1f5f9', xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    series: [
      { name: 'Top Up', data: clients.map(c => c.totalTopup) },
      { name: 'Dialokasikan', data: clients.map(c => c.totalInternal) },
      { name: 'Fee Dihasilkan', data: clients.map(c => c.totalFee) },
    ]
  }
})

const exportReportSummaryToCSV = () => {
  if (reportClientSummary.value.length === 0) {
    alert('Tidak ada data ringkasan untuk diexport.')
    return
  }
  const headers = ['No', 'Klien', 'Frekuensi Transaksi', 'Total Top Up (Rp)', 'Dialokasikan (Rp)', 'Total Fee (Rp)', 'Sisa Saldo (Rp)']
  const rows = reportClientSummary.value.map((c, i) => [
    `"${i + 1}"`,
    `"${c.full_name}"`,
    `"${c.count}"`,
    `"${c.totalTopup}"`,
    `"${c.totalInternal}"`,
    `"${c.totalFee}"`,
    `"${c.totalTopup - c.totalInternal}"`
  ])
  
  const totalTopup = reportClientSummary.value.reduce((sum, c) => sum + c.totalTopup, 0)
  const totalInternal = reportClientSummary.value.reduce((sum, c) => sum + c.totalInternal, 0)
  const totalFee = reportClientSummary.value.reduce((sum, c) => sum + c.totalFee, 0)
  rows.push([
    '"TOTAL"',
    '""',
    `"${filteredHistory.value.length}"`,
    `"${totalTopup}"`,
    `"${totalInternal}"`,
    `"${totalFee}"`,
    `"${totalTopup - totalInternal}"`
  ])
  
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `Ringkasan_Mutasi_${formatDateOnly(historyDateRange.value.start)}_to_${formatDateOnly(historyDateRange.value.end)}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const feeBarChartOptions = computed(() => {
  const labels = filteredFeeSummary.value.map(item => item.full_name)
  const data = filteredFeeSummary.value.map(item => item.totalFee)
  
  return {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, horizontal: true } },
    colors: ['#a855f7'],
    dataLabels: { enabled: false },
    xaxis: { categories: labels, labels: { formatter: (val: number) => 'Rp ' + val.toLocaleString('id-ID') } },
    yaxis: { labels: { style: { fontSize: '12px', fontWeight: 600 } } },
    tooltip: { y: { formatter: (val: number) => 'Rp ' + val.toLocaleString('id-ID') } },
    series: [{ name: 'Fee (Rp)', data }]
  }
})

const exportFeeToCSV = () => {
  isFeeExportMenuOpen.value = false
  if (filteredFeeSummary.value.length === 0) {
    alert('Tidak ada data fee untuk diexport.')
    return
  }
  
  const headers = ['Klien', 'Frekuensi Top Up', 'Total Fee Dihasilkan (Rp)']
  const rows = filteredFeeSummary.value.map(item => [
    `"${item.full_name}"`,
    `"${item.count}"`,
    `"${item.totalFee}"`
  ])
  
  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", `Rekap_Fee_${formatDateOnly(feeDateRange.value.start)}_to_${formatDateOnly(feeDateRange.value.end)}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const feeSearchQuery = ref('')
const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const getLocalYYYYMMDD = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const feeDateRange = ref({ start: getLocalYYYYMMDD(thirtyDaysAgo), end: getLocalYYYYMMDD(today) })
const historyDateRange = ref({ start: getLocalYYYYMMDD(thirtyDaysAgo), end: getLocalYYYYMMDD(today) })

const copyToClipboard = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.addToast('Nomor rekening disalin', 'success')
  } catch (err) {
    toast.addToast('Gagal menyalin', 'error')
  }
}

// Manage Transaction (Super Admin only)
const manageTransaction = async (txId: string, action: 'delete' | 'to_sandbox' | 'to_production') => {
  const actionLabels: Record<string, string> = {
    delete: 'menghapus transaksi ini',
    to_sandbox: 'memindahkan transaksi ini ke Sandbox',
    to_production: 'memindahkan transaksi ini ke Produksi',
  }
  
  if (!confirm(`Yakin ingin ${actionLabels[action]}?`)) return
  
  managingTxId.value = txId
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch('/api/admin/finance/manage-transaction', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: { transaction_id: txId, action }
    }) as any
    toast.addToast(res.message, 'success')
    await refreshTransactions()
  } catch (error: any) {
    toast.addToast(error.data?.statusMessage || 'Gagal memproses', 'error')
  } finally {
    managingTxId.value = null
  }
}

// 1. Fetch Data Transaksi Global (Top Up / dll)
const { data: transactions, pending, refresh: refreshTransactions } = useAsyncData<any[]>('admin_finance_list', async () => {
  return (await ($fetch as any)('/api/admin/finance')) as any[]
}, { default: () => [] })

// 2. Fetch Data Pencairan Referral
const { data: referralWithdrawals, pending: pendingWd, refresh: refreshWd } = useAsyncData<any[]>('admin_finance_referral_withdrawals', async () => {
  return (await ($fetch as any)('/api/admin/finance/withdrawals')) as any[]
}, { default: () => [] })

// 3. Fetch Data Akun Bank Afiliator
const { data: affiliates, pending: pendingAff, refresh: refreshAff } = useAsyncData<any[]>('admin_finance_affiliates', async () => {
  return (await ($fetch as any)('/api/admin/finance/affiliates')) as any[]
}, { default: () => [] })

const refreshAll = () => {
  refreshTransactions()
  refreshWd()
  refreshAff()
}

// Filter Transaksi Global (Top Up Withdraw yang masih Pending)
const pendingWithdraws = computed(() => {
  return transactions.value.filter(tx => tx.type === 'withdraw' && tx.status === 'pending')
})

const pendingReferralWithdraws = computed(() => {
  return referralWithdrawals.value.filter(wd => wd.status === 'pending')
})

const filteredHistory = computed(() => {
  let history = transactions.value.filter(tx => !(tx.type === 'withdraw' && tx.status === 'pending'))
  
  const start = new Date(historyDateRange.value.start)
  start.setHours(0, 0, 0, 0)
  const end = new Date(historyDateRange.value.end)
  end.setHours(23, 59, 59, 999)

  history = history.filter(tx => {
    const txDate = new Date(tx.created_at)
    return txDate >= start && txDate <= end
  })

  // Filter by environment
  if (envFilter.value === 'production') {
    history = history.filter(tx => !tx.is_sandbox)
  } else if (envFilter.value === 'sandbox') {
    history = history.filter(tx => tx.is_sandbox)
  }

  // Filter by currency
  if (currencyFilter.value === 'IDR') {
    history = history.filter(tx => (tx.currency || 'IDR') === 'IDR')
  } else if (currencyFilter.value === 'USD') {
    history = history.filter(tx => tx.currency === 'USD')
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    history = history.filter(tx => tx.users?.full_name?.toLowerCase().includes(q))
  }
  // Sembunyikan akun testing dari daftar jika aktif (mutlak untuk mode finance)
  if (shouldHideTesting.value) {
    history = history.filter(tx => !isTestingAccount(tx.user_id, tx.users?.full_name, tx.users?.email))
  }
  if (typeFilter.value !== 'all') {
    history = history.filter(tx => {
      const meta = getTransactionMeta(tx)
      if (typeFilter.value === 'topup') return tx.type === 'topup'
      if (typeFilter.value === 'withdraw') return tx.type === 'withdraw'
      if (typeFilter.value === 'affiliate_commission') return tx.type === 'affiliate_commission'
      if (typeFilter.value === 'allocation') return meta.category === 'allocation'
      if (typeFilter.value === 'rental') return meta.category === 'rental' || meta.category === 'extension'
      if (typeFilter.value === 'google') return meta.platform === 'google'
      if (typeFilter.value === 'meta') return meta.platform === 'meta'
      if (typeFilter.value === 'refund') return tx.type === 'refund' || meta.category === 'refund'
      return tx.type === typeFilter.value
    })
  }
  return history
})

const totalFeeRevenue = computed(() => {
  let txs = transactions.value.filter(tx => tx.type === 'topup' && tx.status === 'success')
  if (shouldHideTesting.value) {
    txs = txs.filter(tx => !isTestingAccount(tx.user_id, tx.users?.full_name, tx.users?.email))
  }
  // Filter by environment
  if (envFilter.value === 'production') {
    txs = txs.filter(tx => !tx.is_sandbox)
  } else if (envFilter.value === 'sandbox') {
    txs = txs.filter(tx => tx.is_sandbox)
  }
  // Filter by currency
  if (currencyFilter.value === 'IDR') {
    txs = txs.filter(tx => (tx.currency || 'IDR') === 'IDR')
  } else if (currencyFilter.value === 'USD') {
    txs = txs.filter(tx => tx.currency === 'USD')
  }
  return txs.reduce((sum, tx) => sum + (Number(tx.fee_amount) || 0), 0)
})

const filteredFeeSummary = computed(() => {
  let txs = transactions.value.filter(tx => tx.type === 'topup' && tx.status === 'success')
  if (shouldHideTesting.value) {
    txs = txs.filter(tx => !isTestingAccount(tx.user_id, tx.users?.full_name, tx.users?.email))
  }
  
  if (envFilter.value === 'production') {
    txs = txs.filter(tx => !tx.is_sandbox)
  } else if (envFilter.value === 'sandbox') {
    txs = txs.filter(tx => tx.is_sandbox)
  }

  const start = new Date(feeDateRange.value.start)
  start.setHours(0, 0, 0, 0)
  const end = new Date(feeDateRange.value.end)
  end.setHours(23, 59, 59, 999)

  txs = txs.filter(tx => {
    const txDate = new Date(tx.created_at)
    return txDate >= start && txDate <= end
  })
  
  const map = new Map()
  txs.forEach(tx => {
    const uid = tx.user_id
    if (!map.has(uid)) {
      map.set(uid, {
        user_id: uid,
        full_name: tx.users?.full_name || 'Tanpa Nama',
        count: 0,
        totalFee: 0
      })
    }
    const data = map.get(uid)
    data.count += 1
    data.totalFee += Number(tx.fee_amount) || 0
  })

  let result = Array.from(map.values())
  if (feeSearchQuery.value) {
    const q = feeSearchQuery.value.toLowerCase()
    result = result.filter(item => item.full_name.toLowerCase().includes(q))
  }
  
  result.sort((a, b) => b.totalFee - a.totalFee)
  return result
})

// Modal Confirmation State (Top Up Withdraw)
const isConfirmModalOpen = ref(false)
const confirmAction = ref<'approve' | 'reject'>('approve')
const confirmId = ref<string>('')
const confirmMessage = ref<string>('')

const processWithdraw = (id: string, action: 'approve' | 'reject') => {
  confirmAction.value = action
  confirmId.value = id
  confirmMessage.value = action === 'approve' 
    ? 'Anda yakin sudah mentransfer dana ini ke rekening klien?'
    : 'Anda yakin ingin menolak pencairan dana ini?'
  isConfirmModalOpen.value = true
}

const executeProcessWithdraw = async () => {
  isConfirmModalOpen.value = false
  isSubmitting.value = confirmId.value

  try {
    const csrfToken = unref(csrf)
    const response = await $fetch('/api/admin/finance', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: { transaction_id: confirmId.value, action: confirmAction.value }
    })

    toast.addToast((response as any).message, 'success')
    await refreshTransactions()
    refreshNuxtData('admin-badges')
    
    if (pendingWithdraws.value.length === 0) activeTab.value = 'history'
  } catch (error: any) {
    toast.addToast(error.data?.statusMessage || 'Gagal memproses transaksi', 'error')
  } finally {
    isSubmitting.value = null
  }
}

// Modal State (Referral Withdraw)
const confirmIdRef = ref<string>('')
const isRejectRefModalOpen = ref(false)
const rejectReasonTemplate = ref('Data rekening tidak valid/tidak ditemukan')
const customRejectReason = ref('')

const finalRejectReason = computed(() => {
  return rejectReasonTemplate.value === 'Lainnya' ? customRejectReason.value : rejectReasonTemplate.value
})

const approveReferralWithdraw = async (id: string) => {
  if (!(await useConfirm().show({ message: 'Anda yakin sudah mentransfer komisi ini ke rekening klien? Tindakan ini tidak dapat dibatalkan.' }))) return
  
  isSubmittingWd.value = id
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch(`/api/admin/finance/withdrawals/${id}/approve`, {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {}
    }) as any
    toast.addToast(res.message, 'success')
    await refreshWd()
    // Opsional update transactions history
    await refreshTransactions()
  } catch (error: any) {
    toast.addToast(error.data?.statusMessage || 'Gagal menyetujui pencairan', 'error')
  } finally {
    isSubmittingWd.value = null
  }
}

const openRejectReferralModal = (id: string) => {
  confirmIdRef.value = id
  rejectReasonTemplate.value = 'Data rekening tidak valid/tidak ditemukan'
  customRejectReason.value = ''
  isRejectRefModalOpen.value = true
}

const executeRejectReferralWithdraw = async () => {
  if (!finalRejectReason.value) return
  isSubmittingWd.value = confirmIdRef.value
  
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch(`/api/admin/finance/withdrawals/${confirmIdRef.value}/reject`, {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: { reason: finalRejectReason.value }
    }) as any
    toast.addToast(res.message, 'success')
    isRejectRefModalOpen.value = false
    await refreshWd()
  } catch (error: any) {
    toast.addToast(error.data?.statusMessage || 'Gagal menolak pencairan', 'error')
  } finally {
    isSubmittingWd.value = null
  }
}

const formatCurrency = (val: number, curr?: string) => {
  const targetCurr = curr || (currencyFilter.value === 'USD' ? 'USD' : 'IDR')
  if (targetCurr === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val || 0)
  }
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0)
}
</script>
