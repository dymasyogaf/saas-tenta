<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-ink-900">{{ $t('referral.title') }}</h1>
        <p class="text-ink-500 text-sm mt-1">{{ $t('referral.subtitle') }}</p>
      </div>
      <div>
        <button 
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
      <div class="bg-white border border-ink-100 rounded-2xl p-5 shadow-sm">
        <p class="text-ink-500 text-sm font-medium">{{ $t('referral.stats.totalEarned') }}</p>
        <h3 class="text-2xl font-bold text-ink-900 mt-2">Rp {{ totalEarned.toLocaleString(locale) }}</h3>
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
            <div class="text-center py-6">
              <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users class="w-8 h-8 text-orange-500" />
              </div>
              <h4 class="font-bold text-ink-900 mb-2">{{ $t('referral.becomeAffiliate') }}</h4>
              <p class="text-sm text-ink-500 mb-6 max-w-sm mx-auto">{{ $t('referral.affiliateDesc') }}</p>
              
              <button 
                @click="registerAffiliate"
                :disabled="isRegisteringAffiliate"
                class="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-md text-sm transition-colors shadow-sm inline-flex items-center justify-center gap-2"
              >
                <Loader2 v-if="isRegisteringAffiliate" class="w-4 h-4 animate-spin" />
                {{ $t('referral.activateCode') }}
              </button>
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
              <div class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
              <p class="text-sm text-ink-700">{{ $t('referral.howItWorks.step1') }}</p>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
              <p class="text-sm text-ink-700">{{ $t('referral.howItWorks.step2') }}</p>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
              <p class="text-sm text-ink-700" v-html="$t('referral.howItWorks.step3')"></p>
            </li>
          </ul>
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
                  <span :class="item.status === 'reward_given' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
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

  </div>
</template>

<script setup lang="ts">
import { 
  Gift, Users, Copy, ShieldCheck, Loader2, Trash2
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
})

const { t, locale } = useI18n()
const { addToast } = useToast()
const { csrf } = useCsrf()

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
const isResetting = ref(false)

const isHistoryLoading = ref(true)
const totalEarned = ref(0)
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
    const csrfToken = unref(csrf)
    const res = await $fetch('/api/referral/register', { method: 'POST', headers: csrfToken ? { 'csrf-token': csrfToken } : {} }) as any
    if (res && res.success) {
      referralStatus.value.isAffiliate = true
      referralStatus.value.myReferralCode = res.code
      addToast(t('referral.toast.registerSuccess'), 'success')
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

onMounted(() => {
  fetchReferralStatus()
})
</script>
