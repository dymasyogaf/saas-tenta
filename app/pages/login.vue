<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQsIDI3LCA0MiwgMC4wMykiLz48L3N2Zz4=')]">
    <div class="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-ink-900/5 border border-ink-100 p-8 md:p-10 relative overflow-hidden">
      <!-- Decorative Blob -->
      <div class="absolute top-0 right-0 w-32 h-32 bg-orange-500 opacity-5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

      <div class="flex justify-center mb-8">
        <img src="/logo-full.png" alt="Tentaklik Logo" class="h-8 w-auto">
      </div>

      <div class="text-center mb-8">
        <h1 class="text-2xl font-display font-bold text-ink-900 mb-2">Selamat Datang Kembali</h1>
        <p class="text-ink-500 text-sm">Masuk untuk mengelola kampanye iklan Anda.</p>
      </div>

      <!-- Error Message -->
      <div v-if="authError || errorMsg" class="flex items-center gap-2 bg-red-50 text-red-600 p-3 mb-6 rounded-xl border border-red-200 text-sm font-medium">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ authError || errorMsg }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-semibold text-ink-900 mb-2">Email</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-400">
              <Mail class="w-5 h-5" />
            </div>
            <input v-model="email" type="email" required placeholder="nama@perusahaan.com" class="w-full pl-11 pr-4 py-3 bg-ink-50 border border-ink-200 rounded-xl focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-ink-900 placeholder:text-ink-400">
          </div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-semibold text-ink-900">Password</label>
            <button type="button" @click="forgotPassword" :disabled="isResetting" class="text-xs font-bold transition-colors" :class="isResetting ? 'text-ink-400 cursor-not-allowed' : 'text-orange-600 hover:text-orange-700'">
              {{ isResetting ? 'Mengirim...' : 'Lupa Password?' }}
            </button>
          </div>
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

        <div class="flex items-center gap-2 pt-2">
          <input v-model="remember" type="checkbox" id="remember" class="w-4 h-4 text-orange-600 bg-ink-50 border-ink-200 rounded focus:ring-orange-500 focus:ring-2 accent-orange-500">
          <label for="remember" class="text-sm font-medium text-ink-600 select-none cursor-pointer">Ingat saya</label>
        </div>

        <button type="submit" :disabled="loading" class="w-full bg-orange-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 mt-2 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="loading">Memproses...</span>
          <template v-else>
            Masuk <ArrowRight class="w-4 h-4" />
          </template>
        </button>
      </form>

      <p class="text-center text-sm font-medium text-ink-600 mt-8">
        Belum punya akun? <NuxtLink to="/register" class="text-orange-600 font-bold hover:underline">Daftar sekarang</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-vue-next'

definePageMeta({
  layout: 'default',
})

const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const remember = ref(false)
const errorMsg = ref('')

const { login, loading, error: authError } = useAuth()
const { addToast } = useToast()
const supabase = useSupabaseClient()

const handleLogin = async () => {
  errorMsg.value = ''
  
  if (!email.value || !password.value) {
    errorMsg.value = 'Email dan password harus diisi'
    return
  }

  const data = await login(email.value, password.value)
  if (data) {
    const is2FAEnabled = data.user?.user_metadata?.is_2fa_enabled
    const phone = data.user?.user_metadata?.phone
    
    if (is2FAEnabled && phone) {
      // Set cookie needs_2fa dengan maxAge 10 menit
      const needs2FA = useCookie('needs_2fa', { maxAge: 60 * 10 })
      needs2FA.value = 'true'
      
      // Kirim OTP via API secara otomatis ke HP mereka
      const { data: { session } } = await supabase.auth.getSession()
      $fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          Authorization: session ? `Bearer ${session.access_token}` : ''
        },
        body: { phone: phone }
      }).catch(err => {
        console.error('Gagal mengirim OTP otomatis saat 2FA', err)
      })
      
      // Tunggu Nuxt Supabase me-load global state (Race condition fix)
      const globalUser = useSupabaseUser()
      if (!globalUser.value) {
        await new Promise<void>(resolve => {
          const unwatch = watch(globalUser, (val) => {
            if (val) {
              unwatch()
              resolve()
            }
          })
          // Fallback timeout 1 detik agar tidak hang
          setTimeout(() => { unwatch(); resolve() }, 1000)
        })
      }
      
      router.push('/verify-2fa')
    } else {
      // Tunggu Nuxt Supabase me-load global state (Race condition fix)
      const globalUser = useSupabaseUser()
      if (!globalUser.value) {
        await new Promise<void>(resolve => {
          const unwatch = watch(globalUser, (val) => {
            if (val) {
              unwatch()
              resolve()
            }
          })
          setTimeout(() => { unwatch(); resolve() }, 1000)
        })
      }
      
      // If successful without 2FA, redirect to dashboard
      router.push('/dashboard')
    }
  }
}

const isResetting = ref(false)

const forgotPassword = async () => {
  if (!email.value) {
    addToast('Silakan isi alamat email Anda terlebih dahulu di kolom form.', 'info')
    return
  }
  
  isResetting.value = true
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/update-password`
    })
    
    if (error) throw error
    
    addToast('Link reset password telah dikirim ke email Anda!', 'success')
  } catch (err: any) {
    addToast(err.message || 'Gagal mengirim email reset password', 'error')
  } finally {
    isResetting.value = false
  }
}
</script>
