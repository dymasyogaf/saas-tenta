<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[70]">
      <div class="fixed inset-0 bg-ink-900/50 transition-opacity" @click="close"></div>
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 relative overflow-hidden transform transition-all text-center" role="dialog" aria-modal="true">
          <!-- Decorative Blob -->
          <div class="absolute top-0 left-0 w-32 h-32 bg-orange-500 opacity-5 rounded-full blur-3xl -ml-8 -mt-8 pointer-events-none"></div>

          <div class="flex justify-center mb-6 relative z-10">
            <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center border-4 border-orange-50 shadow-sm">
              <MailOpen class="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <h3 class="text-xl font-display font-bold text-ink-900 mb-2">{{ $t('auth.checkEmailTitle') }}</h3>
          <p class="text-ink-600 text-sm leading-relaxed mb-6">
            {{ $t('auth.checkEmailSubtitle') }} <br>
            <span class="font-bold text-ink-900 mt-1 block">{{ email }}</span>
          </p>

          <div class="space-y-3 relative z-10">
            <a 
              href="https://mail.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              class="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex justify-center items-center gap-2"
            >
              <Mail class="w-4 h-4" />
              <span>{{ $t('auth.openGmail') }}</span>
            </a>

            <button 
              @click="close"
              class="w-full bg-ink-50 text-ink-700 font-bold py-3 px-4 rounded-xl hover:bg-ink-100 transition-colors border border-ink-200 flex justify-center items-center"
            >
              <span>{{ $t('common.close') }}</span>
            </button>
          </div>

          <p class="text-xs text-ink-400 mt-6">
            Belum menerima email? Coba periksa folder Spam atau Junk Anda.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { MailOpen, Mail } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  email: string
}>()

const emit = defineEmits(['update:modelValue'])

const close = () => {
  emit('update:modelValue', false)
}
</script>
