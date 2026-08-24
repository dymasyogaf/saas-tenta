<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-display font-bold text-ink-900">Review Verifikasi KYC</h1>
        <p class="text-ink-500 text-sm mt-1">Kelola persetujuan verifikasi identitas (eKYC) klien.</p>
      </div>
      <button @click="fetchPendingUsers" class="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-ink-200 rounded-lg text-sm font-bold text-ink-700 hover:bg-ink-50 transition-colors shadow-sm w-full sm:w-auto">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" /> Segarkan
      </button>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr class="border-b border-ink-100 bg-ink-50 text-xs text-ink-500 uppercase tracking-wider font-bold">
              <th class="p-4">Tanggal Pengajuan</th>
              <th class="p-4">Nama Lengkap</th>
              <th class="p-4">Email / Telepon</th>
              <th class="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="isLoading">
              <tr v-for="i in 3" :key="'skeleton-'+i" class="border-b border-ink-100 animate-pulse">
                <td class="p-4"><div class="h-4 bg-ink-200 rounded w-24"></div></td>
                <td class="p-4">
                  <div class="h-4 bg-ink-200 rounded w-32 mb-2"></div>
                  <div class="h-3 bg-ink-200 rounded w-20"></div>
                </td>
                <td class="p-4">
                  <div class="h-4 bg-ink-200 rounded w-40 mb-2"></div>
                  <div class="h-3 bg-ink-200 rounded w-24"></div>
                </td>
                <td class="p-4 text-center">
                  <div class="h-8 bg-ink-200 rounded w-20 mx-auto"></div>
                </td>
              </tr>
            </template>
            <tr v-else-if="pendingUsers.length === 0" class="border-b border-ink-100">
              <td colspan="4" class="p-8 text-center text-ink-500">
                <ShieldCheck class="w-12 h-12 text-ink-200 mx-auto mb-3" />
                <p class="text-sm font-medium">Hore! Tidak ada antrean verifikasi KYC saat ini.</p>
              </td>
            </tr>
            <tr v-else v-for="user in pendingUsers" :key="user.id" class="border-b border-ink-100 hover:bg-ink-50 transition-colors">
              <td class="p-4 text-sm text-ink-700 font-medium">
                {{ new Date(user.updated_at || user.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}
              </td>
              <td class="p-4">
                <div class="text-sm font-bold text-ink-900">{{ user.verification_details?.name || user.full_name || 'Tidak ada nama' }}</div>
                <div class="text-xs text-ink-500">NIK: {{ user.verification_details?.nik || '-' }}</div>
              </td>
              <td class="p-4">
                <div class="text-sm text-ink-700">{{ user.email }}</div>
                <div class="text-xs text-ink-500">{{ user.phone || 'No HP tidak tersedia' }}</div>
              </td>
              <td class="p-4 text-center">
                <button @click="openReviewModal(user)" class="px-4 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm font-bold transition-colors">
                  Review
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Review Modal -->
    <Teleport to="body">
<div v-if="isReviewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="px-6 py-4 border-b border-ink-100 flex justify-between items-center bg-ink-50">
          <h3 class="font-bold text-lg text-ink-900 flex items-center gap-2">
            <ScanFace v-if="!isRejectingMode" class="w-5 h-5 text-orange-500" /> 
            <MessageSquareX v-else class="w-5 h-5 text-red-500" />
            {{ isRejectingMode ? 'Tulis Alasan Penolakan' : 'Review Data KYC' }}
          </h3>
          <button @click="closeReviewModal" class="text-ink-400 hover:text-ink-900">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto">
          <div v-if="selectedUser && !isRejectingMode" class="space-y-6">
            
            <div class="p-4 bg-orange-50 border border-orange-200 rounded-xl" v-if="!selectedUser.verification_details?.ktp_url">
              <p class="text-xs text-orange-600 font-bold uppercase mb-1">Peringatan Audit (Data Lama)</p>
              <p class="text-sm text-orange-800">Foto KTP dan wajah tidak ditemukan di server. Silakan periksa di Google Sheets (Data Webhook lama).</p>
            </div>

            <!-- Tampilan Foto KTP & Pas Photo -->
            <div v-if="selectedUser.verification_details?.ktp_url" class="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-ink-100 pb-6">
              <div>
                <label class="block text-xs font-bold text-ink-500 uppercase mb-2">Foto KTP</label>
                <div class="rounded-xl overflow-hidden border border-ink-200 bg-ink-50 aspect-video relative group">
                   <img :src="selectedUser.verification_details.ktp_url" alt="KTP" class="w-full h-full object-cover" />
                   <a :href="selectedUser.verification_details.ktp_url" target="_blank" class="absolute inset-0 bg-ink-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold rounded-xl backdrop-blur-sm">Lihat Penuh</a>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-ink-500 uppercase mb-2">Pas Foto Diri</label>
                <div class="rounded-xl overflow-hidden border border-ink-200 bg-ink-50 aspect-square md:aspect-video relative group">
                   <img :src="selectedUser.verification_details.pasphoto_url" alt="Pas Foto" class="w-full h-full object-cover" />
                   <a :href="selectedUser.verification_details.pasphoto_url" target="_blank" class="absolute inset-0 bg-ink-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold rounded-xl backdrop-blur-sm">Lihat Penuh</a>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-ink-500 uppercase">Nama Lengkap (Sesuai KTP)</label>
                <div class="text-base font-bold text-ink-900">{{ selectedUser.verification_details?.name || '-' }}</div>
              </div>
              
              <div>
                <label class="block text-xs font-bold text-ink-500 uppercase">Nomor Induk Kependudukan (NIK)</label>
                <div class="text-base font-mono font-bold text-ink-900 tracking-wide">{{ selectedUser.verification_details?.nik || '-' }}</div>
              </div>
              
              <div>
                <label class="block text-xs font-bold text-ink-500 uppercase">Tanggal Lahir</label>
                <div class="text-base font-medium text-ink-900">{{ selectedUser.verification_details?.dob || '-' }}</div>
              </div>
              
              <div class="pt-4 border-t border-ink-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-ink-500 uppercase">Email</label>
                  <div class="text-sm text-ink-700">{{ selectedUser.email }}</div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-ink-500 uppercase">Telepon WhatsApp</label>
                  <div class="text-sm text-ink-700">{{ selectedUser.phone || '-' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- REJECT MODE -->
          <div v-if="isRejectingMode" class="space-y-5">
            <div>
              <p class="text-sm text-ink-600 mb-3">Silakan pilih atau tulis alasan spesifik penolakan KYC untuk klien <strong>{{ selectedUser?.verification_details?.name }}</strong>. Pesan ini akan dikirimkan langsung ke notifikasi mereka.</p>
              
              <div class="flex flex-wrap gap-2 mb-4">
                <button @click="setTemplate('ktp')" class="px-3 py-1.5 bg-white border border-green-200 hover:bg-green-50 rounded-lg text-xs font-bold text-green-700 transition-colors flex items-center gap-1.5"><CheckCircle2 class="w-3.5 h-3.5" /> Foto KTP Buram</button>
                <button @click="setTemplate('nik')" class="px-3 py-1.5 bg-white border border-yellow-200 hover:bg-yellow-50 rounded-lg text-xs font-bold text-yellow-700 transition-colors flex items-center gap-1.5"><AlertCircle class="w-3.5 h-3.5" /> NIK Tidak Sesuai</button>
                <button @click="setTemplate('empty')" class="px-3 py-1.5 bg-white border border-ink-200 hover:bg-ink-50 rounded-lg text-xs font-bold text-ink-700 transition-colors">Teks Kosong + Signature</button>
              </div>

              <ClientOnly>
                <div class="border border-ink-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 bg-white">
                  <QuillEditor theme="snow" v-model:content="rejectMessage" contentType="html" class="min-h-[200px]" :toolbar="['bold', 'italic', 'underline', { 'list': 'ordered'}, { 'list': 'bullet' }, 'clean']" />
                </div>
                <template #fallback>
                  <textarea v-model="rejectMessage" rows="6" placeholder="Memuat editor..." class="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl focus:outline-none text-sm"></textarea>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t border-ink-100 bg-ink-50 flex justify-end gap-3 shrink-0">
          <template v-if="!isRejectingMode">
            <button @click="isRejectingMode = true" :disabled="isProcessing" class="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
              Tolak (Reject)
            </button>
            <button @click="handleAction('verified')" :disabled="isProcessing" class="px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
              <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
              <CheckCircle2 v-else class="w-4 h-4" /> 
              Setujui (Approve)
            </button>
          </template>
          <template v-else>
            <button @click="isRejectingMode = false" :disabled="isProcessing" class="px-5 py-2.5 bg-white border border-ink-200 text-ink-700 hover:bg-ink-50 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
              Kembali
            </button>
            <button @click="handleAction('rejected')" :disabled="isProcessing || !rejectMessage.trim()" class="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
              <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
              Kirim Penolakan
            </button>
          </template>
        </div>

      </div>
    </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Loader2, ShieldCheck, ScanFace, X, CheckCircle2, MessageSquareX, AlertCircle } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: ['admin']
})

const supabase = useSupabaseClient()
const { csrf } = useCsrf()
const { addToast } = useToast()

const isLoading = ref(true)
const isProcessing = ref(false)
const pendingUsers = ref<any[]>([])

const isReviewModalOpen = ref(false)
const selectedUser = ref<any>(null)
const isRejectingMode = ref(false)
const rejectMessage = ref('')

const setTemplate = (type: string) => {
  const signature = `<p><br></p><p>--</p><p>Regards.</p><p><strong>Super Admin Dymas</strong></p><p><br></p><p>PT Media Pro Indonesia</p><p>Tentaklik Admin Support</p>`
  
  if (type === 'ktp') {
    rejectMessage.value = `<p>Halo,</p><p><br></p><p>Pengajuan KYC Anda kami tolak karena <strong>Foto KTP</strong> yang Anda unggah buram, terpotong, atau kurang jelas sehingga tidak dapat diproses oleh sistem kami. Silakan ulangi proses verifikasi menggunakan foto KTP yang lebih terang dan jelas terbaca.</p><p>Terima kasih atas kerja samanya.</p>` + signature
  } else if (type === 'nik') {
    rejectMessage.value = `<p>Halo,</p><p><br></p><p>Pengajuan KYC Anda kami tolak karena <strong>Nomor Induk Kependudukan (NIK)</strong> yang dimasukkan pada form tidak sesuai dengan yang tertera di kartu fisik KTP Anda. Mohon diperiksa kembali dan ulangi proses verifikasi dengan data yang benar.</p><p>Terima kasih atas kerja samanya.</p>` + signature
  } else if (type === 'empty') {
    rejectMessage.value = `<p>Halo,</p><p><br></p><p><br></p><p><br></p>` + signature
  }
}

const closeReviewModal = () => {
  isReviewModalOpen.value = false
  setTimeout(() => {
    isRejectingMode.value = false
    rejectMessage.value = ''
    selectedUser.value = null
  }, 300)
}

const fetchPendingUsers = async () => {
  isLoading.value = true
  try {
    const data = await $fetch<any[]>('/api/admin/verifications')
    pendingUsers.value = data || []
  } catch (error: any) {
    addToast(error.message || 'Gagal mengambil data verifikasi.', 'error')
    console.error('Error fetching pending users:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchPendingUsers()
})

const openReviewModal = (user: any) => {
  selectedUser.value = user
  isReviewModalOpen.value = true
}

const handleAction = async (newStatus: 'verified' | 'rejected') => {
  if (!selectedUser.value) return
  
  isProcessing.value = true
  try {
    await $fetch('/api/admin/users/verify', {
      method: 'POST',
      headers: { 'csrf-token': unref(csrf) },
      body: {
        userId: selectedUser.value.id,
        status: newStatus,
        message: newStatus === 'rejected' ? rejectMessage.value : null
      }
    })
    
    addToast(
      newStatus === 'verified' 
        ? `Profil ${selectedUser.value.verification_details?.name || 'klien'} berhasil disetujui!` 
        : `Penolakan terkirim ke klien.`,
      newStatus === 'verified' ? 'success' : 'success'
    )
    
    closeReviewModal()
    await fetchPendingUsers() // Refresh data table
    refreshNuxtData('admin-badges') // Refresh badge notifikasi global
    
  } catch (error: any) {
    addToast(error.message || `Gagal memproses pengajuan.`, 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>
