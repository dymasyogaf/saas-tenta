<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-fade-in">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-ink-100 flex flex-col">
      <!-- Modal Header -->
      <div class="p-5 border-b border-ink-100 flex justify-between items-center bg-ink-50/50">
        <div>
          <h3 class="text-lg font-bold text-ink-900">Ubah Paket Aktif</h3>
          <p class="text-ink-500 text-xs mt-0.5">Pilih paket yang ingin Anda gunakan saat ini.</p>
        </div>
        <button @click="close" class="text-ink-400 hover:text-ink-700 bg-white p-1.5 rounded-full border border-ink-200 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Body: Subscriptions List -->
      <div class="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
        <div 
          v-for="sub in activeSubscriptionsList" 
          :key="sub.package_type"
          :class="[
            'border-2 rounded-xl p-4 transition-all flex items-center justify-between',
            sub.package_type === saldoStore.activePackage 
              ? 'border-orange-500 bg-orange-50/70 shadow-xs' 
              : 'border-ink-100 bg-white hover:border-ink-300'
          ]"
        >
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-extrabold text-base text-ink-900 capitalize">{{ sub.package_type }}</h4>
              <span 
                :class="sub.package_type === saldoStore.activePackage ? 'bg-orange-500 text-white' : 'bg-emerald-100 text-emerald-700'"
                class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase"
              >
                {{ sub.package_type === saldoStore.activePackage ? 'Sedang Aktif' : `Sisa ${sub.days_remaining} Hari` }}
              </span>
            </div>
            <p class="text-xs text-ink-600 mt-1">
              Limit Mingguan: <strong class="text-orange-950">{{ getLimitText(sub.package_type) }}</strong>
            </p>
            <p v-if="sub.package_type === saldoStore.activePackage" class="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Kedaluwarsa: {{ formatDate(sub.expires_at) }}
            </p>
          </div>

          <button 
            v-if="sub.package_type !== saldoStore.activePackage"
            @click="handleSelect(sub.package_type)"
            :disabled="isSubmitting"
            class="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors shadow-xs disabled:opacity-50 shrink-0"
          >
            {{ isSubmitting ? 'Memproses...' : 'Gunakan Paket Ini' }}
          </button>
          <span v-else class="text-xs font-bold text-orange-600 bg-orange-100 px-2.5 py-1 rounded-lg shrink-0">
            Aktif
          </span>
        </div>

        <div v-if="activeSubscriptionsList.length === 0" class="text-center py-6 text-ink-400 text-sm">
          Tidak ada paket aktif yang tersedia.
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-ink-100 bg-ink-50/50 flex justify-end">
        <button @click="close" class="bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 font-semibold text-xs py-2 px-4 rounded-xl transition-colors">
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, unref } from 'vue'
import { useSaldoStore } from '~/stores/saldo'
import { useCsrf } from '#imports'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const saldoStore = useSaldoStore()
const { csrf } = useCsrf()
const isSubmitting = ref(false)

const activeSubscriptionsList = computed(() => {
  if (saldoStore.activeSubscriptions && saldoStore.activeSubscriptions.length > 0) {
    return saldoStore.activeSubscriptions
  }
  if (saldoStore.activePackage) {
    return [{
      package_type: saldoStore.activePackage,
      days_remaining: saldoStore.daysRemaining,
      expires_at: saldoStore.packageExpiresAt,
      is_active: true
    }]
  }
  return []
})

const getLimitText = (pkg: string) => {
  if (pkg === 'scale') return 'Rp 30.000.000+ / Unlimited'
  if (pkg === 'growth') return 'Rp 15.000.000'
  return 'Rp 5.000.000'
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

const close = () => {
  emit('close')
}

const handleSelect = async (pkg: string) => {
  isSubmitting.value = true
  try {
    const csrfToken = unref(csrf)
    const success = await saldoStore.switchPackage(pkg, csrfToken)
    if (success) {
      close()
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
