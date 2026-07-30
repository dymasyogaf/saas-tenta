<template>
  <!-- Modal Verifikasi No Telepon -->
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[60]">
    <div class="fixed inset-0 bg-ink-900/50 transition-opacity" @click="close"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative transform transition-all pt-10 pb-8 px-6 sm:px-10 text-center">
        <!-- Close Button -->
        <button @click="close" class="absolute top-4 right-4 text-ink-400 hover:text-ink-600 transition-colors">
          <X class="w-5 h-5" />
        </button>
        
        <!-- Body -->
        <p class="text-ink-900 text-sm md:text-base leading-relaxed mb-6">
          {{ $t('modals.verifyPhone.subtitle1') }}<br>
          <span class="text-orange-500">{{ actualPhone }}</span><br>
          {{ $t('modals.verifyPhone.subtitle2') }}
        </p>
        
        <div class="flex items-center justify-center gap-2 sm:gap-4 mb-6">
          <input 
            v-for="(digit, index) in 6" 
            :key="index"
            :ref="el => inputRefs[index] = el as HTMLInputElement"
            v-model="otp[index]"
            type="text" 
            maxlength="1" 
            @input="handleInput(index, $event)"
            @keydown.delete="handleDelete(index, $event)"
            class="w-10 h-12 sm:w-12 sm:h-14 border border-ink-200 rounded-lg text-center text-xl font-bold text-ink-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
          >
        </div>
        
        <p class="text-ink-500 text-sm mb-6">
          <span v-if="timeLeft > 0">{{ $t('modals.verifyPhone.wait') }} <span class="text-orange-500 font-medium">{{ timeLeft }} {{ $t('modals.verifyPhone.seconds') }}</span> {{ $t('modals.verifyPhone.resend') }}</span>
          <button v-else @click="sendOTP" class="text-orange-500 font-bold hover:underline">{{ $t('modals.verifyPhone.resendBtn') }}</button>
        </p>
        
        <button 
          @click="verifyOTP"
          :disabled="isVerifying || otpString.length < 6 || attempts >= 5"
          :class="isVerifying || otpString.length < 6 || attempts >= 5 ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'"
          class="w-full font-bold py-3 rounded-lg text-sm transition-all mb-4 flex items-center justify-center gap-2"
        >
          <span v-if="isVerifying">{{ $t('modals.verifyPhone.verifying') }}</span>
          <span v-else>{{ $t('modals.verifyPhone.verifyBtn') }}</span>
        </button>
        
        <p class="text-ink-900 text-sm">
          {{ $t('modals.verifyPhone.attempts1') }} <span class="text-orange-500 font-medium">{{ 5 - attempts }}X</span> {{ $t('modals.verifyPhone.attempts2') }}
        </p>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: boolean
  phone?: string
}>(), {
  phone: '+6283178772170'
})

const emit = defineEmits(['update:modelValue', 'verified'])

const { user } = useAuth()
const { addToast } = useToast()
const { t } = useI18n()

const actualPhone = computed(() => {
  if (props.phone) return props.phone // Prioritaskan props.phone (nomor baru)
  if (user.value?.user_metadata?.phone) return user.value.user_metadata.phone
  return '+6283178772170'
})

const otp = ref(['', '', '', '', '', ''])
const inputRefs = ref<HTMLInputElement[]>([])
const otpString = computed(() => otp.value.join(''))

const isVerifying = ref(false)
const attempts = ref(0)
const timeLeft = ref(0)
let timer: any = null

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/[^0-9]/g, '')
  otp.value[index] = value
  
  // Auto advance
  if (value && index < 5) {
    inputRefs.value[index + 1]?.focus()
  }
}

const handleDelete = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !otp.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus()
  }
}

const startTimer = () => {
  timeLeft.value = 350
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    if (timeLeft.value > 0) timeLeft.value--
    else clearInterval(timer)
  }, 1000)
}

const sendOTP = async () => {
  if (!actualPhone.value) {
    addToast(t('modals.verifyPhone.errInvalidPhone'), 'error')
    return
  }
  
  try {
    const { data: { session } } = await useSupabaseClient().auth.getSession()
    addToast(t('modals.verifyPhone.sendingOtp'), 'info')
    await $fetch('/api/otp/send', {
      method: 'POST',
      headers: {
        Authorization: session ? `Bearer ${session.access_token}` : '',
        'csrf-token': unref(useCsrf().csrf) || ''
      },
      body: { phone: actualPhone.value }
    })
    startTimer()
    addToast(t('modals.verifyPhone.successSend'), 'success')
  } catch (err: any) {
    addToast(err.data?.statusMessage || t('modals.verifyPhone.errSend'), 'error')
  }
}

const verifyOTP = async () => {
  if (otpString.value.length < 6 || attempts.value >= 5) return
  
  isVerifying.value = true
  attempts.value++
  
  try {
    const { data: { session } } = await useSupabaseClient().auth.getSession()
    await $fetch('/api/otp/verify', {
      method: 'POST',
      headers: {
        Authorization: session ? `Bearer ${session.access_token}` : '',
        'csrf-token': unref(useCsrf().csrf) || ''
      },
      body: { phone: actualPhone.value, otp: otpString.value }
    })
    
    addToast(t('modals.verifyPhone.successVerify'), 'success')
    emit('verified')
    close()
  } catch (err: any) {
    addToast(err.data?.statusMessage || t('modals.verifyPhone.errVerify'), 'error')
    otp.value = ['', '', '', '', '', ''] // reset
    inputRefs.value[0]?.focus()
  } finally {
    isVerifying.value = false
  }
}

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    otp.value = ['', '', '', '', '', '']
    attempts.value = 0
    if (timeLeft.value === 0) {
      sendOTP()
    } else {
      setTimeout(() => inputRefs.value[0]?.focus(), 100)
    }
  } else {
    if (timer) clearInterval(timer)
  }
})

const close = () => {
  emit('update:modelValue', false)
}
</script>
