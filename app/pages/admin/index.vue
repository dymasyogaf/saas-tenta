<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Dashboard Operasional</h2>
        <p class="text-slate-500 text-sm mt-1">Ringkasan aktivitas internal dan kesehatan bisnis agensi Tentaklik.</p>
      </div>
      <button @click="refreshAll" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': pending || pendingAdsOps }" /> Segarkan Data
      </button>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-4">
      <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <Info class="w-4 h-4" />
      </div>
      <div>
        <h3 class="text-sm font-bold text-blue-900">Control Room Admin</h3>
        <p class="text-blue-700 text-xs mt-1">Gunakan data di bawah ini untuk memantau aktivitas operasional dan finansial. Data diperbarui secara real-time dari Supabase.</p>
      </div>
    </div>

    <!-- Default Admin / Super Admin Dashboard -->
    <div v-if="userRole !== 'admin_ads_ops' && userRole !== 'admin_compliance'">
      <!-- Row 1: Operational Stats -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-b border-slate-200 pb-2 mb-4 gap-3">
      <h3 class="text-lg font-bold text-slate-900">Antrean Operasional (To-Do)</h3>
      
      <!-- Custom Date Filter Popover -->
      <div class="relative shrink-0">
        <!-- Visual Button -->
        <button @click="showDatePopover = !showDatePopover" class="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 px-3 rounded-lg text-sm hover:border-slate-300 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
          <Calendar class="w-4 h-4 text-slate-500" />
          <span class="font-medium whitespace-nowrap">{{ dateRangeText }}</span>
        </button>
        
        <!-- Popover Content -->
        <div v-if="showDatePopover" class="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
          <h4 class="font-bold text-slate-900 mb-4">Pilih Rentang Waktu</h4>
          
          <div class="space-y-3">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Mulai Tanggal</label>
              <input v-model="tempStartDate" type="date" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-slate-700" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Sampai Tanggal</label>
              <input v-model="tempEndDate" type="date" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-slate-700" />
            </div>
          </div>
          
          <button @click="applyDateFilter" class="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
            Terapkan
          </button>
        </div>
        
        <!-- Overlay for closing popover when clicking outside -->
        <Teleport to="body">
