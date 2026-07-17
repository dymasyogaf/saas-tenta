export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser()
  const needs2FA = useCookie('needs_2fa')

  // Protect all /dashboard routes
  if (to.path.startsWith('/dashboard') && !user.value) {
    return navigateTo('/login')
  }
  
  // Rute 2FA check
  if (to.path.startsWith('/dashboard') && user.value && needs2FA.value === 'true') {
    return navigateTo('/verify-2fa')
  }
  
  // Jika mencoba ke /verify-2fa tapi tidak butuh 2FA
  if (to.path === '/verify-2fa') {
    if (!user.value) return navigateTo('/login')
    if (needs2FA.value !== 'true') return navigateTo('/dashboard')
  }

  // Redirect to dashboard if logged in and trying to access auth pages (and doesn't need 2FA)
  if ((to.path === '/login' || to.path === '/register') && user.value) {
    if (needs2FA.value === 'true') {
      return navigateTo('/verify-2fa')
    }
    return navigateTo('/dashboard')
  }
})
