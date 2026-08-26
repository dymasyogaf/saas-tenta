<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Manajemen Akun Iklan (Ads Ops)</h2>
        <p class="text-slate-500 text-sm mt-1">Buat akun iklan di platform, lalu masukkan ID-nya ke sini untuk dihubungkan ke dasbor Klien.</p>
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-3">
        <button v-if="isAdmin" @click="resetDev" class="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm w-full sm:w-auto">
          <Trash2 class="w-4 h-4" /> Reset Dev (Wipe Data)
        </button>
        <button @click="() => refreshAll()" class="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm w-full sm:w-auto">
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': pending || pendingBudget }" /> Segarkan Data
        </button>
      </div>
    </div>

    <!-- Mode Switcher -->
    <div class="flex overflow-x-auto gap-2 mb-4 bg-slate-100 p-1 rounded-xl w-full sm:w-max max-w-full scrollbar-hide">
      <button @click="viewMode = 'akun'" :class="viewMode === 'akun' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'" class="shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
        Pembuatan Akun Iklan
        <span v-if="newList.length > 0" class="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-[10px]">{{ newList.length }}</span>
      </button>
      <button @click="viewMode = 'anggaran'" :class="viewMode === 'anggaran' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'" class="shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
        Top Up Anggaran
        <span v-if="pendingBudgetList.length > 0" class="bg-orange-100 text-orange-700 py-0.5 px-2 rounded-full text-[10px]">{{ pendingBudgetList.length }}</span>
      </button>
      <button @click="viewMode = 'expiring'" :class="viewMode === 'expiring' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'" class="shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
        Sewa Mau Habis
        <span v-if="expiringRentals.length > 0" class="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-[10px]">{{ expiringRentals.length }}</span>
      </button>
      <button @click="viewMode = 'low-balance'" :class="viewMode === 'low-balance' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'" class="shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
        Sisa Saldo Iklan Menipis
        <span v-if="lowBalanceRentals.length > 0" class="bg-orange-100 text-orange-700 py-0.5 px-2 rounded-full text-[10px]">{{ lowBalanceRentals.length }}</span>
      </button>
      <button @click="viewMode = 'low-limit'" :class="viewMode === 'low-limit' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'" class="shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
        Sisa Limit Menipis
        <span v-if="lowLimitRentals.length > 0" class="bg-yellow-100 text-yellow-700 py-0.5 px-2 rounded-full text-[10px]">{{ lowLimitRentals.length }}</span>
      </button>
      <button @click="viewMode = 'active-accounts'" :class="viewMode === 'active-accounts' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'" class="shrink-0 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
        Daftar Akun Aktif
        <span v-if="activeAccounts.length > 0" class="bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px]">{{ activeAccounts.length }}</span>
      </button>
    </div>

    <template v-if="viewMode === 'akun'">
      <!-- Alert Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Megaphone class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-bold text-blue-900">Ruang Eksekusi Tim Iklan</h3>
          <p class="text-xs text-blue-700 mt-1">Daftar di bawah ini adalah klien yang <b>baru saja mengajukan</b> pembuatan akun iklan. Tugas Anda adalah membuatkan akun iklan di Business Manager Meta/TikTok/Google mereka, lalu menyalin <b>Ad Account ID</b> yang terbentuk ke dalam kolom di bawah ini.</p>
        </div>
      </div>

      <!-- Tabs/Filter -->
      <div class="flex border-b border-slate-200 mt-6 gap-6">
        <button 
          @click="activeTab = 'new'"
          class="pb-3 text-sm font-semibold transition-colors border-b-2"
          :class="activeTab === 'new' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          Permintaan Baru 
          <span class="ml-1 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-[10px]">{{ newList.length }}</span>
        </button>
        <button 
          @click="activeTab = 'processing'"
          class="pb-3 text-sm font-semibold transition-colors border-b-2"
          :class="activeTab === 'processing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          Perlu Eksekusi
          <span class="ml-1 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px]">{{ processingList.length }}</span>
        </button>
        <button 
          @click="activeTab = 'completed'"
          class="pb-3 text-sm font-semibold transition-colors border-b-2"
          :class="activeTab === 'completed' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          Sudah Diberi ID Akun
        </button>
      </div>

      <!-- Table Container -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[800px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th class="px-6 py-4">Klien & Target URL</th>
                <th class="px-6 py-4">Platform & Info Akun</th>
                <th class="px-6 py-4 w-72">Ad Account ID</th>
                <th class="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Loading Skeleton -->
              <tr v-if="pending" v-for="i in 3" :key="'skel'+i" class="animate-pulse bg-white">
                <td class="px-6 py-4">
                  <div class="h-4 w-32 bg-ink-200 rounded mb-2"></div>
                  <div class="h-3 w-48 bg-ink-200 rounded"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-ink-200 rounded-full"></div>
                    <div class="h-4 w-24 bg-ink-200 rounded"></div>
                  </div>
                </td>
                <td class="px-6 py-4"><div class="h-10 w-full bg-ink-200 rounded-lg"></div></td>
                <td class="px-6 py-4"><div class="h-10 w-24 bg-ink-200 rounded-lg mx-auto"></div></td>
              </tr>
              
              <!-- Empty State -->
              <tr v-else-if="currentList.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                  <CheckCircle2 v-if="activeTab === 'new'" class="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <CheckCircle2 v-else-if="activeTab === 'processing'" class="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <Megaphone v-else class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p class="font-medium text-slate-600">
                    {{ activeTab === 'new' ? 'Tidak ada permintaan baru.' : (activeTab === 'processing' ? 'Hore! Semua akun klien sudah dieksekusi.' : 'Belum ada data riwayat akun.') }}
                  </p>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr v-else v-for="req in currentList" :key="req.id" class="hover:bg-slate-50 transition-colors group">
                <!-- Klien Info -->
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-900">{{ req.users?.full_name || 'Tanpa Nama' }}</p>
                  <div class="flex items-center gap-1 mt-1 text-slate-500">
                    <Link class="w-3 h-3" />
                    <a v-if="req.target_url" :href="req.target_url" target="_blank" class="text-xs hover:text-blue-600 hover:underline line-clamp-1 max-w-[200px]">
                      {{ req.target_url }}
                    </a>
                    <span v-else class="text-xs italic text-slate-400">Tanpa Web</span>
                  </div>
                  <div v-if="req.details?.social_link" class="flex items-center gap-1 mt-1 text-slate-500">
                    <span class="text-[10px] font-bold text-blue-500 uppercase px-1 py-0.5 bg-blue-50 rounded">Sosmed</span>
                    <a :href="req.details.social_link" target="_blank" class="text-xs hover:text-blue-600 hover:underline line-clamp-1 max-w-[150px]">
                      {{ req.details.social_link }}
                    </a>
                  </div>
                  <p class="text-[10px] text-slate-400 mt-2">Diajukan: {{ new Date(req.created_at).toLocaleDateString('id-ID') }}</p>
                </td>

                <!-- Platform Info -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 mb-2">
                    <img :src="getPlatformLogo(req.platform)" class="w-5 h-5 object-contain" />
                    <span class="font-bold text-slate-800 text-xs">{{ req.platform }}</span>
                  </div>
                  <div class="text-[11px] text-slate-600 space-y-0.5">
                    <p v-if="req.details?.full_name"><span class="font-semibold">Nama KTP:</span> {{ req.details.full_name }}</p>
                    
                    <template v-if="req.platform.includes('TikTok')">
                      <p v-if="req.details?.bm_id"><span class="font-semibold">BC ID:</span> {{ req.details.bm_id }}</p>
                    </template>
                    <template v-else-if="req.platform.includes('Google')">
                      <p v-if="req.details?.shared_email"><span class="font-semibold">Email:</span> {{ req.details.shared_email }}</p>
                    </template>
                    <template v-else>
                      <p v-if="req.details?.bm_id"><span class="font-semibold">BM ID:</span> {{ req.details.bm_id }}</p>
                    </template>

                    <p><span class="font-semibold">Kategori:</span> {{ req.details?.ad_category || '-' }}</p>
                  </div>
                </td>

                <!-- Input Ad Account ID -->
                <td class="px-6 py-4">
                  <!-- Audit: tampilkan read-only saja -->
                  <template v-if="isAuditMode">
                    <div v-if="inputModels[req.id]" class="flex items-center gap-1.5">
                      <Hash class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span class="text-sm font-mono text-slate-700">{{ inputModels[req.id] }}</span>
                    </div>
                    <span v-else class="text-xs text-slate-400 italic">Belum diisi</span>
                  </template>
                  <!-- Normal mode -->
                  <template v-else>
                    <div v-if="activeTab !== 'new'" class="space-y-3">
                      <div class="relative">
                        <input 
                          v-model="inputModels[req.id]"
                          @input="formatInput(req.id, req.platform)"
                          type="text" 
                          placeholder="ID: Misal 123456789" 
                          class="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          :disabled="isSubmitting === req.id || (activeTab === 'completed' && !isEditing[req.id])"
                        />
                        <Hash class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <div class="relative">
                        <input 
                          v-model="inputNameModels[req.id]"
                          type="text" 
                          placeholder="Nama (Opsional): MP - KOSONG" 
                          class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                          :disabled="isSubmitting === req.id || (activeTab === 'completed' && !isEditing[req.id])"
                        />
                      </div>
                      <p class="text-[10px] text-slate-400 mt-1 italic">Nama akun akan diambil otomatis dari API atau gunakan nama di atas.</p>
                    </div>
                    <div v-else class="text-xs text-slate-400 italic">Menunggu persetujuan...</div>
                  </template>
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-center">
                  <!-- READ-ONLY MODE: Tim Audit -->
                  <template v-if="isAuditMode">
                    <!-- Tombol Hubungi WA jika masih pending/processing -->
                    <div v-if="activeTab === 'new' || activeTab === 'processing'" class="flex flex-col items-center gap-1.5">
                      <button
                        @click="openContactModal(req)"
                        :class="getFollowUpTime(req.id)
                          ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'"
                        class="flex items-center justify-center gap-1.5 px-3 py-2 border text-xs font-bold rounded-lg transition-all w-full"
                      >
                        <MessageCircle class="w-3.5 h-3.5" />
                        {{ getFollowUpTime(req.id) ? 'Follow up lagi' : 'Hubungi Tim' }}
                      </button>
                      <p v-if="getFollowUpTime(req.id)" class="text-[10px] text-green-600 font-medium">
                        Sudah di-follow up {{ getFollowUpTime(req.id) }}
                      </p>
                    </div>
                    <!-- Badge saja jika sudah selesai -->
                    <span v-else class="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      ✓ Selesai
                    </span>
                  </template>

                  <!-- NORMAL MODE: Tim Iklan / Super Admin -->
                  <template v-else>
                    <template v-if="activeTab === 'new'">
                      <div class="flex flex-col gap-2">
                        <button 
                          @click="processAction(req.id, 'approve', 'akun')"
                          :disabled="isSubmitting === req.id"
                          class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                        >
                          <span v-if="isSubmitting === req.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Setujui
                        </button>
                        <button 
                          @click="processAction(req.id, 'reject', 'akun')"
                          :disabled="isSubmitting === req.id"
                          class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                        >
                          Tolak
                        </button>
                      </div>
                    </template>
                    <template v-else-if="activeTab === 'processing' || isEditing[req.id]">
                      <button 
                        @click="processAction(req.id, 'save_id', 'akun')"
                        :disabled="!inputModels[req.id] || isSubmitting === req.id"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                      >
                        <span v-if="isSubmitting === req.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Simpan ID
                      </button>
                      <button v-if="isEditing[req.id]" @click="cancelEdit(req.id, req.details?.ad_account_id, req.details?.ad_account_name)" class="text-[10px] text-slate-500 hover:text-slate-700 mt-2 font-medium">Batal</button>
                    </template>
                    <template v-else>
                      <div class="flex flex-col gap-2">
                        <button 
                          @click="startEdit(req.id)"
                          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                        >
                          <Edit2 class="w-3 h-3" /> Edit ID
                        </button>
                        <button 
                          @click="processAction(req.id, 'delete', 'akun')"
                          :disabled="isSubmitting === req.id"
                          class="px-4 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                        >
                          <span v-if="isSubmitting === req.id && currentAction === 'delete'" class="w-3 h-3 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin"></span>
                          <Trash2 v-else class="w-3 h-3" /> Hapus
                        </button>
                      </div>
                    </template>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template v-else-if="viewMode === 'anggaran'">
      <!-- Alert Info -->
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
        <Megaphone class="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-bold text-orange-900">Alokasi Anggaran Iklan</h3>
          <p class="text-xs text-orange-700 mt-1">Daftar klien yang melakukan penambahan anggaran. <b>Tugas Anda:</b> Tambahkan saldo di Business Manager klien terlebih dahulu. Jika sudah berhasil masuk, barulah klik <b>Setujui</b> di sini agar saldo klien terpotong di sistem.</p>
        </div>
      </div>

      <!-- Tabs/Filter -->
      <div class="flex border-b border-slate-200 mt-6 gap-6">
        <button 
          @click="budgetTab = 'new'"
          class="pb-3 text-sm font-semibold transition-colors border-b-2"
          :class="budgetTab === 'new' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          Permintaan Baru 
          <span class="ml-1 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-[10px]">{{ pendingBudgetList.length }}</span>
        </button>
        <button 
          @click="budgetTab = 'history'"
          class="pb-3 text-sm font-semibold transition-colors border-b-2"
          :class="budgetTab === 'history' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          Riwayat
        </button>
      </div>

      <!-- Table Container -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-4">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[800px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th class="px-6 py-4">Klien</th>
                <th class="px-6 py-4">Akun Iklan</th>
                <th class="px-6 py-4">Nominal</th>
                <th class="px-6 py-4 text-center">Aksi / Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Loading Skeleton -->
              <tr v-if="pendingBudget" v-for="i in 3" :key="'skel_b'+i" class="animate-pulse bg-white">
                <td class="px-6 py-4">
                  <div class="h-4 w-32 bg-ink-200 rounded mb-2"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="h-4 w-24 bg-ink-200 rounded"></div>
                  </div>
                </td>
                <td class="px-6 py-4"><div class="h-4 w-24 bg-ink-200 rounded"></div></td>
                <td class="px-6 py-4"><div class="h-10 w-24 bg-ink-200 rounded-lg mx-auto"></div></td>
              </tr>
              
              <!-- Empty State -->
              <tr v-else-if="currentBudgetList.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                  <CheckCircle2 v-if="budgetTab === 'new'" class="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <Megaphone v-else class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p class="font-medium text-slate-600">
                    {{ budgetTab === 'new' ? 'Tidak ada permintaan alokasi anggaran baru.' : 'Belum ada riwayat alokasi anggaran.' }}
                  </p>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr v-else v-for="req in currentBudgetList" :key="req.id" class="hover:bg-slate-50 transition-colors group">
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-900">{{ req.users?.full_name || 'Tanpa Nama' }}</p>
                  <p class="text-[10px] text-slate-400 mt-1">Diajukan: {{ new Date(req.created_at).toLocaleDateString('id-ID') }} {{ new Date(req.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) }}</p>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 mb-1">
                    <img v-if="req.ad_accounts?.platform" :src="getPlatformLogo(req.ad_accounts.platform)" class="w-4 h-4 object-contain" />
                    <span class="font-bold text-slate-800 text-xs">{{ req.ad_accounts?.account_name || '-' }}</span>
                  </div>
                  <p class="text-xs text-slate-500 font-mono">{{ req.ad_accounts?.account_id || '-' }}</p>
                </td>
                <td class="px-6 py-4">
                  <p class="font-bold text-orange-600 text-base">{{ formatRupiah(req.amount) }}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <!-- READ-ONLY: Tim Audit -->
                  <template v-if="isAuditMode">
                    <div v-if="budgetTab === 'new'" class="flex flex-col items-center gap-1.5">
                      <button
                        @click="openContactModal(req, 'anggaran')"
                        :class="getFollowUpTime(req.id)
                          ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                          : 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700'"
                        class="flex items-center justify-center gap-1.5 px-3 py-2 border text-xs font-bold rounded-lg transition-all w-full"
                      >
                        <MessageCircle class="w-3.5 h-3.5" />
                        {{ getFollowUpTime(req.id) ? 'Follow up lagi' : 'Hubungi Tim' }}
                      </button>
                      <p v-if="getFollowUpTime(req.id)" class="text-[10px] text-green-600 font-medium">
                        Sudah di-follow up {{ getFollowUpTime(req.id) }}
                      </p>
                    </div>
                    <span v-else class="px-3 py-1 rounded-full text-xs font-bold capitalize" :class="req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                      {{ req.status }}
                    </span>
                  </template>

                  <!-- NORMAL MODE: Tim Iklan -->
                  <template v-else>
                    <template v-if="budgetTab === 'new'">
                      <div class="flex flex-col gap-2">
                        <button 
                          @click="processAction(req.id, 'approve', 'anggaran')"
                          :disabled="isSubmitting === req.id"
                          class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                        >
                          <span v-if="isSubmitting === req.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Setujui
                        </button>
                        <button 
                          @click="processAction(req.id, 'reject', 'anggaran')"
                          :disabled="isSubmitting === req.id"
                          class="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                        >
                          Tolak
                        </button>
                      </div>
                    </template>
                    <template v-else>
                      <span class="px-3 py-1 rounded-full text-xs font-bold capitalize" :class="req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                        {{ req.status }}
                      </span>
                      <p v-if="req.status === 'rejected' && req.rejection_reason" class="text-[10px] text-slate-500 mt-2 max-w-[200px] mx-auto line-clamp-2" :title="req.rejection_reason.replace(/<[^>]*>?/gm, '')">
                        {{ req.rejection_reason.replace(/<[^>]*>?/gm, '') }}
                      </p>
                    </template>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Mode Sewa Mau Habis -->
    <template v-else-if="viewMode === 'expiring'">
      <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <Megaphone class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-bold text-red-900">Perhatian: Sewa Segera Habis (H-7)</h3>
          <p class="text-xs text-red-700 mt-1">Daftar klien di bawah ini masa sewa akun iklannya akan habis dalam waktu kurang dari 7 hari. Silakan klik tombol Follow Up untuk menghubungi klien via WhatsApp.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[800px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th class="px-6 py-4">Klien & Kontak</th>
                <th class="px-6 py-4">Akun Iklan</th>
                <th class="px-6 py-4">Sisa Waktu</th>
                <th class="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="pendingExpiring" v-for="i in 3" :key="'exp-skel'+i" class="animate-pulse bg-white">
                <td class="px-6 py-4"><div class="h-4 w-32 bg-ink-200 rounded mb-2"></div></td>
                <td class="px-6 py-4"><div class="h-4 w-24 bg-ink-200 rounded mb-2"></div></td>
                <td class="px-6 py-4"><div class="h-4 w-20 bg-ink-200 rounded"></div></td>
                <td class="px-6 py-4"><div class="h-8 w-24 bg-ink-200 rounded-lg mx-auto"></div></td>
              </tr>
              
              <tr v-else-if="expiringRentals.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                  <CheckCircle2 class="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p class="font-medium text-slate-600">Aman! Tidak ada akun yang sewanya hampir habis.</p>
                </td>
              </tr>

              <tr v-else v-for="req in expiringRentals" :key="'exp'+req.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-900">{{ req.users?.full_name || 'Tanpa Nama' }}</p>
                  <p class="text-xs text-slate-500 mt-1 font-mono">{{ req.users?.phone || '-' }}</p>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 mb-1">
                    <img :src="getPlatformLogo(req.platform)" class="w-4 h-4 object-contain" />
                    <span class="font-bold text-slate-800 text-xs">{{ req.account_name || '-' }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500 font-mono">{{ req.account_id }}</p>
                </td>
                <td class="px-6 py-4">
                  <p class="font-bold text-red-600">
                    {{ Math.ceil((new Date(req.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) }} Hari Lagi
                  </p>
                  <p class="text-[10px] text-slate-500 mt-1">Exp: {{ new Date(req.subscription_expires_at).toLocaleDateString('id-ID') }}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <a v-if="req.users?.phone" :href="`https://wa.me/${req.users.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo Bapak/Ibu ' + (req.users?.full_name || '') + ', masa sewa akun iklan ' + req.platform + ' Anda akan habis dalam ' + Math.ceil((new Date(req.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) + ' hari. Apakah ingin diperpanjang?')}`" target="_blank" class="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">
                    <MessageCircle class="w-3.5 h-3.5" /> Follow Up WA
                  </a>
                  <span v-else class="text-xs text-slate-400 italic">No WA tidak tersedia</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Mode Saldo Menipis -->
    <template v-else-if="viewMode === 'low-balance'">
      <div class="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
        <WalletCards class="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-bold text-orange-900">Perhatian: Sisa Saldo Iklan Menipis (<= Rp 350.000)</h3>
          <p class="text-xs text-orange-700 mt-1">Daftar klien di bawah ini sisa saldo akun iklannya sudah menipis (tersisa <= Rp 350.000). Silakan klik tombol Follow Up untuk mengingatkan klien Top Up.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[800px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th class="px-6 py-4">Klien & Kontak</th>
                <th class="px-6 py-4">Akun Iklan</th>
                <th class="px-6 py-4">Sisa Saldo Iklan</th>
                <th class="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="pendingLowBalance" v-for="i in 3" :key="'lb-skel'+i" class="animate-pulse bg-white">
                <td class="px-6 py-4"><div class="h-4 w-32 bg-ink-200 rounded mb-2"></div></td>
                <td class="px-6 py-4"><div class="h-4 w-24 bg-ink-200 rounded mb-2"></div></td>
                <td class="px-6 py-4"><div class="h-4 w-20 bg-ink-200 rounded"></div></td>
                <td class="px-6 py-4"><div class="h-8 w-24 bg-ink-200 rounded-lg mx-auto"></div></td>
              </tr>
              
              <tr v-else-if="lowBalanceRentals.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                  <CheckCircle2 class="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p class="font-medium text-slate-600">Aman! Tidak ada akun yang sisa anggarannya kritis.</p>
                </td>
              </tr>

              <tr v-else v-for="req in lowBalanceRentals" :key="'lb'+req.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-900">{{ req.users?.full_name || 'Tanpa Nama' }}</p>
                  <p class="text-xs text-slate-500 mt-1 font-mono">{{ req.users?.phone || '-' }}</p>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 mb-1">
                    <img :src="getPlatformLogo(req.platform)" class="w-4 h-4 object-contain" />
                    <span class="font-bold text-slate-800 text-xs">{{ req.account_name || '-' }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500 font-mono">{{ req.account_id }}</p>
                </td>
                <td class="px-6 py-4">
                  <p class="font-bold text-orange-600">
                    {{ formatRupiah(req.saldo || 0) }}
                  </p>
                  <p class="text-[10px] text-slate-500 mt-1">Total Anggaran: {{ formatRupiah(req.limit_amount || 0) }}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <a v-if="req.users?.phone" :href="`https://wa.me/${req.users.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo Bapak/Ibu ' + (req.users?.full_name || '') + ', sisa saldo iklan pada akun ' + req.platform + ' (' + (req.account_name || '') + ') Anda saat ini tersisa ' + formatRupiah(req.saldo || 0) + '. Silakan lakukan Top Up agar iklan Anda tetap berjalan lancar.')}`" target="_blank" class="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">
                    <MessageCircle class="w-3.5 h-3.5" /> Follow Up WA
                  </a>
                  <span v-else class="text-xs text-slate-400 italic">No WA tidak tersedia</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Mode Sisa Limit Menipis -->
    <template v-else-if="viewMode === 'low-limit'">
      <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
        <Activity class="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-bold text-yellow-900">Perhatian: Sisa Limit Menipis (Tersisa < Rp 300.000)</h3>
          <p class="text-xs text-yellow-700 mt-1">Daftar klien di bawah ini pemakaian batas limit iklannya sudah sangat tinggi, sehingga sisa limitnya di bawah Rp 300.000. Silakan klik tombol Follow Up untuk mengingatkan klien Top Up.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[800px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th class="px-6 py-4">Klien & Kontak</th>
                <th class="px-6 py-4">Akun Iklan</th>
                <th class="px-6 py-4">Sisa Limit</th>
                <th class="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Skeleton Loading -->
              <tr v-if="pendingLowLimit">
                <td colspan="4" class="px-6 py-8 text-center text-slate-400">Loading data...</td>
              </tr>
              
              <!-- Empty State -->
              <tr v-else-if="lowLimitRentals.length === 0">
                <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                  <CheckCircle2 class="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p class="font-medium text-slate-600">Aman! Tidak ada akun yang sisa limitnya kritis.</p>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr v-else v-for="req in lowLimitRentals" :key="req.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-800">{{ req.users?.full_name || 'Tanpa Nama' }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">{{ req.users?.email }}</p>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 mb-1">
                    <img v-if="req.platform === 'meta'" src="/icon-meta-ads.png" class="w-4 h-4" alt="Meta" />
                    <img v-else-if="req.platform === 'tiktok'" src="/tiktok.svg" class="w-4 h-4 rounded-full" alt="TikTok" />
                    <img v-else src="/icon-google-ads.png" class="w-4 h-4" alt="Google" />
                    <span class="font-semibold text-slate-700">{{ req.account_name || 'Belum ada nama' }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500 font-mono">{{ req.account_id }}</p>
                </td>
                <td class="px-6 py-4">
                  <p class="font-bold text-yellow-600">
                    {{ formatRupiah((req.limit_amount || 0) - (req.weekly_spend || 0)) }}
                  </p>
                  <p class="text-[10px] text-slate-500 mt-1">Total Limit: {{ formatRupiah(req.limit_amount || 0) }}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <a v-if="req.users?.phone" :href="`https://wa.me/${req.users.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo Bapak/Ibu ' + (req.users?.full_name || '') + ', sisa limit pada akun iklan ' + req.platform + ' (' + (req.account_name || '') + ') Anda saat ini tersisa ' + formatRupiah((req.limit_amount || 0) - (req.weekly_spend || 0)) + '. Silakan lakukan pembayaran agar iklan Anda tidak terhenti.')}`" target="_blank" class="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">
                    <MessageCircle class="w-3.5 h-3.5" /> Follow Up WA
                  </a>
                  <span v-else class="text-xs text-slate-400 italic">No WA tidak tersedia</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Mode Daftar Akun Aktif -->
    <template v-else-if="viewMode === 'active-accounts'">
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Activity class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h3 class="text-sm font-bold text-blue-900">Daftar Akun Iklan Aktif</h3>
          <p class="text-xs text-blue-700 mt-1">Daftar di bawah ini adalah seluruh akun iklan yang saat ini berstatus aktif dan sedang digunakan oleh klien.</p>
        </div>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm min-w-[800px]">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th class="px-6 py-4">Klien & Kontak</th>
                <th class="px-6 py-4">Akun Iklan</th>
                <th class="px-6 py-4">Status & Waktu</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <!-- Skeleton Loading -->
              <tr v-if="pendingActiveAccounts">
                <td colspan="3" class="px-6 py-8 text-center text-slate-400">Loading data...</td>
              </tr>
              
              <!-- Empty State -->
              <tr v-else-if="activeAccounts.length === 0">
                <td colspan="3" class="px-6 py-12 text-center text-slate-500">
                  <p class="font-medium text-slate-600">Belum ada akun iklan yang aktif saat ini.</p>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr v-else v-for="account in activeAccounts" :key="account.id" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-800">{{ account.users?.full_name || 'Tanpa Nama' }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">{{ account.users?.email }}</p>
                  <p class="text-xs text-slate-500 font-mono">{{ account.users?.phone || '-' }}</p>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 mb-1">
                    <img v-if="account.platform === 'meta'" src="/icon-meta-ads.png" class="w-4 h-4" alt="Meta" />
                    <img v-else-if="account.platform === 'tiktok'" src="/tiktok.svg" class="w-4 h-4 rounded-full" alt="TikTok" />
                    <img v-else src="/icon-google-ads.png" class="w-4 h-4" alt="Google" />
                    <span class="font-semibold text-slate-700">{{ account.account_name || 'Belum ada nama' }}</span>
                  </div>
                  <p class="text-[10px] text-slate-500 font-mono">{{ account.account_id }}</p>
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase">{{ account.status }}</span>
                  <p class="text-[10px] text-slate-500 mt-2">Dibuat: {{ new Date(account.created_at).toLocaleDateString('id-ID') }}</p>
                  <p v-if="account.subscription_expires_at" class="text-[10px] text-slate-500 mt-0.5">Exp: {{ new Date(account.subscription_expires_at).toLocaleDateString('id-ID') }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Reject Modal -->
    <Teleport to="body">
<div v-if="isRejectModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-lg text-slate-900 flex items-center gap-2">
            <MessageSquareX class="w-5 h-5 text-red-500" />
            Tulis Alasan Penolakan
          </h3>
          <button @click="closeRejectModal" class="text-slate-400 hover:text-slate-900">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto">
          <p class="text-sm text-slate-600 mb-3">Silakan pilih atau tulis alasan penolakan untuk pengajuan ini. Pesan ini akan dikirimkan langsung ke notifikasi klien.</p>
          
          <!-- Template Khusus Pembuatan Akun -->
          <div v-if="rejectContext === 'akun'" class="flex flex-wrap gap-2 mb-4">
            <button @click="setTemplate('kebijakan', 'akun')" class="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 rounded-lg text-xs font-bold text-red-700 transition-colors">Melanggar Kebijakan</button>
            <button @click="setTemplate('saldo', 'akun')" class="px-3 py-1.5 bg-white border border-yellow-200 hover:bg-yellow-50 rounded-lg text-xs font-bold text-yellow-700 transition-colors">Saldo Tidak Cukup</button>
            <button @click="setTemplate('data_invalid', 'akun')" class="px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg text-xs font-bold text-blue-700 transition-colors">Data Tidak Valid</button>
            <button @click="setTemplate('empty')" class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-colors">Teks Kosong</button>
          </div>

          <!-- Template Khusus Anggaran -->
          <div v-else-if="rejectContext === 'anggaran'" class="flex flex-wrap gap-2 mb-4">
            <button @click="setTemplate('suspend', 'anggaran')" class="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 rounded-lg text-xs font-bold text-red-700 transition-colors">Akun Tersuspend</button>
            <button @click="setTemplate('limit', 'anggaran')" class="px-3 py-1.5 bg-white border border-yellow-200 hover:bg-yellow-50 rounded-lg text-xs font-bold text-yellow-700 transition-colors">Kena Limit Platform</button>
            <button @click="setTemplate('empty')" class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 transition-colors">Teks Kosong</button>
          </div>

          <ClientOnly>
            <div class="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 bg-white">
              <QuillEditor theme="snow" v-model:content="rejectReason" contentType="html" class="min-h-[200px]" :toolbar="['bold', 'italic', 'underline', { 'list': 'ordered'}, { 'list': 'bullet' }, 'clean']" />
            </div>
            <template #fallback>
              <textarea v-model="rejectReason" rows="6" placeholder="Memuat editor..." class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-sm"></textarea>
            </template>
          </ClientOnly>
        </div>
        
        <div class="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button @click="closeRejectModal" class="px-5 py-2.5 text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl font-bold text-sm transition-colors">
            Batal
          </button>
          <button @click="submitReject" :disabled="isSubmitting === selectedRequestId || !rejectReason.trim()" class="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
            <span v-if="isSubmitting === selectedRequestId" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Kirim Penolakan
          </button>
        </div>
      </div>
    </div>
    </Teleport>

  </div>

  <!-- Modal Hubungi Tim Iklan (hanya untuk Tim Audit) -->
  <ModalContactAdsTeamModal
    v-if="isContactModalOpen"
    :request="contactRequest"
    :type="contactType"
    @close="isContactModalOpen = false"
    @contacted="handleContacted"
  />
</template>

<script setup lang="ts">
import { RefreshCw, Megaphone, Link, Hash, CheckCircle2, Edit2, Trash2, MessageSquareX, X, MessageCircle, Activity, WalletCards } from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'] // Harusnya dilindungi middleware admin_ads_ops / super_admin
})

const { csrf } = useCsrf()

const user = useSupabaseUser()
const isAdmin = computed(() => {
  const role = user.value?.user_metadata?.role || user.value?.app_metadata?.role
  return role === 'admin' || role === 'super_admin'
})

// Mode read-only untuk Tim Audit (admin_compliance)
const userRole = computed(() => user.value?.user_metadata?.role || user.value?.app_metadata?.role || '')
const isAuditMode = computed(() => userRole.value === 'admin_compliance')

// State modal kontak WA
const isContactModalOpen = ref(false)
const contactRequest = ref<any>(null)
const contactType = ref<'akun' | 'anggaran'>('akun')

// Tracking follow-up via localStorage
const FOLLOWUP_KEY = 'tentaklik_audit_followups'
const followUpTracker = ref<Record<string, string>>({})

// Load dari localStorage saat mount
onMounted(() => {
  try {
    const saved = localStorage.getItem(FOLLOWUP_KEY)
    if (saved) followUpTracker.value = JSON.parse(saved)
  } catch {}
})

const markFollowedUp = (id: string) => {
  followUpTracker.value[id] = new Date().toISOString()
  localStorage.setItem(FOLLOWUP_KEY, JSON.stringify(followUpTracker.value))
}

const getFollowUpTime = (id: string) => {
  const iso = followUpTracker.value[id]
  if (!iso) return null
  return new Date(iso).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
}

const openContactModal = (req: any, type: 'akun' | 'anggaran' = 'akun') => {
  contactRequest.value = req
  contactType.value = type
  isContactModalOpen.value = true
}

const handleContactClose = () => {
  // Hanya mark jika user sudah klik WA (modal emits 'contacted' saat WA terbuka)
  isContactModalOpen.value = false
}

const handleContacted = (id: string) => {
  markFollowedUp(id)
  isContactModalOpen.value = false
}

const route = useRoute()
const viewMode = ref<'akun' | 'anggaran' | 'expiring' | 'low-balance' | 'low-limit' | 'active-accounts'>((route.query.tab as any) || 'akun')

watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    viewMode.value = newTab as any
  }
})
const activeTab = ref('new')
const budgetTab = ref('new')
const isSubmitting = ref<string | null>(null)
const currentAction = ref<string | null>(null)
const inputModels = ref<Record<string, string>>({})
const inputNameModels = ref<Record<string, string>>({})

const isEditing = ref<Record<string, boolean>>({})

// Reject Modal State
const isRejectModalOpen = ref(false)
const selectedRequestId = ref<string | null>(null)
const rejectReason = ref('')
const rejectContext = ref<'akun' | 'anggaran'>('akun')

const openRejectModal = (id: string, context: 'akun' | 'anggaran') => {
  selectedRequestId.value = id
  rejectContext.value = context
  rejectReason.value = ''
  isRejectModalOpen.value = true
}

const closeRejectModal = () => {
  isRejectModalOpen.value = false
  selectedRequestId.value = null
  rejectReason.value = ''
}

const setTemplate = (type: string, context: 'akun' | 'anggaran' = 'akun') => {
  if (context === 'akun') {
    if (type === 'kebijakan') {
      rejectReason.value = `<p>Mohon maaf, pengajuan akun iklan Anda <strong>ditolak</strong> karena <strong>URL/Website tujuan melanggar kebijakan kami</strong> atau kebijakan platform iklan (misal: mengandung unsur perjudian, pornografi, obat ilegal, dll).</p><p>Silakan perbaiki landing page Anda atau gunakan website lain sebelum mengajukan kembali.</p><p><br></p><p><em>- Tim Iklan Tentaklik</em></p>`
    } else if (type === 'saldo') {
      rejectReason.value = `<p>Mohon maaf, pengajuan Anda kami tolak karena <strong>Saldo Bersih</strong> Anda saat ini tidak mencukupi untuk membayar biaya sewa akun iklan ini.</p><p>Mohon lakukan top up terlebih dahulu dan pastikan tidak ada tunggakan sebelum membuat pengajuan kembali.</p><p><br></p><p><em>- Tim Iklan Tentaklik</em></p>`
    } else if (type === 'data_invalid') {
      rejectReason.value = `<p>Mohon maaf, pengajuan Anda kami tolak karena <strong>Data Akun yang diberikan tidak valid atau tidak lengkap</strong>.</p><p>Mohon periksa kembali Business Manager ID (BM ID) atau Email Anda saat mengisi form.</p><p><br></p><p><em>- Tim Iklan Tentaklik</em></p>`
    } else if (type === 'empty') {
      rejectReason.value = `<p><br></p><p><br></p><p><em>- Tim Iklan Tentaklik</em></p>`
    }
  } else if (context === 'anggaran') {
    if (type === 'suspend') {
      rejectReason.value = `<p>Mohon maaf, penambahan anggaran <strong>ditolak</strong> karena <strong>Akun Iklan Anda berstatus Suspended / Banned</strong> oleh platform.</p><p>Saldo Anda yang dibekukan telah kami kembalikan ke Saldo Utama. Harap hubungi tim support untuk pemulihan akun.</p><p><br></p><p><em>- Tim Iklan Tentaklik</em></p>`
    } else if (type === 'limit') {
      rejectReason.value = `<p>Mohon maaf, penambahan anggaran kami tolak karena <strong>Akun Iklan Anda sedang terkena limit harian</strong> dari platform, sehingga top up sebesar ini belum dapat diproses.</p><p>Saldo Anda telah dikembalikan. Silakan ajukan nominal yang lebih kecil atau tunggu hingga limit akun Anda naik.</p><p><br></p><p><em>- Tim Iklan Tentaklik</em></p>`
    } else if (type === 'empty') {
      rejectReason.value = `<p><br></p><p><br></p><p><em>- Tim Iklan Tentaklik</em></p>`
    }
  }
}

const submitReject = () => {
  if (selectedRequestId.value) {
    processAction(selectedRequestId.value, 'reject', rejectContext.value)
  }
}

// Fetch Data dari Server Endpoint (Bypass RLS)
const { data: requests, pending, refresh: refreshAkun } = useFetch<any[]>('/api/admin/ads-ops', { default: () => [] })
const { data: budgetRequests, pending: pendingBudget, refresh: refreshBudget } = useFetch<any[]>('/api/admin/ads/budget-requests', { default: () => [] })
const { data: expiringRentals, pending: pendingExpiring, refresh: refreshExpiring } = useFetch<any[]>('/api/admin/expiring-rentals', { default: () => [] })
const { data: lowBalanceRentals, pending: pendingLowBalance, refresh: refreshLowBalance } = useFetch<any[]>('/api/admin/low-balance', { default: () => [] })
const { data: lowLimitDataResponse, pending: pendingLowLimit, refresh: refreshLowLimit } = useFetch<any>('/api/admin/low-limit', { default: () => ({ data: [] }) })
const { data: activeAccounts, pending: pendingActiveAccounts, refresh: refreshActiveAccounts } = useFetch<any[]>('/api/admin/active-accounts', { default: () => [] })

const lowLimitRentals = computed(() => lowLimitDataResponse.value?.data || [])

const refreshAll = () => {
  refreshAkun()
  refreshBudget()
  refreshExpiring()
  refreshLowBalance()
  refreshLowLimit()
  refreshActiveAccounts()
}

// Inisialisasi Input Model jika data ditarik
watch(requests, (newVals) => {
  if (newVals) {
    newVals.forEach((req: any) => {
      // Set default input text dari database jika sudah ada
      if (!inputModels.value[req.id]) {
        inputModels.value[req.id] = req.details?.ad_account_id || ''
      }
      if (!inputNameModels.value[req.id]) {
        inputNameModels.value[req.id] = req.details?.ad_account_name || ''
      }
    })
  }
}, { immediate: true })

// Memisahkan list berdasarkan status dan ad_account_id
const newList = computed(() => {
  return requests.value.filter(req => req.status === 'pending_review')
})

const processingList = computed(() => {
  return requests.value.filter(req => req.status === 'processing')
})

const completedList = computed(() => {
  return requests.value.filter(req => req.status === 'approved' && req.details?.ad_account_id)
})

const currentList = computed(() => {
  if (activeTab.value === 'new') return newList.value
  if (activeTab.value === 'processing') return processingList.value
  return completedList.value
})

const pendingBudgetList = computed(() => {
  return budgetRequests.value.filter(req => req.status === 'pending')
})

const historyBudgetList = computed(() => {
  return budgetRequests.value.filter(req => req.status !== 'pending')
})

const currentBudgetList = computed(() => {
  if (budgetTab.value === 'new') return pendingBudgetList.value
  return historyBudgetList.value
})

const getPlatformLogo = (platform: string) => {
  const p = (platform || '').toLowerCase()
  if (p.includes('meta')) return '/icon-meta-ads.png'
  if (p.includes('tiktok')) return '/tiktok.svg'
  if (p.includes('google')) return '/icon-google-ads.png'
  return '/icon-meta-ads.png'
}

const formatRupiah = (angka: number) => {
  if (angka >= 999000000) return 'Unlimited'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka || 0)
}

const startEdit = (id: string) => {
  isEditing.value[id] = true
}

const formatInput = (id: string, platform: string) => {
  let val = inputModels.value[id] || ''
  const platStr = (platform || '').toLowerCase()
  
  if (platStr.includes('google') || platStr.includes('tiktok') || platStr.includes('meta') || platStr.includes('facebook')) {
    // Semua platform sekarang hanya angka murni (langsung hapus strip, spasi, & huruf)
    val = val.replace(/[^0-9]/g, '')
  }
  
  inputModels.value[id] = val
}

const cancelEdit = (id: string, originalValue: string, originalNameValue: string = '') => {
  isEditing.value[id] = false
  inputModels.value[id] = originalValue || ''
  inputNameModels.value[id] = originalNameValue || ''
}

const resetDev = async () => {
  if (!(await useConfirm().show({ message: '🔥 PERINGATAN DEV: Aksi ini akan menghapus SEMUA data Pengajuan (ad_account_requests) dan Akun Iklan (ad_accounts) di database. Lanjutkan?' }))) return
  const toast = useToast()
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch('/api/dev/reset-ads', { method: 'POST', headers: csrfToken ? { 'csrf-token': csrfToken } : {} })
    toast.addToast((res as any).message, 'success')
    await refreshAll()
    refreshNuxtData('admin-badges')
  } catch(e: any) {
    toast.addToast(e.data?.statusMessage || 'Gagal mereset data', 'error')
  }
}

const processAction = async (id: string, action: 'approve' | 'reject' | 'save_id' | 'delete', context: 'akun' | 'anggaran' = 'akun') => {
  // Jika action = reject tapi belum buka modal, buka modalnya dulu
  if (action === 'reject' && (!isRejectModalOpen.value || selectedRequestId.value !== id)) {
    openRejectModal(id, context)
    return
  }

  let adAccountId = undefined
  let rejectReasonToSubmit = undefined

  if (action === 'delete') {
    if (!(await useConfirm().show({ message: 'Apakah Anda yakin ingin menghapus pengajuan ini dari database secara permanen?' }))) return
  } else if (action === 'save_id' && context === 'akun') {
    const req = requests.value.find((r: any) => r.id === id)
    adAccountId = inputModels.value[id]?.trim()
    
    if (!adAccountId) {
      useToast().addToast('Harap isi ID Akun!', 'error')
      return
    }
  } else if (action === 'reject') {
    rejectReasonToSubmit = rejectReason.value
  }

  isSubmitting.value = id
  currentAction.value = action
  const toast = useToast()

  try {
    const csrfToken2 = unref(csrf)
    
    let endpoint = '/api/admin/ads-ops'
    let bodyData: any = {
      action: action,
      request_id: id,
      ad_account_id: adAccountId,
      ad_account_name: inputNameModels.value[id]?.trim(),
      reason: rejectReasonToSubmit
    }

    if (context === 'anggaran') {
      endpoint = '/api/admin/ads/budget-requests'
      bodyData = {
        action: action,
        request_id: id,
        reason: rejectReasonToSubmit
      }
    }

    const response = await $fetch(endpoint, {
      method: 'POST',
      headers: csrfToken2 ? { 'csrf-token': csrfToken2 } : {},
      body: bodyData
    })

    toast.addToast((response as any).message, 'success')
    isEditing.value[id] = false
    
    if (action === 'reject') {
      closeRejectModal()
    }
    
    await refreshAll()
    refreshNuxtData('admin-badges')
  } catch (error: any) {
    toast.addToast(error.data?.statusMessage || 'Gagal memproses aksi', 'error')
  } finally {
    isSubmitting.value = null
    currentAction.value = null
  }
}
</script>
