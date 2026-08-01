<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-ink-900">{{ $t('referral.title') }}</h1>
        <p class="text-ink-500 text-sm mt-1">{{ $t('referral.subtitle') }}</p>
      </div>
      <div>
        <button 
          v-if="isAdmin"
          @click="resetDevData"
          :disabled="isResetting"
          class="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-md text-sm border border-red-200 shadow-sm flex items-center gap-2 transition-colors"
        >
          <Loader2 v-if="isResetting" class="w-4 h-4 animate-spin" />
          <Trash2 v-else class="w-4 h-4" />
          {{ $t('referral.resetDev') }}
        </button>
      </div>
    </div>

    <!-- Overview Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <p class="text-ink-500 text-sm font-medium">{{ $t('referral.stats.totalEarned') }}</p>
        <h3 class="text-2xl font-bold text-ink-900 mt-2">Rp {{ totalEarned.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US') }}</h3>
        
        <div v-if="availableToClaim > 0" class="mt-4 pt-4 border-t border-ink-100">
            <button 
              @click="claimCommission"
              :disabled="isClaiming"
              class="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Loader2 v-if="isClaiming" class="w-4 h-4 animate-spin" />
              Ajukan Pencairan
            </button>
        </div>
      </div>
      <div class="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
        <p class="text-ink-500 text-sm font-medium">{{ $t('referral.stats.friendsRegistered') }}</p>
        <h3 class="text-2xl font-bold text-ink-900 mt-2">{{ totalRegistered }} <span class="text-sm font-normal text-ink-400">{{ $t('referral.stats.people') }}</span></h3>
      </div>
      <div class="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
        <p class="text-ink-500 text-sm font-medium">{{ $t('referral.stats.friendsSubscribed') }}</p>
        <h3 class="text-2xl font-bold text-ink-900 mt-2">{{ totalActive }} <span class="text-sm font-normal text-ink-400">{{ $t('referral.stats.active') }}</span></h3>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Kiri: Bagikan Kode / Affiliate -->
      <div class="bg-white border border-ink-100 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
        <div v-if="referralStatus.isLoading" class="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
        </div>
        
        <div class="px-6 pt-5 pb-4 border-b border-ink-100">
          <h3 class="font-bold text-ink-900 text-base flex items-center gap-2">
            <Gift class="w-5 h-5 text-orange-500" />
            {{ $t('referral.shareCode') }}
          </h3>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-center">
          
          <template v-if="!referralStatus.isAffiliate">
            <div class="py-4 text-center">
              <div class="mb-6">
                <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users class="w-8 h-8 text-orange-500" />
                </div>
                <h4 class="font-bold text-ink-900 mb-2">{{ $t('referral.becomeAffiliate') }}</h4>
                <p class="text-sm text-ink-500 mb-6 max-w-sm mx-auto">{{ $t('referral.affiliateDesc') }}</p>
                
                <button 
                  @click="showTermsModal = true"
                  class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-8 rounded-md text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
                >
                  Buat Link Referral
                </button>
              </div>
            </div>
          </template>
          
          <template v-else>
            <div class="space-y-6">
              <p class="text-sm text-ink-600">{{ $t('referral.shareInstruction') }}</p>
              
              <div class="bg-ink-50 border border-ink-200 rounded-xl p-6 text-center">
                <p class="text-xs text-ink-500 uppercase tracking-wider font-bold mb-3">{{ $t('referral.yourLink') || 'Link Referral Anda' }}</p>
                <div class="flex items-center justify-center gap-3">
                  <span class="text-lg sm:text-xl font-mono font-bold text-orange-600 tracking-tight break-all">
                    {{ referralLink }}
                  </span>
                </div>
                <button 
                  @click="copyReferralCode"
                  class="mt-4 bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 font-bold py-2 px-6 rounded-md text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
                >
                  <Copy class="w-4 h-4" />
                  {{ $t('referral.copyLink') || 'Salin Link' }}
                </button>
              </div>

              <!-- Quick Share -->
              <div>
                <p class="text-xs text-ink-500 font-bold mb-3">{{ $t('referral.quickShare') }}</p>
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
        

        <!-- Box Aturan Pendek -->
        <div class="bg-ink-50/50 border border-ink-100 rounded-2xl p-6">
          <h4 class="font-bold text-ink-900 text-sm mb-4">{{ $t('referral.howItWorks.title') }}</h4>
          <ul class="space-y-4">
            <li class="flex items-start gap-3">
              <div class="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0"></div>
              <div>
                <p class="text-sm font-bold text-ink-900">{{ $t('referral.howItWorks.step1Title') }}</p>
                <p class="text-sm text-ink-700 mt-1">{{ $t('referral.howItWorks.step1') }}</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0"></div>
              <div>
                <p class="text-sm font-bold text-ink-900">{{ $t('referral.howItWorks.step2Title') }}</p>
                <p class="text-sm text-ink-700 mt-1">{{ $t('referral.howItWorks.step2') }}</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0"></div>
              <div>
                <p class="text-sm font-bold text-ink-900">{{ $t('referral.howItWorks.step3Title') }}</p>
                <p class="text-sm text-ink-700 mt-1">{{ $t('referral.howItWorks.step3') }}</p>
              </div>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-2 h-2 mt-1.5 rounded-full bg-orange-500 shrink-0"></div>
              <div>
                <p class="text-sm font-bold text-ink-900">{{ $t('referral.howItWorks.step4Title') }}</p>
                <p class="text-sm text-ink-700 mt-1">{{ $t('referral.howItWorks.step4') }}</p>
              </div>
            </li>
          </ul>
          <div class="mt-6 pt-4 border-t border-ink-100">
            <p class="text-xs text-ink-500">{{ $t('referral.howItWorks.terms') }}</p>
          </div>
        </div>

      </div>
    </div>

    <!-- Riwayat Affiliate -->
    <div class="bg-white border border-ink-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="px-6 py-5 border-b border-ink-100">
        <h3 class="font-bold text-ink-900 text-base">{{ $t('referral.history.title') }}</h3>
      </div>
      <div>
        <div v-if="isHistoryLoading" class="flex justify-center items-center py-12">
          <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
        </div>
        <div v-else-if="!referralStatus.isAffiliate" class="text-center py-12 text-ink-500 text-sm p-6">
          {{ $t('referral.history.activateFirst') }}
        </div>
        <div v-else-if="historyList.length === 0" class="text-center py-12 text-ink-500 text-sm p-6">
          {{ $t('referral.history.noHistory') }}
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-ink-50 text-ink-600 border-b border-ink-100">
              <tr>
                <th class="px-6 py-4 font-bold">{{ $t('referral.history.date') }}</th>
                <th class="px-6 py-4 font-bold">{{ $t('referral.history.user') }}</th>
                <th class="px-6 py-4 font-bold">{{ $t('referral.history.status') }}</th>
                <th class="px-6 py-4 font-bold">{{ $t('referral.history.commission') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="(item, index) in historyList" :key="index" class="hover:bg-ink-50/50 transition-colors">
                <td class="px-6 py-4 text-ink-600">{{ new Date(item.date).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
                <td class="px-6 py-4 font-medium text-ink-900">{{ item.email }}</td>
                <td class="px-6 py-4">
                  <span v-if="item.is_claimed" class="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    Dicairkan
                  </span>
                  <span v-else :class="item.status === 'reward_given' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                    {{ item.status === 'reward_given' ? $t('referral.history.success') : $t('referral.history.pending') }}
                  </span>
                </td>
                <td class="px-6 py-4 font-bold" :class="item.status === 'reward_given' ? 'text-green-600' : 'text-ink-400'">{{ item.reward }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Registration & Terms Modal -->
    <div v-if="showTermsModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-ink-100 flex justify-between items-center bg-orange-50/50">
          <h2 class="text-lg font-bold text-ink-900">Pengajuan Program Afiliasi</h2>
          <button @click="showTermsModal = false" class="text-ink-400 hover:text-ink-600 p-1 rounded-md hover:bg-ink-50 transition-colors">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-6 overflow-y-auto flex-1 text-sm text-ink-700">
          <form @submit.prevent="registerAffiliate" id="affiliateForm" class="space-y-4 mb-6">
            <div>
              <label class="block text-xs font-bold text-ink-700 mb-1">Nama Lengkap <span class="text-red-500">*</span></label>
              <input v-model="affiliateForm.fullName" type="text" required class="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow" placeholder="Masukkan nama lengkap sesuai KTP" />
            </div>
            <div>
              <label class="block text-xs font-bold text-ink-700 mb-1">Pilih Bank <span class="text-red-500">*</span></label>
              <select v-model="affiliateForm.bankName" required class="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow">
                <option value="" disabled selected>Pilih Bank Anda</option>
                <option v-for="bank in bankList" :key="bank" :value="bank">{{ bank }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-ink-700 mb-1">Nomor Rekening <span class="text-red-500">*</span></label>
              <input v-model="affiliateForm.bankAccount" type="text" inputmode="numeric" @input="affiliateForm.bankAccount = affiliateForm.bankAccount.replace(/\D/g, '')" required class="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow" placeholder="Misal: 1234567890" />
            </div>
            <div>
              <label class="block text-xs font-bold text-ink-700 mb-1">Atas Nama Rekening <span class="text-red-500">*</span></label>
              <input v-model="affiliateForm.accountName" type="text" required class="w-full bg-white border border-ink-200 rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-shadow" placeholder="Nama pemilik rekening bank" />
            </div>
          </form>

          <div class="border-t border-ink-100 pt-6 space-y-4">
            <h4 class="font-bold text-ink-900 text-base">Syarat & Ketentuan</h4>
            <div class="bg-ink-50 rounded-xl p-4 text-xs space-y-4 text-ink-600 max-h-40 overflow-y-auto border border-ink-100">
              <p>{{ $t('referral.termsModal.intro1') }}</p>
              <p>{{ $t('referral.termsModal.intro2') }}</p>
              
              <div>
                <h5 class="font-bold text-ink-900 mb-1">{{ $t('referral.termsModal.section1Title') }}</h5>
                <ul class="list-disc pl-4 space-y-1">
                  <li>{{ $t('referral.termsModal.section1Item1') }}</li>
                  <li>{{ $t('referral.termsModal.section1Item2') }}</li>
                  <li>{{ $t('referral.termsModal.section1Item3') }}</li>
                </ul>
              </div>
              
              <div>
                <h5 class="font-bold text-ink-900 mb-1">{{ $t('referral.termsModal.section2Title') }}</h5>
                <ul class="list-disc pl-4 space-y-1">
                  <li>{{ $t('referral.termsModal.section2Item1') }}</li>
                  <li>{{ $t('referral.termsModal.section2Item2') }}</li>
                  <li>{{ $t('referral.termsModal.section2Item3') }}</li>
                </ul>
              </div>
              
              <div>
                <h5 class="font-bold text-ink-900 mb-1">{{ $t('referral.termsModal.section3Title') }}</h5>
                <ul class="list-disc pl-4 space-y-1">
                  <li>{{ $t('referral.termsModal.section3Item1') }}</li>
                  <li>{{ $t('referral.termsModal.section3Item2') }}</li>
                  <li>{{ $t('referral.termsModal.section3Item3') }}</li>
                  <li>{{ $t('referral.termsModal.section3Item4') }}</li>
                </ul>
              </div>
              
              <div>
                <h5 class="font-bold text-ink-900 mb-1">{{ $t('referral.termsModal.section4Title') }}</h5>
                <ul class="list-disc pl-4 space-y-1">
                  <li>{{ $t('referral.termsModal.section4Item1') }}</li>
                  <li>{{ $t('referral.termsModal.section4Item2') }}</li>
                </ul>
              </div>
            </div>

            <div class="flex items-start gap-2 pt-2">
              <input v-model="affiliateForm.agreeTerms" type="checkbox" id="agreeTermsModal" class="mt-0.5 rounded border-ink-300 text-orange-500 focus:ring-orange-500" />
              <label for="agreeTermsModal" class="text-xs font-medium text-ink-700 leading-tight cursor-pointer">
                Saya telah membaca dan menyetujui Syarat & Ketentuan Program Afiliasi TentaKlik. <span class="text-red-500">*</span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-ink-100 bg-ink-50 flex justify-end gap-3">
          <button 
            @click="showTermsModal = false"
            class="px-5 py-2.5 text-sm font-bold text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-md transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit"
            form="affiliateForm"
            :disabled="isRegisteringAffiliate || !affiliateForm.agreeTerms || !affiliateForm.fullName || !affiliateForm.bankName || !affiliateForm.bankAccount || !affiliateForm.accountName"
            class="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-md text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
          >
            <Loader2 v-if="isRegisteringAffiliate" class="w-4 h-4 animate-spin" />
            Kirim Pengajuan
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { 
  Gift, Users, Copy, ShieldCheck, Loader2, Trash2
} from 'lucide-vue-next'
import { useI18n, useToast, useCsrf } from '#imports'

definePageMeta({
  layout: 'dashboard',
})

const { t, locale } = useI18n()
const { addToast } = useToast()
const { csrf } = useCsrf()

const user = useSupabaseUser()
const isAdmin = computed(() => {
  const role = user.value?.user_metadata?.role || user.value?.app_metadata?.role
  return role === 'admin' || role === 'super_admin'
})

const referralStatus = ref({
  isLoading: true,
  isAffiliate: false,
  myReferralCode: null as string | null,
  hasSubmittedCode: false,
  submittedCode: null as string | null,
  daysRemaining: 0,
  canSubmit: false
})
const isRegisteringAffiliate = ref(false)
const showTermsModal = ref(false)
const isResetting = ref(false)

const affiliateForm = ref({
  fullName: '',
  bankName: '',
  bankAccount: '',
  accountName: '',
  agreeTerms: false
})

const bankList = [
  'Bank Mandiri', 'Bank Rakyat Indonesia (BRI)', 'Bank Negara Indonesia (BNI)', 'Bank Tabungan Negara (BTN)', 'Bank Syariah Indonesia (BSI)',
  'BCA (Bank Central Asia)', 'CIMB Niaga', 'Bank Danamon', 'Bank Permata', 'Panin Bank', 'Bank Mega', 'Bank OCBC NISP', 'Bank Maybank Indonesia', 'Bank KB Bukopin', 'Bank Sinarmas', 'Bank Muamalat', 'Bank BTPN',
  'Bank Jago', 'Seabank', 'Blu by BCA Digital', 'Jenius (BTPN)', 'TMRW by UOB', 'Allo Bank', 'Bank Neo Commerce (BNC)', 'Krom Bank', 'Line Bank', 'Superbank', 'Hibank',
  'Bank DKI', 'Bank BJB', 'Bank BJB Syariah', 'Bank Jateng', 'Bank Jatim', 'Bank BPD DIY', 'Bank Banten', 'Bank Nagari', 'Bank Sumut', 'Bank Sumsel Babel', 'Bank Lampung', 'Bank Jambi', 'Bank Riau Kepri Syariah', 'Bank Sulselbar', 'Bank SulutGo', 'Bank Kaltimtara', 'Bank Kalbar', 'Bank Kalsel', 'Bank Kalteng', 'Bank Maluku Malut', 'Bank Papua', 'Bank NTB Syariah', 'Bank NTT', 'Bank Bali',
  'Bank Victoria', 'Bank Artha Graha', 'Bank Bumi Arta', 'Bank Ina Perdana', 'Bank Index Selindo', 'Bank JTrust', 'Bank Maspion', 'Bank Mayapada', 'Bank Mestika Dharma', 'Bank Multiarta Sentosa (MAS)', 'Bank Nationalnobu', 'Bank QNB Indonesia', 'Bank SBI Indonesia',
  'Lainnya'
].sort((a, b) => {
  if (a === 'Lainnya') return 1;
  if (b === 'Lainnya') return -1;
  return a.localeCompare(b);
})

const isHistoryLoading = ref(true)
const totalEarned = ref(0)
const availableToClaim = ref(0)
const totalRegistered = ref(0)
const totalActive = ref(0)
const historyList = ref<any[]>([])

const referralLink = computed(() => {
  if (!referralStatus.value.myReferralCode) return ''
  return typeof window !== 'undefined' 
    ? `${window.location.origin}/register?ref=${referralStatus.value.myReferralCode}`
    : `https://tentaklik.com/register?ref=${referralStatus.value.myReferralCode}`
})

const shareText = computed(() =>
  t('referral.shareMessage', { code: referralLink.value })
)

const whatsappShareUrl = computed(() =>
  `https://wa.me/?text=${encodeURIComponent(shareText.value)}`
)

const telegramShareUrl = computed(() =>
  `https://t.me/share/url?url=&text=${encodeURIComponent(shareText.value)}`
)

const fetchReferralStatus = async () => {
  try {
    const res = await $fetch('/api/referral/status') as any
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
    const res = await $fetch('/api/referral/history') as any
    if (res && res.success) {
      totalEarned.value = res.totalEarned
      availableToClaim.value = res.availableToClaim || 0
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
  if (!affiliateForm.value.fullName || !affiliateForm.value.bankName || !affiliateForm.value.bankAccount || !affiliateForm.value.accountName) {
    addToast('Mohon lengkapi semua data formulir', 'error')
    return
  }

  isRegisteringAffiliate.value = true
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch('/api/referral/register', { 
      method: 'POST', 
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: {
        fullName: affiliateForm.value.fullName,
        bankName: affiliateForm.value.bankName,
        bankAccount: affiliateForm.value.bankAccount,
        accountName: affiliateForm.value.accountName
      }
    }) as any

    if (res && res.success) {
      referralStatus.value.isAffiliate = true
      referralStatus.value.myReferralCode = res.code
      addToast(t('referral.toast.registerSuccess'), 'success')
      showTermsModal.value = false
    }
  } catch (error: any) {
    addToast(error.data?.message || t('referral.toast.registerFailed'), 'error')
  } finally {
    isRegisteringAffiliate.value = false
  }
}



const copyReferralCode = async () => {
  if (!referralLink.value) return
  try {
    await navigator.clipboard.writeText(referralLink.value)
    addToast(t('referral.toast.codeCopied'), 'success')
  } catch (error) {
    addToast(t('referral.toast.copyFailed'), 'error')
  }
}

const resetDevData = async () => {
  if (!confirm(t('referral.resetConfirm'))) return
  
  isResetting.value = true
  try {
    const csrfToken3 = unref(csrf)
    const res = await $fetch('/api/referral/reset', { method: 'POST', headers: csrfToken3 ? { 'csrf-token': csrfToken3 } : {} }) as any
    if (res && res.success) {
      addToast(t('referral.toast.resetSuccess'), 'success')
      window.location.reload()
    } else {
      addToast(res.message || t('referral.toast.resetFailed'), 'error')
    }
  } catch (error: any) {
    addToast(error.data?.message || t('referral.toast.resetError'), 'error')
  } finally {
    isResetting.value = false
  }
}

const isClaiming = ref(false)
const claimCommission = async () => {
  if (availableToClaim.value < 100000) {
    addToast('Pencairan komisi bisa dilakukan minimal Rp 100.000', 'error')
    return
  }

  if (!confirm('Apakah Anda yakin ingin mencairkan komisi ini ke Rekening Bank Anda? Tim Finance akan memproses pengajuan Anda.')) return
  
  isClaiming.value = true
  try {
    const csrfToken4 = unref(csrf)
    const res = await $fetch('/api/referral/claim', { method: 'POST', headers: csrfToken4 ? { 'csrf-token': csrfToken4 } : {} }) as any
    if (res && res.success) {
      addToast(res.message, 'success')
      // Refresh data
      fetchHistory()
    } else {
      addToast(res.message || 'Gagal mencairkan komisi', 'error')
    }
  } catch (error: any) {
    addToast(error.data?.message || 'Terjadi kesalahan saat mencairkan komisi', 'error')
  } finally {
    isClaiming.value = false
  }
}

onMounted(() => {
  fetchReferralStatus()
})
</script>
