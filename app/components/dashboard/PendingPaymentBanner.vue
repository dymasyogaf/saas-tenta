<template>
  <div v-if="shouldShowBanner" class="bg-orange-50 border border-orange-200 p-4 sm:px-6 sm:py-5 rounded-2xl mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shadow-sm animate-fade-in mx-4 sm:mx-8 mt-4 sm:mt-6">
    <div class="flex gap-3 items-start sm:items-center">
      <div class="mt-0.5 text-orange-600 bg-orange-100 p-2 rounded-xl shrink-0">
        <Info class="w-6 h-6" />
      </div>
      <div>
        <h4 class="font-bold text-orange-900 text-base mb-0.5">Payment Pending</h4>
        <p class="text-sm text-orange-800">Please complete your top-up invoice payment before time expires.</p>
      </div>
    </div>
    <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
      <div class="flex items-center gap-1.5 text-orange-600 font-bold bg-white px-3.5 py-2.5 rounded-xl border border-orange-200 w-full sm:w-auto justify-center shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {{ pendingTimeLeft }}
      </div>
      <button 
        @click="resumePayment(pendingTrx[0])" 
        :disabled="isResuming"
        class="w-full sm:w-auto whitespace-nowrap bg-orange-600 hover:bg-orange-700 disabled:opacity-70 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
      >
        <Loader2 v-if="isResuming" class="w-4 h-4 animate-spin" />
        <span>{{ isResuming ? 'Loading...' : 'Pay Now' }}</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Info, Loader2 } from 'lucide-vue-next'
import { useSaldoStore } from '~/stores/saldo'
import { useRoute, useRouter } from 'vue-router'

const saldoStore = useSaldoStore()
const router = useRouter()
const route = useRoute()

const isResuming = ref(false)

const pendingTrx = computed(() => {
  return saldoStore.transactions.filter(t => t.type === 'topup' && t.status === 'pending')
})

const shouldShowBanner = computed(() => {
  if (pendingTrx.value.length === 0) return false
  if (pendingTimeLeft.value === 'Expired') return false
  // Don't show banner if user is on /dashboard/topup/payment
  if (route.path === '/dashboard/topup/payment') return false
  return true
})

const now = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval>

onMounted(() => {
  saldoStore.fetchTransactions()
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
  
  if (diff <= 0) return 'Expired'
  const m = Math.floor(diff / 60)
  const s = diff % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const resumePayment = async (trx: any) => {
  if (!trx || isResuming.value) return

  const txRef = trx.payment_gateway_ref || ''
  const txDesc = trx.description || ''
  const isUsdTrx = trx.currency === 'USD' || txRef.startsWith('NP-') || txRef.startsWith('USDT-') || txDesc.includes('USDT') || txDesc.includes('NOWPayments')

  let pd = trx.payment_data
  if (typeof pd === 'string') {
    try { pd = JSON.parse(pd) } catch (e) { pd = null }
  }

  // NOWPayments (USD / Crypto) Transaction
  if (isUsdTrx) {
    let payAddress = pd?.payAddress
    let payAmount = pd?.payAmount
    let paymentId = pd?.paymentId

    if (!payAddress) {
      isResuming.value = true
      try {
        const response = await $fetch<any>('/api/nowpayments/create-payment', {
          method: 'POST',
          body: {
            amount: trx.amount,
            packageType: trx.package_selected || 'starter'
          }
        })
        if (response && response.payAddress) {
          payAddress = response.payAddress
          payAmount = response.payAmount
          paymentId = response.paymentId
          pd = response
        }
      } catch (err) {
        console.error('Failed to resume NOWPayments transaction:', err)
      } finally {
        isResuming.value = false
      }
    }

    const rawAmt = parseFloat(String(payAmount || pd?.totalAmount || Number(trx.amount || 0) * 1.05))
    const roundedAmt = (!rawAmt || isNaN(rawAmt)) ? '31.50' : (Math.ceil(rawAmt * 2) / 2).toFixed(2)

    const query: Record<string, string> = {
      orderId: String(pd?.merchantOrderId || trx.payment_gateway_ref || ''),
      paymentId: String(paymentId || ''),
      ref: String(trx.payment_gateway_ref || ''),
      payAddress: String(payAddress || ''),
      payAmount: roundedAmt,
      method: 'USDT TRC-20 (Crypto)',
      bank: 'USDT TRC-20',
      amount: String(pd?.totalAmount || (Number(trx.amount || 0) * 1.05)),
      net: String(pd?.netAmount || trx.amount || 0),
      fee: String(pd?.feeAmount || (Number(trx.amount || 0) * 0.05)),
      pkg: String(pd?.packageType || trx.package_selected || 'starter'),
      createdAt: String(trx.created_at || new Date().toISOString())
    }

    router.push({
      path: '/dashboard/topup/payment',
      query
    })
    return
  }

  // Duidku (IDR Virtual Account) Transaction
  if (!pd) {
    router.push('/dashboard/topup')
    return
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
