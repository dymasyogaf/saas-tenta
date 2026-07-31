<template>
  <div class="min-h-screen flex items-center justify-center p-4 font-sans antialiased bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTQsIDI3LCA0MiwgMC4wMykiLz48L3N2Zz4=')]">
    <div class="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-ink-900/5 border border-ink-100 p-8 md:p-10 relative overflow-hidden my-8 text-center">
      <!-- Decorative Blob -->
      <div class="absolute top-0 left-0 w-40 h-40 bg-orange-500 opacity-5 rounded-full blur-3xl -ml-10 -mt-10 pointer-events-none"></div>

      <div class="flex justify-center mb-8 relative z-10">
        <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center border-4 border-orange-50 shadow-sm">
          <MailOpen class="w-10 h-10 text-orange-500" />
        </div>
      </div>

      <h1 class="text-2xl font-display font-bold text-ink-900 mb-3">{{ $t('auth.checkEmailTitle') }}</h1>
      <p class="text-ink-600 text-sm leading-relaxed mb-8">
        {{ $t('auth.checkEmailSubtitle') }} <br>
        <span class="font-bold text-ink-900 mt-1 block">{{ emailParam }}</span>
      </p>

      <div class="space-y-3">
        <a 
          href="https://mail.google.com" 
          target="_blank" 
          rel="noopener noreferrer"
          class="w-full bg-orange-500 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2"
        >
          <Mail class="w-5 h-5" />
          <span>{{ $t('auth.openGmail') }}</span>
        </a>

        <NuxtLink 
          to="/login"
          class="w-full bg-ink-50 text-ink-700 font-bold py-3.5 px-4 rounded-xl hover:bg-ink-100 transition-colors border border-ink-200 flex justify-center items-center gap-2"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>{{ $t('auth.backToLogin') }}</span>
        </NuxtLink>
      </div>

      <p class="text-xs text-ink-400 mt-8">
        Belum menerima email? Coba periksa folder Spam atau Junk Anda.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MailOpen, ArrowLeft, Mail } from 'lucide-vue-next'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const emailParam = computed(() => route.query.email as string || 'alamat email Anda')
</script>
