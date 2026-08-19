<template>
  <div class="payment-page">
    <!-- Animated Background -->
    <div class="payment-bg">
      <div class="payment-bg-orb payment-bg-orb--1"></div>
      <div class="payment-bg-orb payment-bg-orb--2"></div>
      <div class="payment-bg-orb payment-bg-orb--3"></div>
    </div>

    <div class="payment-container">

      <!-- ═══════════════ SUCCESS STATE ═══════════════ -->
      <Transition name="state-fade" mode="out-in">
        <div v-if="paymentStatus === 'success'" key="success" class="payment-result">
          <!-- Confetti Particles -->
          <div class="confetti-container">
            <div v-for="i in 30" :key="i" class="confetti-piece" :style="confettiStyle(i)"></div>
          </div>

          <div class="payment-result__card payment-result__card--success">
            <!-- Animated Check with Rings -->
            <div class="result-icon result-icon--success">
              <div class="result-icon__pulse-ring"></div>
              <div class="result-icon__pulse-ring result-icon__pulse-ring--delay"></div>
              <div class="result-icon__bg">
                <svg class="result-icon__check" viewBox="0 0 24 24" fill="none">
                  <path class="result-icon__check-path" d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>

            <div class="result-badge result-badge--success">
              <Sparkles class="w-3 h-3" /> Transaksi Selesai
            </div>

            <h2 class="payment-result__title">Pembayaran Berhasil!</h2>
            <p class="payment-result__subtitle">Saldo iklan kamu berhasil ditambahkan sebesar</p>

            <div class="result-amount-box result-amount-box--success">
              <p class="result-amount-box__label">Saldo Ditambahkan</p>
              <p class="result-amount-box__value result-amount-box__value--success">
                +{{ formatRupiah(Number(route.query.net)) }}
              </p>
            </div>

            <!-- Receipt Details -->
            <div class="result-receipt">
              <div class="result-receipt__header">
                <Receipt class="w-4 h-4 text-ink-400" />
                <span>Detail Transaksi</span>
              </div>
              <div class="result-receipt__body">
                <div class="result-receipt__row">
                  <span>Order ID</span>
                  <span class="font-mono text-ink-900">{{ truncateRef(route.query.orderId as string) }}</span>
                </div>
                <div class="result-receipt__row">
                  <span>Referensi</span>
                  <span class="font-mono text-ink-900">{{ truncateRef(route.query.ref as string) }}</span>
                </div>
                <div class="result-receipt__row">
                  <span>Metode</span>
                  <span class="text-ink-900 font-semibold">{{ route.query.method }}</span>
                </div>
                <div class="result-receipt__row">
                  <span>Paket</span>
                  <span class="payment-pkg-badge capitalize">{{ route.query.pkg }}</span>
                </div>
                <div class="result-receipt__divider"></div>
                <div class="result-receipt__row">
                  <span>Saldo Masuk</span>
                  <span class="text-green-600 font-bold">+{{ formatRupiah(Number(route.query.net)) }}</span>
                </div>
                <div class="result-receipt__row">
                  <span>Biaya Layanan</span>
                  <span class="text-ink-700 font-semibold">{{ formatRupiah(Number(route.query.fee)) }}</span>
                </div>
                <div class="result-receipt__row">
                  <span>Total Dibayar</span>
                  <span class="text-ink-900 font-bold">{{ formatRupiah(Number(route.query.amount)) }}</span>
                </div>
                <div class="result-receipt__row">
                  <span>Waktu</span>
                  <span class="text-ink-700">{{ currentTime }}</span>
                </div>
              </div>
            </div>

            <div class="result-actions">
              <NuxtLink to="/dashboard/topup" class="payment-btn payment-btn--primary">
                <Wallet class="w-4 h-4" />
                Lihat Saldo Terbaru
              </NuxtLink>
              <NuxtLink to="/dashboard" class="payment-btn payment-btn--ghost">
                Kembali ke Dashboard
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- ═══════════════ FAILED/EXPIRED STATE ═══════════════ -->
        <div v-else-if="paymentStatus === 'failed' || isExpired" key="failed" class="payment-result">
          <div class="payment-result__card payment-result__card--failed">
            <div class="result-icon result-icon--failed">
              <div class="result-icon__bg result-icon__bg--failed">
                <XCircle class="result-icon__svg--large" />
              </div>
            </div>

            <div class="result-badge result-badge--failed">
              {{ isExpired ? 'Waktu Habis' : 'Gagal' }}
            </div>

            <h2 class="payment-result__title">
              {{ isExpired ? 'Waktu Pembayaran Habis' : 'Pembayaran Gagal' }}
            </h2>
            <p class="payment-result__subtitle">
              {{ isExpired
                ? 'Sesi pembayaran sudah berakhir. Tidak ada dana yang didebit dari rekening Anda.'
                : 'Transaksi tidak berhasil diproses. Silakan coba lagi dengan transaksi baru.'
              }}
            </p>

            <div class="result-receipt result-receipt--compact">
              <div class="result-receipt__body">
                <div class="result-receipt__row">
                  <span>Order ID</span>
                  <span class="font-mono text-ink-900">{{ truncateRef(route.query.orderId as string) }}</span>
                </div>
                <div class="result-receipt__row">
                  <span>Nominal</span>
                  <span class="text-ink-900 font-bold">{{ formatRupiah(Number(route.query.amount)) }}</span>
                </div>
              </div>
            </div>

            <div class="result-actions">
              <NuxtLink to="/dashboard/topup" class="payment-btn payment-btn--primary">
                <RefreshCw class="w-4 h-4" />
                Buat Transaksi Baru
              </NuxtLink>
              <NuxtLink to="/dashboard" class="payment-btn payment-btn--ghost">
                Kembali ke Dashboard
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- ═══════════════ PENDING STATE ═══════════════ -->
        <div v-else key="pending" class="payment-pending">

          <!-- Progress Steps -->
          <div class="payment-steps">
            <div class="payment-step payment-step--done">
              <div class="payment-step__circle"><CheckCircle class="w-4 h-4" /></div>
              <span class="payment-step__label">Buat Pesanan</span>
            </div>
            <div class="payment-step__line payment-step__line--active"></div>
            <div class="payment-step payment-step--active">
              <div class="payment-step__circle"><Clock class="w-4 h-4" /></div>
              <span class="payment-step__label">Menunggu Bayar</span>
            </div>
            <div class="payment-step__line"></div>
            <div class="payment-step">
              <div class="payment-step__circle"><Sparkles class="w-4 h-4" /></div>
              <span class="payment-step__label">Saldo Masuk</span>
            </div>
          </div>

          <!-- Main Card -->
          <div class="payment-card">
            <!-- Timer Header -->
            <div class="payment-card__header">
              <div class="payment-timer">
                <div class="payment-timer__progress">
                  <svg viewBox="0 0 100 100" class="payment-timer__svg">
                    <circle cx="50" cy="50" r="44" class="payment-timer__track" />
                    <circle cx="50" cy="50" r="44" class="payment-timer__fill"
                      :style="{ strokeDashoffset: timerDashOffset }"
                    />
                  </svg>
                  <div class="payment-timer__inner">
                    <Clock class="w-4 h-4 text-orange-500" />
                  </div>
                </div>
                <div>
                  <p class="payment-timer__label">Selesaikan pembayaran dalam</p>
                  <p :class="['payment-timer__time', timeLeft < 300 ? 'payment-timer__time--urgent' : '']">
                    {{ formattedTime }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Amount Section -->
            <div class="payment-amount-section">
              <div class="payment-amount">
                <p class="payment-amount__label">Total Pembayaran</p>
                <p class="payment-amount__value">{{ formatRupiah(Number(route.query.amount)) }}</p>
              </div>
              <div class="payment-amount-breakdown">
                <div class="payment-amount-breakdown__row">
                  <span>Saldo yang akan masuk</span>
                  <span class="text-green-600 font-semibold">+{{ formatRupiah(Number(route.query.net)) }}</span>
                </div>
                <div class="payment-amount-breakdown__row">
                  <span>Biaya layanan</span>
                  <span class="font-semibold">{{ formatRupiah(Number(route.query.fee)) }}</span>
                </div>
                <div class="payment-amount-breakdown__row">
                  <span>Paket</span>
                  <span class="payment-pkg-badge capitalize">{{ route.query.pkg }}</span>
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="payment-divider">
              <div class="payment-divider__notch payment-divider__notch--left"></div>
              <div class="payment-divider__line"></div>
              <div class="payment-divider__notch payment-divider__notch--right"></div>
            </div>

            <!-- VA Section -->
            <div class="payment-va-section">
              <!-- Bank Info -->
              <div class="payment-va__bank">
                <img v-if="bankLogo" :src="bankLogo" :alt="route.query.method as string" class="payment-va__bank-logo" />
                <div>
                  <p class="payment-va__bank-name">{{ route.query.method }}</p>
                  <p v-if="route.query.bankCode" class="payment-va__bank-code">Kode Bank: {{ route.query.bankCode }}</p>
                </div>
              </div>

              <!-- VA Number -->
              <div class="payment-va__number-box">
                <p class="payment-va__number-label">Nomor Virtual Account</p>
                <div class="payment-va__number-row">
                  <span class="payment-va__number">{{ formatVA(route.query.va as string) }}</span>
                  <button @click="copyVA" :class="['payment-va__copy-btn', copied ? 'payment-va__copy-btn--copied' : '']">
                    <component :is="copied ? CheckCircle : Copy" class="w-4 h-4" />
                    {{ copied ? 'Tersalin!' : 'Salin' }}
                  </button>
                </div>
              </div>

              <!-- Penting -->
              <div class="payment-va__warning">
                <AlertTriangle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>Transfer tepat sesuai nominal <strong>{{ formatRupiah(Number(route.query.amount)) }}</strong> agar pembayaran terverifikasi otomatis.</p>
              </div>
            </div>

            <!-- Status Indicator -->
            <div class="payment-status-bar">
              <div :class="['payment-status-dot', isChecking ? 'payment-status-dot--checking' : 'payment-status-dot--idle']"></div>
              <span>{{ isChecking ? 'Mengecek pembayaran...' : 'Menunggu pembayaran' }}</span>
            </div>

            <!-- Instructions Accordion -->
            <div class="payment-instructions">
              <button @click="isInstructionOpen = !isInstructionOpen" class="payment-instructions__toggle">
                <div class="payment-instructions__toggle-left">
                  <BookOpen class="w-4 h-4 text-orange-500" />
                  <span>Panduan Pembayaran</span>
                </div>
                <ChevronDown :class="['w-4 h-4 text-ink-400 transition-transform duration-300', isInstructionOpen ? 'rotate-180' : '']" />
              </button>

              <div v-show="isInstructionOpen" class="payment-instructions__body">
                <div v-if="currentBankInstructions" class="payment-instructions__content">
                  <!-- Channel Tabs -->
                  <div class="payment-instructions__tabs">
                    <button
                      v-for="tab in instructionTabs"
                      :key="tab.id"
                      @click="activeInstructionTab = tab.id"
                      :class="['payment-instructions__tab', activeInstructionTab === tab.id ? 'payment-instructions__tab--active' : '']"
                    >
                      {{ tab.label }}
                    </button>
                  </div>

                  <!-- Steps -->
                  <ol class="payment-instructions__steps">
                    <li v-for="(step, i) in currentInstructions" :key="i" class="payment-instructions__step">
                      <span class="payment-instructions__step-num">{{ i + 1 }}</span>
                      <span>{{ step }}</span>
                    </li>
                  </ol>
                </div>
                <p v-else class="payment-instructions__empty">
                  Silakan bayar sesuai instruksi di mesin ATM atau mobile banking bank Anda.
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="payment-actions">
              <button @click="checkStatusManual" :disabled="isChecking" class="payment-btn payment-btn--outline">
                <RefreshCw :class="['w-4 h-4', isChecking ? 'animate-spin' : '']" />
                {{ isChecking ? 'Mengecek...' : 'Cek Status Pembayaran' }}
              </button>
              <NuxtLink to="/dashboard/topup" class="payment-btn payment-btn--ghost">
                Batalkan & Kembali
              </NuxtLink>
            </div>
          </div>

          <!-- Trust Badges -->
          <div class="payment-trust">
            <div class="payment-trust__item">
              <ShieldCheck class="w-4 h-4 text-green-500" />
              <span>Transaksi Aman</span>
            </div>
            <div class="payment-trust__divider"></div>
            <div class="payment-trust__item">
              <Lock class="w-4 h-4 text-blue-500" />
              <span>Data Terenkripsi</span>
            </div>
            <div class="payment-trust__divider"></div>
            <div class="payment-trust__item">
              <Zap class="w-4 h-4 text-orange-500" />
              <span>Verifikasi Otomatis</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Wallet, Clock, Copy, CheckCircle, XCircle, ChevronDown,
  RefreshCw, ShieldCheck, Building2, BookOpen, AlertTriangle,
  Sparkles, Lock, Zap, Receipt
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()

// ─── State ───────────────────────────────────────────────────────────────────
const paymentStatus = ref<'pending' | 'success' | 'failed'>('pending')
const isChecking = ref(false)
const isExpired = ref(false)
const copied = ref(false)
const isInstructionOpen = ref(false)
const activeInstructionTab = ref('mobile')

// ─── Timer ───────────────────────────────────────────────────────────────────
const EXPIRY_MINUTES = 60
const TOTAL_SECONDS = EXPIRY_MINUTES * 60

const initialTimeLeft = route.query.createdAt 
  ? Math.max(0, Math.floor(TOTAL_SECONDS - (Date.now() - new Date(route.query.createdAt as string).getTime()) / 1000))
  : TOTAL_SECONDS

const timeLeft = ref(initialTimeLeft)
const CIRCUMFERENCE = 2 * Math.PI * 44

const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = timeLeft.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const timerDashOffset = computed(() => {
  const progress = timeLeft.value / TOTAL_SECONDS
  return CIRCUMFERENCE * (1 - progress)
})

// ─── Utils ───────────────────────────────────────────────────────────────────
const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0
}).format(n || 0)

