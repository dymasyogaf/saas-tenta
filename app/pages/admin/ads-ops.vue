<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Manajemen Akun Iklan (Ads Ops)</h2>
        <p class="text-slate-500 text-sm mt-1">Buat akun iklan di platform, lalu masukkan ID-nya ke sini untuk dihubungkan ke dasbor Klien.</p>
      </div>
      <button @click="refresh" class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': pending }" /> Segarkan Data
      </button>
    </div>

    <!-- Alert Info -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
      <Megaphone class="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-bold text-blue-900">Ruang Eksekusi Tim Iklan</h3>
        <p class="text-xs text-blue-700 mt-1">Daftar di bawah ini adalah klien yang pengajuannya sudah <b>Lolos Audit (Approved)</b>. Tugas Anda adalah membuatkan akun iklan di Business Manager Meta/TikTok/Google, lalu menyalin <b>Ad Account ID</b> yang terbentuk ke dalam kolom di bawah ini.</p>
      </div>
    </div>

    <!-- Tabs/Filter -->
    <div class="flex border-b border-slate-200 mt-6 gap-6">
      <button 
        @click="activeTab = 'pending'"
        class="pb-3 text-sm font-semibold transition-colors border-b-2"
        :class="activeTab === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        Perlu Eksekusi 
        <span class="ml-1 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-[10px]">{{ pendingList.length }}</span>
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
        <table class="w-full text-left text-sm">
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
                <div class="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                <div class="h-3 w-48 bg-slate-200 rounded"></div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-slate-200 rounded-full"></div>
                  <div class="h-4 w-24 bg-slate-200 rounded"></div>
                </div>
              </td>
              <td class="px-6 py-4"><div class="h-10 w-full bg-slate-200 rounded-lg"></div></td>
              <td class="px-6 py-4"><div class="h-10 w-24 bg-slate-200 rounded-lg mx-auto"></div></td>
            </tr>
            
            <!-- Empty State -->
            <tr v-else-if="currentList.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                <CheckCircle2 v-if="activeTab === 'pending'" class="w-12 h-12 text-green-400 mx-auto mb-3" />
                <Megaphone v-else class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p class="font-medium text-slate-600">
                  {{ activeTab === 'pending' ? 'Hore! Semua akun klien sudah dieksekusi.' : 'Belum ada data eksekusi.' }}
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
                  <a :href="req.target_url" target="_blank" class="text-xs hover:text-blue-600 hover:underline line-clamp-1 max-w-[200px]">
                    {{ req.target_url }}
                  </a>
                </div>
                <p class="text-[10px] text-slate-400 mt-2">Disetujui: {{ new Date(req.created_at).toLocaleDateString('id-ID') }}</p>
              </td>

              <!-- Platform Info -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-2 mb-2">
                  <img :src="getPlatformLogo(req.platform)" class="w-5 h-5 object-contain" />
                  <span class="font-bold text-slate-800 text-xs">{{ req.platform }}</span>
                </div>
                <div class="text-[11px] text-slate-600 space-y-0.5">
                  <p v-if="req.details?.bm_id"><span class="font-semibold">BM ID:</span> {{ req.details.bm_id }}</p>
                  <p v-if="req.details?.shared_email"><span class="font-semibold">Email:</span> {{ req.details.shared_email }}</p>
                  <p><span class="font-semibold">Tipe:</span> {{ req.details?.account_type || '-' }}</p>
                  <p><span class="font-semibold">Bisnis:</span> {{ req.details?.ad_category || '-' }}</p>
                </div>
              </td>

              <!-- Input Ad Account ID -->
              <td class="px-6 py-4">
                <div class="relative">
                  <input 
                    v-model="inputModels[req.id]"
                    type="text" 
                    placeholder="Misal: act_123456789" 
                    class="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                    :disabled="isSubmitting === req.id || (activeTab === 'completed' && !isEditing[req.id])"
                  />
                  <Hash class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-center">
                <template v-if="activeTab === 'pending' || isEditing[req.id]">
                  <button 
                    @click="saveAdAccountId(req.id)"
                    :disabled="!inputModels[req.id] || isSubmitting === req.id"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                  >
                    <span v-if="isSubmitting === req.id" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Simpan ID
                  </button>
                  <button v-if="isEditing[req.id]" @click="cancelEdit(req.id, req.details?.ad_account_id)" class="text-[10px] text-slate-500 hover:text-slate-700 mt-2 font-medium">Batal</button>
                </template>
                <template v-else>
                  <button 
                    @click="startEdit(req.id)"
                    class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center w-full gap-2"
                  >
                    <Edit2 class="w-3 h-3" /> Edit ID
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, Megaphone, Link, Hash, CheckCircle2, Edit2 } from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'] // Harusnya dilindungi middleware admin_ads_ops / super_admin
})

const activeTab = ref('pending')
const isSubmitting = ref<string | null>(null)
const inputModels = ref<Record<string, string>>({})
const isEditing = ref<Record<string, boolean>>({})

// Fetch Data dari Server Endpoint (Bypass RLS)
const { data: requests, pending, refresh } = useAsyncData('admin_adsops_list', async () => {
  return (await $fetch('/api/admin/ads-ops')) as any[]
}, { default: () => [] })

// Inisialisasi Input Model jika data ditarik
watch(requests, (newVals) => {
  if (newVals) {
    newVals.forEach((req: any) => {
      // Set default input text dari database jika sudah ada
      if (!inputModels.value[req.id]) {
        inputModels.value[req.id] = req.details?.ad_account_id || ''
      }
    })
  }
}, { immediate: true })

// Memisahkan list berdasarkan apakah Ad Account ID sudah diisi atau belum
const pendingList = computed(() => {
  return requests.value.filter(req => !req.details?.ad_account_id)
})

const completedList = computed(() => {
  return requests.value.filter(req => req.details?.ad_account_id)
})

const currentList = computed(() => {
  return activeTab.value === 'pending' ? pendingList.value : completedList.value
})

const getPlatformLogo = (platform: string) => {
  if (platform.includes('Meta')) return '/icon-meta-ads.png'
  if (platform.includes('TikTok')) return '/tiktok.svg'
  if (platform.includes('Google')) return '/icon-google-ads.png'
  return '/icon-meta-ads.png'
}

const startEdit = (id: string) => {
  isEditing.value[id] = true
}

const cancelEdit = (id: string, originalValue: string) => {
  isEditing.value[id] = false
  inputModels.value[id] = originalValue || ''
}

const saveAdAccountId = async (id: string) => {
  const adAccountId = inputModels.value[id]?.trim()
  if (!adAccountId) return

  isSubmitting.value = id
  const toast = useToast()

  try {
    const response = await $fetch('/api/admin/ads-ops', {
      method: 'POST',
      body: {
        request_id: id,
        ad_account_id: adAccountId
      }
    })

    toast.addToast((response as any).message, 'success')
    isEditing.value[id] = false
    await refresh() // Tarik ulang data agar pindah tab
  } catch (error: any) {
    toast.addToast(error.data?.statusMessage || 'Gagal menyimpan ID', 'error')
  } finally {
    isSubmitting.value = null
  }
}
</script>
