<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity" @click="handleClose"></div>

        <!-- Modal Container (Matching Member Area Invoice Style) -->
        <div class="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-xl my-auto overflow-hidden border border-slate-200 dark:border-slate-800 transition-all flex flex-col max-h-[90vh]">
          
          <!-- Top Header -->
          <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shrink-0 relative border-b border-slate-700/60">
            <div class="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <button 
              @click="handleClose" 
              class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all focus:outline-none"
              title="Close Modal"
            >
              <X class="w-4 h-4" />
            </button>
            
            <div class="flex items-center justify-between pr-10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-xl">
                  T
                </div>
                <div>
                  <h3 class="font-extrabold text-base sm:text-lg text-white leading-tight">Tentaklik Payment</h3>
                  <p class="text-xs text-slate-400">Crypto Top-Up Gateway</p>
                </div>
              </div>

              <!-- Status Badge -->
              <span 
                :class="paymentStatus === 'finished' || paymentStatus === 'confirmed' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-orange-500/20 text-orange-300 border-orange-500/30'"
                class="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border shadow-xs"
              >
                {{ paymentStatus === 'finished' || paymentStatus === 'confirmed' ? '✓ PAID' : 'UNPAID / PENDING' }}
              </span>
            </div>

            <!-- Tab Switcher -->
            <div class="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 mt-4">
              <button
                @click="activeTab = 'pay'"
                :class="activeTab === 'pay' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 font-medium'"
                class="flex-1 py-2 text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <CreditCard class="w-3.5 h-3.5" />
                <span>Payment & QR Code</span>
              </button>
              <button
                @click="activeTab = 'invoice'"
                :class="activeTab === 'invoice' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold shadow-md' 
                  : 'text-slate-400 hover:text-slate-200 font-medium'"
                class="flex-1 py-2 text-xs rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <FileText class="w-3.5 h-3.5" />
                <span>View Invoice</span>
              </button>
            </div>
          </div>

          <!-- Body Container -->
          <div class="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">

            <!-- ================= TAB 1: PAYMENT & QR ================= -->
            <template v-if="activeTab === 'pay'">
              <!-- Progress Steps -->
              <div class="flex items-center justify-between max-w-sm mx-auto py-2 text-xs font-semibold">
                <div class="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle class="w-4 h-4" />
                  <span>Create Order</span>
                </div>
                <div class="h-0.5 w-10 bg-orange-400"></div>
                <div class="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-bold">
                  <Clock class="w-4 h-4 animate-spin-slow" />
                  <span>Pending Payment</span>
                </div>
                <div class="h-0.5 w-10 bg-slate-200 dark:bg-slate-700"></div>
                <div class="flex items-center gap-1.5 text-slate-400">
                  <Sparkles class="w-4 h-4" />
                  <span>Credited</span>
                </div>
              </div>

              <!-- Status Banner -->
              <div :class="statusBannerClass" class="rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold shadow-sm transition-all">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div v-if="paymentStatus === 'waiting'" class="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <CheckCircle v-else-if="paymentStatus === 'finished' || paymentStatus === 'confirmed'" class="w-5 h-5 text-emerald-600 shrink-0" />
                  <AlertTriangle v-else-if="paymentStatus === 'expired' || paymentStatus === 'failed'" class="w-5 h-5 text-rose-600 shrink-0" />
                  <div v-else class="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span class="truncate">{{ statusMessage }}</span>
                </div>
                <div v-if="paymentStatus === 'waiting'" class="flex items-center gap-1 text-xs font-mono font-bold text-orange-600 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-slate-700">
                  <Clock class="w-3 h-3" />
                  <span>{{ formattedCountdown }}</span>
                </div>
              </div>

              <template v-if="paymentStatus === 'waiting' || paymentStatus === 'confirming' || paymentStatus === 'sending'">
                <!-- QR Code & Address Box -->
                <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <!-- QR Image -->
                  <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 shrink-0 text-center">
                    <img 
                      v-if="qrCodeUrl"
                      :src="qrCodeUrl" 
                      alt="USDT TRC-20 Deposit QR"
                      class="w-40 h-40 rounded-xl object-contain mx-auto"
                    />
                    <p class="text-[10px] font-bold text-slate-400 mt-2">Scan via Crypto App</p>
                  </div>

                  <!-- Right Side: Amount & Wallet Address -->
                  <div class="flex-1 space-y-3.5 w-full">
                    <!-- Exact Amount Box -->
                    <div class="bg-orange-50/80 dark:bg-orange-950/30 p-3.5 rounded-xl border border-orange-200/80 dark:border-orange-800/50">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300 block mb-1">
                        Exact Amount to Send
                      </span>
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white break-all">
                          {{ payData?.payAmount }} <span class="text-xs font-bold text-orange-600">USDT</span>
                        </span>
                        <button
                          @click="copyToClipboard(String(payData?.payAmount || ''))"
                          class="text-xs font-bold text-orange-600 bg-white hover:bg-orange-100 border border-orange-300 px-3 py-1.5 rounded-xl transition-all active:scale-95 flex items-center gap-1 shrink-0"
                        >
                          <Check v-if="copiedField === 'amount'" class="w-3.5 h-3.5 text-orange-600" />
                          <Copy v-else class="w-3.5 h-3.5 text-orange-500" />
                          {{ copiedField === 'amount' ? 'Copied' : 'Copy' }}
                        </button>
                      </div>
                    </div>

                    <!-- Deposit Address Box -->
                    <div class="space-y-1">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        TRC-20 Wallet Deposit Address
                      </span>
                      <div class="flex items-center gap-2">
                        <div class="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 break-all select-all">
                          {{ payData?.payAddress }}
                        </div>
                        <button
                          @click="copyToClipboard(payData?.payAddress || '')"
                          class="text-xs font-bold text-orange-600 bg-white hover:bg-orange-100 border border-orange-300 px-3 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-1 shrink-0"
                        >
                          <Check v-if="copiedField === 'address'" class="w-3.5 h-3.5 text-orange-600" />
                          <Copy v-else class="w-3.5 h-3.5 text-orange-500" />
                          {{ copiedField === 'address' ? 'Copied' : 'Copy' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Network Warning Box -->
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
                  <AlertTriangle class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p class="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                    Send <strong class="text-amber-700 dark:text-amber-300 font-bold">ONLY via TRC-20 (Tron) network</strong>. Do not use ERC-20 or BEP-20 to avoid permanent loss.
                  </p>
                </div>

                <!-- Payment Summary Breakdown -->
                <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
                  <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Inbound Balance (USDT)</span>
                    <span class="font-bold text-slate-900 dark:text-white">{{ payData?.netAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} USDT</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span>Service Fee</span>
                    <span class="font-bold text-slate-900 dark:text-white">{{ payData?.feeAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} USDT</span>
                  </div>
                  <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                  <div class="flex justify-between items-center">
                    <span class="font-bold text-slate-900 dark:text-white">Total USDT Payable</span>
                    <span class="font-black text-orange-600 text-sm">{{ payData?.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} USDT</span>
                  </div>
                  <div class="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>Order Reference</span>
                    <span class="font-mono text-slate-500 dark:text-slate-400">{{ payData?.merchantOrderId }}</span>
                  </div>
                </div>
              </template>

              <!-- Success State -->
              <div v-else-if="paymentStatus === 'finished' || paymentStatus === 'confirmed'" class="text-center py-8 space-y-3">
                <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-lg border border-emerald-300 animate-bounce">
                  <CheckCircle class="w-10 h-10 text-emerald-600" />
                </div>
                <h4 class="font-extrabold text-xl text-slate-900 dark:text-white">Payment Confirmed!</h4>
                <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  Your payment of <strong class="text-orange-600 font-semibold">{{ payData?.payAmount }} USDT</strong> has been verified. Your balance has been updated!
                </p>
              </div>

              <!-- Expired / Failed State -->
              <div v-else-if="paymentStatus === 'expired' || paymentStatus === 'failed'" class="text-center py-8 space-y-3">
                <div class="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto shadow-lg border border-rose-300">
                  <AlertTriangle class="w-10 h-10 text-rose-600" />
                </div>
                <h4 class="font-extrabold text-xl text-slate-900 dark:text-white">
                  {{ paymentStatus === 'expired' ? 'Payment Expired' : 'Payment Failed' }}
                </h4>
                <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  The payment session timed out or was cancelled. Please create a new top-up request.
                </p>
              </div>
            </template>

            <!-- ================= TAB 2: INVOICE ================= -->
            <template v-else-if="activeTab === 'invoice'">
              <div id="invoice-print-area" class="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                <!-- Invoice Header -->
                <div class="flex items-start justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <div class="w-7 h-7 rounded-lg bg-orange-500 text-white font-bold flex items-center justify-center text-sm">T</div>
                      <span class="font-black text-lg text-slate-900 dark:text-white tracking-tight">TENTAKLIK</span>
                    </div>
                    <p class="text-xs text-slate-500">Digital Ad Management Infrastructure</p>
                  </div>
                  <div class="text-right">
                    <h2 class="text-xl font-black text-slate-900 dark:text-white tracking-tight">INVOICE</h2>
                    <span 
                      :class="paymentStatus === 'finished' || paymentStatus === 'confirmed' 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-100 text-amber-800 border-amber-200'"
                      class="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md border mt-1"
                    >
                      {{ paymentStatus === 'finished' || paymentStatus === 'confirmed' ? '✓ PAID' : 'UNPAID' }}
                    </span>
                  </div>
                </div>

                <!-- Invoice Meta Details -->
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <div>
                    <span class="text-slate-400 block text-[10px] uppercase font-bold">Invoice No.</span>
                    <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ payData?.merchantOrderId }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
                    <span class="font-medium text-slate-800 dark:text-slate-200">{{ formattedDate }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                    <span class="font-semibold text-orange-600">USDT TRC-20 (Crypto)</span>
                  </div>
                </div>

                <!-- Invoice Table -->
                <div class="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                  <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th class="p-3">Item Description</th>
                        <th class="p-3 text-right">Amount (USD)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50 text-slate-800 dark:text-slate-200">
                      <tr>
                        <td class="p-3">
                          <div class="font-semibold">Digital Ad Management Deposit</div>
                          <div class="text-[11px] text-slate-400">Package: <span class="capitalize font-medium text-slate-600 dark:text-slate-300">{{ payData?.packageType || 'Starter' }}</span></div>
                        </td>
                        <td class="p-3 text-right font-mono font-semibold">${{ payData?.netAmount?.toFixed(2) }}</td>
                      </tr>
                      <tr v-if="payData?.feeAmount">
                        <td class="p-3">
                          <div class="font-semibold">Service & Processing Fee</div>
                        </td>
                        <td class="p-3 text-right font-mono font-semibold">${{ payData?.feeAmount?.toFixed(2) }}</td>
                      </tr>
                    </tbody>
                    <tfoot class="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 font-bold">
                      <tr>
                        <td class="p-3 text-slate-900 dark:text-white font-extrabold">Total Amount Payable</td>
                        <td class="p-3 text-right text-orange-600 text-sm font-black font-mono">
                          ${{ payData?.totalAmount?.toFixed(2) }} USD
                        </td>
                      </tr>
                      <tr>
                        <td class="p-3 text-slate-500 font-medium text-[11px]">Equivalent Crypto Amount</td>
                        <td class="p-3 text-right text-slate-700 dark:text-slate-300 text-xs font-bold font-mono">
                          {{ payData?.payAmount }} USDT
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <!-- Invoice Footer Note -->
                <div class="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1 text-center sm:text-left">
                  <p>This digital invoice is automatically generated by Tentaklik Payment Gateway.</p>
                  <p>© {{ new Date().getFullYear() }} Tentaklik — area.tentaklik.com</p>
                </div>
              </div>
            </template>

          </div>

          <!-- Footer Buttons (Fixed at bottom) -->
          <div class="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <button
              v-if="paymentStatus === 'finished' || paymentStatus === 'confirmed'"
              @click="handleSuccess"
              class="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98]"
            >
              Done & Refresh Balance
            </button>
            <button
              v-else-if="paymentStatus === 'expired' || paymentStatus === 'failed'"
              @click="handleClose"
              class="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.98]"
            >
              Close
            </button>
            <button
              v-else
              @click="handleClose"
              class="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <span>Close Window (Auto-Tracked in Background)</span>
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { 
  X, Wallet, Copy, Check, Clock, CheckCircle, AlertTriangle, 
  CreditCard, FileText, Sparkles 
} from 'lucide-vue-next'

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

const activeTab = ref<'pay' | 'invoice'>('pay')
const paymentStatus = ref<string>('waiting')
const copiedField = ref<string>('')
const countdown = ref(3600)
let pollingInterval: ReturnType<typeof setInterval> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null

const formattedDate = computed(() => {
  const d = new Date()
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
})

// QR Code URL using external API
const qrCodeUrl = computed(() => {
  if (!props.payData?.payAddress) return ''
  const address = encodeURIComponent(props.payData.payAddress)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}&margin=8`
})

const statusBannerClass = computed(() => {
  switch (paymentStatus.value) {
    case 'waiting': return 'bg-orange-50 border border-orange-200/80 text-orange-900 dark:bg-orange-950/40 dark:border-orange-800/60 dark:text-orange-200'
    case 'confirming':
    case 'sending': return 'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800/60 dark:text-blue-200'
    case 'confirmed':
    case 'finished': return 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200'
    case 'expired':
    case 'failed': return 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-200'
    case 'partially_paid': return 'bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/60 dark:text-amber-200'
    default: return 'bg-slate-50 border border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
  }
})

const statusMessage = computed(() => {
  switch (paymentStatus.value) {
    case 'waiting': return 'Waiting for USDT payment...'
    case 'confirming': return 'Transaction detected, confirming on blockchain...'
    case 'sending': return 'Processing payment...'
    case 'confirmed':
    case 'finished': return 'Payment confirmed successfully!'
    case 'expired': return 'Payment session expired.'
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
  pollPaymentStatus()
  pollingInterval = setInterval(pollPaymentStatus, 10000)
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

const startCountdown = () => {
  stopCountdown()
  
  if (props.payData?.expirationEstimate) {
    const expiry = new Date(props.payData.expirationEstimate).getTime()
    const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000))
    countdown.value = remaining > 0 ? remaining : 3600
  } else {
    countdown.value = 3600
  }

  countdownInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
    } else {
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

// Watch BOTH isOpen and payData together so countdown starts properly when payData arrives
watch(
  [() => props.isOpen, () => props.payData],
  ([open, data]) => {
    if (open && data) {
      activeTab.value = 'pay'
      paymentStatus.value = 'waiting'
      copiedField.value = ''
      startPolling()
      startCountdown()
    } else if (!open) {
      stopPolling()
      stopCountdown()
    }
  },
  { immediate: true }
)

const handleVisibilityChange = () => {
  if (!props.isOpen || !props.payData) return
  if (document.hidden) {
    stopPolling()
  } else {
    if (!['finished', 'confirmed', 'expired', 'failed'].includes(paymentStatus.value)) {
      startPolling()
    }
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  stopPolling()
  stopCountdown()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>
