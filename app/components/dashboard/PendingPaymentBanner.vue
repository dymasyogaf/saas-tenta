<template>
  <div v-if="pendingTrx.length > 0 && pendingTimeLeft !== 'Kedaluwarsa'" class="bg-orange-50 border border-orange-200 p-4 sm:px-6 sm:py-5 rounded-2xl mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm animate-fade-in mx-4 sm:mx-8 mt-4 sm:mt-6">
    <div class="flex gap-3 items-start sm:items-center">
      <div class="mt-0.5 text-orange-600 bg-orange-100 p-2 rounded-xl shrink-0">
        <Info class="w-6 h-6" />
      </div>
      <div>
        <h4 class="font-bold text-orange-900 text-base mb-0.5">Menunggu Pembayaran</h4>
        <p class="text-sm text-orange-800">Selesaikan pembayaran tagihan Top Up Saldo Anda sebelum waktu habis.</p>
      </div>
    </div>
    <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
      <div class="flex items-center gap-1.5 text-orange-600 font-bold bg-white px-3.5 py-2.5 rounded-xl border border-orange-200 w-full sm:w-auto justify-center shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {{ pendingTimeLeft }}
      </div>
      <button @click="resumePayment(pendingTrx[0])" class="w-full sm:w-auto whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
        Lanjut Bayar
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { useSaldoStore } from '~/stores/saldo'

const saldoStore = useSaldoStore()
const router = useRouter()

const pendingTrx = computed(() => {
  return saldoStore.transactions.filter(t => t.type === 'topup' && t.status === 'pending')
})

const now = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval>

onMounted(() => {
  countdownTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

const pendingTimeLeft = computed(() => {
  if (pendingTrx.value.length === 0) return ''
  const createdAt = new Date(pendingTrx.value[0].created_at).getTime()
  const expiry = createdAt + 60 * 60 * 1000
  const diff = Math.floor((expiry - now.value) / 1000)
  
  if (diff <= 0) return 'Kedaluwarsa'
  const m = Math.floor(diff / 60)
  const s = diff % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const resumePayment = (trx: any) => {
  let pd = trx.payment_data
  if (!pd) return
  if (typeof pd === 'string') {
    try { pd = JSON.parse(pd) } catch (e) { return }
  }
  
  const query: Record<string, string> = {
    orderId: String(pd.merchantOrderId || trx.payment_gateway_ref || ''),
    ref: String(trx.payment_gateway_ref || ''),
    va: String(pd.vaNumber || pd.paymentCode || ''),
    bank: String(pd.method || 'M2'),
    bankCode: String(pd.bankCode || ''),
    method: String(pd.paymentName || 'Transfer Bank'),
    amount: String(pd.paymentAmount || trx.amount || 0),
    net: String(pd.netAmount || trx.amount || 0),
    fee: String(pd.feeAmount || 0),
    pkg: String(pd.packageType || trx.package_selected || 'starter'),
    createdAt: String(trx.created_at || new Date().toISOString())
  }

  // Hapus query yang kosong atau "undefined"
  Object.keys(query).forEach(k => {
    if (query[k] === 'undefined' || query[k] === 'null' || !query[k]) {
      delete query[k]
    }
  })
  
  router.push({
    path: '/dashboard/topup/payment',
    query
  })
}
</script>
