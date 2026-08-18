import { ref } from 'vue'

const isVisible = ref(false)
const title = ref('')
const message = ref('')
const confirmLabel = ref('Oke')
const cancelLabel = ref('Batal')
const type = ref<'confirm' | 'alert'>('confirm')

let resolvePromise: ((value: boolean) => void) | null = null

export const useConfirm = () => {
  const show = (options: {
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    type?: 'confirm' | 'alert'
  }): Promise<boolean> => {
    title.value = options.title || (options.type === 'alert' ? 'Perhatian' : 'Konfirmasi')
    message.value = options.message
    confirmLabel.value = options.confirmLabel || 'Oke'
    cancelLabel.value = options.cancelLabel || 'Batal'
    type.value = options.type || 'confirm'
    isVisible.value = true

    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const confirm = () => {
    isVisible.value = false
    if (resolvePromise) resolvePromise(true)
  }

  const cancel = () => {
    isVisible.value = false
    if (resolvePromise) resolvePromise(false)
  }

  return {
    isVisible,
    title,
    message,
    confirmLabel,
    cancelLabel,
    type,
    show,
    confirm,
    cancel
  }
}
