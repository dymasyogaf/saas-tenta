export const useModal = () => {
  const activeModal = useState<string | null>('active_modal', () => null)
  
  const openModal = (id: string) => { activeModal.value = id }
  const closeModal = () => { activeModal.value = null }
  const isOpen = (id: string) => activeModal.value === id
  
  return { activeModal, openModal, closeModal, isOpen }
}
