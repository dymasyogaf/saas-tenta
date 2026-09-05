export const useNotificationSound = () => {
  const isSoundEnabled = useState<boolean>('notification_sound_enabled', () => true)
  const isHapticEnabled = useState<boolean>('notification_haptic_enabled', () => true)

  // Always sync state from localStorage on client
  if (import.meta.client && typeof window !== 'undefined') {
    try {
      const savedSound = localStorage.getItem('tentaklik_sound_enabled')
      if (savedSound !== null) {
        isSoundEnabled.value = savedSound === 'true'
      }
      const savedHaptic = localStorage.getItem('tentaklik_haptic_enabled')
      if (savedHaptic !== null) {
        isHapticEnabled.value = savedHaptic === 'true'
      }
    } catch (_) {}
  }

  const toggleSound = (val?: boolean) => {
    isSoundEnabled.value = typeof val === 'boolean' ? val : !isSoundEnabled.value
    if (import.meta.client && typeof window !== 'undefined') {
      try {
        localStorage.setItem('tentaklik_sound_enabled', String(isSoundEnabled.value))
        if (isSoundEnabled.value) {
          playNotificationChime('info')
        }
      } catch (_) {}
    }
  }

  const toggleHaptic = (val?: boolean) => {
    isHapticEnabled.value = typeof val === 'boolean' ? val : !isHapticEnabled.value
    if (import.meta.client && typeof window !== 'undefined') {
      try {
        localStorage.setItem('tentaklik_haptic_enabled', String(isHapticEnabled.value))
      } catch (_) {}
    }
  }

  /**
   * Generates a modern, elegant, crystal-clear chime using the native Web Audio API.
   * Uses multi-oscillator harmonic layering for rich acoustic resonance across all speakers.
   */
  const playNotificationChime = (type: string = 'info') => {
    if (!import.meta.client || !isSoundEnabled.value) return

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      const now = ctx.currentTime

      // Master Gain for volume & clarity control
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.45, now) // Higher audible master level
      masterGain.connect(ctx.destination)

      // Helper function to create rich bell note with fundamental + harmonic sparkle
      const playBellNote = (freq: number, startTime: number, duration: number = 0.45) => {
        // 1. Primary body tone (Warm Sine)
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(freq, startTime)

        gain1.gain.setValueAtTime(0.0001, startTime)
        gain1.gain.linearRampToValueAtTime(0.7, startTime + 0.012)
        gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

        osc1.connect(gain1)
        gain1.connect(masterGain)
        osc1.start(startTime)
        osc1.stop(startTime + duration)

        // 2. Harmonic overtone (Crisp Triangle for punch and clarity on laptop/mobile speakers)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'triangle'
        osc2.frequency.setValueAtTime(freq * 2, startTime) // 1 octave above for sparkle

        gain2.gain.setValueAtTime(0.0001, startTime)
        gain2.gain.linearRampToValueAtTime(0.25, startTime + 0.008)
        gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.7)

        osc2.connect(gain2)
        gain2.connect(masterGain)
        osc2.start(startTime)
        osc2.stop(startTime + duration * 0.75)
      }

      const t = (type || '').toLowerCase()

      if (t === 'budget_approved' || t === 'success' || t === 'topup_approved' || t === 'kyc_approved') {
        // High harmonic ascending sparkle chime (G5 -> C6 -> E6)
        const notes = [783.99, 1046.50, 1318.51]
        notes.forEach((freq, idx) => {
          playBellNote(freq, now + idx * 0.09, 0.5)
        })
      } else if (t === 'budget_rejected' || t === 'error' || t === 'warning') {
        // Distinct alert chime (A5 -> F5)
        const notes = [880.00, 698.46]
        notes.forEach((freq, idx) => {
          playBellNote(freq, now + idx * 0.12, 0.45)
        })
      } else {
        // Crisp, elegant modern 2-tone notification bell (A5 -> E6)
        const notes = [880.00, 1318.51]
        notes.forEach((freq, idx) => {
          playBellNote(freq, now + idx * 0.10, 0.5)
        })
      }

      // Close AudioContext after playback to prevent resource leaks
      setTimeout(() => {
        try {
          ctx.close()
        } catch (_) {}
      }, 1200)
    } catch (e) {
      console.warn('Audio chime playback error:', e)
    }
  }

  /**
   * Triggers mobile haptic feedback if supported by device
   */
  const triggerHaptic = (pattern: number | number[] = [80, 50, 80]) => {
    if (!import.meta.client || !isHapticEnabled.value) return
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    } catch (_) {}
  }

  return {
    isSoundEnabled,
    isHapticEnabled,
    toggleSound,
    toggleHaptic,
    playNotificationChime,
    triggerHaptic
  }
}
