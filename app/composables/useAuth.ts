import { useSupabaseClient, useSupabaseUser } from '#imports'

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
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        error.value = 'Email atau password yang Anda masukkan salah.'
      } else {
        error.value = err.message || 'Gagal untuk masuk. Silakan coba lagi.'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string, fullName: string, phone: string) => {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      })
      if (err) throw err
      return data
    } catch (err: any) {
      error.value = err.message || 'Gagal mendaftar. Silakan coba lagi.'
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
    } catch (err: any) {
      console.error('Logout error:', err)
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
