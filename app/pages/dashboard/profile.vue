<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <h2 class="text-2xl font-display font-bold text-ink-900 mb-6">Profile</h2>
    
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
            <div class="flex justify-between items-center">
              <span class="text-sm text-ink-500 font-medium">Layanan Aktif:</span>
              <span class="flex items-center gap-1.5 px-3 py-1 rounded-full border border-orange-500 text-orange-500 text-xs font-bold bg-white">
                <Gem class="w-3 h-3" /> GRATIS
              </span>
            </div>
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
            <h3 class="font-bold text-ink-900 text-base">Profile</h3>
          </div>
          
          <div class="p-6 space-y-6">
            <!-- Nama -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-2">Nama</label>
              <div v-if="isLoadingPhone" class="flex gap-3">
                <div class="flex-1 h-11 bg-ink-100 animate-pulse rounded-md"></div>
                <div class="w-40 h-11 bg-ink-100 animate-pulse rounded-md shrink-0"></div>
              </div>
              <div v-else class="flex flex-col sm:flex-row gap-3">
                <input type="text" :value="fullName" class="flex-1 border border-ink-200 rounded-md px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white" />
                
                <div v-if="isProfileVerified" class="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <div class="flex w-full items-center justify-center gap-2 bg-green-50 text-green-600 px-4 py-2.5 rounded-md text-sm font-semibold border border-green-200">
                    <ShieldCheck class="w-4 h-4" /> Profile Terverifikasi
                  </div>
                  <button @click="resetVerification" class="text-xs text-ink-400 hover:text-red-500 underline mt-1 sm:mt-0">Reset (Dev)</button>
                </div>
                
                <NuxtLink v-else to="/dashboard/verification" class="flex items-center justify-center gap-2 border border-orange-500 text-orange-500 px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-orange-50 transition-colors shrink-0">
                  <ShieldCheck class="w-4 h-4" /> Verifikasi profile
                </NuxtLink>
              </div>
            </div>
            
            <!-- No Telepon -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-2">No Telepon</label>
              <div class="flex flex-wrap items-center gap-2 text-sm">
                <Smartphone class="w-4 h-4 text-ink-400" />
                <!-- Loading State -->
                <template v-if="isLoadingPhone">
                  <div class="w-32 h-5 bg-ink-100 animate-pulse rounded mr-2"></div>
                  <div class="flex items-center gap-1.5 text-ink-400">
                    <Loader2 class="w-4 h-4 animate-spin" />
                    <span class="font-medium text-sm italic">Memeriksa...</span>
                  </div>
                </template>
                
                <template v-else>
                  <span class="text-ink-900 mr-2">{{ phone }}</span>
                  <!-- Unverified State -->
                  <template v-if="!isPhoneVerified">
                    <div class="flex items-center gap-1.5 text-orange-600">
                      <AlertCircle class="w-4 h-4" />
                      <span class="font-bold text-sm">Belum Diverifikasi</span>
                    </div>
                    <button @click="isVerifyPhoneOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">Verifikasi</button>
                    <button @click="isPhoneOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">Ubah</button>
                  </template>
  
                  <!-- Verified State -->
                  <template v-else>
                    <div class="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-lg">
                      <ShieldCheck class="w-4 h-4" />
                      <span class="font-bold text-sm">Terverifikasi</span>
                    </div>
                    <button @click="isPhoneOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">Ubah</button>
                  </template>
                </template>
              </div>
            </div>
            
            <!-- Email -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-2">Email</label>
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
                      <span class="font-bold text-sm">Belum Diverifikasi</span>
                    </div>
                    <button @click="isEmailOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">Ubah Email / Verifikasi</button>
                  </template>
  
                  <!-- Verified State -->
                  <template v-else>
                    <div class="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-lg">
                      <ShieldCheck class="w-4 h-4" />
                      <span class="font-bold text-sm">Terverifikasi</span>
                    </div>
                    <button @click="isEmailOpen = true" class="text-orange-500 hover:text-orange-600 font-medium ml-2 underline underline-offset-2">Ubah</button>
                  </template>
                </template>
              </div>
            </div>
            
            <!-- 2FA -->
            <div class="pt-2">
              <div class="flex items-center gap-4 mb-2">
                <div class="w-48">
                  <p class="font-bold text-ink-900 text-sm">Aktifkan Two-Factor Authentication (2FA)</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer shrink-0" :class="{'opacity-50': isUpdating2FA}">
                  <input type="checkbox" v-model="is2FAEnabled" @change="handleToggle2FA" :disabled="isUpdating2FA" class="sr-only peer">
                  <div class="w-11 h-6 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              <p class="text-xs text-ink-400 mb-4 md:ml-52 max-w-sm">Tingkatkan keamanan akunmu dengan OTP setiap kali login menggunakan email.</p>
              
              <div :class="is2FAEnabled ? 'bg-green-50 border-green-100' : 'bg-yellow-50 border-yellow-100'" class="border rounded-lg p-4 flex items-start gap-3 mt-4 md:ml-52 transition-colors">
                <component :is="is2FAEnabled ? ShieldCheck : AlertCircle" :class="is2FAEnabled ? 'text-green-600' : 'text-yellow-600'" class="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p class="font-bold text-ink-900 text-sm mb-1">{{ is2FAEnabled ? 'Keren, akunmu udah diamankan menggunakan 2FA' : 'Amankan akunmu sekarang dengan 2FA' }}</p>
                  <p class="text-xs text-ink-500 leading-relaxed">{{ is2FAEnabled ? 'Akun Anda sekarang dilindungi oleh verifikasi OTP setiap kali login menggunakan email.' : 'Aktifkan Two-Factor Authentication (2FA) untuk meminimalisir risiko keamanan pada akunmu.' }}</p>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="space-y-3 pt-6 border-t border-ink-100">
              <button @click="isPasswordOpen = true" class="w-full flex items-center justify-center gap-2 border border-orange-500 text-orange-500 font-bold py-2.5 rounded-lg text-sm hover:bg-orange-50 transition-colors">
                <Lock class="w-4 h-4" /> Ganti Password
              </button>
            </div>
          </div>
          
          <div class="px-6 py-4 flex justify-end border-t border-ink-100">
            <button class="bg-ink-100 text-ink-400 font-bold py-2 px-6 rounded-md text-sm cursor-not-allowed">
              Simpan
            </button>
          </div>
        </div>
        
        <!-- Bank Content -->
        <div v-else-if="activeTab === 'bank'" class="bg-white border border-ink-100 rounded-2xl shadow-sm">
          <div class="px-6 py-5 border-b border-ink-100">
            <h3 class="font-bold text-ink-900 text-base">Bank</h3>
          </div>
          <div class="p-6">
            <p class="text-ink-900 text-sm mb-6 leading-relaxed">Penarikan My Balance akan ditransfer ke Bank di bawah ini. Mohon pastikan data yang diinput sudah benar</p>
            <div class="space-y-6">
              <div>
                <label class="block text-sm text-ink-900 mb-2">Nama pemilik rekening</label>
                <input type="text" class="w-full border border-ink-100 rounded-md px-3 py-2 text-sm text-ink-700 bg-ink-50/30 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" value="">
              </div>
              <div>
                <label class="block text-sm text-ink-900 mb-2">Bank</label>
                <input type="text" class="w-full border border-ink-100 rounded-md px-3 py-2 text-sm text-ink-700 bg-ink-50/30 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" value="">
              </div>
              <div>
                <label class="block text-sm text-ink-900 mb-2">Nomor rekening</label>
                <input type="text" class="w-full border border-ink-100 rounded-md px-3 py-2 text-sm text-ink-700 bg-ink-50/30 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" value="">
              </div>
            </div>
          </div>
          <div class="px-6 py-4 flex justify-end border-t border-ink-100">
            <button class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-md text-sm transition-colors">
              Ubah Data Bank
            </button>
          </div>
        </div>

        <!-- Layanan Aktif Content -->
        <div v-else-if="activeTab === 'layanan'" class="bg-white border border-ink-100 rounded-2xl shadow-sm">
          <div class="px-6 py-5 border-b border-ink-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 class="font-bold text-ink-900 text-base">Layananku</h3>
            <div class="flex items-center gap-3">
              <button class="border border-orange-500 text-orange-500 font-bold py-2 px-4 rounded-md text-sm hover:bg-orange-50 transition-colors">
                Eksplor Layanan
              </button>
              <button class="flex items-center gap-2 border border-orange-500 text-orange-500 font-bold py-2 px-4 rounded-md text-sm hover:bg-orange-50 transition-colors">
                <Receipt class="w-4 h-4" /> Halaman Invoice
              </button>
            </div>
          </div>
          
          <div class="p-6">
            <div class="border border-ink-100 rounded-xl p-5">
              <div class="flex flex-wrap items-center gap-3 mb-5">
                <span class="font-bold text-ink-900">Ads Platform</span>
                <span class="text-ink-500 text-sm">Ads Whitelisted</span>
                <span class="px-3 py-1 bg-ink-100 text-ink-500 text-xs font-bold rounded-md">Subscription Inactive</span>
              </div>
              
              <div class="space-y-3">
                <div class="flex items-center gap-3 p-4 border border-ink-100 rounded-lg">
                  <div class="w-8 h-8 flex items-center justify-center shrink-0">
                    <img src="/icon-meta-ads.png" alt="Meta" class="w-full h-full object-contain">
                  </div>
                  <span class="font-bold text-ink-900 text-sm">Facebook Whitelisted</span>
                </div>
                <div class="flex items-center gap-3 p-4 border border-ink-100 rounded-lg">
                  <div class="w-8 h-8 rounded-full border border-ink-100 flex items-center justify-center p-1.5 bg-black">
                    <img src="/tiktok.svg" alt="TikTok" class="w-full h-full object-contain filter brightness-0 invert">
                  </div>
                  <span class="font-bold text-ink-900 text-sm">Tiktok Whitelisted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Kode Referral Content -->
        <div v-else-if="activeTab === 'referral'" class="bg-white border border-ink-100 rounded-2xl shadow-sm">
          <div class="px-6 pt-5 pb-4 border-b border-ink-100">
            <h3 class="font-bold text-ink-900 text-base">Kode Referral</h3>
          </div>
          <div class="p-6 space-y-6">
            <div class="bg-ink-50/50 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <p class="text-ink-900 text-sm font-medium">Daftar disini untuk mengikuti program Affiliate</p>
              <button class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-md text-sm transition-colors shrink-0 shadow-sm">
                Daftar Menjadi Affiliate Partner
              </button>
            </div>
            
            <div class="bg-ink-50/50 rounded-xl p-5">
              <h4 class="font-bold text-ink-900 text-sm mb-2">Affiliate</h4>
              <p class="text-ink-900 text-sm mb-4">
                Kamu punya <span class="text-pink-600 font-medium">74 hari lagi</span> untuk memasukkan kode referral temanmu.
              </p>
              <div class="flex flex-col sm:flex-row gap-3">
                <input type="text" class="flex-1 border border-ink-200 rounded-md px-3 py-2.5 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white" placeholder="" />
                <button class="bg-ink-100 text-ink-400 font-bold py-2.5 px-8 rounded-md text-sm cursor-not-allowed shrink-0">
                  Submit
                </button>
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
  </div>
