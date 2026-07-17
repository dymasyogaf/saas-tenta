<template>
  <div class="space-y-8 max-w-6xl mx-auto">
    <!-- Hero Section -->
    <div class="bg-gradient-to-br from-orange-50/80 to-white border border-orange-100 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
      <div class="absolute -top-32 -right-32 w-80 h-80 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />

      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-6">
          <Megaphone class="w-8 h-8 text-orange-500" />
          <div class="flex flex-col">
            <span class="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-none">tentaklik</span>
            <span class="text-xl font-display font-black text-ink-900 leading-none tracking-tight">Ads</span>
          </div>
        </div>

        <h2 class="text-2xl md:text-4xl font-display font-bold text-ink-900 mb-4 max-w-3xl leading-tight">
          Akun iklan yang lebih optimal, siap gas tanpa batas!
        </h2>
        <p class="text-ink-600 mb-10 max-w-3xl text-sm md:text-base leading-relaxed">
          Tinggalin cara beriklan yang lama dan penuh drama! Pakai Tentaklik Ads buat dapetin mudahnya beriklan minim hambatan.
        </p>

        <h3 class="text-xl font-bold text-ink-900 mb-6">Yang pasti kamu dapetin</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="bg-white border border-ink-100 rounded-xl p-5 flex gap-4 hover:border-orange-200 hover:shadow-md transition-all"
          >
            <div class="shrink-0">
              <component :is="benefit.icon" class="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h4 class="font-bold text-ink-900 text-sm mb-1.5">{{ benefit.title }}</h4>
              <p class="text-sm text-ink-500 leading-relaxed">{{ benefit.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Platform List -->
    <div class="flex justify-between items-center mb-2">
      <h3 class="font-display font-bold text-xl md:text-2xl text-ink-900">Layanan iklan di Tentaklik</h3>
    </div>

    <div class="flex flex-col gap-4">
      <PlatformCard
        v-for="platform in platforms"
        :key="platform.name"
        :platform="platform"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Megaphone, GraduationCap, BarChart2, ShieldCheck, Wallet } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
})

const benefits = [
  {
    icon: GraduationCap,
    title: 'Info, ilmu, hingga edukasi ads terupdate',
    desc: 'Diberikan langsung oleh tim Tentaklik atau kolaborasi bersama Meta, Google, maupun TikTok.',
  },
  {
    icon: BarChart2,
    title: 'Scale up iklan tanpa limit',
    desc: 'Akun whitelisted yang ideal untuk ngiklan secara agresif tanpa khawatir kena limit harian.',
  },
  {
    icon: ShieldCheck,
    title: 'Akun lebih aman, minim risiko restrict',
    desc: 'Ngiklan lebih tenang dengan akun yang minim drama. Jika terkena restrict, tim kami siap sedia bantu kamu selesaikan masalahnya.',
  },
  {
    icon: Wallet,
    title: 'Budget iklan lebih efisien',
    desc: 'Isi saldo akun iklan gratis management fee untuk pengguna baru*, ngiklan jadi lebih optimal! *S&K berlaku.',
  },
]

const platforms = [
  {
    name: 'Facebook Ads Whitelisted Account (Meta)',
    logo: '/icon-meta-ads.png',
    logoClass: 'rounded-full',
    status: 'Tidak Aktif',
    description: 'Scale up iklan pakai <strong>Meta Ads</strong> Whitelisted Account dari Tentaklik yang bisa gas kapan pun dan minim hambatan!',
  },
  {
    name: 'TikTok Ads Whitelisted Account',
    logo: '/tiktok.svg',
    logoClass: 'rounded-2xl bg-black p-3',
    logoInvert: true,
    status: 'Tidak Aktif',
    description: 'Scale up iklan pakai <strong>Tiktok Ads</strong> Whitelisted Account dari Tentaklik yang bisa gas kapan pun dan minim hambatan!',
  },
  {
    name: 'Google Ads Whitelisted Account',
    logo: '/icon-google-ads.png',
    logoClass: 'rounded-full',
    status: 'Tidak Aktif',
    description: 'Scale up iklan pakai <strong>Google Ads</strong> Whitelisted Account dari Tentaklik yang bisa gas kapan pun dan minim hambatan!',
  },
]
</script>
