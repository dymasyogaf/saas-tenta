<template>
  <div 
    class="border rounded-2xl p-5 md:p-6 flex flex-col shadow-sm relative overflow-hidden"
    :class="platform.isComingSoon 
      ? 'bg-ink-50 border-ink-200 opacity-60 grayscale pointer-events-none select-none' 
      : 'bg-white border-ink-100 hover:border-orange-200 transition-colors'"
  >
    <!-- Coming Soon Ribbon -->
    <div 
      v-if="platform.isComingSoon" 
      class="absolute -right-10 top-5 rotate-45 bg-ink-400 text-white text-[10px] font-black uppercase tracking-widest py-1 px-10 shadow-md z-10 pointer-events-none"
    >
      Segera Hadir
    </div>

    <!-- Main Row -->
    <div class="flex flex-col md:flex-row gap-5 items-start md:items-center">
      <img
        :src="platform.logo"
        :alt="platform.name"
        class="w-16 h-16 shadow-sm border border-ink-100 object-contain shrink-0"
        :class="[platform.logoClass || 'rounded-full', { 'p-3': !platform.logoInvert, 'bg-white': !platform.logoInvert }]"
        :style="platform.logoInvert ? 'filter: invert(1)' : ''"
      />
      <div class="flex-1">
        <div class="flex flex-wrap items-center gap-3 mb-1.5">
          <h4 class="font-display font-bold text-lg" :class="platform.isComingSoon ? 'text-ink-400' : 'text-ink-900'">{{ platform.name }}</h4>
          <span 
            class="border text-xs font-bold px-2.5 py-1 rounded-md"
            :class="{
              'bg-ink-200 text-ink-500 border-ink-300': platform.isComingSoon,
              'bg-ink-100 text-ink-600 border-ink-200': !platform.isComingSoon && !platform.rawStatus,
              'bg-orange-100 text-orange-600 border-orange-200': platform.rawStatus === 'pending_review',
              'bg-blue-100 text-blue-600 border-blue-200': platform.rawStatus === 'processing',
              'bg-green-100 text-green-700 border-green-200': platform.rawStatus === 'approved',
              'bg-red-100 text-red-600 border-red-200': platform.rawStatus === 'rejected'
            }"
          >
            {{ platform.isComingSoon ? $t('components.platformCard.comingSoon') : platform.status }}
          </span>
        </div>
        <p class="text-sm mb-3 leading-relaxed" :class="platform.isComingSoon ? 'text-ink-400' : 'text-ink-600'" v-html="platform.description" />
        <button
          v-if="!platform.isComingSoon"
          class="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
          @click="showSteps = !showSteps"
        >
          {{ showSteps ? $t('components.platformCard.hide') : $t('components.platformCard.show') }} {{ $t('components.platformCard.steps') }}
          <component :is="showSteps ? ChevronUp : ChevronDown" class="w-4 h-4" />
        </button>
      </div>
      <div class="shrink-0 mt-3 md:mt-0 w-full md:w-auto">
        <button v-if="platform.isComingSoon" disabled class="w-full md:w-auto px-6 py-3 rounded-xl text-sm font-bold shadow-sm bg-ink-200 text-ink-400 cursor-not-allowed border border-ink-300">
          {{ $t('components.platformCard.comingSoon') }}
        </button>
        <button v-else-if="!platform.rawStatus" :disabled="isLocked" @click="!isLocked && $emit('request')" class="w-full md:w-auto px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm" :class="isLocked ? 'bg-ink-200 text-ink-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'">
          <span v-if="isLocked" class="flex items-center gap-2 justify-center"><ShieldAlert class="w-4 h-4" /> {{ $t('components.platformCard.locked') }}</span>
          <span v-else>{{ $t('components.platformCard.getAccount') }}</span>
        </button>
        <button v-else-if="['pending_review', 'processing'].includes(platform.rawStatus)" disabled class="w-full md:w-auto bg-ink-200 text-ink-500 cursor-not-allowed px-6 py-3 rounded-xl text-sm font-bold shadow-sm">
          {{ platform.status }}
        </button>
        <button v-else-if="platform.rawStatus === 'approved'" @click="$emit('manage')" class="w-full md:w-auto bg-green-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">
          {{ $t('components.platformCard.topUp') }}
        </button>
        <button v-else-if="platform.rawStatus === 'rejected'" @click="$emit('request')" class="w-full md:w-auto bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm">
          {{ $t('components.platformCard.reapply') }}
        </button>
      </div>
    </div>

    <!-- Steps Accordion -->
    <div v-if="showSteps && !platform.isComingSoon" class="mt-6 pt-6 border-t border-ink-100">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div
          v-for="step in steps"
          :key="step.title"
          class="border border-ink-100 rounded-xl p-5 text-center flex flex-col items-center"
        >
          <component :is="step.icon" class="w-10 h-10 mb-4 p-2 rounded-lg" :class="step.colorClass" />
          <h5 class="font-bold text-ink-900 text-sm mb-2">{{ step.title }}</h5>
          <p class="text-[13px] text-ink-500 leading-relaxed">{{ step.desc }}</p>
        </div>
      </div>
      <div class="mt-5">
        <button
          class="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
          @click="showSteps = false"
        >
          {{ $t('components.platformCard.hide') }} {{ $t('components.platformCard.steps') }} <ChevronUp class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  Wallet,
  Settings,
  Megaphone,
  ShieldAlert,
} from 'lucide-vue-next'

interface Platform {
  name: string
  logo: string
  logoClass?: string
  logoInvert?: boolean
  status: string
  rawStatus?: string | null
  description: string
  isComingSoon?: boolean
}

defineProps<{
  platform: Platform
  isLocked?: boolean
}>()

defineEmits(['request', 'manage'])

const { t } = useI18n()
const showSteps = ref(false)

const steps = computed(() => [
  {
    icon: FileText,
    title: t('components.platformCard.step1Title'),
    desc: t('components.platformCard.step1Desc'),
    colorClass: 'text-cyan-500 bg-cyan-50',
  },
  {
    icon: ShieldCheck,
    title: t('components.platformCard.step2Title'),
    desc: t('components.platformCard.step2Desc'),
    colorClass: 'text-pink-500 bg-pink-50',
  },
  {
    icon: Settings,
    title: t('components.platformCard.step3Title'),
    desc: t('components.platformCard.step3Desc'),
    colorClass: 'text-blue-500 bg-blue-50',
  },
  {
    icon: Wallet,
    title: t('components.platformCard.topUp') + ' Akun',
    desc: t('components.platformCard.step4Desc'),
    colorClass: 'text-teal-500 bg-teal-50',
  },
  {
    icon: Megaphone,
    title: t('components.platformCard.step5Title'),
    desc: t('components.platformCard.step5Desc'),
    colorClass: 'text-orange-500 bg-orange-50',
  },
])
</script>
