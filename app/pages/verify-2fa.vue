<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQsIDI3LCA0MiwgMC4wMykiLz48L3N2Zz4=')]">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-ink-900/5 border border-ink-100 p-8 md:p-10 relative overflow-hidden">
      <!-- Decorative Blob -->
      <div class="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

      <div class="flex justify-center mb-8">
        <div class="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100">
          <ShieldCheck class="w-8 h-8" />
        </div>
      </div>

      <div class="text-center mb-8">
        <h1 class="text-2xl font-display font-bold text-ink-900 mb-2">{{ $t('auth.verifySecurityTitle') }}</h1>
        <p class="text-ink-500 text-sm">{{ $t('auth.verifySecuritySubtitle1') }}{{ maskedPhone }}{{ $t('auth.verifySecuritySubtitle2') }}</p>
      </div>

      <div class="space-y-6">
        <div class="flex justify-between gap-2 sm:gap-3" @paste="handlePaste">
          <input 
            v-for="(digit, index) in 6" 
            :key="index"
            :ref="el => otpInputs[index] = el"
            v-model="otpValues[index]"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="1"
            class="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-ink-50 border border-ink-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-ink-900"
            @input="handleInput(index, $event)"
            @keydown="handleKeydown(index, $event)"
          >
        </div>

        <button 
          @click="verifyOTP" 
          :disabled="!isOtpComplete || isVerifying"
          :class="!isOtpComplete || isVerifying ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'"
          class="w-full font-bold py-3.5 px-4 rounded-xl transition-all flex justify-center items-center gap-2"
        >
          <span v-if="isVerifying">{{ $t('common.verifying') }}</span>
          <span v-else>{{ $t('auth.verifyAndLogin') }}</span>
        </button>
        
        <div class="text-center pt-2 space-y-4">
          <button 
            @click="resendOTP" 
            :disabled="cooldown > 0 || isResending"
            class="block w-full text-sm font-semibold transition-colors disabled:opacity-50"
            :class="cooldown > 0 ? 'text-ink-400 cursor-not-allowed' : 'text-orange-600 hover:text-orange-700'"
          >
            <span v-if="isResending">{{ $t('auth.resending') }}</span>
            <span v-else-if="cooldown > 0">{{ $t('auth.resendIn') }} {{ cooldown }}s</span>
            <span v-else>{{ $t('auth.resendOtp') }}</span>
          </button>
          
          <button @click="cancelLogin" class="text-xs font-medium text-ink-400 hover:text-ink-600 underline underline-offset-2">
            {{ $t('auth.cancelAndBack') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const router = useRouter()
const { t } = useI18n()
const { addToast } = useToast()
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const needs2FA = useCookie('needs_2fa')

const phone = computed(() => user.value?.user_metadata?.phone || '')

const maskedPhone = computed(() => {
  if (!phone.value) return ''
  const str = phone.value
  if (str.length < 8) return str
  return str.substring(0, 4) + '****' + str.substring(str.length - 3)
})

const otpInputs = ref<any[]>([])
const otpValues = ref<string[]>(Array(6).fill(''))
const isVerifying = ref(false)
const isResending = ref(false)
const cooldown = ref(30)
let timer: any = null

const isOtpComplete = computed(() => otpValues.value.every(v => v !== ''))
const otpString = computed(() => otpValues.value.join(''))

onMounted(() => {
  if (otpInputs.value[0]) {
    setTimeout(() => otpInputs.value[0].focus(), 100)
  }
  startCooldown()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const startCooldown = () => {
  cooldown.value = 30
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (cooldown.value > 0) cooldown.value--
    else clearInterval(timer)
  }, 1000)
}

const handleInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/[^0-9]/g, '')
  
  if (value) {
    otpValues.value[index] = value[value.length - 1] || '' // Take last typed character
    if (index < 5 && otpInputs.value[index + 1]) {
      otpInputs.value[index + 1].focus()
    }
  } else {
    otpValues.value[index] = ''
  }
  
  if (isOtpComplete.value) {
    verifyOTP()
  }
}

const handleKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !otpValues.value[index] && index > 0) {
    otpInputs.value[index - 1].focus()
    otpValues.value[index - 1] = ''
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
  if (!pastedData) return
  
  for (let i = 0; i < pastedData.length; i++) {
    otpValues.value[i] = pastedData[i] || ''
  }
  
  if (pastedData.length < 6 && otpInputs.value[pastedData.length]) {
    otpInputs.value[pastedData.length].focus()
  } else if (otpInputs.value[5]) {
    otpInputs.value[5].focus()
  }
  
  if (isOtpComplete.value) {
    verifyOTP()
  }
}

const verifyOTP = async () => {
  if (!isOtpComplete.value) return
  isVerifying.value = true
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await $fetch('/api/otp/verify', {
      method: 'POST',
      headers: {
        Authorization: session ? `Bearer ${session.access_token}` : '',
        'csrf-token': unref(useCsrf().csrf) || ''
      },
      body: { phone: phone.value, otp: otpString.value }
    }) as any
    
    if (res.success) {
      addToast(t('auth.toast.verifySuccess'), 'success')
      needs2FA.value = null // clear cookie
      router.push('/dashboard')
    } else {
      addToast(res.message || t('auth.toast.wrongOtp'), 'error')
      otpValues.value = Array(6).fill('')
      if (otpInputs.value[0]) otpInputs.value[0].focus()
    }
  } catch (err: any) {
    addToast(err.data?.message || t('auth.toast.verifyError'), 'error')
    otpValues.value = Array(6).fill('')
    if (otpInputs.value[0]) otpInputs.value[0].focus()
  } finally {
    isVerifying.value = false
  }
}

const resendOTP = async () => {
  if (cooldown.value > 0 || !phone.value) return
  isResending.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    await $fetch('/api/otp/send', {
      method: 'POST',
      headers: {
        Authorization: session ? `Bearer ${session.access_token}` : '',
        'csrf-token': unref(useCsrf().csrf) || ''
      },
      body: { phone: phone.value }
    })
    addToast(t('auth.toast.newOtpSent'), 'success')
    startCooldown()
    if (otpInputs.value[0]) otpInputs.value[0].focus()
  } catch (err: any) {
    addToast(err.data?.message || t('auth.toast.resendFailed'), 'error')
  } finally {
    isResending.value = false
  }
}

const cancelLogin = async () => {
  needs2FA.value = null
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
