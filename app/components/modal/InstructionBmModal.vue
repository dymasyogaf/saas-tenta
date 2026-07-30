<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-ink-900/60 backdrop-blur-sm transition-opacity" @click="close"></div>
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden relative border border-ink-100 flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-white shrink-0">
          <h3 class="font-display font-bold text-ink-900 text-lg">{{ $t('modals.instructionBm.title') }} {{ isTiktok ? 'Business Center' : 'Business Manager' }}</h3>
          <button @click="close" class="text-ink-400 hover:text-ink-600 transition-colors p-1">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-4">
          <ol v-if="!isTiktok" class="list-decimal pl-5 space-y-1.5 text-sm text-ink-800 font-medium">
            <li>{{ $t('modals.instructionBm.step1a') }} <a href="https://business.facebook.com/" target="_blank" class="text-orange-500 hover:text-orange-600 hover:underline transition-colors">https://business.facebook.com/</a></li>
            <li>{{ $t('modals.instructionBm.step2a') }}</li>
            <li>{{ $t('modals.instructionBm.step3a') }}</li>
            <li>{{ $t('modals.instructionBm.step4a') }}</li>
            <li>{{ $t('modals.instructionBm.step5a') }}</li>
          </ol>

          <ol v-else class="list-decimal pl-5 space-y-1.5 text-sm text-ink-800 font-medium">
            <li>{{ $t('modals.instructionBm.step1a') }} pusat bisnis tiktok ads di <a href="https://business.tiktok.com/" target="_blank" class="text-orange-500 hover:text-orange-600 hover:underline transition-colors">https://business.tiktok.com/</a></li>
            <li>{{ $t('modals.instructionBm.step3a') }}</li>
            <li>{{ $t('modals.instructionBm.step3b') }}</li>
            <li>{{ $t('modals.instructionBm.step4b') }}</li>
          </ol>

          <div class="mt-4 border border-ink-100 rounded-xl overflow-hidden bg-ink-50 shadow-sm p-1">
            <img v-if="!isTiktok" src="~/assets/instruction-fb.png" :alt="$t('modals.instructionBm.altFb')" class="w-full h-auto rounded-lg" />
            <img v-else src="~/assets/instruction-tiktok.png" :alt="$t('modals.instructionBm.altTiktok')" class="w-full h-auto rounded-lg" />
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 bg-white flex justify-end border-t border-ink-100 shrink-0">
          <button @click="close" class="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
            {{ $t('modals.instructionBm.ok') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  platformName?: string
}>()

const isTiktok = computed(() => props.platformName?.includes('TikTok'))

const emit = defineEmits(['update:modelValue'])

const close = () => {
  emit('update:modelValue', false)
}
</script>
