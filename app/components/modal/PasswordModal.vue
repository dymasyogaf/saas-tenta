<template>
  <!-- Modal Ganti Password -->
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[60]">
    <div class="fixed inset-0 bg-ink-900/50 transition-opacity" @click="close"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between p-6">
          <h3 class="font-bold text-ink-900 text-xl">Ganti Password</h3>
          <button @click="close" class="text-ink-400 hover:text-ink-600 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="px-6 space-y-5">
          <!-- Password Lama -->
          <div>
            <label class="block text-sm text-ink-900 mb-2">Password Lama</label>
            <div class="relative">
              <input v-model="oldPassword" :type="showOld ? 'text' : 'password'" class="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white" placeholder="Masukkan password saat ini" @keyup.enter="handleSave">
              <button @click="showOld = !showOld" class="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-600">
                <component :is="showOld ? Eye : EyeOff" class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <!-- Password Baru -->
          <div>
            <label class="block text-sm text-ink-900 mb-2">Password Baru</label>
            <div class="relative">
              <input v-model="newPassword" :type="showNew ? 'text' : 'password'" class="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white" placeholder="Minimal 8 karakter" @keyup.enter="handleSave">
              <button @click="showNew = !showNew" class="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-600">
                <component :is="showNew ? Eye : EyeOff" class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <!-- Konfirmasi Password -->
          <div>
            <label class="block text-sm text-ink-900 mb-2">Konfirmasi Password</label>
            <div class="relative">
              <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" class="w-full border border-ink-200 rounded-md px-3 py-2 text-sm text-ink-700 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white" placeholder="Ulangi password baru" @keyup.enter="handleSave">
              <button @click="showConfirm = !showConfirm" class="absolute inset-y-0 right-0 flex items-center px-3 text-ink-400 hover:text-ink-600">
                <component :is="showConfirm ? Eye : EyeOff" class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button @click="handleForgotPassword" type="button" :disabled="isResetting" class="text-sm font-medium transition-colors mt-2" :class="isResetting ? 'text-ink-400 cursor-not-allowed' : 'text-orange-500 hover:text-orange-600'">
            {{ isResetting ? 'Mengirim...' : 'Lupa Password?' }}
          </button>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 mt-6 border-t border-ink-100 flex justify-end">
          <button 
            @click="handleSave"
            :disabled="!isFormValid || isLoading"
            :class="!isFormValid || isLoading ? 'bg-ink-100 text-ink-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'"
            class="font-bold py-2 px-6 rounded-md text-sm transition-all flex items-center gap-2"
          >
            <span v-if="isLoading">Menyimpan...</span>
            <span v-else>Simpan Perubahan</span>
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
}>()

const emit = defineEmits(['update:modelValue'])

const { addToast } = useToast()
const { user } = useAuth()
const supabase = useSupabaseClient()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const showOld = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
const isLoading = ref(false)
const isResetting = ref(false)

const isFormValid = computed(() => {
  return oldPassword.value.length > 0 && 
         newPassword.value.length >= 8 && 
         confirmPassword.value.length >= 8
})

const handleSave = async () => {
  if (!isFormValid.value || isLoading.value) return
  
  if (newPassword.value !== confirmPassword.value) {
    addToast('Konfirmasi password tidak cocok dengan password baru', 'error')
    return
  }

  if (newPassword.value === oldPassword.value) {
    addToast('Password baru tidak boleh sama dengan password lama', 'error')
    return
  }
  
  if (!user.value?.email) {
    addToast('Terjadi kesalahan sistem, sesi tidak valid.', 'error')
    return
  }

  isLoading.value = true
  
  try {
    // 1. Verifikasi Password Lama
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.value.email,
      password: oldPassword.value
    })
    
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('Password lama yang Anda masukkan salah.')
      }
      throw authError
    }

    // 2. Jika password lama benar, Update ke Password Baru
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword.value
    })
    
    if (updateError) throw updateError
    
    addToast('Password berhasil diperbarui', 'success')
    close()
  } catch (err: any) {
    addToast(err.message || 'Gagal memperbarui password', 'error')
  } finally {
    isLoading.value = false
  }
}

const close = () => {
  emit('update:modelValue', false)
  // reset state
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showOld.value = false
  showNew.value = false
  showConfirm.value = false
}

const handleForgotPassword = async () => {
  if (!user.value?.email) {
    addToast('Terjadi kesalahan, email tidak ditemukan.', 'error')
    return
  }
  
  isResetting.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(user.value.email, {
      redirectTo: `${window.location.origin}/update-password`
    })
    
    if (error) throw error
    
    addToast('Tautan reset password telah dikirim ke email Anda!', 'success')
  } catch (err: any) {
    addToast(err.message || 'Gagal mengirim email reset', 'error')
  } finally {
    isResetting.value = false
  }
}
</script>
