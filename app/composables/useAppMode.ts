import { ref, computed, type Ref } from 'vue'

export const useAppMode = () => {
  // Detect hostname safely on both client and server
  const detectMode = (): 'local' | 'global' => {
    if (import.meta.client && typeof window !== 'undefined') {
      const hostname = window.location.hostname || ''
      if (hostname.startsWith('area.') || hostname.includes('area.localhost')) {
        return 'global'
      }
    }
    try {
      const nuxtApp = tryUseNuxtApp()
      if (nuxtApp) {
        const url = useRequestURL()
        const hostname = url.hostname || ''
        if (hostname.startsWith('area.') || hostname.includes('area.localhost')) {
          return 'global'
        }
      }
    } catch {
      // Ignore if outside Nuxt request context
    }
    return 'local'
  }

  // Safe useState wrapper: use useState when Nuxt context is active, fallback to ref
  let appMode: Ref<'local' | 'global'>
  try {
    const nuxtApp = tryUseNuxtApp()
    if (nuxtApp) {
      appMode = useState<'local' | 'global'>('appMode', () => detectMode())
    } else {
      appMode = ref(detectMode())
    }
  } catch {
    appMode = ref(detectMode())
  }

  const setAppMode = (mode: 'local' | 'global') => {
    appMode.value = mode
  }

  return {
    appMode,
    setAppMode,
    isGlobal: computed(() => appMode.value === 'global'),
    isLocal: computed(() => appMode.value === 'local')
  }
}
