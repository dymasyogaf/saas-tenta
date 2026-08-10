<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <h2 class="text-2xl font-display font-bold text-ink-900 mb-6">{{ $t('profile.title') }}</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
      
      <!-- Left Sidebar -->
      <div class="md:col-span-4 space-y-6">
        <!-- User Card -->
        <div class="bg-white border border-ink-100 rounded-2xl p-6 shadow-sm">
          <div class="flex flex-col items-center mb-6">
            <div class="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-sm">
              {{ initials }}
            </div>
            <h3 class="font-bold text-ink-900 text-lg">{{ fullName }}</h3>
          </div>
          
          <div class="space-y-4">
          </div>
        </div>
        
        <!-- Navigation Menu -->
        <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            class="w-full flex items-center justify-between px-6 py-4 border-b border-ink-100 hover:bg-ink-50 transition-colors text-left"
            :class="activeTab === tab.id ? 'bg-orange-50/50 text-orange-500' : 'text-ink-500'"
          >
            <span :class="activeTab === tab.id ? 'font-semibold' : 'font-medium'" class="text-sm">
              {{ tab.label }}
            </span>
            <ChevronRight v-if="activeTab === tab.id" class="w-4 h-4 text-orange-500" />
          </button>
        </div>
      </div>
      
      <!-- Right Content -->
      <div class="md:col-span-8">
        <!-- Profile Form -->
        <div v-if="activeTab === 'profile'" class="bg-white border border-ink-100 rounded-2xl shadow-sm">
          <div class="px-6 py-5 border-b border-ink-100">
            <h3 class="font-bold text-ink-900 text-base">{{ $t('profile.title') }}</h3>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Nama -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-2">{{ $t('profile.name') }}</label>
              <div v-if="isLoadingPhone" class="flex gap-3">
                <div class="flex-1 h-11 bg-ink-100 animate-pulse rounded-md"></div>
                <div class="w-40 h-11 bg-ink-100 animate-pulse rounded-md shrink-0"></div>
              </div>
              <div v-else class="flex flex-col sm:flex-row gap-3">
                <input type="text" :value="fullName" class="flex-1 border border-ink-200 rounded-md px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white" />
                
                <div v-if="verificationStatus === 'verified'" class="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <div class="flex w-full items-center justify-center gap-2 bg-green-50 text-green-600 px-4 py-2.5 rounded-md text-sm font-semibold border border-green-200">
                    <ShieldCheck class="w-4 h-4" /> {{ $t('profile.profileVerified') }}
                  </div>
                  <button v-if="isAdmin" @click="resetVerification" class="text-xs text-ink-400 hover:text-red-500 underline mt-1 sm:mt-0">{{ $t('profile.resetDev') }}</button>
                </div>
                
                <div v-else-if="verificationStatus === 'pending'" class="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <div class="flex w-full items-center justify-center gap-2 bg-orange-50 text-orange-600 px-4 py-2.5 rounded-md text-sm font-semibold border border-orange-200">
                    <ShieldCheck class="w-4 h-4" /> {{ $t('profile.underReview') }}
                  </div>
                  <button v-if="isAdmin" @click="resetVerification" class="text-xs text-ink-400 hover:text-red-500 underline mt-1 sm:mt-0">{{ $t('profile.resetDev') }}</button>
                </div>

                <NuxtLink v-else to="/dashboard/verification" class="flex items-center justify-center gap-2 border border-orange-500 text-orange-500 px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-orange-50 transition-colors shrink-0">
                  <ShieldCheck class="w-4 h-4" /> {{ $t('profile.verifyProfile') }}
                </NuxtLink>
              </div>
            </div>
            
            <!-- No Telepon -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-2">{{ $t('profile.phone') }}</label>
              <div class="flex flex-wrap items-center gap-2 text-sm">
                <Smartphone class="w-4 h-4 text-ink-400" />
                <!-- Loading State -->
                <template v-if="isLoadingPhone">
                  <div class="w-32 h-5 bg-ink-100 animate-pulse rounded mr-2"></div>
                  <div class="flex items-center gap-1.5 text-ink-400">
                    <Loader2 class="w-4 h-4 animate-spin" />
                    <span class="font-medium text-sm italic">{{ $t('profile.checking') }}</span>
                  </div>
                </template>
                
                <template v-else>
                  <span class="text-ink-900 mr-2">{{ phone }}</span>
                  
                  <!-- Empty State -->
                  <template v-if="phone === 'Belum diatur'">
                    <button @click="isPhoneOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">Tambah Nomor</button>
                  </template>

                  <!-- Filled State -->
                  <template v-else>
                    <!-- Unverified State -->
                    <template v-if="!isPhoneVerified">
                      <div class="flex items-center gap-1.5 text-orange-600">
                        <AlertCircle class="w-4 h-4" />
                        <span class="font-bold text-sm">{{ $t('profile.notVerified') }}</span>
                      </div>
                      <button @click="isVerifyPhoneOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">{{ $t('profile.verify') }}</button>
                      <button @click="isPhoneOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">{{ $t('profile.change') }}</button>
                    </template>
  
                    <!-- Verified State -->
                    <template v-else>
                      <div class="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-lg">
                        <ShieldCheck class="w-4 h-4" />
                        <span class="font-bold text-sm">{{ $t('profile.verified') }}</span>
                      </div>
                      <button @click="isPhoneOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">{{ $t('profile.change') }}</button>
                    </template>
                  </template>
                </template>
              </div>
            </div>
            
            <!-- Email -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-2">{{ $t('profile.email') }}</label>
              <div class="flex flex-wrap items-center gap-2 text-sm">
                <template v-if="isLoadingPhone">
                  <div class="w-48 h-5 bg-ink-100 animate-pulse rounded mr-2"></div>
                </template>
                <template v-else>
                  <span class="text-ink-900 mr-2">{{ email }}</span>
                  
                  <!-- Unverified State -->
                  <template v-if="!isEmailVerified">
                    <div class="flex items-center gap-1.5 text-orange-600">
                      <AlertCircle class="w-4 h-4" />
                      <span class="font-bold text-sm">{{ $t('profile.notVerified') }}</span>
                    </div>
                    <button @click="isEmailOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">{{ $t('profile.changeEmailVerify') }}</button>
                  </template>

                  <!-- Verified State -->
                  <template v-else>
                    <div class="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-lg">
                      <ShieldCheck class="w-4 h-4" />
                      <span class="font-bold text-sm">{{ $t('profile.verified') }}</span>
                    </div>
                    <button @click="isEmailOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">{{ $t('profile.change') }}</button>
                  </template>
                </template>
              </div>
            </div>
            
            <!-- 2FA -->
            <div class="pt-2">
              <div class="flex items-center gap-4 mb-2">
                <div class="w-48">
                  <p class="font-bold text-ink-900 text-sm">{{ $t('profile.twoFA.title') }}</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer shrink-0" :class="{'opacity-50': isUpdating2FA}">
                  <input type="checkbox" v-model="is2FAEnabled" @change="handleToggle2FA" :disabled="isUpdating2FA" class="sr-only peer">
                  <div class="w-11 h-6 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              <p class="text-xs text-ink-400 mb-4 md:ml-52 max-w-sm">{{ $t('profile.twoFA.desc') }}</p>
              
              <div :class="is2FAEnabled ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'" class="border rounded-lg p-4 flex items-start gap-3 mt-4 md:ml-52 transition-colors">
                <component :is="is2FAEnabled ? ShieldCheck : AlertCircle" :class="is2FAEnabled ? 'text-green-600' : 'text-yellow-600'" class="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p class="font-bold text-ink-900 text-sm mb-1">{{ is2FAEnabled ? $t('profile.twoFA.enabledTitle') : $t('profile.twoFA.disabledTitle') }}</p>
                  <p class="text-xs text-ink-500 leading-relaxed">{{ is2FAEnabled ? $t('profile.twoFA.enabledDesc') : $t('profile.twoFA.disabledDesc') }}</p>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="space-y-3 pt-6 border-t border-ink-100">
              <button @click="isPasswordOpen = true" class="w-full flex items-center justify-center gap-2 border border-orange-500 text-orange-500 font-bold py-2.5 rounded-lg text-sm hover:bg-orange-50 transition-colors">
                <Lock class="w-4 h-4" /> {{ $t('profile.changePassword') }}
              </button>
            </div>
          </div>
          
          <div class="px-6 py-4 flex justify-end border-t border-ink-100">
            <button class="bg-ink-100 text-ink-400 font-bold py-2 px-6 rounded-md text-sm cursor-not-allowed">
              {{ $t('profile.save') }}
            </button>
          </div>
        </div>
        
        <!-- Layanan Aktif Content -->
        <div v-else-if="activeTab === 'layanan'" class="bg-white border border-ink-100 rounded-2xl shadow-sm">
          <div class="px-6 py-5 border-b border-ink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 class="font-bold text-ink-900 text-base">{{ $t('profile.services.title') }}</h3>
            <div class="flex items-center gap-3">
              <NuxtLink to="/dashboard/topup" class="border border-orange-500 text-orange-500 font-bold py-2 px-4 rounded-md text-sm hover:bg-orange-50 transition-colors">
                {{ $t('profile.services.changePlan') }}
              </NuxtLink>
            </div>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Paket Saat Ini -->
            <div class="border border-ink-100 rounded-xl p-5 bg-orange-50/50">
              <div class="flex items-center gap-3 mb-2">
                <Gem class="w-5 h-5 text-orange-500" />
                <span class="font-bold text-ink-900 text-lg">{{ $t('profile.services.currentPlan', { name: activePackage.charAt(0).toUpperCase() + activePackage.slice(1) }) }}</span>
                <span class="px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-md uppercase tracking-wider">{{ $t('profile.services.active') }}</span>
              </div>
              <p class="text-sm text-ink-500">
                <i18n-t keypath="profile.services.planDesc" tag="span">
                  <template #name>{{ activePackage.charAt(0).toUpperCase() + activePackage.slice(1) }}</template>
                  <template #link><NuxtLink to="/dashboard/topup" class="text-orange-500 font-bold hover:underline">Top Up</NuxtLink></template>
                </i18n-t>
              </p>
            </div>

            <!-- Sewa Akun Iklan -->
            <div class="border border-ink-100 rounded-xl p-5">
              <div class="flex flex-wrap items-center gap-3 mb-5">
                <span class="font-bold text-ink-900">{{ $t('profile.services.adAccountRental') }}</span>
                <span class="px-3 py-1 bg-ink-100 text-ink-500 text-xs font-bold rounded-md">{{ $t('profile.services.accounts', { count: adsStore.adAccounts.length }) }}</span>
              </div>
              
              <div v-if="adsStore.isFetchingAccounts" class="flex justify-center p-4">
                <Loader2 class="w-6 h-6 text-orange-500 animate-spin" />
              </div>
              <div v-else-if="adsStore.adAccounts.length === 0" class="text-center p-4 text-ink-500 text-sm">
                {{ $t('profile.services.noAccounts') }}
              </div>
              <div v-else class="space-y-3">
                <div v-for="account in adsStore.adAccounts" :key="account.id" class="flex items-center justify-between p-4 border border-ink-100 rounded-lg hover:border-orange-200 transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 flex items-center justify-center shrink-0">
                      <img v-if="account.platform === 'Meta'" src="/icon-meta-ads.png" alt="Meta" class="w-5 h-5 object-contain" />
                      <svg v-else-if="account.platform === 'Google'" viewBox="0 0 24 24" class="w-5 h-5">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <div v-else class="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <span class="text-[11px] font-bold">T</span>
                      </div>
                    </div>
                    <div>
                      <span class="font-bold text-ink-900 text-sm block">{{ account.name }}</span>
                      <span class="text-[11px] text-ink-500">ID: {{ account.account_id }}</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div v-if="account.subscription_expires_at">
                      <span class="text-[10px] text-ink-500">{{ $t('profile.services.activePeriod') }}</span>
                      <div class="flex items-center justify-end gap-1.5 mt-0.5">
                        <span 
                          class="font-bold text-xs px-1.5 py-0.5 rounded" 
                          :class="getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0 ? 'bg-red-50 text-red-600' : (getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 5 ? 'bg-orange-50 text-orange-600' : 'text-ink-900')"
                        >
                          {{ calculateDaysLeft(account.subscription_expires_at) }}
                        </span>
                        <button 
                          v-if="getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 5"
                          @click="openExtendRentModal(account)" 
                          class="text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm transition-all flex items-center"
                          :class="getDaysLeftNum(account.subscription_expires_at)! <= 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-orange-500 text-white hover:bg-orange-600'"
                        >
                          {{ $t('profile.services.extend') }}
                        </button>
                      </div>
                    </div>
                    <div v-else>
                      <span class="text-[10px] text-ink-500">{{ $t('profile.services.activePeriod') }}</span>
                      <p class="font-bold text-ink-900 text-xs">-</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
    
    <!-- Modals -->
    <ModalPasswordModal v-model="isPasswordOpen" />
    <ModalVerifyPhoneModal v-model="isVerifyPhoneOpen" :phone="pendingPhone || undefined" @verified="handleVerified" />
    <ModalPhoneModal v-model="isPhoneOpen" :currentPhone="phone" @request-verify="handlePhoneRequested" />
    <ModalEmailModal v-model="isEmailOpen" :currentEmail="email" />
    
    <ModalExtendRentModal 
      v-model="isExtendRentModalOpen"
      :account="selectedAccountForExtend"
      @success="adsStore.fetchAdAccounts"
    />
  </div>
