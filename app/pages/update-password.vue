<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQsIDI3LCA0MiwgMC4wMykiLz48L3N2Zz4=')]">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-ink-900/5 border border-ink-100 p-8 md:p-10 relative overflow-hidden">
      
      <div class="flex justify-center mb-6">
        <div class="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-100">
          <Key class="w-8 h-8" />
        </div>
      </div>

      <div class="text-center mb-8">
        <h1 class="text-2xl font-display font-bold text-ink-900 mb-2">Reset Password</h1>
        <p class="text-ink-500 text-sm">Silakan masukkan password baru Anda.</p>
      </div>

      <form @submit.prevent="handleUpdatePassword" class="space-y-5">
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Password Baru</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-400">
              <Lock class="w-5 h-5" />
            </div>
            <input v-model="newPassword" :type="showNew ? 'text' : 'password'" required placeholder="Minimal 8 karakter" class="w-full pl-11 pr-12 py-3 bg-ink-50 border border-ink-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-ink-900 placeholder:text-ink-400">
            <button type="button" @click="showNew = !showNew" class="absolute inset-y-0 right-0 pr-4 flex items-center text-ink-400 hover:text-ink-600 transition-colors">
              <EyeOff v-if="!showNew" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Konfirmasi Password Baru</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-400">
              <Lock class="w-5 h-5" />
            </div>
            <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" required placeholder="Ulangi password baru" class="w-full pl-11 pr-12 py-3 bg-ink-50 border border-ink-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-ink-900 placeholder:text-ink-400">
            <button type="button" @click="showConfirm = !showConfirm" class="absolute inset-y-0 right-0 pr-4 flex items-center text-ink-400 hover:text-ink-600 transition-colors">
              <EyeOff v-if="!showConfirm" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <button type="submit" :disabled="loading || !isFormValid" class="w-full bg-orange-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 mt-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="loading">Menyimpan...</span>
          <span v-else>Update Password</span>
        </button>
      </form>
      
      <p class="text-center text-sm mt-6">
        <NuxtLink to="/login" class="text-ink-500 hover:text-orange-600 font-medium transition-colors">Kembali ke Login</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, Eye, EyeOff, Key } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const router = useRouter()
const supabase = useSupabaseClient()
const { addToast } = useToast()

const newPassword = ref('')
const confirmPassword = ref('')
const showNew = ref(false)
const showConfirm = ref(false)
const loading = ref(false)

const isFormValid = computed(() => {
  return newPassword.value.length >= 8 && confirmPassword.value.length >= 8
})

const handleUpdatePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    addToast('Konfirmasi password tidak cocok', 'error')
    return
  }
  
  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value
    })
    
    if (error) throw error
    
    addToast('Password berhasil diupdate! Silakan login.', 'success')
    router.push('/login')
  } catch (err: any) {
    addToast(err.message || 'Gagal mengupdate password', 'error')
  } finally {
    loading.value = false
  }
}
</script>
