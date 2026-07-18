export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()

  // Jika user belum login, lempar ke halaman login
  if (!user.value) {
    return navigateTo('/login')
  }

  // Ambil data profil dari public.users untuk mendapatkan role terbaru
  const supabase = useSupabaseClient()
  try {
    // 1. Cek dari metadata sesi (paling cepat, kebal RLS)
    let role = user.value.user_metadata?.role

    // 2. Jika di metadata tidak ada, baru coba tembak ke database
    if (!role || role === 'client') {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.value.id)
        .maybeSingle()
        
      if (data?.role) {
        role = data.role
      }
    }

    console.log('Role pengguna terdeteksi:', role)

    // Jika masih client biasa, tendang!
    if (!role || role === 'client') {
      console.warn('Ditolak: User ini bukan admin.')
      return navigateTo('/dashboard')
    }
  } catch (err) {
    console.error('Middleware crash:', err)
    return navigateTo('/dashboard')
  }

  // TODO: Tambahkan proteksi lebih spesifik per-tim
  // Contoh: if (to.path.includes('/finance') && role !== 'admin_finance' && role !== 'super_admin') return abortNavigation()
})
