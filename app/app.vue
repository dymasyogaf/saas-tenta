<script setup lang="ts">
import { useAppMode } from '~/composables/useAppMode'

const { isGlobal } = useAppMode()

useHead({
  titleTemplate: (titleChunk) => {
    const baseTitle = isGlobal.value ? 'Area Tentaklik' : 'Member Tentaklik'
    return titleChunk && titleChunk !== 'Member Tentaklik' ? `${titleChunk} - ${baseTitle}` : baseTitle
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
