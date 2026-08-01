<template>
  <div class="space-y-8 max-w-6xl mx-auto">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-orange-50/80 to-white border border-orange-100 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
      <div class="absolute -top-32 -right-32 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />

      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-6">
          <Megaphone class="w-8 h-8 text-orange-500" />
          <div class="flex flex-col">
            <span class="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-none">tentaklik</span>
            <span class="text-xl font-display font-black text-ink-900 leading-none tracking-tight">Ads</span>
          </div>
        </div>

        <h2 class="text-2xl md:text-4xl font-display font-bold text-ink-900 mb-4 max-w-3xl leading-tight">
          {{ $t('platform.heroTitle') }}
        </h2>
        <p class="text-ink-600 mb-10 max-w-3xl text-sm md:text-base leading-relaxed">
          {{ $t('platform.heroDesc') }}
        </p>

        <h3 class="text-xl font-bold text-ink-900 mb-6">{{ $t('platform.benefitsTitle') }}</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="bg-white border border-ink-100 rounded-xl p-5 flex gap-4 hover:border-orange-200 hover:shadow-md transition-all"
          >
            <div class="shrink-0">
              <component :is="benefit.icon" class="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h4 class="font-bold text-ink-900 text-sm mb-1.5">{{ benefit.title }}</h4>
              <p class="text-sm text-ink-500 leading-relaxed">{{ benefit.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>



    <!-- Platform List -->
    <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-4">
      <h3 class="font-display font-bold text-xl md:text-2xl text-ink-900">{{ $t('platform.servicesTitle') }}</h3>
      
      <button v-if="isAdmin" @click="resetDev" class="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-bold text-red-600 hover:bg-red-100 transition-colors shadow-sm shrink-0">
        <Trash2 class="w-4 h-4" /> {{ $t('platform.resetDev') }}
      </button>
    </div>

    <div class="flex flex-col gap-4">
      <template v-if="isLoading">
        <div v-for="i in 3" :key="'skeleton-card-' + i" class="bg-white border border-ink-100 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-pulse shadow-sm">
          <div class="flex items-center gap-4 w-full md:w-2/3">
            <div class="w-16 h-16 bg-ink-200 rounded-2xl shrink-0"></div>
            <div class="w-full space-y-2">
              <div class="h-5 bg-ink-200 rounded w-1/3"></div>
              <div class="h-4 bg-ink-200 rounded w-2/3 mt-2"></div>
            </div>
          </div>
          <div class="shrink-0 w-full md:w-32 h-10 bg-ink-200 rounded-xl"></div>
        </div>
      </template>
      <template v-else>
        <DashboardPlatformCard
          v-for="platform in platforms"
          :key="platform.name"
          :platform="platform"
          :is-locked="verificationStatus !== 'verified'"
          @request="openRequestModal(platform.name)"
          @manage="openTopUpModal"
        />
      </template>
    </div>

    <!-- Modal Pengajuan Akun -->
    <ModalRequestAdAccountModal 
      v-model="isModalOpen"
      :platformName="selectedPlatformName"
      @success="fetchRequests"
    />
  </div>
</template>

<script setup lang="ts">
import { Megaphone, GraduationCap, BarChart2, ShieldCheck, Wallet, ShieldAlert, Trash2 } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'dashboard',
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { user } = useAuth()
const { csrf } = useCsrf()

const isAdmin = computed(() => {
  const role = user.value?.user_metadata?.role || user.value?.app_metadata?.role
  return role === 'admin' || role === 'super_admin'
})

const isModalOpen = ref(false)
const selectedPlatformName = ref('')
const verificationStatus = ref<string | null>(null)
const isLoading = ref(true)

const openRequestModal = (name: string) => {
  selectedPlatformName.value = name
  isModalOpen.value = true
}

const openTopUpModal = () => {
  navigateTo('/dashboard/topup')
}

const benefits = computed(() => [
  {
    icon: GraduationCap,
    title: t('platform.benefits.educationTitle'),
    desc: t('platform.benefits.educationDesc'),
  },
  {
    icon: BarChart2,
    title: t('platform.benefits.scaleTitle'),
    desc: t('platform.benefits.scaleDesc'),
  },
  {
    icon: ShieldCheck,
    title: t('platform.benefits.safeTitle'),
    desc: t('platform.benefits.safeDesc'),
  },
  {
    icon: Wallet,
    title: t('platform.benefits.budgetTitle'),
    desc: t('platform.benefits.budgetDesc'),
  },
])

const platformsRaw = ref<any[]>([
  {
    dbName: 'Meta Ads',
    name: 'Facebook Ads Whitelisted Account (Meta)',
    logo: '/icon-meta-ads.png',
    logoClass: 'rounded-full',
    statusKey: 'inactive',
    rawStatus: null,
    descKey: 'platform.metaDesc',
  },
  {
    dbName: 'TikTok Ads',
    name: 'TikTok Ads Whitelisted Account',
    logo: '/tiktok.svg',
    logoClass: 'rounded-2xl p-2',
    statusKey: 'inactive',
    rawStatus: null,
    isComingSoon: true,
    descKey: 'platform.tiktokDesc',
  },
  {
    dbName: 'Google Ads',
    name: 'Google Ads Whitelisted Account',
    logo: '/icon-google-ads.png',
    logoClass: 'rounded-full',
    statusKey: 'inactive',
    rawStatus: null,
    descKey: 'platform.googleDesc',
  },
])

const platforms = computed(() =>
  platformsRaw.value.map(p => ({
    ...p,
    status: t(`platform.accountStatus.${p.statusKey}`),
    description: t(p.descKey),
  }))
)

const fetchRequests = async () => {
  isLoading.value = true
  if (!user.value) {
    isLoading.value = false
    return
  }
  
  const uid = (user.value as any)?.id || (user.value as any)?.sub
  
  // Fetch verification status
  const { data: profile } = await (supabase as any)
    .from('users')
    .select('verification_status')
    .eq('id', uid)
    .single()
    
  if (profile && profile.verification_status) {
    verificationStatus.value = profile.verification_status
  } else {
    verificationStatus.value = 'unverified'
  }
  
  // Fetch requests status (ambil yang terbaru)
  const { data, error } = await (supabase as any)
    .from('ad_account_requests')
    .select('platform, status')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    
  if (data) {
    const statusKeyMap: Record<string, string> = {
      'pending_review': 'inReview',
      'processing': 'creating',
      'approved': 'active',
      'rejected': 'rejected',
    }
    data.forEach((req: any) => {
      const p = platformsRaw.value.find(p => p.dbName === req.platform)
      if (p && !p.rawStatus) {
        p.rawStatus = req.status
        p.statusKey = statusKeyMap[req.status] || 'inactive'
      }
    })
  }
  
  isLoading.value = false
}

const resetDev = async () => {
  if (!confirm(t('platform.resetDevConfirm'))) return
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch('/api/dev/reset-ads', { method: 'POST', headers: csrfToken ? { 'csrf-token': csrfToken } : {} })
    alert((res as any).message)

    platformsRaw.value.forEach(p => {
      p.rawStatus = null
      p.statusKey = 'inactive'
    })

    refreshNuxtData()
    fetchRequests()
  } catch(e: any) {
    alert(e.data?.statusMessage || t('platform.resetFailed'))
  }
}

onMounted(() => {
  fetchRequests()
})
</script>
