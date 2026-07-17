<template>
  <div class="bg-ink-50/30 rounded-lg border border-ink-100/50 p-16 flex items-center justify-center">
    <p class="text-ink-500 text-sm font-medium">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  message?: string
}>(), {
  message: 'Data tidak ditemukan'
})
</script>
