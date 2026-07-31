<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQsIDI3LCA0MiwgMC4wMykiLz48L3N2Zz4=')]">
    <div class="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-ink-900/5 border border-ink-100 p-8 md:p-10 relative overflow-hidden my-8">
      <!-- Decorative Blob -->
      <div class="absolute top-0 left-0 w-40 h-40 bg-orange-500 opacity-5 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none"></div>

      <div class="flex justify-center mb-6">
        <img src="/logo-full.png" alt="Tentaklik Logo" class="h-8 w-auto">
      </div>

      <div class="text-center mb-8">
        <h1 class="text-2xl font-display font-bold text-ink-900 mb-2">{{ $t('auth.registerTitle') }}</h1>
        <p class="text-ink-500 text-sm">{{ $t('auth.registerSubtitle') }}</p>
      </div>

      <!-- Error Message -->
      <div v-if="authError || errorMsg" class="flex items-center gap-2 bg-red-50 text-red-600 p-3 mb-6 rounded-xl border border-red-200 text-sm font-medium">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ authError || errorMsg }}</span>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">{{ $t('auth.fullName') }} <span class="text-red-500">*</span></label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-400">
              <User class="w-5 h-5" />
            </div>
            <input v-model="name" type="text" required :placeholder="$t('auth.namePlaceholder')" class="w-full pl-11 pr-4 py-3 bg-ink-50 border border-ink-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-ink-900 placeholder:text-ink-400">
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">{{ $t('auth.email') }} <span class="text-red-500">*</span></label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-400">
              <Mail class="w-5 h-5" />
            </div>
            <input v-model="email" type="email" required :placeholder="$t('auth.registerEmailPlaceholder')" class="w-full pl-11 pr-4 py-3 bg-ink-50 border border-ink-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-ink-900 placeholder:text-ink-400">
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">{{ $t('auth.whatsapp') }} <span class="text-red-500">*</span></label>
          <div class="flex">
            <div class="relative w-[110px] bg-ink-100 border border-ink-200 border-r-0 rounded-l-xl flex items-center justify-between px-3 group focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:z-10 transition-all">
              <span class="font-medium text-ink-900">{{ selectedCountry?.flag }} {{ dialCode }}</span>
              <svg class="w-4 h-4 text-ink-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              
              <select v-model="dialCode" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer outline-none">
                <option v-for="c in countryCodes" :key="c.code" :value="c.dial_code" :title="c.name">
                  {{ c.flag }} {{ c.name }} ({{ c.dial_code }})
                </option>
              </select>
            </div>
            <input v-model="phone" type="tel" required @input="phone = phone.replace(/[^0-9]/g, '')" placeholder="81234567890" class="w-full pl-4 pr-4 py-3 bg-ink-50 border border-ink-200 rounded-r-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 focus:z-10 transition-all outline-none text-ink-900 placeholder:text-ink-400">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-ink-900 mb-2">{{ $t('auth.password') }} <span class="text-red-500">*</span></label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-400">
                <Lock class="w-5 h-5" />
              </div>
              <input v-model="password" :type="showPassword ? 'text' : 'password'" required placeholder="••••••••" class="w-full pl-11 pr-12 py-3 bg-ink-50 border border-ink-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-ink-900 placeholder:text-ink-400">
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center text-ink-400 hover:text-ink-600 transition-colors">
                <EyeOff v-if="!showPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-ink-900 mb-2">{{ $t('auth.confirmPassword') }} <span class="text-red-500">*</span></label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-400">
                <LockKeyhole class="w-5 h-5" />
              </div>
              <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" required placeholder="••••••••" class="w-full pl-11 pr-12 py-3 bg-ink-50 border border-ink-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-ink-900 placeholder:text-ink-400">
              <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center text-ink-400 hover:text-ink-600 transition-colors">
                <EyeOff v-if="!showConfirmPassword" class="w-5 h-5" />
                <Eye v-else class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div class="pt-2 flex items-start gap-2">
          <input type="checkbox" id="terms" required class="mt-0.5 w-4 h-4 shrink-0 text-orange-600 bg-ink-50 border-ink-200 rounded focus:ring-orange-500 focus:ring-2 accent-orange-500">
          <label for="terms" class="text-xs text-ink-500 leading-relaxed text-left cursor-pointer select-none">
            <i18n-t keypath="auth.termsText" tag="span">
              <template #terms>
                <a href="https://tentaklik.com/ketentuan/" target="_blank" rel="noopener noreferrer" class="text-orange-600 font-bold hover:underline">{{ $t('auth.termsLink') }}</a>
              </template>
              <template #privacy>
                <a href="https://tentaklik.com/privasi/" target="_blank" rel="noopener noreferrer" class="text-orange-600 font-bold hover:underline">{{ $t('auth.privacyLink') }}</a>
              </template>
            </i18n-t>
          </label>
        </div>

        <button type="submit" :disabled="isLoading" class="w-full bg-ink-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-ink-800 transition-colors shadow-lg shadow-ink-900/10 mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          <template v-if="isLoading">
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>{{ $t('common.processing') }}</span>
          </template>
          <template v-else>
            <span>{{ $t('auth.registerButton') }}</span>
            <ArrowRight class="w-4 h-4" />
          </template>
        </button>
      </form>

      <p class="text-center text-sm font-medium text-ink-600 mt-8">
        {{ $t('auth.hasAccount') }} <NuxtLink to="/login" class="text-orange-600 font-bold hover:underline">{{ $t('auth.loginHere') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Mail, Lock, LockKeyhole, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'
import { countryCodes } from '~/utils/countryCodes'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const router = useRouter()
const name = ref('')
const email = ref('')
const dialCode = ref('+62')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const errorMsg = ref('')

const selectedCountry = computed(() => {
  return countryCodes.find(c => c.dial_code === dialCode.value) || countryCodes[0]
})

const { register, loading, error: authError } = useAuth()
const { addToast } = useToast()

// Sync our local loading state with the composable's loading state, or just use the composable's directly.
// We'll use a watch or simply bind disabled to loading.
watchEffect(() => {
  isLoading.value = loading.value
})

const handleRegister = async () => {
  errorMsg.value = ''
  
  if (password.value !== confirmPassword.value) {
    errorMsg.value = t('auth.toast.passwordMismatch')
    return
  }

  // Remove leading zeros from phone input just in case user types '0812...' instead of '812...'
  let cleanPhone = phone.value.trim().replace(/^0+/, '')
  const fullPhone = `${dialCode.value}${cleanPhone}`

  const data = await register(email.value, password.value, name.value, fullPhone)
  if (data) {
    router.push({ path: '/check-email', query: { email: email.value } })
  }
}

const showAlert = (msg: string) => {
  addToast(msg, 'info')
}
</script>
