<template>
  <div v-if="!isHiddenRoute" class="mb-6 max-w-6xl mx-auto">
    <!-- Verification Banner Skeleton -->
    <div v-if="verificationStatus === null" class="bg-ink-50 border border-ink-100 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
      <div class="flex items-start gap-3 w-full">
        <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
        <div class="w-full space-y-2 mt-1">
          <div class="h-5 bg-ink-200 rounded w-1/3"></div>
          <div class="h-4 bg-ink-200 rounded w-2/3 mt-2"></div>
        </div>
      </div>
      <div class="shrink-0 w-full md:w-40 h-10 bg-ink-200 rounded-xl mt-4 md:mt-0"></div>
    </div>

    <!-- Verification Banner -->
    <div v-else-if="verificationStatus === 'unverified' || verificationStatus === 'rejected'" class="bg-red-50 border border-red-200 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start gap-3">
        <div class="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
          <ShieldAlert class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-red-900 mb-1">{{ $t('components.verificationBanner.unverifiedTitle') }}</h4>
          <p class="text-sm text-red-700">{{ $t('components.verificationBanner.unverifiedDesc') }}</p>
        </div>
      </div>
      <NuxtLink to="/dashboard/verification" class="shrink-0 w-full md:w-auto text-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
        {{ $t('components.verificationBanner.verifyNow') }}
      </NuxtLink>
    </div>

    <!-- Pending Banner -->
    <div v-else-if="verificationStatus === 'pending'" class="bg-orange-50 border border-orange-200 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start gap-3">
        <div class="p-2 bg-orange-100 rounded-lg text-orange-600 shrink-0">
          <ShieldAlert class="w-6 h-6" />
        </div>
        <div>
          <h4 class="font-bold text-orange-900 mb-1">{{ $t('components.verificationBanner.pendingTitle') }}</h4>
          <p class="text-sm text-orange-700">{{ $t('components.verificationBanner.pendingDesc') }}</p>
        </div>
      </div>
      <NuxtLink to="/dashboard/profile" class="shrink-0 w-full md:w-auto text-center px-6 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold rounded-xl text-sm transition-colors shadow-sm">
        {{ $t('components.verificationBanner.checkStatus') }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import { ref, onMounted, computed } from 'vue'

const { user } = useAuth()
const supabase = useSupabaseClient()
const route = useRoute()

// Hide banner on verification page itself
const isHiddenRoute = computed(() => {
  return route.path === '/dashboard/verification'
})

const verificationStatus = ref<string | null>(null)

onMounted(async () => {
  if (user.value) {
    const uid = (user.value as any).id || (user.value as any).sub
    if (uid) {
      const { data } = await (supabase as any)
        .from('users')
        .select('verification_status')
        .eq('id', uid)
        .single()
        
      if (data && data.verification_status) {
        verificationStatus.value = data.verification_status
      } else {
        verificationStatus.value = 'unverified'
      }
    }
  }
})
</script>
