<template>
  <div class="bg-ink-50/30 rounded-lg border border-ink-100/50 p-16 flex flex-col items-center justify-center text-center gap-4">
    <div v-if="$slots.illustration" class="text-ink-300">
      <slot name="illustration"></slot>
    </div>
    <p class="text-ink-500 text-sm font-medium">{{ message }}</p>
    <div v-if="$slots.cta" class="mt-2">
      <slot name="cta"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
}>(), {
  message: 'Data tidak ditemukan'
})
</script>
