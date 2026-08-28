<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleClose"></div>

      <!-- Modal Content -->
      <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <!-- Header -->
        <div class="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white">
          <button @click="handleClose" class="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Wallet class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-lg">USDT TRC-20 Payment</h3>
              <p class="text-sm text-white/80">Transfer USDT to the address below</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-5">
          <!-- Status Indicator -->
          <div :class="statusBannerClass" class="rounded-xl p-3 flex items-center gap-3 text-sm font-medium">
            <div v-if="paymentStatus === 'waiting'" class="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <CheckCircle v-else-if="paymentStatus === 'finished' || paymentStatus === 'confirmed'" class="w-5 h-5 text-emerald-600 shrink-0" />
            <AlertTriangle v-else-if="paymentStatus === 'expired' || paymentStatus === 'failed'" class="w-5 h-5 text-red-600 shrink-0" />
            <div v-else class="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <span>{{ statusMessage }}</span>
          </div>

          <!-- QR Code -->
          <div v-if="paymentStatus === 'waiting'" class="flex flex-col items-center gap-3">
            <div class="bg-white border-2 border-ink-100 rounded-2xl p-3 shadow-sm">
              <img 
                :src="qrCodeUrl" 
                alt="QR Code USDT TRC-20 Address"
                class="w-48 h-48 rounded-lg"
                loading="eager"
              />
            </div>
          </div>

          <!-- Pay Amount -->
          <div v-if="paymentStatus === 'waiting'" class="bg-ink-50 rounded-xl p-4 border border-ink-100">
            <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1.5">Amount to Send</p>
            <div class="flex items-center justify-between gap-2">
              <span class="text-2xl font-black text-ink-900">{{ payData?.payAmount }} USDT</span>
              <button
                @click="copyToClipboard(String(payData?.payAmount || ''))"
                class="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Copy class="w-3.5 h-3.5" />
                {{ copiedField === 'amount' ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Wallet Address -->
          <div v-if="paymentStatus === 'waiting'" class="bg-ink-50 rounded-xl p-4 border border-ink-100">
            <p class="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1.5">TRC-20 Wallet Address</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 text-sm font-mono text-ink-900 break-all bg-white border border-ink-200 rounded-lg px-3 py-2">{{ payData?.payAddress }}</code>
              <button
                @click="copyToClipboard(payData?.payAddress || '')"
                class="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Copy class="w-3.5 h-3.5" />
                {{ copiedField === 'address' ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Warning -->
          <div v-if="paymentStatus === 'waiting'" class="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p class="text-xs text-amber-800 font-medium leading-relaxed">
              Make sure to send via <strong>TRC-20</strong> network only. Do not send via ERC-20 or BEP-20, funds may be permanently lost.
            </p>
          </div>

          <!-- Countdown Timer -->
          <div v-if="paymentStatus === 'waiting'" class="flex items-center justify-center gap-2 text-sm">
            <Clock class="w-4 h-4 text-ink-400" />
            <span class="text-ink-500">Time remaining:</span>
            <span class="font-bold text-ink-900 tabular-nums">{{ formattedCountdown }}</span>
          </div>

          <!-- Payment Summary -->
          <div class="bg-ink-50 rounded-xl p-4 border border-ink-100 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-ink-500">Inbound Balance</span>
              <span class="font-bold text-ink-900">${{ payData?.netAmount?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-ink-500">Service Fee</span>
              <span class="font-bold text-ink-900">${{ payData?.feeAmount?.toFixed(2) }}</span>
            </div>
            <hr class="border-ink-200">
            <div class="flex justify-between text-sm">
              <span class="font-bold text-ink-900">Total Payment</span>
              <span class="font-bold text-emerald-600">${{ payData?.totalAmount?.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-ink-400">Order ID</span>
              <span class="font-mono text-ink-500">{{ payData?.merchantOrderId }}</span>
            </div>
          </div>

          <!-- Success State -->
          <div v-if="paymentStatus === 'finished' || paymentStatus === 'confirmed'" class="text-center py-4">
            <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle class="w-8 h-8 text-emerald-600" />
            </div>
            <h4 class="font-bold text-lg text-ink-900 mb-1">Payment Successful!</h4>
            <p class="text-sm text-ink-600">Your USD balance has been updated.</p>
          </div>

          <!-- Expired/Failed State -->
          <div v-if="paymentStatus === 'expired' || paymentStatus === 'failed'" class="text-center py-4">
            <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle class="w-8 h-8 text-red-600" />
            </div>
            <h4 class="font-bold text-lg text-ink-900 mb-1">
              {{ paymentStatus === 'expired' ? 'Payment Expired' : 'Payment Failed' }}
            </h4>
            <p class="text-sm text-ink-600">Please create a new payment.</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-ink-50 border-t border-ink-100">
          <button
            v-if="paymentStatus === 'finished' || paymentStatus === 'confirmed'"
            @click="handleSuccess"
            class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Done
          </button>
          <button
            v-else-if="paymentStatus === 'expired' || paymentStatus === 'failed'"
            @click="handleClose"
            class="w-full bg-ink-200 hover:bg-ink-300 text-ink-700 font-bold py-3 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            v-else
            @click="handleClose"
            class="w-full bg-ink-200 hover:bg-ink-300 text-ink-700 font-bold py-3 rounded-xl transition-colors"
          >
            Pay Later (Do not close if transferred)
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, Wallet, Copy, Clock, CheckCircle, AlertTriangle } from 'lucide-vue-next'

interface PaymentData {
  paymentId: string
  payAddress: string
  payAmount: number
  merchantOrderId: string
  netAmount: number
  feeAmount: number
  totalAmount: number
  packageType: string
  expirationEstimate: string
}

const props = defineProps<{
  isOpen: boolean
  payData: PaymentData | null
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const paymentStatus = ref<string>('waiting')
const copiedField = ref<string>('')
const countdown = ref(3600) // 60 minutes in seconds
let pollingInterval: ReturnType<typeof setInterval> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null

// QR Code URL using external API (no extra npm package needed)
const qrCodeUrl = computed(() => {
  if (!props.payData?.payAddress) return ''
  const address = encodeURIComponent(props.payData.payAddress)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}&margin=8`
})

const statusBannerClass = computed(() => {
  switch (paymentStatus.value) {
    case 'waiting': return 'bg-orange-50 border border-orange-200 text-orange-800'
    case 'confirming':
    case 'sending': return 'bg-blue-50 border border-blue-200 text-blue-800'
    case 'confirmed':
    case 'finished': return 'bg-emerald-50 border border-emerald-200 text-emerald-800'
    case 'expired':
    case 'failed': return 'bg-red-50 border border-red-200 text-red-800'
    case 'partially_paid': return 'bg-amber-50 border border-amber-200 text-amber-800'
    default: return 'bg-ink-50 border border-ink-200 text-ink-800'
  }
})

const statusMessage = computed(() => {
  switch (paymentStatus.value) {
    case 'waiting': return 'Waiting for USDT payment...'
    case 'confirming': return 'Transaction detected, confirming on blockchain...'
    case 'sending': return 'Processing payment...'
    case 'confirmed':
    case 'finished': return 'Payment confirmed successfully!'
    case 'expired': return 'Payment expired.'
    case 'failed': return 'Payment failed.'
    case 'partially_paid': return 'Amount sent is less than required.'
    default: return 'Loading status...'
  }
})

const formattedCountdown = computed(() => {
  const mins = Math.floor(countdown.value / 60)
  const secs = countdown.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copiedField.value = text === String(props.payData?.payAmount) ? 'amount' : 'address'
    setTimeout(() => { copiedField.value = '' }, 2000)
  } catch (e) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copiedField.value = text === String(props.payData?.payAmount) ? 'amount' : 'address'
    setTimeout(() => { copiedField.value = '' }, 2000)
  }
}

const pollPaymentStatus = async () => {
  if (!props.payData?.paymentId) return

  try {
    const result = await $fetch<any>('/api/nowpayments/payment-status', {
      params: { paymentId: props.payData.paymentId }
    })

    if (result?.status) {
      paymentStatus.value = result.status

      // Stop polling on terminal states
      if (['finished', 'confirmed', 'expired', 'failed'].includes(result.status)) {
        stopPolling()
        stopCountdown()
      }
    }
  } catch (err) {
    console.error('Error polling payment status:', err)
  }
}

const startPolling = () => {
  if (pollingInterval) return
  pollPaymentStatus() // Initial check
  pollingInterval = setInterval(pollPaymentStatus, 10000) // Every 10 seconds
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

const startCountdown = () => {
  if (countdownInterval) return
  
  // Calculate from expiration estimate
  if (props.payData?.expirationEstimate) {
    const expiry = new Date(props.payData.expirationEstimate).getTime()
    const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
    countdown.value = remaining
  } else {
    countdown.value = 3600
  }

  countdownInterval = setInterval(() => {
    countdown.value = Math.max(0, countdown.value - 1)
    if (countdown.value <= 0) {
      stopCountdown()
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

const handleClose = () => {
  stopPolling()
  stopCountdown()
  emit('close')
}

const handleSuccess = () => {
  stopPolling()
  stopCountdown()
  emit('success')
}

// Watch modal open/close to start/stop polling
watch(() => props.isOpen, (newVal) => {
  if (newVal && props.payData) {
    paymentStatus.value = 'waiting'
    copiedField.value = ''
    startPolling()
    startCountdown()
  } else {
    stopPolling()
    stopCountdown()
  }
})

// PERF-06: Pause polling when tab is hidden, resume when visible
const handleVisibilityChange = () => {
  if (!props.isOpen || !props.payData) return
  if (document.hidden) {
    stopPolling()
  } else {
    // Resume polling if modal still open and not in terminal state
    if (!['finished', 'confirmed', 'expired', 'failed'].includes(paymentStatus.value)) {
      startPolling()
    }
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// Cleanup on unmount
onUnmounted(() => {
  stopPolling()
  stopCountdown()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>
