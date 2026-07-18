<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-display font-bold text-ink-900">Review Verifikasi KYC</h1>
        <p class="text-ink-500 text-sm mt-1">Kelola persetujuan verifikasi identitas (eKYC) klien.</p>
      </div>
      <button @click="fetchPendingUsers" class="flex items-center gap-2 px-4 py-2 bg-white border border-ink-200 rounded-lg text-sm font-bold text-ink-700 hover:bg-ink-50 transition-colors shadow-sm">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" /> Segarkan
      </button>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
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
    <div v-if="isReviewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div class="px-6 py-4 border-b border-ink-100 flex justify-between items-center bg-ink-50">
          <h3 class="font-bold text-lg text-ink-900 flex items-center gap-2">
            <ScanFace class="w-5 h-5 text-orange-500" /> Review Data KYC
          </h3>
          <button @click="isReviewModalOpen = false" class="text-ink-400 hover:text-ink-900">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto">
          <div v-if="selectedUser" class="space-y-6">
            
            <div class="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <p class="text-xs text-orange-600 font-bold uppercase mb-1">Peringatan Audit</p>
              <p class="text-sm text-orange-800">Pastikan NIK dan Nama sesuai dengan data KTP fisik. Untuk foto KTP dan wajah, silakan periksa di Google Sheets (Data Webhook).</p>
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
              
              <div class="pt-4 border-t border-ink-100 grid grid-cols-2 gap-4">
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
        </div>
        
        <div class="p-6 border-t border-ink-100 bg-ink-50 flex justify-end gap-3 shrink-0">
          <button @click="handleAction('rejected')" :disabled="isProcessing" class="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50">
            Tolak (Reject)
          </button>
          <button @click="handleAction('verified')" :disabled="isProcessing" class="px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
            <Loader2 v-if="isProcessing" class="w-4 h-4 animate-spin" />
            <CheckCircle2 v-else class="w-4 h-4" /> 
            Setujui (Approve)
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Loader2, ShieldCheck, ScanFace, X, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard'
})

const supabase = useSupabaseClient()
const { addToast } = useToast()

const isLoading = ref(true)
const isProcessing = ref(false)
const pendingUsers = ref<any[]>([])

const isReviewModalOpen = ref(false)
const selectedUser = ref<any>(null)

const fetchPendingUsers = async () => {
  isLoading.value = true
  try {
    const { data, error } = await (supabase as any)
      .from('users')
      .select('id, email, phone, full_name, verification_status, verification_details, created_at, updated_at')
      .eq('verification_status', 'pending')
      .order('updated_at', { ascending: false })
      
    if (error) throw error
    
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
    const { error } = await (supabase as any)
      .from('users')
      .update({ verification_status: newStatus })
      .eq('id', selectedUser.value.id)
      
    if (error) throw error
    
    // Kirim notifikasi in-app
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: selectedUser.value.id,
        type: 'verification',
        title: newStatus === 'verified' ? 'Verifikasi Disetujui' : 'Verifikasi Ditolak',
        message: newStatus === 'verified' 
          ? 'Selamat! Data identitas Anda telah disetujui. Anda sekarang dapat mengakses semua fitur.'
          : 'Maaf, verifikasi identitas Anda ditolak. Silakan periksa kembali dan ajukan ulang.'
      })
    
    addToast(
      newStatus === 'verified' 
        ? `Profil ${selectedUser.value.verification_details?.name || 'klien'} berhasil disetujui!` 
        : `Pengajuan ${selectedUser.value.verification_details?.name || 'klien'} ditolak.`,
      newStatus === 'verified' ? 'success' : 'error'
    )
    
    isReviewModalOpen.value = false
    await fetchPendingUsers() // Refresh data table
    
  } catch (error: any) {
    addToast(error.message || `Gagal memproses pengajuan.`, 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>
