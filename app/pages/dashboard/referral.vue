<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-ink-900">Program Affiliate</h1>
        <p class="text-ink-500 text-sm mt-1">Ajak teman dan dapatkan komisi tambahan untuk setiap teman yang berlangganan.</p>
      </div>
      <div>
        <button 
          @click="resetDevData"
          :disabled="isResetting"
          class="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-md text-sm border border-red-200 shadow-sm flex items-center gap-2 transition-colors"
        >
          <Loader2 v-if="isResetting" class="w-4 h-4 animate-spin" />
          <Trash2 v-else class="w-4 h-4" />
          Reset Data (Dev)
        </button>
      </div>
    </div>

    <!-- Overview Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
        <p class="text-ink-500 text-sm font-medium">Total Saldo Didapat</p>
        <h3 class="text-2xl font-bold text-ink-900 mt-2">Rp {{ totalEarned.toLocaleString('id-ID') }}</h3>
      </div>
      <div class="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
        <p class="text-ink-500 text-sm font-medium">Teman Mendaftar</p>
        <h3 class="text-2xl font-bold text-ink-900 mt-2">{{ totalRegistered }} <span class="text-sm font-normal text-ink-400">Orang</span></h3>
      </div>
      <div class="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
        <p class="text-ink-500 text-sm font-medium">Teman Berlangganan</p>
        <h3 class="text-2xl font-bold text-ink-900 mt-2">{{ totalActive }} <span class="text-sm font-normal text-ink-400">Aktif</span></h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Kiri: Bagikan Kode / Affiliate -->
      <div class="bg-white border border-ink-100 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
        <div v-if="referralStatus.isLoading" class="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
        </div>
        
        <div class="px-6 pt-5 pb-4 border-b border-ink-100">
          <h3 class="font-bold text-ink-900 text-base flex items-center gap-2">
            <Gift class="w-5 h-5 text-orange-500" />
            Bagikan Kode Referral
          </h3>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-center">
          
          <template v-if="!referralStatus.isAffiliate">
            <div class="text-center py-6">
              <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users class="w-8 h-8 text-orange-500" />
              </div>
              <h4 class="font-bold text-ink-900 mb-2">Jadi Affiliate Partner</h4>
              <p class="text-sm text-ink-500 mb-6 max-w-sm mx-auto">Dapatkan komisi 10% dari setiap pembayaran langganan teman Anda. Teman Anda juga akan mendapat diskon 10%.</p>
              
              <button 
                @click="registerAffiliate"
                :disabled="isRegisteringAffiliate"
                class="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-md text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
              >
                <Loader2 v-if="isRegisteringAffiliate" class="w-4 h-4 animate-spin" />
                Aktifkan Kode Saya
              </button>
            </div>
          </template>
          
          <template v-else>
            <div class="space-y-6">
              <p class="text-sm text-ink-600">Berikan kode ini kepada teman Anda saat mereka mendaftar di TentaKlik.</p>
              
              <div class="bg-ink-50 border border-ink-200 rounded-xl p-6 text-center">
                <p class="text-xs text-ink-500 uppercase tracking-wider font-bold mb-3">KODE REFERRAL ANDA</p>
                <div class="flex items-center justify-center gap-3">
                  <span class="text-3xl font-mono font-bold text-orange-600 tracking-wider">
                    {{ referralStatus.myReferralCode }}
                  </span>
                </div>
                <button 
                  @click="copyReferralCode"
                  class="mt-4 bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
                >
                  <Copy class="w-4 h-4" />
                  Salin Kode
                </button>
              </div>

              <!-- Quick Share -->
              <div>
                <p class="text-xs text-ink-500 font-bold mb-3">BAGIKAN CEPAT</p>
                <div class="flex items-center gap-3">
                  <a :href="whatsappShareUrl" target="_blank" rel="noopener noreferrer" class="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-2.5 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2">
                    WhatsApp
                  </a>
                  <a :href="telegramShareUrl" target="_blank" rel="noopener noreferrer" class="flex-1 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-2.5 px-4 rounded-md text-sm transition-colors flex items-center justify-center gap-2">
                    Telegram
                  </a>
                </div>
              </div>
            </div>
          </template>

        </div>
      </div>

      <!-- Kanan: Klaim Kode & Aturan -->
      <div class="space-y-6">
        
        <!-- Box Input Kode Teman -->
        <div class="bg-white border border-ink-100 rounded-2xl shadow-sm overflow-hidden relative">
          <div v-if="referralStatus.isLoading" class="absolute inset-0 bg-white/70 flex items-center justify-center z-10"></div>
          
          <div class="px-6 pt-5 pb-4 border-b border-ink-100">
            <h3 class="font-bold text-ink-900 text-base">Punya Kode Referral Teman?</h3>
          </div>
          <div class="p-6">
            <template v-if="referralStatus.hasSubmittedCode">
              <div class="bg-green-50 border border-green-200 text-green-800 rounded-xl p-5 text-center">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck class="w-6 h-6 text-green-600" />
                </div>
                <p class="text-sm font-medium">
                  Anda telah menggunakan kode referral teman: <br/>
                  <span class="font-bold text-lg mt-1 block">{{ referralStatus.submittedCode }}</span>
                </p>
                <p class="text-xs mt-3 text-green-700">Anda berhak mendapatkan diskon 10% untuk pembayaran langganan pertama Anda.</p>
              </div>
            </template>
            <template v-else-if="!referralStatus.canSubmit">
              <div class="bg-red-50 border border-red-200 text-red-800 rounded-xl p-5 text-center text-sm font-medium">
                Batas waktu (60 hari) untuk menggunakan kode referral telah habis.
              </div>
            </template>
            <template v-else>
              <p class="text-ink-600 text-sm mb-4">
                Masukkan kode referral teman Anda di bawah ini. Sisa waktu Anda: <span class="text-orange-600 font-bold">{{ referralStatus.daysRemaining }} hari</span>.
              </p>
              <div class="flex flex-col gap-3">
                <input 
                  v-model="friendReferralCode" 
                  type="text" 
                  class="w-full border border-ink-200 rounded-md px-4 py-3 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white font-mono" 
                  placeholder="Contoh: TENTA-Ref0001" 
                />
                <button 
                  @click="submitReferralCode"
                  :disabled="isSubmittingReferral || !friendReferralCode"
                  class="bg-orange-500 hover:bg-orange-600 disabled:bg-ink-200 disabled:text-ink-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-md text-sm flex items-center justify-center gap-2 transition-colors w-full"
                >
                  <Loader2 v-if="isSubmittingReferral" class="w-4 h-4 animate-spin" />
                  Klaim Diskon 10%
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Box Aturan Pendek -->
        <div class="bg-ink-50/50 border border-ink-100 rounded-2xl p-6">
          <h4 class="font-bold text-ink-900 text-sm mb-4">Cara Kerja Affiliate TentaKlik</h4>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
              <p class="text-sm text-ink-700">Dapatkan kode referral Anda dengan mengklik "Aktifkan Kode Saya".</p>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
              <p class="text-sm text-ink-700">Bagikan kode tersebut ke teman-teman yang butuh tools TentaKlik.</p>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
              <p class="text-sm text-ink-700">Teman Anda mendapat <b>diskon 10%</b>, dan Anda mendapat <b>saldo 10%</b> saat teman sukses membayar.</p>
            </li>
          </ul>
        </div>

      </div>
    </div>

    <!-- Riwayat Affiliate -->
    <div class="bg-white border border-ink-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-ink-100">
        <h3 class="font-bold text-ink-900 text-base">Riwayat Referral Anda</h3>
      </div>
      <div>
        <div v-if="isHistoryLoading" class="flex justify-center items-center py-12">
          <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
        </div>
        <div v-else-if="!referralStatus.isAffiliate" class="text-center py-12 text-ink-500 text-sm p-6">
          Aktifkan program Affiliate Anda terlebih dahulu untuk melihat riwayat.
        </div>
        <div v-else-if="historyList.length === 0" class="text-center py-12 text-ink-500 text-sm p-6">
          Belum ada teman yang menggunakan kode Anda. Bagikan kode Anda sekarang!
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-ink-50 text-ink-600 border-b border-ink-100">
              <tr>
                <th class="px-6 py-4 font-bold">Tanggal</th>
                <th class="px-6 py-4 font-bold">Pengguna</th>
                <th class="px-6 py-4 font-bold">Status</th>
                <th class="px-6 py-4 font-bold">Komisi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="(item, index) in historyList" :key="index" class="hover:bg-ink-50/50 transition-colors">
                <td class="px-6 py-4 text-ink-600">{{ new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
                <td class="px-6 py-4 font-medium text-ink-900">{{ item.email }}</td>
                <td class="px-6 py-4">
                  <span :class="item.status === 'reward_given' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    {{ item.status === 'reward_given' ? 'Berhasil' : 'Pending' }}
                  </span>
                </td>
                <td class="px-6 py-4 font-bold" :class="item.status === 'reward_given' ? 'text-green-600' : 'text-ink-400'">{{ item.reward }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { 
  Gift, Users, Copy, ShieldCheck, Loader2, Trash2
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
})

const { addToast } = useToast()

const referralStatus = ref({
  isLoading: true,
  isAffiliate: false,
  myReferralCode: null as string | null,
  hasSubmittedCode: false,
  submittedCode: null as string | null,
  daysRemaining: 0,
  canSubmit: false
})
const friendReferralCode = ref('')
const isRegisteringAffiliate = ref(false)
const isSubmittingReferral = ref(false)
const isResetting = ref(false)

const isHistoryLoading = ref(true)
const totalEarned = ref(0)
const totalRegistered = ref(0)
const totalActive = ref(0)
const historyList = ref<any[]>([])

const whatsappShareUrl = computed(() => {
  const text = encodeURIComponent(`Halo! Daftar TentaKlik pakai kode referralku: ${referralStatus.value.myReferralCode} untuk dapat diskon 10% di pembayaran pertama!`)
  return `https://wa.me/?text=${text}`
})

const telegramShareUrl = computed(() => {
  const text = encodeURIComponent(`Halo! Daftar TentaKlik pakai kode referralku: ${referralStatus.value.myReferralCode} untuk dapat diskon 10% di pembayaran pertama!`)
  return `https://t.me/share/url?url=&text=${text}`
})

const fetchReferralStatus = async () => {
  try {
    const res = await $fetch('/api/referral/status')
    if (res && res.success) {
      referralStatus.value = {
        isLoading: false,
        isAffiliate: res.isAffiliate,
        myReferralCode: res.myReferralCode,
        hasSubmittedCode: res.hasSubmittedCode,
        submittedCode: res.submittedCode,
        daysRemaining: res.daysRemaining,
        canSubmit: res.canSubmit
      }
      
      if (res.isAffiliate) {
        fetchHistory()
      } else {
        isHistoryLoading.value = false
      }
    }
  } catch (error) {
    console.error('Error fetching referral status:', error)
    referralStatus.value.isLoading = false
    isHistoryLoading.value = false
  }
}

const fetchHistory = async () => {
  isHistoryLoading.value = true
  try {
    const res = await $fetch('/api/referral/history')
    if (res && res.success) {
      totalEarned.value = res.totalEarned
      totalRegistered.value = res.totalRegistered
      totalActive.value = res.totalActive
      historyList.value = res.history || []
    }
  } catch (error) {
    console.error('Error fetching history:', error)
  } finally {
    isHistoryLoading.value = false
  }
}

const registerAffiliate = async () => {
  isRegisteringAffiliate.value = true
  try {
    const res = await $fetch('/api/referral/register', { method: 'POST' })
    if (res && res.success) {
      referralStatus.value.isAffiliate = true
      referralStatus.value.myReferralCode = res.code
      addToast('Berhasil mendaftar sebagai Affiliate Partner!', 'success')
    }
  } catch (error: any) {
    addToast(error.data?.message || 'Gagal mendaftar affiliate', 'error')
  } finally {
    isRegisteringAffiliate.value = false
  }
}

const submitReferralCode = async () => {
  if (!friendReferralCode.value) return
  isSubmittingReferral.value = true
  try {
    const res = await $fetch('/api/referral/submit', {
      method: 'POST',
      body: { code: friendReferralCode.value }
    })
    if (res && res.success) {
      referralStatus.value.hasSubmittedCode = true
      referralStatus.value.submittedCode = friendReferralCode.value
      referralStatus.value.canSubmit = false
      addToast(res.message || 'Kode referral berhasil diterapkan!', 'success')
    }
  } catch (error: any) {
    addToast(error.data?.message || 'Kode referral tidak valid', 'error')
  } finally {
    isSubmittingReferral.value = false
  }
}

const copyReferralCode = async () => {
  if (!referralStatus.value.myReferralCode) return
  try {
    await navigator.clipboard.writeText(referralStatus.value.myReferralCode)
    addToast('Kode referral disalin!', 'success')
  } catch (error) {
    addToast('Gagal menyalin kode', 'error')
  }
}

const resetDevData = async () => {
  if (!confirm('Yakin ingin mereset semua data referral Anda? Ini hanya untuk keperluan testing (Dev).')) return
  
  isResetting.value = true
  try {
    const res = await $fetch('/api/referral/reset', { method: 'POST' })
    if (res && res.success) {
      addToast('Data referral berhasil direset!', 'success')
      window.location.reload()
    } else {
      addToast(res.message || 'Gagal mereset data', 'error')
    }
  } catch (error: any) {
    addToast(error.data?.message || 'Terjadi kesalahan saat reset', 'error')
  } finally {
    isResetting.value = false
  }
}

onMounted(() => {
  fetchReferralStatus()
})
</script>
