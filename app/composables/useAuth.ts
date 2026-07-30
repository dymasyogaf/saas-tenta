import { useSupabaseClient, useSupabaseUser } from '#imports'

/**
 * Helper: Safely extract a human-readable error message from any thrown value.
 * In Cloudflare Pages/Workers runtime, `instanceof Error` can fail because the
 * prototype chain differs from Node.js. So we check for common properties first.
 */
function extractErrorMessage(err: unknown): string {
  // 1. If it's a string, use it directly
  if (typeof err === 'string') return err

  // 2. If it has a `.message` property (AuthApiError, Error, etc.)
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as any).message
    if (typeof msg === 'string' && msg.length > 0 && msg !== '{}' && msg !== '""') return msg
  }

  // 3. Try other common Supabase error shapes
  if (err && typeof err === 'object') {
    const obj = err as Record<string, any>
    if (typeof obj.error_description === 'string') return obj.error_description
    if (typeof obj.msg === 'string') return obj.msg
    if (obj.data && typeof obj.data.message === 'string') return obj.data.message
  }

  // 4. Last resort: JSON.stringify, but guard against empty "{}"
  try {
    const json = JSON.stringify(err)
    if (json && json !== '{}' && json !== '""') return json
  } catch { /* ignore */ }

  return 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.'
}

/**
 * Translate common Supabase auth error messages to user-friendly Indonesian text.
 */
function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase()

  if (lower.includes('invalid login credentials'))
    return 'Email atau password yang Anda masukkan salah.'
  if (lower.includes('email not confirmed'))
    return 'Email belum dikonfirmasi. Silakan cek inbox Anda.'
  if (lower.includes('user already registered') || lower.includes('already been registered'))
    return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.'
  if (lower.includes('password') && lower.includes('at least'))
    return 'Password terlalu pendek. Minimal 6 karakter.'
  if (lower.includes('rate limit') || lower.includes('too many requests'))
    return 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.'
  if (lower.includes('signup is disabled'))
    return 'Pendaftaran saat ini dinonaktifkan. Hubungi admin.'
  
  // Guard against Supabase returning 500 internal server errors which trigger AuthRetryableFetchError
  if (lower.includes('authretryablefetcherror'))
    return 'Gagal mendaftar. Jika Anda menggunakan nomor HP/Email lama, pastikan belum dipakai akun lain (atau hubungi admin).'
    
  if (lower.includes('network') || lower.includes('fetch'))
    return 'Koneksi gagal. Periksa internet Anda dan coba lagi.'

  return msg
}

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (err) throw err
      return data
    } catch (err: unknown) {
      error.value = translateAuthError(extractErrorMessage(err))
      return null
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string, fullName: string, phone: string) => {
    loading.value = true
    error.value = null
    const refCookie = useCookie('ref_code')
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            ref_code: refCookie.value || null,
          },
        },
      })
      if (err) throw err
      return data
    } catch (err: unknown) {
      console.error('RAW SUPABASE REGISTER ERROR:', err)
      error.value = translateAuthError(extractErrorMessage(err))
      return null
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      const { error: err } = await supabase.auth.signOut()
      if (err) throw err
    } catch (err: unknown) {
      console.error('Logout error:', extractErrorMessage(err))
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
  }
}

