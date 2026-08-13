export default defineNuxtPlugin((nuxtApp) => {
  const { setAppMode } = useAppMode()

  // Detect hostname on server side
  if (process.server) {
    const headers = useRequestHeaders(['host'])
    const host = headers.host || ''
    
    // For local development testing, we can check if it starts with 'area.'
    if (host.includes('area.tentaklik.com') || host.startsWith('area.')) {
      setAppMode('global')
    } else {
      setAppMode('local')
    }
  } 
  // Detect hostname on client side (fallback or if client-side navigation occurs)
  else if (process.client) {
    const host = window.location.hostname
    
    if (host.includes('area.tentaklik.com') || host.startsWith('area.')) {
      setAppMode('global')
    } else {
      setAppMode('local')
    }
  }
})
