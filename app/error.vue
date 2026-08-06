<template>
  <div class="min-h-screen bg-[#FEF9F6] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden font-sans text-center">
    
    <!-- Bubble Animations -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div 
        v-for="i in 15" 
        :key="i"
        class="bubble"
        :style="{
          left: `${Math.random() * 100}%`,
          width: `${Math.random() * 20 + 10}px`,
          height: `${Math.random() * 20 + 10}px`,
          animationDuration: `${Math.random() * 4 + 4}s`,
          animationDelay: `${Math.random() * 2}s`
        }"
      ></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
      
      <!-- Floating Illustration -->
      <div class="w-72 h-72 md:w-96 md:h-96 mb-2 animate-float relative flex items-center justify-center">
        <img 
          :src="`/eror/${mappedCode}.avif`" 
          :alt="`Error ${mappedCode} Illustration`" 
          class="w-full h-full object-contain mix-blend-multiply"
          style="-webkit-mask-image: radial-gradient(circle at center, black 45%, transparent 70%); mask-image: radial-gradient(circle at center, black 45%, transparent 70%);"
        />
      </div>

      <!-- Error Code -->
      <h1 class="text-8xl md:text-[140px] font-display font-black text-[#E16015] leading-none mb-4 tracking-tight animate-fade-in-up">
        {{ statusCode }}
      </h1>
      
      <!-- Title -->
      <h2 class="text-3xl md:text-[40px] font-extrabold text-slate-800 mb-6 leading-tight animate-fade-in-up delay-100">
        {{ title }}
      </h2>
      
      <!-- Description -->
      <p class="text-lg md:text-xl text-slate-500 mb-10 max-w-lg leading-relaxed animate-fade-in-up delay-200">
        {{ description }}
      </p>

      <!-- Buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
        <button 
          @click="handleError"
          class="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-base font-bold rounded-full transition-all duration-300 shadow-[0_8px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_12px_25px_rgba(249,115,22,0.4)] hover:-translate-y-1"
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ArrowRight } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  error: Object
})

const { locale } = useI18n()
const isEn = computed(() => locale.value === 'en')

const statusCode = computed(() => {
  return props.error?.statusCode || 500
})

const mappedCode = computed(() => {
  if ([403, 404, 500, 503].includes(statusCode.value)) {
    return statusCode.value
  }
  return statusCode.value >= 500 ? 500 : 404
})

const title = computed(() => {
  switch (statusCode.value) {
    case 403: return isEn.value ? 'Oops! This area is forbidden to dive in.' : 'Oops! Area ini dilarang diselami.'
    case 404: return isEn.value ? 'Oops! This page dived too deep.' : 'Oops! Halaman ini menyelam terlalu dalam.'
    case 503: return isEn.value ? 'The system is taking a deep breath.' : 'Sistem sedang menarik napas.'
    default: return isEn.value ? 'Whoops! Our tentacles are tangled.' : 'Waduh! Tentakel kami nyangkut.'
  }
})

const description = computed(() => {
  switch (statusCode.value) {
    case 403: return isEn.value 
      ? "You don't have permission to enter these waters. Let's head back to a safe spot."
      : 'Kamu nggak punya izin buat masuk ke perairan ini. Balik ke tempat aman aja yuk.'
    case 404: return isEn.value
      ? "The URL you're looking for couldn't be found. It might have moved or been typed incorrectly."
      : 'URL yang kamu cari nggak ketemu. Mungkin sudah pindah atau salah ketik.'
    case 503: return isEn.value
      ? 'We are currently doing some ship maintenance. Please wait a moment!'
      : 'Saat ini kami sedang melakukan perbaikan kapal (maintenance). Tunggu sebentar ya!'
    default: return isEn.value
      ? 'The system is experiencing a slight disturbance. Our tech team is diving in to fix it.'
      : 'Sistem sedang mengalami sedikit gangguan. Tim teknisi kami sedang menyelam untuk memperbaikinya.'
  }
})

const buttonText = computed(() => isEn.value ? 'Back to Home' : 'Kembali ke Beranda')

const handleError = () => {
  try {
    clearError({ redirect: '/' })
  } catch {
    window.location.href = '/'
  }
}
</script>

<style scoped>
.font-display {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.animate-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }

.animate-float {
  animation: float 5s ease-in-out infinite;
}

.bubble {
  position: absolute;
  bottom: -50px;
  background-color: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: 50%;
  animation: rise linear infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

@keyframes rise {
  0% { 
    transform: translateY(0) scale(0.5); 
    opacity: 0; 
  }
  20% { 
    opacity: 1; 
  }
  80% { 
    opacity: 1; 
  }
  100% { 
    transform: translateY(-100vh) scale(1.5); 
    opacity: 0; 
  }
}
</style>
