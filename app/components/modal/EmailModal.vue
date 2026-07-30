<template>
  <!-- Modal Ubah Email -->
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[60]">
    <div class="fixed inset-0 bg-ink-900/50 transition-opacity" @click="close"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between p-6">
          <h3 class="font-bold text-ink-900 text-xl">{{ $t('modals.email.title') }}</h3>
          <button @click="close" class="text-ink-400 hover:text-ink-600 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="px-6 space-y-5">
          <p class="text-sm text-ink-500 mb-2">
            {{ $t('modals.email.currentEmail') }} <span class="font-semibold text-ink-900">{{ currentEmail }}</span>
          </p>
          
          <!-- Email Baru -->
          <div>
            <label class="block text-sm font-medium text-ink-900 mb-2">{{ $t('modals.email.newEmail') }}</label>
            <div class="relative">
              <input 
                v-model="newEmail" 
                type="text" 
                name="new_contact_address"
                autocomplete="off"
                :placeholder="$t('modals.email.newEmailPlaceholder')"
                class="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
                name="security_token_verification"
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
            @click="saveEmail"
            :disabled="!isValid || isLoading"
            :class="!isValid || isLoading ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'"
            class="font-bold py-2 px-6 rounded-md text-sm transition-all flex items-center gap-2"
          >
            <span v-if="isLoading">{{ $t('modals.email.saving') }}</span>
            <span v-else>{{ $t('modals.email.saveChanges') }}</span>
          </button>
        </div>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  currentEmail?: string
}>()

const emit = defineEmits(['update:modelValue', 'email-updated'])

const { addToast } = useToast()
const supabase = useSupabaseClient()

const { t } = useI18n()
const newEmail = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)

const isValid = computed(() => {
  return newEmail.value.length > 5 && newEmail.value.includes('@') && newEmail.value !== props.currentEmail && password.value.length >= 6
})

const saveEmail = async () => {
  if (!isValid.value || !props.currentEmail) return
  
  isLoading.value = true
  try {
    // 1. Verifikasi Password terlebih dahulu
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: props.currentEmail.trim(),
      password: password.value
    })
    
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error(t('modals.email.wrongPassword'))
      }
      throw authError
    }
  
    // 2. Jika password benar, ubah email
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail.value.trim()
    })
    
    if (updateError) throw new Error(`${t('modals.email.updateFailed')} ${updateError.message}`)
    
    // 3. Update juga email di tabel public.users agar sinkron
    const { data: userSession } = await supabase.auth.getUser()
    if (userSession.user?.id) {
      await (supabase as any).from('users').update({ email: newEmail.value }).eq('id', userSession.user.id)
    }
    
    addToast(t('modals.email.successMsg'), 'success')
    emit('email-updated')
    close()
  } catch (err: any) {
    addToast(err.message || t('modals.email.updateFailedGeneric'), 'error')
  } finally {
    isLoading.value = false
  }
}

const close = () => {
  emit('update:modelValue', false)
  setTimeout(() => {
    newEmail.value = ''
    password.value = ''
    showPassword.value = false
  }, 200)
}
</script>
