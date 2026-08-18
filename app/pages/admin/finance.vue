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
    <div class="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 shadow-md mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-slate-400 mb-1">Total Pendapatan Fee (Gross)</p>
        <p class="text-3xl font-display font-bold text-white">{{ formatCurrency(totalFeeRevenue) }}</p>
        <p class="text-xs text-slate-500 mt-1">Akumulasi dari seluruh potongan fee sesuai paket klien (Starter/Growth/Scale) untuk transaksi Top Up yang sukses.</p>
      </div>
      <div class="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
        <Receipt class="w-6 h-6 text-white" />
      </div>
    </div>

    <!-- Tabs/Filter -->
    <div class="flex border-b border-slate-200 mt-6 gap-6 overflow-x-auto whitespace-nowrap pb-1 scrollbar-hide">
      <button 
        @click="activeTab = 'withdraw'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2"
        :class="activeTab === 'withdraw' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Tugas Eksekusi (Top Up) 
        <span v-if="pendingWithdraws.length > 0" class="bg-red-500 text-white py-0.5 px-2 rounded-full text-[10px] animate-pulse">{{ pendingWithdraws.length }}</span>
      </button>
      <button 
        @click="activeTab = 'history'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2"
        :class="activeTab === 'history' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Riwayat Mutasi Global
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

    <!-- Tab 1: Pencairan (Withdraw) Top Up -->
    <div v-if="activeTab === 'withdraw'" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Klien & Tanggal</th>
              <th class="px-6 py-4">Tujuan Rekening</th>
              <th class="px-6 py-4 text-right">Nominal Pencairan</th>
              <th class="px-6 py-4 text-center">Aksi (Eksekusi)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="pending" v-for="i in 2" :key="'skel'+i" class="animate-pulse bg-white">
              <td class="px-6 py-4"><div class="h-4 w-32 bg-ink-200 rounded mb-2"></div><div class="h-3 w-24 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-4 w-48 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-5 w-24 bg-ink-200 rounded ml-auto"></div></td>
              <td class="px-6 py-4"><div class="h-8 w-32 bg-ink-200 rounded-lg mx-auto"></div></td>
            </tr>
            <tr v-else-if="pendingWithdraws.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                <CheckCircle2 class="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p class="font-medium text-slate-600">Semua pencairan top up sudah diselesaikan.</p>
              </td>
            </tr>
            <tr v-else v-for="tx in pendingWithdraws" :key="tx.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-slate-900">{{ tx.users?.full_name || 'Tanpa Nama' }}</p>
                <p class="text-[10px] text-slate-400 mt-1">{{ new Date(tx.created_at).toLocaleString('id-ID') }}</p>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 mb-1">
                  <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700">
                    PENCAIRAN
                  </span>
                </div>
                <p class="text-xs font-semibold text-slate-800 uppercase">{{ tx.payment_gateway_ref || 'BANK TRANSFER' }}</p>
                <p class="text-[11px] text-slate-500 mt-0.5">Silakan cek data rekening klien.</p>
              </td>
              <td class="px-6 py-4 text-right">
                <p class="font-display font-bold text-slate-900 text-lg">{{ formatCurrency(tx.amount || 0) }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <button 
                    @click="processWithdraw(tx.id, 'reject')"
                    :disabled="isSubmitting === tx.id"
                    class="px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors"
                  >
                    Tolak
                  </button>
                  <button 
                    @click="processWithdraw(tx.id, 'approve')"
                    :disabled="isSubmitting === tx.id"
                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span v-if="isSubmitting === tx.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Transfer & Setujui
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 2: Riwayat Mutasi -->
    <div v-if="activeTab === 'history'" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <!-- Search & Filter -->
      <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div class="relative w-64">
          <input v-model="searchQuery" type="text" placeholder="Cari nama klien..." class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <select v-model="typeFilter" class="bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-emerald-500">
          <option value="all">Semua Jenis Transaksi</option>
          <option value="topup">Top Up Masuk</option>
          <option value="withdraw">Pencairan Keluar</option>
          <option value="affiliate_commission">Pencairan Komisi</option>
        </select>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-white border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Tgl & Waktu</th>
              <th class="px-6 py-4">Klien</th>
              <th class="px-6 py-4">Jenis Transaksi</th>
              <th class="px-6 py-4 text-right">Nominal</th>
              <th class="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-if="filteredHistory.length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                <Receipt class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Tidak ada riwayat mutasi yang sesuai.</p>
              </td>
            </tr>
            <tr v-else v-for="tx in filteredHistory" :key="tx.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4 text-slate-600 text-xs">
                {{ new Date(tx.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) }}
              </td>
              <td class="px-6 py-4 font-bold text-slate-900">
                {{ tx.users?.full_name || 'Tanpa Nama' }}
              </td>
              <td class="px-6 py-4">
                <span class="text-[11px] font-bold uppercase tracking-wider"
                  :class="{
                    'text-emerald-600': tx.type === 'topup',
                    'text-orange-600': tx.type === 'withdraw',
                    'text-blue-600': tx.type === 'affiliate_commission',
                  }">
                  {{ tx.type }}
                </span>
                <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1 max-w-[150px]" :title="tx.payment_gateway_ref">{{ tx.payment_gateway_ref || 'Internal' }}</p>
              </td>
              <td class="px-6 py-4 text-right font-bold"
                  :class="{
                    'text-emerald-600': tx.type === 'topup',
                    'text-slate-900': tx.type !== 'topup',
                  }">
                {{ tx.type === 'topup' ? '+' : '-' }} {{ formatCurrency(tx.amount || 0) }}
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab 3: Pencairan Referral -->
    <div v-if="activeTab === 'referral'" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
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
        <table class="w-full text-left text-sm">
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

  </div>
</template>

<script setup lang="ts">
import { RefreshCw, WalletCards, CheckCircle2, Search, Receipt, Users, Copy } from 'lucide-vue-next'
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const { csrf } = useCsrf()
const toast = useToast()

const activeTab = ref('withdraw')
const searchQuery = ref('')
const typeFilter = ref('all')
const isSubmitting = ref<string | null>(null)
const isSubmittingWd = ref<string | null>(null)

const copyToClipboard = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.addToast('Nomor rekening disalin', 'success')
  } catch (err) {
    toast.addToast('Gagal menyalin', 'error')
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
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    history = history.filter(tx => tx.users?.full_name?.toLowerCase().includes(q))
  }
  if (typeFilter.value !== 'all') {
    history = history.filter(tx => tx.type === typeFilter.value)
  }
  return history
})

const totalFeeRevenue = computed(() => {
  return transactions.value
    .filter(tx => tx.type === 'topup' && tx.status === 'success')
    .reduce((sum, tx) => sum + (Number(tx.fee_amount) || 0), 0)
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

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}
</script>