</template>

<script setup lang="ts">
import { 
  Gem, ChevronRight, ShieldCheck, Smartphone, 
  AlertCircle, Lock, Receipt, Loader2
} from 'lucide-vue-next'

import { useAdsStore } from '~/stores/ads'

definePageMeta({
  layout: 'dashboard',
})

const { t } = useI18n()
const route = useRoute()
const activeTab = ref((route.query.tab as string) || 'profile')
const activePackage = ref('starter')

const { user } = useAuth()
const adsStore = useAdsStore()

const isAdmin = computed(() => {
  const role = user.value?.user_metadata?.role || user.value?.app_metadata?.role
  return role === 'admin' || role === 'super_admin'
})

const fullName = computed(() => user.value?.user_metadata?.full_name || 'User')
const verificationStatus = ref('unverified')
const email = computed(() => user.value?.email || t('profile.notSet'))
// Anggap email otomatis terverifikasi selama user bisa login, sesuai request MVP.
const isEmailVerified = computed(() => !!user.value?.email)
const phone = computed(() => user.value?.user_metadata?.phone || t('profile.notSet'))
const { addToast } = useToast()

const initials = computed(() => {
  if (!fullName.value || fullName.value === 'User') return 'U'
  const names = fullName.value.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return names[0].substring(0, 2).toUpperCase()
})

