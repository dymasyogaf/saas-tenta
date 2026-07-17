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
      const errorText = typeof err.message === 'string' ? err.message : 
                        (err.data?.message || err.error_description || JSON.stringify(err))
                        
      if (errorText.includes('Invalid login credentials')) {
        error.value = 'Email atau password yang Anda masukkan salah.'
      } else {
        error.value = errorText || 'Gagal untuk masuk. Silakan coba lagi.'
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
      if (err instanceof Error) {
        error.value = err.message
      } else {
        // Coba bongkar paksa isi dari error yang aneh ini
        try {
          const keys = Object.keys(err).join(', ')
          error.value = `Error Keys: [${keys}] - Raw: ${String(err)} - Details: ${JSON.stringify(err)}`
        } catch(e) {
          error.value = 'Un-parsable error occurred.'
        }
      }
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