<div v-if="showDatePopover" @click="showDatePopover = false" class="fixed inset-0 z-40"></div>
        </Teleport>

      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Verifikasi KYC -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
            <ShieldCheck class="w-4 h-4" />
          </div>
          <p class="text-sm font-bold text-slate-700">Antrean KYC</p>
        </div>
        <div v-if="pending" class="h-9 w-16 bg-ink-200 rounded animate-pulse my-1"></div>
        <p v-else class="text-3xl font-display font-bold text-slate-900">{{ stats?.kyc || 0 }}</p>
        <p class="text-xs font-medium text-slate-500 mt-2">Menunggu review Tim Audit</p>
      </div>

      <!-- Request Ad Account -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Megaphone class="w-4 h-4" />
          </div>
          <p class="text-sm font-bold text-slate-700">Request Akun</p>
        </div>
        <div v-if="pending" class="h-9 w-16 bg-ink-200 rounded animate-pulse my-1"></div>
        <p v-else class="text-3xl font-display font-bold text-slate-900">{{ stats?.ads || 0 }}</p>
        <p class="text-xs font-medium text-slate-500 mt-2">Menunggu eksekusi Tim Ads</p>
      </div>

      <!-- Eksekusi Finance -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <WalletCards class="w-4 h-4" />
          </div>
          <p class="text-sm font-bold text-slate-700">Withdraw & Alokasi</p>
        </div>
        <div v-if="pending" class="h-9 w-16 bg-ink-200 rounded animate-pulse my-1"></div>
        <p v-else class="text-3xl font-display font-bold text-slate-900">{{ stats?.withdraw || 0 }}</p>
        <p class="text-xs font-medium text-slate-500 mt-2">Menunggu eksekusi Tim Finance</p>
      </div>

      <!-- Top Up Masuk -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
            <TrendingUp class="w-4 h-4" />
          </div>
          <p class="text-sm font-bold text-slate-700">Top Up Masuk</p>
        </div>
        <div v-if="pending" class="h-9 w-32 bg-ink-200 rounded animate-pulse my-1"></div>
        <p v-else class="text-3xl font-display font-bold text-slate-900">{{ formatCurrency(stats?.topup || 0) }}</p>
        <p class="text-xs font-medium text-slate-500 mt-2">
          Total masuk pada rentang waktu terpilih
        </p>
      </div>
    </div>

    <!-- Alert / Perhatian -->
    <div v-if="(stats?.expiringRentals || 0) > 0 || (stats?.lowBalanceRentals || 0) > 0 || (stats?.lowLimitRentals || 0) > 0" class="mb-8 space-y-4">
      <div v-if="(stats?.expiringRentals || 0) > 0" class="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div class="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
          <Megaphone class="w-5 h-5" />
        </div>
        <div class="flex-1">
          <h3 class="text-base font-bold text-red-900">Perhatian: Ada {{ stats?.expiringRentals }} Akun Iklan Segera Kedaluwarsa</h3>
          <p class="text-sm text-red-700 mt-1">Masa sewa akun iklan klien ini akan habis dalam waktu kurang dari 7 hari. Segera lakukan follow up ke klien agar layanan tidak terputus.</p>
        </div>
        <NuxtLink to="/admin/ads-ops" class="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors">
          Lihat & Follow Up
        </NuxtLink>
      </div>

      <div v-if="(stats?.lowBalanceRentals || 0) > 0" class="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
          <WalletCards class="w-5 h-5" />
        </div>
        <div class="flex-1">
          <h3 class="text-base font-bold text-orange-900">Perhatian: Ada {{ stats?.lowBalanceRentals }} Akun Iklan Sisa Saldo Iklan Menipis</h3>
          <p class="text-sm text-orange-700 mt-1">Sisa anggaran pada akun iklan klien ini di bawah Rp 300.000. Segera hubungi klien untuk melakukan Top Up anggaran.</p>
        </div>
        <NuxtLink to="/admin/ads-ops" class="shrink-0 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-colors">
          Lihat & Follow Up
        </NuxtLink>
      </div>

      <div v-if="(stats?.lowLimitRentals || 0) > 0" class="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-sm flex items-start gap-4">
        <div class="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center shrink-0">
          <Activity class="w-5 h-5" />
        </div>
        <div class="flex-1">
          <h3 class="text-base font-bold text-yellow-900">Perhatian: Ada {{ stats?.lowLimitRentals }} Akun Iklan Sisa Limit Menipis</h3>
          <p class="text-sm text-yellow-700 mt-1">Sisa limit harian/siklus pada akun iklan klien ini di bawah Rp 300.000. Segera hubungi klien untuk melakukan pembayaran agar iklan tidak terhenti.</p>
        </div>
        <NuxtLink to="/admin/ads-ops" class="shrink-0 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-bold rounded-lg transition-colors">
          Lihat & Follow Up
        </NuxtLink>
      </div>
    </div>

    <!-- Row 2: Financial & Growth Stats -->
    <h3 class="text-lg font-bold text-slate-900 pt-2 border-b border-slate-200 pb-2">Kesehatan Bisnis (Growth)</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md relative overflow-hidden group">
        <div class="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
        <div class="relative z-10">
          <p class="text-sm font-medium text-slate-400 mb-1">Total Klien Terdaftar</p>
          <div v-if="pending" class="h-10 w-20 bg-slate-800 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-white">{{ stats?.totalUsers || 0 }}</p>
          <p class="text-xs text-slate-500 mt-2">Keseluruhan pengguna SaaS</p>
        </div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md relative overflow-hidden group">
        <div class="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>
        <div class="relative z-10">
          <p class="text-sm font-medium text-slate-400 mb-1">Akun Iklan Aktif</p>
          <div v-if="pending" class="h-10 w-20 bg-slate-800 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-white">{{ stats?.totalAds || 0 }}</p>
          <p class="text-xs text-slate-500 mt-2">Meta, Google, & TikTok</p>
        </div>
      </div>
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400 rounded-xl p-6 shadow-lg shadow-orange-500/20 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
        <div class="relative z-10">
          <p class="text-sm font-medium text-orange-100 mb-1">Total Pendapatan Fee Top-Up</p>
          <div v-if="pending" class="h-10 w-32 bg-orange-400/50 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-white">{{ formatCurrency(stats?.totalFee || 0) }}</p>
          <p class="text-xs text-orange-100 mt-2">Dari akumulasi fee top-up (rentang terpilih)</p>
        </div>
      </div>
    </div>

    <!-- Row 3: Charts & Recent Activities -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Chart Section -->
      <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        
        <!-- Header & Select -->
        <div class="flex items-start justify-between mb-2">
          <div>
            <h3 class="font-bold text-xl text-slate-900">Volume Top-Up</h3>
            <p class="text-sm text-slate-500 mt-1">{{ dateRangeText === 'Pilih Rentang Waktu' ? '7 Hari Terakhir' : dateRangeText }}</p>
          </div>
          <select v-model="selectedFilter" class="text-sm border border-slate-200 rounded-md py-1.5 px-3 text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer">
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
            <option value="custom" disabled hidden>Kustom</option>
          </select>
        </div>

        <!-- Mini Stats -->
        <div class="flex flex-wrap gap-4 mt-6 mb-8">
          <div class="border border-slate-100 bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm min-w-[200px]">
            <div class="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <WalletCards class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-400">Total {{ selectedFilter === '7' ? '7 Hari' : (selectedFilter === '30' ? '30 Hari' : (selectedFilter === 'month' ? 'Bulan Ini' : 'Terpilih')) }}</p>
              <p class="text-xl font-bold text-slate-900 mt-0.5">{{ formatCurrencyShort(chartTotal) }}</p>
            </div>
          </div>
          <div class="border border-slate-100 bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm min-w-[200px]">
            <div class="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-medium text-slate-400">Tertinggi</p>
              <p class="text-xl font-bold text-slate-900 mt-0.5">{{ formatCurrencyShort(chartHighest.val) }}</p>
              <p class="text-[10px] text-slate-400">{{ chartHighest.label }}</p>
            </div>
          </div>
        </div>

        <!-- Chart -->
        <div class="border border-slate-100 rounded-xl p-4 bg-white shadow-sm relative pt-10">
          <p class="absolute top-4 left-4 text-xs font-bold text-slate-500">Volume (Rp)</p>
          <div class="h-64 w-full">
            <div v-if="pending" class="w-full h-full animate-pulse bg-slate-50 rounded-lg"></div>
            <ClientOnly v-else>
              <VueApexCharts 
                type="area" 
                height="100%" 
                width="100%" 
                :options="chartOptions" 
                :series="stats?.chartSeries || []"
              />
            </ClientOnly>
          </div>
        </div>

      </div>

      <!-- Recent Activities -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div class="p-5 border-b border-slate-100">
          <h3 class="font-bold text-slate-900">Aktivitas Transaksi Terbaru</h3>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="pending" class="p-4 space-y-4">
            <div v-for="i in 5" :key="i" class="h-12 bg-slate-100 rounded animate-pulse"></div>
          </div>
          <div v-else-if="stats?.recentTxs?.length === 0" class="p-8 text-center text-slate-400 text-sm">
            Belum ada aktivitas.
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="tx in stats?.recentTxs" :key="tx.id" class="p-3 hover:bg-slate-50 flex flex-col gap-1 transition-colors rounded-lg">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold" 
                  :class="{
                    'text-green-600': tx.type === 'topup',
                    'text-orange-600': tx.type === 'transfer',
                    'text-blue-600': tx.type === 'withdraw'
                  }">
                  {{ tx.type.toUpperCase() }}
                </span>
                <span class="text-[10px] text-slate-400">
                  {{ new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }} &bull; 
                  {{ new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-1">
                <span class="text-sm font-bold text-slate-800">{{ formatCurrency(tx.amount || 0) }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  :class="{
                    'bg-green-100 text-green-700': tx.status === 'success',
                    'bg-orange-100 text-orange-700': tx.status === 'pending',
                    'bg-red-100 text-red-700': tx.status === 'failed',
                  }">
                  {{ tx.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-3 border-t border-slate-100 text-center">
          <NuxtLink to="/admin/transactions" class="text-xs font-bold text-orange-600 hover:text-orange-700">Lihat Semua Transaksi &rarr;</NuxtLink>
        </div>
      </div>

    </div>

    <!-- Row 4: Registration Chart -->
    <div class="mt-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-xl text-slate-900">Pendaftar Baru</h3>
          <p class="text-sm text-slate-500 mt-1">Akumulasi klien yang mendaftar tiap harinya</p>
        </div>
      </div>
      
      <div class="border border-slate-100 rounded-xl p-4 bg-white shadow-sm relative pt-10">
        <p class="absolute top-4 left-4 text-xs font-bold text-slate-500">Jumlah Pendaftar (Orang)</p>
        <div class="h-64 w-full">
          <div v-if="pending" class="w-full h-full animate-pulse bg-slate-50 rounded-lg"></div>
          <ClientOnly v-else>
            <VueApexCharts 
              type="bar" 
              height="100%" 
              width="100%" 
              :options="userChartOptions" 
              :series="stats?.userChartSeries || []"
            />
          </ClientOnly>
        </div>
      </div>

      <!-- User Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div class="border border-slate-100 bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
            <Users class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-400">Total Pendaftar</p>
            <p class="text-xl font-bold text-slate-900 mt-0.5">{{ stats?.totalUsers || 0 }}</p>
          </div>
        </div>
        <div class="border border-slate-100 bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-400">Terverified</p>
            <p class="text-xl font-bold text-slate-900 mt-0.5">{{ stats?.verifiedUsers || 0 }}</p>
          </div>
        </div>
        <div class="border border-slate-100 bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div class="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center shrink-0">
            <Megaphone class="w-6 h-6" />
          </div>
          <div>
            <p class="text-xs font-medium text-slate-400">Client Beriklan</p>
            <p class="text-xl font-bold text-slate-900 mt-0.5">{{ stats?.uniqueClients || 0 }}</p>
          </div>
        </div>
      </div>
    </div>
    </div> <!-- End Default Dashboard -->

    <!-- ═══════════════════════════════════════════════════════════
         AUDIT DASHBOARD (admin_compliance)
         ═══════════════════════════════════════════════════════════ -->
    <div v-else-if="userRole === 'admin_compliance'">

      <!-- Alert Banner: Antrean Menumpuk -->
      <div v-if="(auditStats?.kycPending || 0) > 5" class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4">
        <div class="w-9 h-9 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-red-900">Antrean KYC Menumpuk!</h3>
          <p class="text-red-700 text-xs mt-1">
            Ada <span class="font-bold">{{ auditStats?.kycPending }}</span> pengajuan KYC yang menunggu review. Segera selesaikan antrean agar klien tidak menunggu terlalu lama.
          </p>
        </div>
        <NuxtLink to="/admin/verifications" class="ml-auto shrink-0 text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 whitespace-nowrap">
          Review Sekarang <ArrowRight class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>

      <!-- ── Section 1: Statistik KYC ─────────────────────────────── -->
      <div class="flex items-center justify-between pt-2 border-b border-slate-200 pb-2 mb-4">
        <h3 class="text-lg font-bold text-slate-900">Statistik KYC</h3>
        <NuxtLink to="/admin/verifications" class="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
          Buka Halaman Review <ArrowRight class="w-3.5 h-3.5" />
        </NuxtLink>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- KYC Pending -->
        <NuxtLink to="/admin/verifications" class="bg-white border-2 border-orange-300 rounded-xl p-5 shadow-sm hover:border-orange-400 hover:shadow-md transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Clock class="w-5 h-5" />
            </div>
            <p class="text-sm font-bold text-slate-700">Menunggu Review</p>
          </div>
          <div v-if="pendingAudit" class="h-9 w-16 bg-slate-200 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-orange-600">{{ auditStats?.kycPending || 0 }}</p>
          <p class="text-xs font-medium text-slate-500 mt-2">Pengajuan KYC pending</p>
        </NuxtLink>

        <!-- Disetujui Hari Ini -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 class="w-5 h-5" />
            </div>
            <p class="text-sm font-bold text-slate-700">Disetujui Hari Ini</p>
          </div>
          <div v-if="pendingAudit" class="h-9 w-16 bg-slate-200 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-green-600">{{ auditStats?.kycApprovedToday || 0 }}</p>
          <p class="text-xs font-medium text-slate-500 mt-2">KYC terverifikasi hari ini</p>
        </div>

        <!-- Ditolak Hari Ini -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle class="w-5 h-5" />
            </div>
            <p class="text-sm font-bold text-slate-700">Ditolak Hari Ini</p>
          </div>
          <div v-if="pendingAudit" class="h-9 w-16 bg-slate-200 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-red-600">{{ auditStats?.kycRejectedToday || 0 }}</p>
          <p class="text-xs font-medium text-slate-500 mt-2">KYC tidak memenuhi syarat</p>
        </div>

        <!-- Belum Submit KYC -->
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <UserX class="w-5 h-5" />
            </div>
            <p class="text-sm font-bold text-slate-700">Belum Submit KYC</p>
          </div>
          <div v-if="pendingAudit" class="h-9 w-16 bg-slate-200 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-slate-600">{{ auditStats?.kycNeverSubmitted || 0 }}</p>
          <p class="text-xs font-medium text-slate-500 mt-2">Terdaftar tapi belum mengisi</p>
        </div>
      </div>

      <!-- ── Section 2 & 3: Chart Trend + Activity Feed ────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        <!-- Chart Trend KYC 7 Hari -->
        <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div class="mb-4">
            <h3 class="font-bold text-xl text-slate-900">Trend KYC (7 Hari Terakhir)</h3>
            <p class="text-sm text-slate-500 mt-1">Perbandingan KYC masuk vs diselesaikan per hari</p>
          </div>
          <div class="border border-slate-100 rounded-xl p-4 bg-slate-50 relative pt-8">
            <p class="absolute top-3 left-4 text-xs font-bold text-slate-400">Jumlah (Pengajuan)</p>
            <div class="h-56 w-full">
              <div v-if="pendingAudit" class="w-full h-full animate-pulse bg-slate-100 rounded-lg"></div>
              <ClientOnly v-else>
                <VueApexCharts
                  type="line"
                  height="100%"
                  width="100%"
                  :options="auditChartOptions"
                  :series="auditStats?.kycChartSeries || []"
                />
              </ClientOnly>
            </div>
          </div>
        </div>

        <!-- Antrean KYC Terbaru (Activity Feed) -->
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-bold text-slate-900">Antrean KYC Terbaru</h3>
            <p class="text-xs text-slate-500 mt-0.5">Pending & butuh review segera</p>
          </div>
          <div class="flex-1 overflow-y-auto p-2">
            <div v-if="pendingAudit" class="p-4 space-y-3">
              <div v-for="i in 4" :key="i" class="h-14 bg-slate-100 rounded animate-pulse"></div>
            </div>
            <div v-else-if="!auditStats?.recentKyc?.length" class="p-8 text-center">
              <CheckCircle2 class="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p class="text-sm font-medium text-slate-500">Antrean KYC kosong!</p>
              <p class="text-xs text-slate-400 mt-1">Semua pengajuan sudah ditangani.</p>
            </div>
            <div v-else class="divide-y divide-slate-100">
              <div v-for="kyc in auditStats?.recentKyc" :key="kyc.id" class="p-3 hover:bg-orange-50 transition-colors rounded-lg">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-800 truncate">{{ kyc.full_name || '(Belum diisi)' }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ kyc.email }}</p>
                  </div>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold shrink-0 mt-0.5">Pending</span>
                </div>
                <p class="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock class="w-3 h-3" />
                  {{ new Date(kyc.updated_at || kyc.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }}
                </p>
              </div>
            </div>
          </div>
          <div class="p-3 border-t border-slate-100 text-center">
            <NuxtLink to="/admin/verifications" class="text-xs font-bold text-orange-600 hover:text-orange-700">Review Semua KYC &rarr;</NuxtLink>
          </div>
        </div>
      </div>

      <!-- ── Section 4: Request Akun Iklan ─────────────────────────── -->
      <div class="border-t border-slate-200 pt-6">
        <div class="flex items-center justify-between pb-2 mb-4">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Antrean Request Akun Iklan</h3>
            <p class="text-xs text-slate-500 mt-0.5">Pengajuan pembuatan akun iklan dari klien yang perlu disetujui</p>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <!-- Pending Review -->
          <NuxtLink to="/admin/verifications" class="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all group">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Megaphone class="w-5 h-5" />
              </div>
              <p class="text-sm font-bold text-slate-700">Menunggu Persetujuan</p>
            </div>
            <div v-if="pendingAudit" class="h-9 w-16 bg-slate-200 rounded animate-pulse my-1"></div>
            <p v-else class="text-4xl font-display font-bold text-blue-600">{{ auditStats?.requestPending || 0 }}</p>
            <p class="text-xs font-medium text-slate-500 mt-2">Request akun belum di-review</p>
          </NuxtLink>

          <!-- Approved Hari Ini -->
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-9 h-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle2 class="w-5 h-5" />
              </div>
              <p class="text-sm font-bold text-slate-700">Disetujui Hari Ini</p>
            </div>
            <div v-if="pendingAudit" class="h-9 w-16 bg-slate-200 rounded animate-pulse my-1"></div>
            <p v-else class="text-4xl font-display font-bold text-green-600">{{ auditStats?.requestApprovedToday || 0 }}</p>
            <p class="text-xs font-medium text-slate-500 mt-2">Request diteruskan ke Tim Ads</p>
          </div>
        </div>

        <!-- List Request Terbaru -->
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div class="p-5 border-b border-slate-100">
            <h4 class="font-bold text-slate-900 text-sm">Request Pending Terbaru</h4>
          </div>
          <div class="p-2">
            <div v-if="pendingAudit" class="p-4 space-y-3">
              <div v-for="i in 3" :key="i" class="h-12 bg-slate-100 rounded animate-pulse"></div>
            </div>
            <div v-else-if="!auditStats?.recentRequests?.length" class="p-6 text-center text-slate-400 text-sm">
              <Megaphone class="w-8 h-8 text-slate-200 mx-auto mb-2" />
              Tidak ada request akun yang pending.
            </div>
            <div v-else class="divide-y divide-slate-100">
              <div v-for="req in auditStats?.recentRequests" :key="req.id" class="p-3 hover:bg-slate-50 flex items-center justify-between transition-colors rounded-lg">
                <div class="min-w-0">
                  <p class="text-sm font-bold text-slate-800 truncate">{{ req.users?.full_name || 'Klien' }}</p>
                  <p class="text-xs text-slate-500">{{ req.account_name || req.platform }} &bull; {{ req.platform }}</p>
                </div>
                <div class="text-right shrink-0 ml-3">
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">Pending Review</span>
                  <p class="text-[10px] text-slate-400 mt-1">
                    {{ new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div> <!-- End Audit Dashboard -->

    <!-- Ads Ops Dashboard -->
    <div v-else-if="userRole === 'admin_ads_ops'">
      <h3 class="text-lg font-bold text-slate-900 pt-2 border-b border-slate-200 pb-2 mb-4">Antrean Pekerjaan (To-Do)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <!-- Request Akun -->
        <NuxtLink to="/admin/ads-ops?tab=akun" class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-400 transition-colors group">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Megaphone class="w-4 h-4" />
            </div>
            <p class="text-sm font-bold text-slate-700 group-hover:text-blue-600">Request Akun Baru</p>
          </div>
          <div v-if="pendingAdsOps" class="h-9 w-16 bg-ink-200 rounded animate-pulse my-1"></div>
          <p v-else class="text-3xl font-display font-bold text-slate-900">{{ adsOpsStats?.pendingAdsAccount || 0 }}</p>
          <p class="text-xs font-medium text-slate-500 mt-2">Menunggu pembuatan akun oleh tim iklan</p>
        </NuxtLink>

        <!-- Request Top Up -->
        <NuxtLink to="/admin/ads-ops?tab=topup" class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-orange-400 transition-colors group">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <WalletCards class="w-4 h-4" />
            </div>
            <p class="text-sm font-bold text-slate-700 group-hover:text-orange-600">Request Top Up Anggaran</p>
          </div>
          <div v-if="pendingAdsOps" class="h-9 w-16 bg-ink-200 rounded animate-pulse my-1"></div>
          <p v-else class="text-3xl font-display font-bold text-slate-900">{{ adsOpsStats?.pendingBudget || 0 }}</p>
          <p class="text-xs font-medium text-slate-500 mt-2">Menunggu alokasi saldo ke platform iklan</p>
        </NuxtLink>
      </div>

      <h3 class="text-lg font-bold text-slate-900 pt-2 border-b border-slate-200 pb-2 mb-4">Kesehatan Akun (Monitoring)</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md relative overflow-hidden">
          <p class="text-sm font-medium text-slate-400 mb-1">Total Akun Aktif</p>
          <div v-if="pendingAdsOps" class="h-10 w-20 bg-slate-800 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-white">{{ adsOpsStats?.activeAccounts || 0 }}</p>
          <p class="text-xs text-slate-500 mt-2">Berjalan normal tanpa masalah</p>
        </div>
        <div class="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
          <p class="text-sm font-medium text-red-600 mb-1">Akun Bermasalah / Banned</p>
          <div v-if="pendingAdsOps" class="h-10 w-20 bg-red-200 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-red-700">{{ adsOpsStats?.bannedAccounts || 0 }}</p>
          <p class="text-xs text-red-500 mt-2">Perlu tindakan perbaikan segera</p>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
          <p class="text-sm font-medium text-amber-600 mb-1">Akun Saldo Menipis</p>
          <div v-if="pendingAdsOps" class="h-10 w-20 bg-amber-200 rounded animate-pulse my-1"></div>
          <p v-else class="text-4xl font-display font-bold text-amber-700">{{ adsOpsStats?.lowBalanceAccounts || 0 }}</p>
          <p class="text-xs text-amber-500 mt-2">Saldo &lt; 20% dari limit</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div class="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-bold text-slate-900">Aktivitas Terkini</h3>
          <select v-model="adsOpsPlatformFilter" class="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:border-orange-500">
            <option value="all">Semua Platform</option>
            <option value="Meta">Meta</option>
            <option value="Google">Google</option>
            <option value="TikTok">TikTok</option>
          </select>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="pendingAdsOps" class="p-4 space-y-4">
            <div v-for="i in 3" :key="i" class="h-12 bg-slate-100 rounded animate-pulse"></div>
          </div>
          <div v-else-if="!adsOpsStats?.recentBudgets?.length" class="p-8 text-center text-slate-400 text-sm">
            Belum ada aktivitas.
          </div>
          <div v-else class="divide-y divide-slate-100">
            <div v-for="act in adsOpsStats?.recentBudgets" :key="act.id" class="p-3 hover:bg-slate-50 flex items-center justify-between transition-colors rounded-lg">
              <div>
                <p class="text-sm font-bold text-slate-800 flex items-center flex-wrap gap-2">
                  {{ act.users?.full_name || 'Klien' }} - {{ act.ad_accounts?.account_name || 'Akun' }}
                  <div v-if="act.ad_accounts?.platform?.toLowerCase() === 'meta'" class="w-4 h-4 flex items-center justify-center shrink-0" title="Meta">
                    <img src="/icon-meta-ads.png" alt="Meta" class="w-4 h-4 object-contain" />
                  </div>
                  <div v-else-if="act.ad_accounts?.platform?.toLowerCase() === 'google'" class="w-4 h-4 flex items-center justify-center shrink-0" title="Google">
                    <svg viewBox="0 0 24 24" class="w-4 h-4">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div v-else-if="act.ad_accounts?.platform?.toLowerCase() === 'tiktok'" class="w-4 h-4 flex items-center justify-center shrink-0 bg-black rounded-[4px]" title="TikTok">
                    <svg viewBox="0 0 448 512" class="w-[10px] h-[10px]" fill="white"><path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 1.86 22.17h0A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14Z"/></svg>
                  </div>
                  <div v-else class="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200" :title="act.ad_accounts?.platform">
                    <span class="text-[8px] font-bold">{{ act.ad_accounts?.platform ? act.ad_accounts.platform.substring(0,1).toUpperCase() : '?' }}</span>
                  </div>
                </p>
                <p class="text-xs text-slate-500 mt-0.5">Alokasi: <span class="font-bold">{{ formatCurrencyShort(act.amount) }}</span></p>
              </div>
              <div class="text-right">
                <span class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  :class="{
                    'bg-green-100 text-green-700': act.status === 'approved',
                    'bg-red-100 text-red-700': act.status === 'rejected',
                  }">
                  {{ act.status === 'approved' ? 'Disetujui' : 'Ditolak' }}
                </span>
                <p class="text-[10px] text-slate-400 mt-1">
                  {{ new Date(act.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import VueApexCharts from 'vue3-apexcharts'
import { ShieldCheck, Megaphone, TrendingUp, WalletCards, Info, RefreshCw, Calendar, Users, AlertTriangle, CheckCircle2, XCircle, UserX, Clock, ArrowRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const supabase = useSupabaseClient()
const { user } = useAuth()
const userRole = computed(() => user.value?.user_metadata?.role || 'admin')

const showDatePopover = ref(false)

// Default range: 30 hari terakhir
const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

// Format YYYY-MM-DD untuk input type="date"
const formatDateForInput = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const tempStartDate = ref(formatDateForInput(thirtyDaysAgo))
const tempEndDate = ref(formatDateForInput(today))

const startDate = ref(formatDateForInput(thirtyDaysAgo))
const endDate = ref(formatDateForInput(today))

const applyDateFilter = () => {
  startDate.value = tempStartDate.value
  endDate.value = tempEndDate.value
  selectedFilter.value = 'custom'
  showDatePopover.value = false
}

const selectedFilter = ref('30')

watch(selectedFilter, (val) => {
  if (val === 'custom') return
  
  const d = new Date()
  if (val === '7') {
    const past = new Date()
    past.setDate(d.getDate() - 7)
    startDate.value = formatDateForInput(past)
    endDate.value = formatDateForInput(d)
  } else if (val === '30') {
    const past = new Date()
    past.setDate(d.getDate() - 30)
    startDate.value = formatDateForInput(past)
    endDate.value = formatDateForInput(d)
  } else if (val === 'month') {
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
    startDate.value = formatDateForInput(firstDay)
    endDate.value = formatDateForInput(d)
  }
  
  // Update temp variables so the calendar UI stays in sync
  tempStartDate.value = startDate.value
  tempEndDate.value = endDate.value
})

// Format tampilan tanggal di tombol filter (Misal: 18 Jun 2026 - 18 Jul 2026)
const dateRangeText = computed(() => {
  if (!startDate.value || !endDate.value) return 'Pilih Rentang Waktu'
  
  const format = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  
  return `${format(startDate.value)} - ${format(endDate.value)}`
})

interface AdminStats {
  kyc: number;
  ads: number;
  topup: number;
  withdraw: number;
  totalUsers: number;
  totalAds: number;
  totalFee: number;
  verifiedUsers: number;
  uniqueClients: number;
  recentTxs: {
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
  }[];
  chartSeries: { name: string; data: number[] }[];
  userChartSeries: { name: string; data: number[] }[];
  chartLabels: string[];
  expiringRentals: number;
  lowBalanceRentals: number;
  lowLimitRentals: number;
}

// Fetch real metrics from Backend API (Bypass RLS)
const { data: stats, pending, refresh } = useFetch<AdminStats>('/api/admin/stats', {
  query: {
    startDate,
    endDate
  },
  watch: [startDate, endDate]
})

const adsOpsPlatformFilter = ref('all')

// Fetch Ads Ops stats
const { data: adsOpsStats, pending: pendingAdsOps, refresh: refreshAdsOps } = useFetch<any>('/api/admin/ads-ops-stats', {
  query: { platform: adsOpsPlatformFilter },
  watch: [adsOpsPlatformFilter]
})

// Fetch Audit stats (admin_compliance)
const { data: auditStats, pending: pendingAudit, refresh: refreshAudit } = useFetch<any>('/api/admin/audit-stats')

const refreshAll = () => {
  refresh()
  refreshAdsOps()
  refreshAudit()
}

// Helper untuk format rupiah yang singkat
const formatCurrency = (val: number) => {
  if (val === 0) return 'Rp 0'
  if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1).replace('.0', '')}M`
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')} Juta`
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

const formatCurrencyShort = (val: number) => {
  if (!val) return 'Rp 0'
  if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1).replace('.0', '')}M`
  if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')} Juta`
  if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`
  return `Rp ${val}`
}

const chartTotal = computed(() => {
  if (!stats.value?.chartSeries?.[0]?.data) return 0
  return stats.value.chartSeries[0].data.reduce((a, b) => a + b, 0)
})

const chartHighest = computed(() => {
  if (!stats.value?.chartSeries?.[0]?.data) return { val: 0, label: '-' }
  const data = stats.value.chartSeries[0].data
  const labels = stats.value?.chartLabels || []
  const maxVal = Math.max(...data)
  const maxIdx = data.indexOf(maxVal)
  const label = labels[maxIdx] || '-'
  return { val: maxVal, label }
})

// Konfigurasi Grafik ApexCharts
const chartOptions = computed<any>(() => ({
  chart: {
    type: 'area',
    toolbar: { 
      show: true,
      tools: {
        download: false,
        selection: false,
        zoom: false, // hide the drag-to-zoom icon
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true
      }
    },
    fontFamily: 'Inter, sans-serif',
    dropShadow: {
      enabled: true,
      color: '#f97316',
      top: 10,
      left: 0,
      blur: 10,
      opacity: 0.15
    }
  },
  colors: ['#f97316'], // Orange
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  markers: {
    size: 4,
    colors: ['#f97316'],
    strokeColors: '#fff',
    strokeWidth: 2,
    hover: { size: 6 }
  },
  xaxis: {
    categories: stats.value?.chartLabels || [],
    tickPlacement: 'on',
    labels: { 
      rotate: 0,
      style: { colors: '#64748b', fontWeight: 500 } 
    },
    axisBorder: { show: false },
    axisTicks: { show: false },
    crosshairs: {
      stroke: { color: '#cbd5e1', width: 1, dashArray: 3 }
    }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => {
        if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')}Jt`
        if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`
        return `Rp ${val}`
      },
      style: { colors: '#64748b', fontWeight: 500 }
    }
  },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4,
    padding: { top: 0, right: 0, bottom: 0, left: 10 }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.65,
      opacityTo: 0.05,
      stops: [0, 100]
    }
  },
  tooltip: {
    theme: 'light',
    custom: function({series, seriesIndex, dataPointIndex, w}: any) {
      const val = series[seriesIndex][dataPointIndex]
      const label = w.globals.labels[dataPointIndex]
      const formatted = formatCurrencyShort(val)
      return `<div style="padding: 6px 12px; font-size: 12px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 8px;">
                ${label} <span style="color: #f97316">&bull;</span> <span style="color: #f97316">${formatted}</span>
              </div>`
    }
  }
}))

const userChartOptions = computed<any>(() => ({
  chart: {
    type: 'bar',
    toolbar: { 
      show: true,
      tools: {
        download: false,
        selection: false,
        zoom: false,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true
      }
    },
    fontFamily: 'Inter, sans-serif'
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '40%',
    }
  },
  colors: ['#3b82f6'], // Blue
  dataLabels: { enabled: false },
  xaxis: {
    categories: stats.value?.chartLabels || [],
    tickPlacement: 'on',
    labels: { 
      style: { colors: '#64748b', fontWeight: 500 } 
    },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => Math.round(val),
      style: { colors: '#64748b', fontWeight: 500 }
    }
  },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4,
    padding: { top: 0, right: 0, bottom: 0, left: 10 }
  },
  tooltip: {
    theme: 'light',
    custom: function({series, seriesIndex, dataPointIndex, w}: any) {
      const val = series[seriesIndex][dataPointIndex]
      const label = w.globals.labels[dataPointIndex]
      return `<div style="padding: 6px 12px; font-size: 12px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 8px;">
                ${label} <span style="color: #3b82f6">&bull;</span> <span style="color: #3b82f6">${val} Orang</span>
              </div>`
    }
  }
}))

// ─── Chart Options: Audit KYC Trend ──────────────────────────────────────────
const auditChartOptions = computed<any>(() => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    dropShadow: {
      enabled: true,
      color: ['#f97316', '#22c55e'],
      top: 8,
      blur: 8,
      opacity: 0.1
    }
  },
  colors: ['#f97316', '#22c55e'],
  stroke: { curve: 'smooth', width: [2.5, 2.5] },
  markers: {
    size: 5,
    strokeColors: '#fff',
    strokeWidth: 2,
    hover: { size: 7 }
  },
  dataLabels: { enabled: false },
  legend: {
    position: 'top',
    horizontalAlign: 'right',
    labels: { colors: '#64748b' }
  },
  xaxis: {
    categories: auditStats.value?.chartLabels || [],
    labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
    axisBorder: { show: false },
    axisTicks: { show: false }
  },
  yaxis: {
    min: 0,
    labels: {
      formatter: (val: number) => Math.round(val),
      style: { colors: '#94a3b8', fontSize: '11px' }
    }
  },
  grid: {
    borderColor: '#f1f5f9',
    strokeDashArray: 4,
    padding: { top: 0, right: 10, bottom: 0, left: 0 }
  },
  tooltip: {
    theme: 'light',
    shared: true,
    intersect: false
  }
}))
</script>
