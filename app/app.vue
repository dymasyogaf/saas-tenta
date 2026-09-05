<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAppMode } from '~/composables/useAppMode'
import { useSupabaseUser } from '#imports'
import { useRealtimeNotifications } from '~/composables/useRealtimeNotifications'

const { isGlobal } = useAppMode()
const user = useSupabaseUser()
const { initRealtimeListener, cleanupRealtimeListener } = useRealtimeNotifications()

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

onMounted(() => {
  if (user.value) {
    initRealtimeListener()
  }
})

watch(user, (newUser) => {
  if (newUser) {
    initRealtimeListener()
  } else {
    cleanupRealtimeListener()
  }
}, { immediate: true })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <NotificationInAppNotificationPopup />
  <NotificationPromptModal />
  <SharedToast />
  <ConfirmModal />
</template>

