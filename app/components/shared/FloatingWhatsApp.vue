<template>
  <div>
    <!-- Floating Button -->
    <button
      @click="openWhatsApp"
      class="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col items-center justify-center gap-1.5 transition-all transform hover:-translate-y-1 group hover:scale-105"
      :title="$t('components.floatingWhatsApp.title')"
    >
      <!-- Gambar dengan border orange -->
      <img src="/support.avif" alt="WhatsApp Support" class="w-14 h-14 object-contain rounded-full shadow-lg border-[3px] border-orange-500 bg-white p-0.5" />
      
      <!-- Teks {{ $t('components.floatingWhatsApp.label') }} -->
      <span class="text-[10px] sm:text-xs font-bold text-orange-600 bg-white px-2 py-0.5 rounded-full shadow-md border border-orange-200 whitespace-nowrap">
        {{ $t('components.floatingWhatsApp.label') }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const openWhatsApp = () => {
  // Nomor CS / Support TentaKlik
  const phoneNumber = '6281128506652'
  const message = encodeURIComponent(t('components.floatingWhatsApp.message'))
  const url = `https://wa.me/${phoneNumber}?text=${message}`
  
  window.open(url, '_blank')
}
</script>