</template>

<script setup lang="ts">
import { 
  Gem, ChevronRight, ShieldCheck, Smartphone, 
  AlertCircle, Lock, Receipt, Loader2
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
})

const activeTab = ref('profile')

const { user } = useAuth()

const fullName = computed(() => user.value?.user_metadata?.full_name || 'User')
const isProfileVerified = computed(() => !!user.value?.user_metadata?.profile_verified)
const email = computed(() => user.value?.email || 'Belum diatur')
// Anggap email otomatis terverifikasi selama user bisa login, sesuai request MVP.
const isEmailVerified = computed(() => !!user.value?.email)
const phone = computed(() => user.value?.user_metadata?.phone || 'Belum diatur')
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
    .select('phone_verified')
    .eq('id', uid)
    .single()
    
  if (error) {
    console.error('Supabase Profile Fetch Error:', error)
    return
  }
  
  if (data) {
    isPhoneVerified.value = (data as any).phone_verified
  }
  
  if (user.value) {
    is2FAEnabled.value = !!user.value.user_metadata?.is_2fa_enabled
  }
  
  isLoadingPhone.value = false
}

onMounted(() => {
  if (user.value) {
    is2FAEnabled.value = !!user.value.user_metadata?.is_2fa_enabled
    fetchProfile()
  }
})

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
    
    addToast(is2FAEnabled.value ? '2FA berhasil diaktifkan' : '2FA berhasil dinonaktifkan', 'success')
  } catch (err: any) {
    is2FAEnabled.value = !is2FAEnabled.value
    addToast(err.message || 'Gagal mengubah status 2FA', 'error')
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
  try {
    const supabase = useSupabaseClient()
    await supabase.auth.updateUser({
      data: { profile_verified: false }
    })
    await supabase.auth.refreshSession()
    addToast('Status verifikasi berhasil di-reset untuk testing!', 'success')
    window.location.reload()
  } catch (err: any) {
    addToast(err.message || 'Gagal reset', 'error')
  }
}

const tabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'bank', label: 'Bank' },
  { id: 'layanan', label: 'Layanan Aktif' },
  { id: 'referral', label: 'Kode Referral' },
]
</script>
