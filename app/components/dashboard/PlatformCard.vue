<template>
  <div class="bg-white border border-ink-100 rounded-2xl p-5 md:p-6 flex flex-col hover:border-orange-200 transition-colors shadow-sm">
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
          <h4 class="font-display font-bold text-lg text-ink-900">{{ platform.name }}</h4>
          <span class="bg-ink-100 text-ink-600 border border-ink-200 text-xs font-bold px-2.5 py-1 rounded-md">
            {{ platform.status }}
          </span>
        </div>
        <p class="text-sm text-ink-600 mb-3 leading-relaxed" v-html="platform.description" />
        <button
          class="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
          @click="showSteps = !showSteps"
        >
          {{ showSteps ? 'Sembunyikan' : 'Lihat' }} tahapan pembuatan akun
          <component :is="showSteps ? ChevronUp : ChevronDown" class="w-4 h-4" />
        </button>
      </div>
      <div class="shrink-0 mt-3 md:mt-0 w-full md:w-auto">
        <button class="w-full md:w-auto bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm">
          Dapatkan Ads Account
        </button>
      </div>
    </div>

    <!-- Steps Accordion -->
    <div v-if="showSteps" class="mt-6 pt-6 border-t border-ink-100">
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
          Sembunyikan tahapan pembuatan akun <ChevronUp class="w-4 h-4" />
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
  IdCard,
  Wallet,
  Settings,
  Megaphone,
} from 'lucide-vue-next'

interface Platform {
  name: string
  logo: string
  logoClass?: string
  logoInvert?: boolean
  status: string
  description: string
}

defineProps<{
  platform: Platform
}>()

const showSteps = ref(false)

const steps = [
  {
    icon: FileText,
    title: 'Isi formulir pendaftaran',
    desc: 'Lengkapi formulir dengan data diri sesuai KTP, detail iklan yang ingin dibuat, dan data akun iklan.',
    colorClass: 'text-cyan-500 bg-cyan-50',
  },
  {
    icon: IdCard,
    title: 'Verifikasi data (eKYC)',
    desc: 'Siapkan dokumen untuk eKYC seperti KTP dan kamera HP untuk mengambil foto selfie.',
    colorClass: 'text-pink-500 bg-pink-50',
  },
  {
    icon: Wallet,
    title: 'Top Up Saldo Akun',
    desc: 'Top up saldomu terlebih dulu biar akun langsung siap digunakan.',
    colorClass: 'text-teal-500 bg-teal-50',
  },
  {
    icon: Settings,
    title: 'Pembuatan Ad Account',
    desc: 'Setelah eKYC diverifikasi, sistem kami akan membuatkan Ad Account untukmu.',
    colorClass: 'text-blue-500 bg-blue-50',
  },
  {
    icon: Megaphone,
    title: 'Langsung gas ngiklan!',
    desc: 'Jika akun berhasil dibuat tanpa hambatan, kamu bisa isi saldo lalu pakai akunnya buat ngiklan.',
    colorClass: 'text-orange-500 bg-orange-50',
  },
]
</script>
