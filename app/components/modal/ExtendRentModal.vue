<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 md:p-6">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative border border-ink-100 flex flex-col max-h-[95vh] md:max-h-[90vh]" role="dialog" aria-modal="true" aria-labelledby="extend-rent-title">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 id="extend-rent-title" class="font-display font-bold text-ink-900">Perpanjang Sewa Akun Iklan</h3>
            <p class="text-xs text-ink-500">Pilih durasi perpanjangan untuk akun {{ account?.name || account?.account_id }}</p>
          </div>
          <button @click="closeModal" class="text-ink-400 hover:text-ink-600 transition-colors bg-ink-50 p-2 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-6 overflow-y-auto bg-ink-50/50">
          <div class="space-y-6 max-w-2xl mx-auto py-4">
            
            <div class="bg-white p-4 rounded-xl border border-ink-200 mb-6 flex items-center gap-4">
              <div class="w-12 h-12 bg-ink-50 rounded-lg flex items-center justify-center">
                <img v-if="account?.platform === 'Meta'" src="/icon-meta-ads.png" class="w-6 h-6 object-contain" />
                <img v-else-if="account?.platform === 'Google'" src="/icon-google-ads.png" class="w-6 h-6 object-contain" />
                <img v-else-if="account?.platform === 'TikTok'" src="/tiktok.svg" class="w-6 h-6 object-contain" />
              </div>
              <div>
                <h4 class="font-bold text-ink-900 text-sm">{{ account?.name || 'Unknown Account' }}</h4>
                <p class="text-xs text-ink-500">ID: {{ account?.account_id }}</p>
                <p class="text-[11px] text-ink-500 mt-1">Masa Aktif: <span class="font-bold" :class="isExpired ? 'text-red-500' : 'text-ink-900'">{{ daysLeftText }}</span></p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div @click="form.subscriptionMonths = 1; form.rentalFee = pricing.monthly" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all text-center', form.subscriptionMonths === 1 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300 bg-white']">
                <h5 class="font-bold text-ink-900 mb-1">1 Bulan</h5>
                <p class="text-xl font-bold text-orange-600 mb-2">Rp {{ pricing.monthly.toLocaleString('id-ID') }}</p>
                <p class="text-xs text-ink-500">Normal</p>
              </div>

              <div @click="form.subscriptionMonths = 3; form.rentalFee = pricing.quarterly" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all relative text-center', form.subscriptionMonths === 3 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300 bg-white']">
                <div class="absolute -top-3 inset-x-0 flex justify-center"><span class="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Hemat 22%</span></div>
                <h5 class="font-bold text-ink-900 mb-1 mt-1">3 Bulan</h5>
                <p class="text-xl font-bold text-orange-600 mb-2">Rp {{ pricing.quarterly.toLocaleString('id-ID') }}</p>
                <p class="text-xs text-ink-500 line-through">Rp {{ pricing.quarterlyOriginal.toLocaleString('id-ID') }}</p>
              </div>

              <div @click="form.subscriptionMonths = 6; form.rentalFee = pricing.semiannual" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all relative text-center', form.subscriptionMonths === 6 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300 bg-white']">
                <div class="absolute -top-3 inset-x-0 flex justify-center"><span class="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Hemat 12%</span></div>
                <h5 class="font-bold text-ink-900 mb-1 mt-1">6 Bulan</h5>
                <p class="text-xl font-bold text-orange-600 mb-2">Rp {{ pricing.semiannual.toLocaleString('id-ID') }}</p>
                <p class="text-xs text-ink-500 line-through">Rp {{ pricing.semiannualOriginal.toLocaleString('id-ID') }}</p>
              </div>
            </div>

            <div class="mt-8 bg-white rounded-xl p-4 border border-ink-200 flex items-center justify-between shadow-sm">
              <div>
                <p class="text-sm text-ink-500 mb-1">Sisa Saldo Bersih Anda</p>
                <p class="font-bold text-xl text-ink-900" :class="{'text-red-500': netBalance < form.rentalFee}">Rp {{ netBalance.toLocaleString('id-ID') }}</p>
              </div>
              <button type="button" v-if="netBalance < form.rentalFee" @click="() => navigateTo('/dashboard/topup')" class="px-4 py-2 bg-white border border-orange-200 text-orange-600 font-bold rounded-lg text-xs hover:bg-orange-50 transition-colors shadow-sm">
                Top Up Sekarang
              </button>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 bg-white flex justify-end gap-3 border-t border-ink-100 shrink-0">
          <button @click="closeModal" type="button" class="px-6 py-2.5 bg-white border border-ink-200 text-ink-700 hover:bg-ink-50 font-bold rounded-xl text-sm transition-colors shadow-sm">
            Batal
          </button>
          
          <button 
            @click="submitPayment"
            :disabled="isSubmitting || netBalance < form.rentalFee" 
            class="px-8 py-2.5 bg-orange-500 border border-orange-500 text-white hover:bg-orange-600 font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <template v-else-if="netBalance < form.rentalFee">Saldo Tidak Mencukupi</template>
            <template v-else>Bayar Sekarang</template>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  account: any
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const toast = useToast()
const supabase = useSupabaseClient()
const { user } = useAuth()
const config = useRuntimeConfig()

