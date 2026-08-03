<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-modal-in">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-green-50 to-emerald-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <MessageCircle class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 class="font-bold text-slate-900 text-base">Hubungi Tim Iklan</h3>
            <p class="text-xs text-slate-500 mt-0.5">{{ type === 'anggaran' ? 'Top up anggaran belum dieksekusi' : 'Pengajuan belum dieksekusi' }} — ingatkan via WhatsApp</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 transition-colors mt-0.5 shrink-0">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Info Pengajuan -->
      <div class="px-6 py-4 bg-slate-50 border-b border-slate-100">
        <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Detail Pengajuan</p>
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <User class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span class="text-sm font-bold text-slate-800">{{ request?.users?.full_name || 'Tanpa Nama' }}</span>
          </div>
          <!-- Info untuk pengajuan akun -->
          <template v-if="type === 'akun'">
            <div class="flex items-center gap-2">
              <img v-if="request?.platform" :src="getPlatformLogo(request.platform)" class="w-3.5 h-3.5 object-contain shrink-0" />
              <span class="text-sm text-slate-700">{{ request?.platform || '-' }}</span>
            </div>
          </template>
          <!-- Info untuk top up anggaran -->
          <template v-else>
            <div class="flex items-center gap-2">
              <img v-if="request?.ad_accounts?.platform" :src="getPlatformLogo(request.ad_accounts.platform)" class="w-3.5 h-3.5 object-contain shrink-0" />
              <span class="text-sm text-slate-700">{{ request?.ad_accounts?.account_name || '-' }}</span>
              <span class="text-xs text-slate-500 font-mono">({{ request?.ad_accounts?.account_id || '-' }})</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-orange-600">{{ formatRupiah(request?.amount) }}</span>
            </div>
          </template>
          <div class="flex items-center gap-2">
            <CalendarDays class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span class="text-xs text-slate-500">Diajukan: {{ formattedDate }}</span>
          </div>
        </div>
      </div>

      <!-- Pilih Tim -->
      <div class="p-6 space-y-3">
        <p class="text-sm text-slate-600 font-medium mb-4">Pilih tim yang perlu dihubungi:</p>

        <!-- Tim Google -->
        <button
          @click="openWhatsApp('google')"
          class="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl transition-all group text-left"
        >
          <div class="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
            <img src="/icon-google-ads.png" class="w-7 h-7 object-contain" alt="Google Ads" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-slate-900 text-sm">Tim Iklan Google</p>
            <p class="text-xs text-slate-500 mt-0.5">Hanif · +62 857-4210-2654</p>
          </div>
          <div class="flex items-center gap-1.5 bg-green-500 group-hover:bg-green-600 text-white px-3 py-1.5 rounded-lg shrink-0 transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span class="text-xs font-bold">WA</span>
          </div>
        </button>

        <!-- Tim Meta -->
        <button
          @click="openWhatsApp('meta')"
          class="w-full flex items-center gap-4 p-4 bg-white border-2 border-slate-200 hover:border-blue-600 hover:bg-indigo-50 rounded-xl transition-all group text-left"
        >
          <div class="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors">
            <img src="/icon-meta-ads.png" class="w-7 h-7 object-contain" alt="Meta Ads" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-slate-900 text-sm">Tim Iklan Meta</p>
            <p class="text-xs text-slate-500 mt-0.5">Bilal · +62 857-0580-4750</p>
          </div>
          <div class="flex items-center gap-1.5 bg-green-500 group-hover:bg-green-600 text-white px-3 py-1.5 rounded-lg shrink-0 transition-colors">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span class="text-xs font-bold">WA</span>
          </div>
        </button>
      </div>

      <!-- Footer note -->
      <div class="px-6 pb-5">
        <p class="text-[11px] text-slate-400 text-center">
          Pesan template sudah otomatis terisi dengan detail pengajuan klien.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, MessageCircle, User, CalendarDays } from 'lucide-vue-next'

const props = defineProps<{
  request: any
  type?: 'akun' | 'anggaran'
}>()

const emit = defineEmits(['close', 'contacted'])

const formattedDate = computed(() => {
  if (!props.request?.created_at) return '-'
  return new Date(props.request.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const getPlatformLogo = (platform: string) => {
  if (platform.includes('Meta')) return '/icon-meta-ads.png'
  if (platform.includes('TikTok')) return '/tiktok.svg'
  if (platform.includes('Google')) return '/icon-google-ads.png'
  return '/icon-meta-ads.png'
}

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka || 0)
}

const buildMessage = (teamName: string) => {
  const clientName = props.request?.users?.full_name || 'Klien'
  const date = formattedDate.value

  if (props.type === 'anggaran') {
    const accountName = props.request?.ad_accounts?.account_name || 'Akun'
    const accountId = props.request?.ad_accounts?.account_id || '-'
    const amount = formatRupiah(props.request?.amount)

    return encodeURIComponent(
      `Halo ${teamName},\n\nAda permintaan top up anggaran yang masih belum dieksekusi:\n\n` +
      `- *Klien:* ${clientName}\n` +
      `- *Akun Iklan:* ${accountName} (${accountId})\n` +
      `- *Nominal:* ${amount}\n` +
      `- *Diajukan:* ${date}\n\n` +
      `Mohon segera ditindaklanjuti. Terima kasih.`
    )
  }

  const platform = props.request?.platform || 'Platform'
  return encodeURIComponent(
    `Halo ${teamName},\n\nAda pengajuan akun iklan yang masih belum dieksekusi:\n\n` +
    `- *Klien:* ${clientName}\n` +
    `- *Platform:* ${platform}\n` +
    `- *Diajukan:* ${date}\n\n` +
    `Mohon segera ditindaklanjuti. Terima kasih.`
  )
}

const openWhatsApp = (team: 'google' | 'meta') => {
  const config = {
    google: { number: '6285742102654', name: 'Hanif' },
    meta:   { number: '6285705804750', name: 'Bilal' }
  }

  const { number, name } = config[team]
  const message = buildMessage(name)
  window.open(`https://wa.me/${number}?text=${message}`, '_blank')
  emit('contacted', props.request?.id)
}
</script>

<style scoped>
@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-modal-in {
  animation: modal-in 0.2s ease-out;
}
</style>
