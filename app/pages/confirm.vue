<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-ink-50 p-4">
    <div class="bg-white rounded-2xl shadow-sm border border-ink-100 p-8 max-w-md w-full text-center space-y-4">
      <div v-if="status === 'loading'" class="flex flex-col items-center justify-center space-y-4">
        <Loader2 class="w-10 h-10 animate-spin text-orange-500" />
        <h2 class="text-xl font-bold text-ink-900">Memproses Konfirmasi...</h2>
        <p class="text-ink-500 text-sm">Mohon tunggu sebentar, sedang memverifikasi token keamanan Anda.</p>
      </div>
      
      <div v-else-if="status === 'success'" class="flex flex-col items-center justify-center space-y-4">
        <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
          <Check class="w-6 h-6" />
        </div>
        <h2 class="text-xl font-bold text-ink-900">Konfirmasi Berhasil!</h2>
        <p class="text-ink-500 text-sm">Email atau akun Anda telah berhasil diverifikasi. Anda akan dialihkan ke dashboard...</p>
      </div>
      
      <div v-else-if="status === 'error'" class="flex flex-col items-center justify-center space-y-4">
        <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
          <XCircle class="w-6 h-6" />
        </div>
        <h2 class="text-xl font-bold text-ink-900">Konfirmasi Gagal</h2>
        <p class="text-ink-500 text-sm">{{ errorMessage }}</p>
        <button @click="goToDashboard" class="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-md text-sm transition-colors w-full">
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loader2, Check, XCircle } from 'lucide-vue-next'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('Link konfirmasi tidak valid atau sudah kadaluarsa.')

const goToDashboard = () => {
  router.push('/dashboard')
}

onMounted(async () => {
  // If there is an error in URL from Supabase
  if (route.query.error_description || route.query.error) {
    status.value = 'error'
    errorMessage.value = (route.query.error_description as string) || 'Terjadi kesalahan saat verifikasi.'
    return
  }

  // Supabase client should automatically process token_hash from URL hash
  // But we can also manually check if there's a token_hash parameter (PKCE flow)
  const token_hash = route.query.token_hash as string
  const type = route.query.type as any

  if (token_hash && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({ token_hash, type })
      if (error) throw error
      
      status.value = 'success'
      setTimeout(() => {
        if (type === 'recovery') {
          router.push('/update-password')
        } else {
          router.push('/dashboard/profile')
        }
      }, 2000)
      return
    } catch (err: any) {
      status.value = 'error'
      errorMessage.value = err.message || 'Token tidak valid atau sudah kadaluarsa.'
      return
    }
  }

  // Wait a bit to let the supabase-js library parse the URL hash
  // if it's implicitly handling it.
  setTimeout(() => {
    if (user.value) {
      status.value = 'success'
      setTimeout(() => {
        // Cek jika ada hash access_token dan type recovery di URL (Implicit flow)
        if (window.location.hash.includes('type=recovery')) {
          router.push('/update-password')
        } else {
          router.push('/dashboard/profile')
        }
      }, 1500)
    } else {
      // If after 3 seconds still no user and no token processing, redirect to login
      status.value = 'error'
      errorMessage.value = 'Sesi tidak ditemukan atau token tidak valid.'
    }
  }, 2000)
})

watch(user, (newUser) => {
  if (newUser && status.value === 'loading') {
    status.value = 'success'
    setTimeout(() => {
      router.push('/dashboard/profile')
    }, 1500)
  }
})
</script>
