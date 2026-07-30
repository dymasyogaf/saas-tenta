export default defineNuxtRouteMiddleware((to) => {
  const refCode = to.query.ref
  
  if (refCode && typeof refCode === 'string') {
    // Save to a cookie that expires in 30 days
    const refCookie = useCookie('ref_code', { maxAge: 60 * 60 * 24 * 30 })
    refCookie.value = refCode
  }
})
