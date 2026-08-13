export const useAppMode = () => {
  // 'local' = member.tentaklik.com (IDR)
  // 'global' = area.tentaklik.com (USDT)
  const appMode = useState<'local' | 'global'>('appMode', () => 'local')

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
