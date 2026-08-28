<script setup lang="ts">
import { useAppMode } from '~/composables/useAppMode'

const { isGlobal } = useAppMode()

useHead({
  titleTemplate: (titleChunk) => {
    const baseTitle = isGlobal.value ? 'Area Tentaklik' : 'Member Tentaklik'
    if (!titleChunk || titleChunk === 'Member Tentaklik' || titleChunk === 'Area Tentaklik' || titleChunk === baseTitle) {
      return baseTitle
    }
    return `${titleChunk} - ${baseTitle}`
  }
})

// Keepalive Supabase — ping sekali saat app dibuka. Keepalive harian dihandle cron-job.org (jam 14.00 WIB)
useSupabaseKeepalive()
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <SharedToast />
  <ConfirmModal />
</template>
