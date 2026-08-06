<template>
  <div class="p-12 text-center">
    <h1 class="text-2xl font-bold mb-4">Halaman Testing Error</h1>
    <p class="mb-4">Mengalihkan ke halaman error...</p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { createError } from '#app'

const route = useRoute()
const code = parseInt(route.query.code) || 500

throw createError({
  statusCode: code,
  statusMessage: `Testing Error ${code}`,
  fatal: true
})
</script>
