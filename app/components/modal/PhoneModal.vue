<template>
  <!-- Modal Ubah No Telepon -->
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[60]">
    <div class="fixed inset-0 bg-ink-900/50 transition-opacity" @click="close"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between p-6">
          <h3 class="font-bold text-ink-900 text-xl">{{ $t('modals.phone.title') }}</h3>
          <button @click="close" class="text-ink-400 hover:text-ink-600 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="px-6 space-y-5">
          <p class="text-sm text-ink-500 mb-2">
            {{ $t('modals.phone.current') }} <span class="font-semibold text-ink-900">{{ currentPhone }}</span>
          </p>
          
          <!-- No Telepon Baru -->
          <div>
            <label class="block text-sm font-medium text-ink-900 mb-2">{{ $t('modals.phone.new') }}</label>
            <div class="flex">
              <div class="relative w-[110px] bg-ink-50 border border-ink-200 border-r-0 rounded-l-md flex items-center justify-between px-3 group focus-within:bg-white focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
                <span class="font-medium text-ink-900 text-sm">{{ selectedCountry?.flag }} {{ dialCode }}</span>
                <svg class="w-4 h-4 text-ink-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                
                <select v-model="dialCode" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer outline-none">
                  <option v-for="c in countryCodes" :key="c.code" :value="c.dial_code" :title="c.name">
                    {{ c.flag }} {{ c.name }} ({{ c.dial_code }})
                  </option>
                </select>
              </div>
              <input 
                v-model="newPhone" 
                type="tel" 
                @input="newPhone = newPhone.replace(/[^0-9]/g, '')"
                name="new_phone_number"
                autocomplete="off"
                placeholder="81234567890"
                class="w-full border border-ink-200 rounded-r-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
            </div>
          </div>
          
          <!-- Konfirmasi Password -->
          <div>
            <label class="block text-sm font-medium text-ink-900 mb-2">{{ $t('modals.email.securityConfirm') }}</label>
            <div class="relative">
              <input 
                v-model="password"
                type="text"
                name="security_token_verification_phone"
                autocomplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                :style="!showPassword ? '-webkit-text-security: disc;' : ''"
                :placeholder="$t('modals.email.passwordPlaceholder')"
                class="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
              <button @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-600">
                <component :is="showPassword ? Eye : EyeOff" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-xs text-ink-400 mt-1.5">{{ $t('modals.email.securityDesc') }}</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 mt-6 border-t border-ink-100 flex justify-end gap-3">
          <button @click="close" class="text-ink-500 hover:text-ink-700 font-medium py-2 px-4 rounded-md text-sm transition-colors">
            {{ $t('common.cancel') }}
          </button>
          <button 
            @click="savePhone"
            :disabled="!isValid || isLoading"
            :class="!isValid || isLoading ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'"
            class="font-bold py-2 px-6 rounded-md text-sm transition-all flex items-center gap-2"
          >
            <span v-if="isLoading">{{ $t('common.processing') }}</span>
            <span v-else>{{ $t('common.next') }}</span>
          </button>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Eye, EyeOff } from 'lucide-vue-next'
import { countryCodes } from '~/utils/countryCodes'

const props = defineProps<{
  modelValue: boolean
  currentPhone?: string
}>()

const emit = defineEmits(['update:modelValue', 'request-verify'])

const { addToast } = useToast()
const { user } = useAuth()
const supabase = useSupabaseClient()

const { t } = useI18n()
const dialCode = ref('+62')
const newPhone = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const selectedCountry = computed(() => {
  return countryCodes.find(c => c.dial_code === dialCode.value) || countryCodes[0]
})

const fullPhone = computed(() => {
  const cleanPhone = newPhone.value.trim().replace(/^0+/, '')
  return `${dialCode.value}${cleanPhone}`
})

const isValid = computed(() => {
  return newPhone.value.length >= 8 && fullPhone.value !== props.currentPhone && password.value.length >= 8
})

const savePhone = async () => {
  if (!isValid.value || !user.value?.email) return
  
  isLoading.value = true
  try {
    // 1. Verifikasi Password terlebih dahulu
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.value.email,
      password: password.value
    })
    
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error(t('modals.password.errWrongOld'))
      }
      throw authError
    }
  
    // 2. Jika password benar, JANGAN langsung update database.
    // Kirim nomor baru kembali ke parent (profile) untuk diverifikasi OTP terlebih dahulu
    emit('request-verify', fullPhone.value)
    close()
  } catch (err: any) {
    addToast(err.message || t('modals.phone.errVerify'), 'error')
  } finally {
    isLoading.value = false
  }
}

const close = () => {
  emit('update:modelValue', false)
  setTimeout(() => {
    newPhone.value = ''
    password.value = ''
    showPassword.value = false
  }, 200)
}
</script>
