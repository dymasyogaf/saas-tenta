<template>
  <ClientOnly>
    <Teleport to="body">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
      >
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 relative overflow-hidden animate-scale-up">
          <!-- Background Glow Effect -->
          <div class="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <!-- Close Button -->
          <button 
            @click="closeModal" 
            class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Icon & Header -->
          <div class="flex items-center gap-3 mb-4">
            <div :class="isExpired ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'" class="p-3 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-lg text-slate-900">
                {{ isExpired ? 'Masa Aktif Paket Habis!' : 'Pembaruan Paket Layanan' }}
              </h3>
              <p class="text-xs text-slate-500">
                {{ isExpired ? 'Limit iklan kamu saat ini 0' : `Masa aktif paket tersisa ${daysRemaining} hari lagi` }}
              </p>
            </div>
          </div>

          <!-- Alert / Info Box -->
          <div :class="isExpired ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'" class="p-4 rounded-xl border text-sm mb-5">
            <p v-if="isExpired" class="leading-relaxed">
              ⚠️ Paket kamu telah kedaluwarsa. Iklan kamu akan ter-pause otomatis karena limit operasional menjadi <strong>Rp 0</strong>. Segera perpanjang atau upgrade paket agar iklan tetap berjalan lancar!
            </p>
            <p v-else class="leading-relaxed">
              ⏳ Paket <strong>{{ currentPackageName }}</strong> kamu akan berakhir dalam <strong>{{ daysRemaining }} hari</strong>. Perpanjang sekarang untuk menambah +28 hari ke sisa masa aktif tanpa merusak limit iklan kamu.
            </p>
          </div>

          <!-- Feature Highlights -->
          <div class="space-y-2.5 mb-6 text-sm text-slate-600">
            <div class="flex items-center gap-2.5">
              <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
              <span><strong>Perpanjang Sama:</strong> Tambah +28 hari dari sisa hari paket kamu saat ini.</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
              <span><strong>Upgrade Paket:</strong> Dapatkan batas limit lebih tinggi & aktif 28 hari baru.</span>
            </div>
            <div class="flex items-center gap-2.5">
              <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-xs font-bold">✓</span>
              <span>Fee topup tetap menyesuaikan nominal transaksi yang kamu masukkan.</span>
            </div>
          </div>

          <!-- CTA Actions -->
          <div class="flex flex-col gap-2.5">
            <button 
              @click="goToTopup" 
              class="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all transform active:scale-[0.98] text-center"
            >
              {{ isExpired ? 'Aktifkan / Topup Sekarang' : 'Perpanjang / Upgrade Paket' }}
            </button>
            <button 
              @click="closeModal" 
              class="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-sm text-center"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSaldoStore } from '~/stores/saldo'

const saldoStore = useSaldoStore()
const router = useRouter()

const isOpen = ref(false)
const dismissedThisSession = ref(false)

const daysRemaining = computed(() => saldoStore.daysRemaining)
const isExpired = computed(() => saldoStore.isPackageExpired)
const currentPackage = computed(() => saldoStore.activePackage || 'starter')

const currentPackageName = computed(() => {
  const pkg = currentPackage.value.toLowerCase()
  if (pkg === 'scale') return 'Scale'
  if (pkg === 'growth') return 'Growth'
  return 'Starter'
})

onMounted(async () => {
  if (!saldoStore.activePackage) {
    await saldoStore.fetchSaldo()
  }

  // Show modal automatically if package is expiring soon (<= 5 days) or expired
  if ((saldoStore.isExpiringSoon || saldoStore.isPackageExpired) && !dismissedThisSession.value) {
    isOpen.value = true
  }
})

const closeModal = () => {
  isOpen.value = false
  dismissedThisSession.value = true
}

const goToTopup = () => {
  closeModal()
  router.push('/dashboard/topup')
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
.animate-scale-up {
  animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleUp {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