const isPhoneVerified = ref(false)
const isLoadingPhone = ref(true)

const isPasswordOpen = ref(false)
const isEmailOpen = ref(false)
const isVerifyPhoneOpen = ref(false)
const isPhoneOpen = ref(false)
const is2FAEnabled = ref(false)
const isUpdating2FA = ref(false)
const pendingPhone = ref('')

const fetchProfile = async () => {
  try {
    const supabase = useSupabaseClient()
    
    // Sinkronisasi paksa data user terbaru dari Auth Supabase
    const { data: { user: freshUser } } = await supabase.auth.getUser()
    if (freshUser) {
      user.value = freshUser as any
    }

    // Use whatever ID field exists
    const uid = (user.value as any)?.id || (user.value as any)?.sub
    if (!uid) return

    const { data, error } = await supabase
      .from('users')
      .select('phone_verified, verification_status, active_package')
      .eq('id', uid)
      .single()
      
    if (error) {
      console.error('Supabase Profile Fetch Error:', error)
      return
    }
    
    if (data) {
      isPhoneVerified.value = (data as any).phone_verified
      if ((data as any).verification_status) {
        verificationStatus.value = (data as any).verification_status
      }
      activePackage.value = (data as any).active_package || 'starter'
    }
    
    if (user.value) {
      is2FAEnabled.value = !!user.value.user_metadata?.is_2fa_enabled
    }
  } catch (error) {
    console.error('Unexpected error fetching profile:', error)
  } finally {
    isLoadingPhone.value = false
  }
}

