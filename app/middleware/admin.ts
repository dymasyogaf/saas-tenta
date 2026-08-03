export default defineNuxtRouteMiddleware(async (to, from) => {
  const user = useSupabaseUser()

  // Jika user belum login, lempar ke halaman login
  if (!user.value) {
    return navigateTo('/login')
  }

  // Ambil data profil dari public.users untuk mendapatkan role terbaru
  const supabase = useSupabaseClient<any>()
  let role = user.value.user_metadata?.role
  
  try {
    // 1. Cek dari metadata sesi (paling cepat, kebal RLS)

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

    if (!role || role === 'client') {
      return navigateTo('/dashboard')
    }
  } catch (err) {
    console.error('Middleware crash:', err)
    return navigateTo('/dashboard')
  }

  // === RBAC (Role Based Access Control) Khusus Mode Admin ===
  // super_admin bebas ke mana saja
  if (role !== 'super_admin') {
    const path = to.path

    // Hanya super_admin yang boleh atur staf
    if (path.startsWith('/admin/users')) {
      return navigateTo('/admin')
    }
    
    // Tim Finance & Tim Audit
    if (path.startsWith('/admin/finance') && role !== 'admin_finance' && role !== 'admin_compliance') {
      return navigateTo('/admin')
    }

    // Tim Ads Ops (Tim Audit boleh lihat, tapi read-only di UI)
    if (path.startsWith('/admin/ads-ops') && role !== 'admin_ads_ops' && role !== 'admin_compliance') {
      return navigateTo('/admin')
    }

    // Tim Audit (eKYC)
    if (path.startsWith('/admin/verifications') && role !== 'admin_compliance') {
      return navigateTo('/admin')
    }
    
    // Note: /admin (Dashboard) dan /admin/clients (Daftar Klien) 
    // bisa diakses oleh semua staf untuk kemudahan koordinasi.
  }
})
