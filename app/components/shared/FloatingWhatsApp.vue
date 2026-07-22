<template>
  <div>
    <!-- Floating Button -->
    <button
      @click="openWhatsApp"
      class="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-center justify-center gap-1.5 transition-all transform hover:-translate-y-1 group hover:scale-105"
      title="Hubungi Customer Support"
    >
      <!-- Gambar dengan border orange -->
      <img src="/support.avif" alt="WhatsApp Support" class="w-14 h-14 object-contain rounded-full shadow-lg border-[3px] border-orange-500 bg-white p-0.5" />
      
      <!-- Teks Tenta Support -->
      <span class="text-[10px] sm:text-xs font-bold text-orange-600 bg-white px-2 py-0.5 rounded-full shadow-md border border-orange-200 whitespace-nowrap">
        Tenta Support
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
const openWhatsApp = () => {
  // Ganti nomor dengan nomor tujuan sebenarnya, pastikan format berawalan 62
  const phoneNumber = '6287756000215' 
  const message = encodeURIComponent('Halo Tim Support Tentaklik, saya butuh bantuan mengenai akun saya. ')
  const url = `https://wa.me/${phoneNumber}?text=${message}`
  
  window.open(url, '_blank')
}
</script>