const pricing = {
  monthly: Number(config.public.pricingMonthly),
  quarterly: Number(config.public.pricingQuarterly),
  quarterlyOriginal: Number(config.public.pricingQuarterlyOriginal),
  semiannual: Number(config.public.pricingSemiannual),
  semiannualOriginal: Number(config.public.pricingSemiannualOriginal),
}

const isSubmitting = ref(false)
const saldo = ref(0)
const pendingSaldo = ref(0)
const netBalance = computed(() => saldo.value - pendingSaldo.value)

const form = reactive({
  subscriptionMonths: 1,
  rentalFee: pricing.monthly,
})

const fetchBalance = async () => {
  if (!user.value) return
  const uid = (user.value as any)?.id || (user.value as any)?.sub
  const { data } = await (supabase as any)
    .from('saldo')
    .select('balance, pending_balance')
    .eq('user_id', uid)
    .single()
    
  if (data) {
    saldo.value = Number(data.balance)
    pendingSaldo.value = Number(data.pending_balance)
  }
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    fetchBalance()
    form.subscriptionMonths = 1
    form.rentalFee = pricing.monthly
  }
})

const daysLeftText = computed(() => {
  if (!props.account?.subscription_expires_at) return '-'
  const end = new Date(props.account.subscription_expires_at)
  const today = new Date()
  end.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffTime = end.getTime() - today.getTime()
  if (diffTime <= 0) return 'Kedaluwarsa'
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + ' Hari'
})

const isExpired = computed(() => {
  if (!props.account?.subscription_expires_at) return false
  const end = new Date(props.account.subscription_expires_at)
  const today = new Date()
  return end.getTime() <= today.getTime()
})

const closeModal = () => {
  emit('update:modelValue', false)
}

const submitPayment = async () => {
  if (netBalance.value < form.rentalFee) {
    toast.addToast('Saldo tidak mencukupi. Silakan top up terlebih dahulu.', 'error')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const response = await $fetch<any>('/api/ads/extend-rent', {
      method: 'POST',
      body: {
        accountId: props.account.id,
        subscriptionMonths: form.subscriptionMonths,
        rentalFee: form.rentalFee
      }
    })

    if (!response.success) {
      throw new Error(response.message || 'Gagal memproses pembayaran')
    }

    toast.addToast(response.message || 'Perpanjangan sewa akun berhasil.', 'success')
    emit('success')
    closeModal()
    
  } catch (err: any) {
    toast.addToast(err.message || err.data?.statusMessage || 'Gagal memproses pembayaran.', 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