const formatVA = (va: string) => {
  if (!va) return '-'
  return va.replace(/(.{4})/g, '$1 ').trim()
}

const copyVA = () => {
  const va = route.query.va as string
  if (!va) return
  navigator.clipboard.writeText(va)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2500)
}

const truncateRef = (ref: string) => {
  if (!ref) return '-'
  if (ref.length <= 16) return ref
  return ref.substring(0, 8) + '...' + ref.substring(ref.length - 6)
}

const currentTime = computed(() => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date())
})

const confettiColors = ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6']
const confettiStyle = (i: number) => {
  const color = confettiColors[i % confettiColors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 2
  const duration = 2 + Math.random() * 2
  const size = 4 + Math.random() * 6
  const rotation = Math.random() * 360
  return {
    '--confetti-color': color,
    left: `${left}%`,
    width: `${size}px`,
    height: `${size * 0.4}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    transform: `rotate(${rotation}deg)`,
  }
}

// ─── Logo Bank ────────────────────────────────────────────────────────────────
const bankLogoMap: Record<string, string> = {
  'M2': '/logos/mandiri.png',
  'BM': '/logos/mandiri.png',
  'I1': '/logos/bni.png',
  'B1': '/logos/bsi.png',
  'BC': '/logos/bca.png',
  'BR': '/logos/bri.png',
  'A1': '/logos/atmbersama.png',
  'FT': '/logos/alfamart.svg',
  'IR': '/logos/indomaret.png',
}
const bankLogo = computed(() => bankLogoMap[route.query.bank as string] || null)

// ─── Instruksi Pembayaran ─────────────────────────────────────────────────────
const instructionTabs = [
  { id: 'mobile', label: 'Mobile Banking' },
  { id: 'atm', label: 'ATM' },
  { id: 'internet', label: 'Internet Banking' },
]

const vaInstructions: Record<string, Record<string, string[]>> = {
  'M2': {
    atm: [
      'Masukkan kartu ATM Mandiri dan PIN Anda',
      'Pilih menu "Bayar/Beli"',
      'Pilih "Multipayment"',
      'Masukkan kode perusahaan: 70014 lalu pilih "Benar"',
      `Masukkan Nomor Virtual Account: ${route.query.va}`,
      `Konfirmasi nominal ${formatRupiah(Number(route.query.amount))} dan pilih "Ya"`,
      'Simpan bukti struk pembayaran',
    ],
    mobile: [
      'Buka aplikasi Livin\' by Mandiri',
      'Pilih menu "Transfer" → "Virtual Account"',
      `Masukkan Nomor VA: ${route.query.va}`,
      'Periksa detail transaksi dan konfirmasi',
      'Masukkan PIN Mandiri Anda',
      'Pembayaran berhasil — simpan bukti',
    ],
    internet: [
      'Login ke Mandiri Online (internet banking)',
      'Pilih menu "Pembayaran" → "Multi Payment"',
      'Pilih "Penyedia Jasa" dan masukkan kode 70014',
      `Masukkan Nomor VA: ${route.query.va}`,
      'Konfirmasi dan masukkan token',
      'Simpan bukti pembayaran',
    ],
  },
  'I1': {
    atm: [
      'Masukkan kartu ATM BNI dan PIN',
      'Pilih "Menu Lainnya" → "Transfer" → "Rekening Tabungan"',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi nominal dan proses pembayaran',
    ],
    mobile: [
      'Buka BNI Mobile Banking',
      'Pilih "Transfer" → "Virtual Account Billing"',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi dan masukkan password transaksi',
    ],
    internet: [
      'Login ke BNI Internet Banking',
      'Pilih "Transfer" → "Virtual Account Billing"',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi dan masukkan token e-secure',
    ],
  },
  'B1': {
    atm: [
      'Masukkan kartu ATM BSI dan PIN',
      'Pilih "Transaksi Lainnya" → "Transfer"',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi jumlah dan selesaikan',
    ],
    mobile: [
      'Buka BSI Mobile',
      'Pilih "Bayar" → "Virtual Account"',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi pembayaran',
    ],
    internet: [
      'Login ke BSI Net Banking',
      'Pilih menu pembayaran Virtual Account',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi dengan OTP',
    ],
  },
  'BC': {
    atm: [
      'Masukkan kartu ATM BCA dan PIN',
      'Pilih "Transaksi Lainnya" → "Transfer" → "BCA Virtual Account"',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi jumlah dan proses pembayaran',
    ],
    mobile: [
      'Buka BCA mobile dan login',
      'Pilih "m-Transfer" → "BCA Virtual Account"',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi dan masukkan PIN',
    ],
    internet: [
      'Login ke KlikBCA',
      'Pilih "Transfer Dana" → "Transfer ke BCA Virtual Account"',
      `Masukkan nomor VA: ${route.query.va}`,
      'Konfirmasi dengan Token KeyBCA',
    ],
  },
  'BR': {
    atm: [
      'Masukkan kartu ATM BRI dan PIN',
      'Pilih "Transaksi Lainnya" → "Pembayaran" → "Briva"',
      `Masukkan nomor BRIVA: ${route.query.va}`,
      'Konfirmasi jumlah dan bayar',
    ],
    mobile: [
      'Buka BRImo',
      'Pilih "BRIVA"',
      `Masukkan nomor: ${route.query.va}`,
      'Konfirmasi dan masukkan PIN',
    ],
    internet: [
      'Login ke Internet Banking BRI',
      'Pilih "Pembayaran" → "BRIVA"',
      `Masukkan nomor BRIVA: ${route.query.va}`,
      'Konfirmasi dengan token',
    ],
  },
}

const currentBankInstructions = computed(() => {
  return vaInstructions[route.query.bank as string] || null
})

const currentInstructions = computed(() => {
  const bankInstr = currentBankInstructions.value
  if (!bankInstr) return []
  return bankInstr[activeInstructionTab.value] || []
})

// ─── Check Status ─────────────────────────────────────────────────────────────
const checkStatus = async () => {
  const orderId = route.query.orderId as string
  if (!orderId || isChecking.value) return

  isChecking.value = true
  try {
    const res = await $fetch<any>('/api/duidku/check-status', {
      params: { orderId }
    })

    if (res.status === 'success') {
      paymentStatus.value = 'success'
      stopPolling()
    } else if (res.status === 'failed') {
      paymentStatus.value = 'failed'
      stopPolling()
    }
  } catch (e: any) {
    if (e.response && e.response.status === 400) {
      console.error('Invalid request to check status, stopping poll:', e)
      stopPolling()
    }
    // Tetap polling jika error jaringan/500
  } finally {
    isChecking.value = false
  }
}

const checkStatusManual = () => {
  checkStatus()
}

// ─── Timer ──────────────────────────────────────────────────────────
let timerInterval: ReturnType<typeof setInterval>

const stopPolling = () => {
  clearInterval(timerInterval)
}

onMounted(() => {
  if (!route.query.orderId || !route.query.va) {
    router.replace('/dashboard/topup')
    return
  }

  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      isExpired.value = true
      stopPolling()
    }
  }, 1000)



  checkStatus()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   PAYMENT PAGE — Premium Design System
   ═══════════════════════════════════════════════════════════════ */

.payment-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  overflow: hidden;
}

/* Animated BG Orbs */
.payment-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.payment-bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
  animation: orb-float 20s ease-in-out infinite;
}
.payment-bg-orb--1 {
  width: 400px; height: 400px;
  background: #f97316;
  top: -100px; right: -100px;
  animation-delay: 0s;
}
.payment-bg-orb--2 {
  width: 300px; height: 300px;
  background: #3b82f6;
  bottom: -80px; left: -80px;
  animation-delay: -7s;
}
.payment-bg-orb--3 {
  width: 250px; height: 250px;
  background: #10b981;
  top: 40%; left: 50%;
  animation-delay: -14s;
}
@keyframes orb-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 30px) scale(0.95); }
}

.payment-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
}

/* ─── Progress Steps ──────────────────────────────────────── */
.payment-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}
.payment-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.payment-step__circle {
  width: 36px; height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.6);
  border: 2px solid #e5e7eb;
  color: #9ca3af;
  transition: all 0.3s;
}
.payment-step--done .payment-step__circle {
  background: linear-gradient(135deg, #f97316, #ea580c);
  border-color: #f97316;
  color: white;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}
.payment-step--active .payment-step__circle {
  background: white;
  border-color: #f97316;
  color: #f97316;
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
  animation: step-pulse 2s ease-in-out infinite;
}
@keyframes step-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
  50% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0.05); }
}
.payment-step__label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #9ca3af;
  white-space: nowrap;
}
.payment-step--done .payment-step__label,
.payment-step--active .payment-step__label {
  color: #374151;
}
.payment-step__line {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  min-width: 40px;
  margin: 0 0.25rem;
  margin-bottom: 1.5rem;
  border-radius: 1px;
}
.payment-step__line--active {
  background: linear-gradient(90deg, #f97316, #fdba74);
}

/* ─── Main Card ───────────────────────────────────────────── */
.payment-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 20px 40px -4px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  overflow: hidden;
}

/* ─── Timer ───────────────────────────────────────────────── */
.payment-card__header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background: linear-gradient(135deg, rgba(249,115,22,0.03), rgba(249,115,22,0.08));
}
.payment-timer {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}
.payment-timer__progress {
  position: relative;
  width: 48px; height: 48px;
  flex-shrink: 0;
}
.payment-timer__svg {
  width: 100%; height: 100%;
  transform: rotate(-90deg);
}
.payment-timer__track {
  fill: none;
  stroke: #f3f4f6;
  stroke-width: 6;
}
.payment-timer__fill {
  fill: none;
  stroke: #f97316;
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: 276.46;
  transition: stroke-dashoffset 1s linear;
}
.payment-timer__inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.payment-timer__label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}
.payment-timer__time {
  font-size: 1.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #111827;
  letter-spacing: 0.05em;
  line-height: 1.2;
}
.payment-timer__time--urgent {
  color: #dc2626;
  animation: urgent-blink 1s ease-in-out infinite;
}
@keyframes urgent-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ─── Amount ──────────────────────────────────────────────── */
.payment-amount-section {
  padding: 1.25rem 1.5rem;
}
.payment-amount {
  text-align: center;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fff7ed, #fef3c7);
  border-radius: 1rem;
  border: 1px solid rgba(249, 115, 22, 0.12);
  margin-bottom: 1rem;
}
.payment-amount__label {
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.25rem;
}
.payment-amount__value {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
}
.payment-amount-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.payment-amount-breakdown__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
}
.payment-pkg-badge {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
}

/* ─── Ticket-style Divider ────────────────────────────────── */
.payment-divider {
  display: flex;
  align-items: center;
  position: relative;
  margin: 0;
}
.payment-divider__notch {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #f3f4f6;
  flex-shrink: 0;
}
.payment-divider__notch--left { margin-left: -10px; }
.payment-divider__notch--right { margin-right: -10px; }
.payment-divider__line {
  flex: 1;
  border-top: 2px dashed #e5e7eb;
}

/* ─── VA Section ──────────────────────────────────────────── */
.payment-va-section {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.payment-va__bank {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.payment-va__bank-logo {
  height: 32px;
  object-fit: contain;
}
.payment-va__bank-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
}
.payment-va__bank-code {
  font-size: 0.75rem;
  color: #6b7280;
}
.payment-va__number-box {
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  transition: border-color 0.2s;
}
.payment-va__number-box:hover {
  border-color: #f97316;
}
.payment-va__number-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}
.payment-va__number-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.payment-va__number {
  font-size: 1.35rem;
  font-weight: 800;
  font-family: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
  color: #111827;
  letter-spacing: 0.15em;
}
.payment-va__copy-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #fff7ed, #fed7aa);
  color: #ea580c;
  border: 1px solid rgba(249, 115, 22, 0.2);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.payment-va__copy-btn:hover {
  background: linear-gradient(135deg, #fed7aa, #fdba74);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(249, 115, 22, 0.15);
}
.payment-va__copy-btn--copied {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0) !important;
  color: #15803d !important;
  border-color: rgba(22, 163, 74, 0.2) !important;
}
.payment-va__warning {
  display: flex;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  background: #fffbeb;
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 0.75rem;
  font-size: 0.75rem;
  color: #92400e;
  line-height: 1.5;
}

/* ─── Status Bar ──────────────────────────────────────────── */
.payment-status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  font-size: 0.7rem;
  color: #9ca3af;
  border-top: 1px solid rgba(0,0,0,0.04);
  background: rgba(249, 250, 251, 0.5);
}
.payment-status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.payment-status-dot--checking {
  background: #f97316;
  animation: dot-pulse 1s ease-in-out infinite;
}
.payment-status-dot--idle {
  background: #22c55e;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

/* ─── Instructions ────────────────────────────────────────── */
.payment-instructions {
  border-top: 1px solid rgba(0,0,0,0.04);
}
.payment-instructions__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  background: none;
  border: none;
  transition: background 0.2s;
}
.payment-instructions__toggle:hover {
  background: rgba(0,0,0,0.02);
}
.payment-instructions__toggle-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.payment-instructions__body {
  padding: 0 1.5rem 1.25rem;
}
.payment-instructions__tabs {
  display: flex;
  gap: 0.375rem;
  margin-bottom: 1rem;
  background: #f3f4f6;
  border-radius: 0.625rem;
  padding: 0.25rem;
}
.payment-instructions__tab {
  flex: 1;
  padding: 0.5rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  color: #6b7280;
  background: none;
  transition: all 0.2s;
  white-space: nowrap;
}
.payment-instructions__tab--active {
  background: white;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.payment-instructions__steps {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
.payment-instructions__step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #374151;
  line-height: 1.5;
}
.payment-instructions__step-num {
  width: 22px; height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff7ed, #fed7aa);
  color: #ea580c;
  font-size: 0.65rem;
  font-weight: 800;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1px;
}
.payment-instructions__empty {
  font-size: 0.8rem;
  color: #6b7280;
}

/* ─── Actions ─────────────────────────────────────────────── */
.payment-actions {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  border-top: 1px solid rgba(0,0,0,0.04);
}

/* ─── Buttons ─────────────────────────────────────────────── */
.payment-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border-radius: 0.875rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-decoration: none;
}
.payment-btn--primary {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}
.payment-btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35);
}
.payment-btn--outline {
  background: white;
  color: #ea580c;
  border: 2px solid #f97316;
}
.payment-btn--outline:hover {
  background: #fff7ed;
  transform: translateY(-1px);
}
.payment-btn--outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.payment-btn--ghost {
  background: none;
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.5rem;
}
.payment-btn--ghost:hover {
  color: #374151;
}

/* ─── Trust Badges ────────────────────────────────────────── */
.payment-trust {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.25rem;
  padding: 0 1rem;
}
.payment-trust__item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: #9ca3af;
}
.payment-trust__divider {
  width: 1px;
  height: 14px;
  background: #d1d5db;
}

/* ─── Result States ───────────────────────────────────────── */
.payment-result {
  width: 100%;
}
.payment-result__card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  text-align: center;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 20px 40px -4px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* Confetti */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
  overflow: hidden;
}
.confetti-piece {
  position: absolute;
  top: -20px;
  background-color: var(--confetti-color);
  opacity: 0;
  animation: confetti-fall linear forwards;
}
@keyframes confetti-fall {
  0% { top: -20px; opacity: 1; transform: translateY(0) rotate(0deg); }
  100% { top: 100vh; opacity: 0.5; transform: translateY(100vh) rotate(720deg); }
}

/* Result Icons */
.result-icon {
  position: relative;
  width: 80px; height: 80px;
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.result-icon__bg {
  position: relative;
  z-index: 2;
  width: 64px; height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.3);
  animation: icon-scale-up 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
.result-icon__bg--failed {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.3);
}
@keyframes icon-scale-up {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

.result-icon__check {
  width: 32px; height: 32px;
  color: white;
}
.result-icon__check-path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: check-draw 0.4s ease-out 0.4s forwards;
}
@keyframes check-draw {
  to { stroke-dashoffset: 0; }
}

.result-icon__svg--large {
  width: 36px; height: 36px;
  color: white;
  animation: pop-in 0.4s ease-out 0.3s both;
}
@keyframes pop-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Rings */
.result-icon__pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #22c55e;
  opacity: 0;
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}
.result-icon__pulse-ring--delay {
  animation-delay: 1s;
}
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; border-width: 8px; }
  100% { transform: scale(2.5); opacity: 0; border-width: 1px; }
}

/* Badges */
.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 1rem;
  animation: fade-in-up 0.5s ease-out 0.2s both;
}
.result-badge--success {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
.result-badge--failed {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Typography */
.payment-result__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.25rem;
  animation: fade-in-up 0.5s ease-out 0.3s both;
}
.payment-result__subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  animation: fade-in-up 0.5s ease-out 0.4s both;
}

/* Amount Box */
.result-amount-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  animation: fade-in-up 0.5s ease-out 0.5s both;
}
.result-amount-box--success {
  background: #f0fdf4;
  border-color: #86efac;
}
.result-amount-box__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}
.result-amount-box__value {
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.result-amount-box__value--success { color: #16a34a; }

/* Receipt */
.result-receipt {
  background: #f8fafc;
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  text-align: left;
  border: 1px solid #e2e8f0;
  animation: fade-in-up 0.5s ease-out 0.6s both;
}
.result-receipt--compact {
  padding: 1rem;
}
.result-receipt__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed #cbd5e1;
}
.result-receipt__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.result-receipt__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  color: #64748b;
}
.result-receipt__divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.25rem 0;
}

/* Actions */
.result-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: fade-in-up 0.5s ease-out 0.7s both;
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* ─── Transitions ─────────────────────────────────────────── */
.state-fade-enter-active { animation: state-in 0.5s ease-out; }
.state-fade-leave-active { animation: state-out 0.3s ease-in; }
@keyframes state-in {
  0% { opacity: 0; transform: translateY(20px) scale(0.98); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes state-out {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-10px) scale(0.98); }
}

/* ─── Responsive ──────────────────────────────────────────── */
@media (max-width: 480px) {
  .payment-va__number {
    font-size: 1.05rem;
    letter-spacing: 0.1em;
  }
  .payment-amount__value {
    font-size: 1.5rem;
  }
  .payment-trust {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .payment-trust__divider {
    display: none;
  }
}
</style>
