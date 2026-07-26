<script setup lang="ts">
// Keepalive Supabase — ping sekali saat app dibuka. Keepalive harian dihandle cron-job.org (jam 14.00 WIB)
useSupabaseKeepalive()
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <SharedToast />
  </div>
</template>