onMounted(() => {
  fetchProfile()
  adsStore.fetchAdAccounts()
})

const calculateDaysLeft = (dateStr: string) => {
  if (!dateStr) return '-'
  const diffDays = getDaysLeftNum(dateStr)
  if (diffDays === null) return '-'
  if (diffDays <= 0) return t('profile.services.expired')
  return diffDays + ' ' + t('profile.services.days')
}

const getDaysLeftNum = (dateStr: string) => {
  if (!dateStr) return null
  const end = new Date(dateStr)
  const today = new Date()
  end.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffTime = end.getTime() - today.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

const isExtendRentModalOpen = ref(false)
const selectedAccountForExtend = ref<any>(null)

const openExtendRentModal = (account: any) => {
  selectedAccountForExtend.value = account
  isExtendRentModalOpen.value = true
}

const handleToggle2FA = async () => {
  isUpdating2FA.value = true
  const supabase = useSupabaseClient()
  try {
    const { error } = await supabase.auth.updateUser({
      data: { is_2fa_enabled: is2FAEnabled.value }
    })
    
    if (error) throw error
    
    await supabase.auth.refreshSession()
    const { data: { user: freshUser } } = await supabase.auth.getUser()
    if (freshUser) {
      user.value = freshUser as any
    }
    
    addToast(is2FAEnabled.value ? t('profile.toast.twoFAEnabled') : t('profile.toast.twoFADisabled'), 'success')
  } catch (err: any) {
    is2FAEnabled.value = !is2FAEnabled.value
    addToast(err.message || t('profile.toast.twoFAFailed'), 'error')
  } finally {
    isUpdating2FA.value = false
  }
}

const handleVerified = async () => {
  isPhoneVerified.value = true
  const supabase = useSupabaseClient()
  
  if (pendingPhone.value) {
    // 1. Simpan nomor baru ke Supabase Auth Metadata karena sudah terbukti valid
    await supabase.auth.updateUser({
      data: { phone: pendingPhone.value }
    })
    
    // 2. Tandai database bahwa nomor sudah verified
    const uid = (user.value as any)?.id || (user.value as any)?.sub
    if (uid) {
      await (supabase as any).from('users').update({ phone_verified: true }).eq('id', uid)
    }
    
    pendingPhone.value = ''
  }
  
  await supabase.auth.refreshSession()
  await fetchProfile()
}

const handlePhoneRequested = (newPhone: string) => {
  // Hanya menampung nomor yang diminta untuk diverifikasi (belum disave ke DB)
  pendingPhone.value = newPhone
  isVerifyPhoneOpen.value = true
}

const resetVerification = async () => {
  if (!confirm(t('profile.resetConfirm'))) return
  try {
    const uid = (user.value as any)?.id || (user.value as any)?.sub
    const supabase = useSupabaseClient()
    await (supabase as any).from('users').update({ verification_status: 'unverified' }).eq('id', uid)
    addToast(t('profile.toast.resetSuccess'), 'success')
    window.location.reload()
  } catch (err: any) {
    addToast(err.message || t('profile.toast.resetFailed'), 'error')
  }
}

const tabs = computed(() => [
  { id: 'profile', label: t('profile.tabs.profile') },
  { id: 'layanan', label: t('profile.tabs.activeServices') },
])
</script>
