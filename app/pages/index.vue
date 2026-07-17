<template>
  <div class="min-h-screen flex items-center justify-center">
    <Loader2 class="w-8 h-8 animate-spin text-orange-500" />
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const route = useRoute()

onMounted(() => {
  // Jika ada hash token dari Supabase (misal sehabis klik link email), alihkan ke halaman confirm
  if (route.hash.includes('access_token=') || route.hash.includes('error=')) {
    router.push({ path: '/confirm', hash: route.hash })
    return
  }

  // Jika ada query parameter token_hash, alihkan juga
  if (route.query.token_hash) {
    router.push({ path: '/confirm', query: route.query })
    return
  }

  router.push('/login')
})
</script>
