<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 md:p-6">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative border border-ink-100 flex flex-col max-h-[95vh] md:max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-white shrink-0">
          <div class="flex items-center gap-3">
            <div v-if="activePlatformName" class="w-12 h-12 bg-white border border-ink-100 rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
              <img :src="platformLogo" class="w-7 h-7 object-contain" />
            </div>
            <div>
              <h3 class="font-display font-bold text-ink-900">Pengajuan Akun Iklan Baru</h3>
              <p v-if="activePlatformName" class="text-xs text-ink-500">Lengkapi formulir pendaftaran untuk {{ activePlatformName }}</p>
              <p v-else class="text-xs text-ink-500">Pilih platform iklan yang ingin Anda tambahkan</p>
            </div>
          </div>
          <button @click="closeModal" class="text-ink-400 hover:text-ink-600 transition-colors bg-ink-50 p-2 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="p-6 overflow-y-auto bg-ink-50/50">
          <!-- Step 1: Pilih Platform -->
          <div v-if="step === 1" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button @click="selectPlatform('Meta Ads')" class="bg-white border border-ink-200 p-6 rounded-xl hover:border-orange-500 hover:shadow-md transition-all text-center flex flex-col items-center gap-4">
              <img src="/icon-meta-ads.png" class="w-12 h-12 object-contain" />
              <span class="font-bold text-ink-900">Meta Ads</span>
            </button>
            <button @click="selectPlatform('Google Ads')" class="bg-white border border-ink-200 p-6 rounded-xl hover:border-orange-500 hover:shadow-md transition-all text-center flex flex-col items-center gap-4">
              <img src="/icon-google-ads.png" class="w-12 h-12 object-contain" />
              <span class="font-bold text-ink-900">Google Ads</span>
            </button>
            <button disabled class="relative bg-white border border-ink-200 p-6 rounded-xl text-center flex flex-col items-center gap-4 opacity-70 cursor-not-allowed overflow-hidden group">
              <div class="absolute inset-0 bg-ink-900/5 flex flex-col items-center justify-center backdrop-blur-[2px] z-10 transition-all">
                <span class="bg-ink-900 text-white text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg transform -rotate-12 group-hover:scale-110 transition-transform">Coming Soon</span>
              </div>
              <img src="/tiktok.svg" class="w-12 h-12 object-contain grayscale" />
              <span class="font-bold text-ink-900">TikTok Ads</span>
            </button>
          </div>

          <!-- Step 2: Form -->
          <form v-else-if="step === 2" id="requestAdForm" @submit.prevent="step = 3" class="space-y-8">
            
            <!-- Section 1: Informasi Detail -->
            <div class="bg-white p-6 rounded-xl border border-ink-200 shadow-sm space-y-5">
              <h4 class="font-bold text-ink-900 text-lg mb-4">Informasi detail</h4>
              
              <div>
                <label class="block text-sm font-bold text-ink-900 mb-2">Nama lengkap (sesuai KTP) <span class="text-red-500">*</span></label>
                <input v-model="form.fullName" type="text" required placeholder="Masukkan nama lengkap sesuai di KTP" class="w-full px-4 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900" />
              </div>

              <div>
                <label class="block text-sm font-bold text-ink-900 mb-2">
                  <template v-if="activePlatformName.includes('Google')">Shared Email</template>
                  <template v-else>ID {{ activePlatformName.includes('TikTok') ? 'Business Center' : 'Business Manager' }}</template>
                  <span class="text-red-500">*</span>
                </label>
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input v-model="form.bmId" :type="activePlatformName.includes('Google') ? 'email' : 'text'" required :placeholder="activePlatformName.includes('Google') ? 'Masukkan Shared Email' : 'Masukkan ID ' + (activePlatformName.includes('TikTok') ? 'Business Center' : 'Business Manager')" class="w-full sm:flex-1 px-4 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900" />
                  <button v-if="!activePlatformName.includes('Google')" type="button" @click="showInstructionBm = true" class="text-sm font-semibold text-orange-500 hover:text-orange-600 whitespace-nowrap text-left transition-colors">Lihat cara mendapatkan ID {{ activePlatformName.includes('TikTok') ? 'Business Center' : 'Business Manager' }}</button>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-ink-900 mb-2">Kategori Bisnis <span class="text-red-500">*</span></label>
                <select v-model="form.adCategory" required class="w-full px-4 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 bg-white">
                  <option value="" disabled>— Pilih kategori —</option>
                  <option value="UMKM">UMKM</option>
                  <option value="Produk Kecantikan">Produk Kecantikan</option>
                  <option value="Kesehatan">Kesehatan</option>
                  <option value="Konsultan Pendidikan">Konsultan Pendidikan</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div v-if="activePlatformName.includes('Meta')">
                <label class="block text-sm font-bold text-ink-900 mb-2">Link Instagram / Facebook Page <span class="text-red-500">*</span></label>
                <input 
                  v-model="form.socialLink" 
                  @blur="formatSocialUrl"
                  type="url" 
                  required 
                  placeholder="https://instagram.com/akunbisnis" 
                  class="w-full px-4 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900" 
                />
              </div>

              <div>
                <label class="block text-sm font-bold text-ink-900 mb-2">Target Website (URL) <span v-if="!activePlatformName.includes('Meta')" class="text-red-500">*</span><span v-else class="text-ink-400 font-normal ml-1">(Opsional)</span></label>
                <input 
                  v-model="form.targetUrl" 
                  @blur="formatUrl"
                  type="url" 
                  :required="!activePlatformName.includes('Meta')" 
                  placeholder="https://domain-anda.com" 
                  class="w-full px-4 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900" 
                />
              </div>
            </div>

            <!-- Section 2: Keamanan 2FA -->
            <div class="bg-white p-6 rounded-xl border border-ink-200 shadow-sm space-y-4">
              <h4 class="font-bold text-ink-900 text-lg mb-2">Keamanan Two Factor Authentication (2FA)</h4>
              <p class="text-sm text-ink-700 leading-relaxed bg-ink-50 p-4 rounded-lg border border-ink-100">
                Autentikasi Dua Faktor (2FA) adalah proses yang meminta pengguna untuk membuktikan identitas mereka dengan dua cara berbeda sebelum bisa masuk ke sistem. Misalnya masuk menggunakan alamat email atau nomor telepon, lalu memasukkan kata sandi atau pin yang benar.
              </p>
              
              <div class="space-y-3 mt-4">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" v-model="form.agree2fa1" required class="mt-1 w-4 h-4 text-orange-500 border-ink-300 rounded focus:ring-orange-500 shrink-0" />
                  <span class="text-sm text-ink-600 group-hover:text-ink-900 transition-colors">Saya menyadari apabila ada admin yang tidak mengaktifkan 2FA dan melakukan kelalaian sehingga menyebabkan akun terkena hack, maka saldo iklan yang digunakan oleh hacker tidak dapat dikembalikan oleh meta/ditinjau ulang oleh platform.</span>
                </label>
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" v-model="form.agree2fa2" required class="mt-1 w-4 h-4 text-orange-500 border-ink-300 rounded focus:ring-orange-500 shrink-0" />
                  <span class="text-sm text-ink-600 group-hover:text-ink-900 transition-colors">Segala keputusan baliknya saldo akibat kejadian hack sepenuhnya berada di pihak platform (Meta/Google/TikTok).</span>
                </label>
              </div>
            </div>

            <!-- Section 3: Kebijakan Platform -->
            <div class="bg-white p-6 rounded-xl border border-ink-200 shadow-sm space-y-4">
              <h4 class="font-bold text-ink-900 text-lg mb-2">Kebijakan {{ activePlatformName.includes('Meta') ? 'Facebook' : activePlatformName }}</h4>
              <div class="bg-ink-50 p-4 rounded-lg border border-ink-100">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" v-model="form.agreePolicy" required class="mt-1 w-4 h-4 text-orange-500 border-ink-300 rounded focus:ring-orange-500 shrink-0" />
                  <span class="text-sm text-ink-600 group-hover:text-ink-900 transition-colors">Saya memahami dan setuju dengan segala kebijakan platform. Saya bersedia menanggung segala resiko jika terjadi pelanggaran terhadap kebijakan platform tersebut.</span>
                </label>
              </div>
            </div>

            <!-- Section 4: Syarat dan Ketentuan -->
            <div class="bg-white p-6 rounded-xl border border-ink-200 shadow-sm space-y-4">
              <h4 class="font-bold text-ink-900 text-lg mb-2">Syarat dan Ketentuan</h4>
              
              <div class="bg-ink-50 border border-ink-200 rounded-lg p-4 h-64 overflow-y-auto text-xs text-ink-700 space-y-4 custom-scrollbar">
                <div class="space-y-2">
                  <h5 class="font-bold text-sm">1. Definisi</h5>
                  <p>1.1 "Ads Account" berarti akun iklan milik Tentaklik yang bersifat whitelisted pada Platform Pengiklanan Digital yang akan diberikan akses kepada Anda sehubungan dengan penggunaan Whitelisted Account Support.</p>
                  <p>1.2 "Ad Credit" berarti saldo yang tertampung pada Ads Account yang disediakan Tentaklik kepada Anda sesuai sejumlah Dana Top-Up yang dapat digunakan untuk melakukan kegiatan pengiklanan pada Platform Pengiklanan Digital.</p>
                  <p>1.3 "Dana Top-Up" berarti sejumlah dana yang dibayarkan oleh Anda sehubungan dengan penggunaan Whitelisted Account Support yang akan ditampung dan menjadi saldo Ad Credit Anda.</p>
                  <p>1.4 "Platform Pengiklanan Digital" berarti platform online yang dapat Anda gunakan untuk melakukan kegiatan pengiklanan dengan menggunakan Ads Account sehubungan dengan Whitelisted Account Support, yaitu Meta, Google, TikTok, dan/atau platform lainnya.</p>
                  <p>1.5 "Whitelisted Account Support" berarti layanan dukungan kegiatan pengiklanan pada Platform Pengiklanan Digital dengan menggunakan Ads Account yang disediakan oleh Tentaklik kepada Anda.</p>
                  <p>1.6 "CPAS (Facebook Collaborative Ads)" berarti menghubungkan layanan Akun Iklan dengan marketplace, yang memungkinkan pelaksanaan iklan menggunakan katalog dan penargetan audien berdasarkan data kunjungan pada marketplace, sesuai dengan persyaratan dan kebijakan platform terkait.</p>
                </div>

                <div class="space-y-2">
                  <h5 class="font-bold text-sm">2. Layanan Tentaklik Ads Service</h5>
                  <p class="font-semibold">2.1 Ruang Lingkup Layanan</p>
                  <ul class="list-disc pl-4 space-y-1">
                    <li>Tentaklik akan menyediakan layanan periklanan sesuai dengan service yang tersedia di Tentaklik.</li>
                    <li>Layanan Tentaklik mencakup, namun tidak terbatas pada: Penyediaan fasilitas top up otomatis 24 jam untuk platform Facebook dan Google.</li>
                    <li>Penyediaan review konten iklan sesuai dengan standar beriklan Tentaklik yang didalamnya termasuk syarat dan ketentuan Platform Digital Beriklan.</li>
                    <li>User akan mendapatkan Ads Account sejumlah maksimal 1 (satu) pada awal penggunaan Layanan. Tentaklik berhak menambahkan jumlah akun Ads Account Anda secara bertahap berdasarkan pertimbangan sepihak.</li>
                    <li>Memberikan support atas tambahan akun iklan maupun business manager yang dibutuhkan oleh user sesuai dengan persetujuan tim Tentaklik.</li>
                    <li>Meregulasi iklan user dimana termasuk dalam kegiatan penutupan/pemberhentian campaign/account iklan dari user bila ditemukan pelanggaran iklan.</li>
                  </ul>
                  <p class="font-semibold mt-2">2.2 Persetujuan Layanan Tentaklik Ads Service</p>
                  <p>Dengan mendaftar pada platform Tentaklik menandakan user telah setuju dengan seluruh S&K beriklan menggunakan Layanan Tentaklik Ads Service.</p>
                </div>

                <div class="space-y-2">
                  <h5 class="font-bold text-sm">3. Tanggung Jawab Tentaklik</h5>
                  <p>Tentaklik berkomitmen memastikan iklan yang berjalan di bawah akun milik Tentaklik sesuai dengan standar Tentaklik yang didalamnya termasuk dalam syarat dan ketentuan Platform Digital Beriklan. Jika Ads Account yang telah diberikan kepada Anda teregulasi bukan disebabkan oleh pelanggaran Anda, maka Tentaklik akan memberikan Ads Account pengganti secara langsung.</p>
                </div>

                <div class="space-y-2">
                  <h5 class="font-bold text-sm">6. Biaya dan Ketentuan Pembayaran</h5>
                  <p class="font-semibold">a. Management Fee</p>
                  <p>Anda berkewajiban untuk membayarkan "Management Fee" kepada Tentaklik sebesar: Platform Facebook (4%) dan Platform Google (3%). Pembayaran atas Management Fee akan dilakukan dengan pemotongan langsung dari jumlah Dana Top-Up Anda.</p>
                  <p class="font-semibold mt-2">b. Biaya Akun</p>
                  <p>Anda wajib membayarkan "Biaya Akun" kepada Tentaklik pada setiap bulannya, untuk setiap Ads Account yang digunakan. Besar Biaya Akun adalah Rp 555.000,- per akun per bulan termasuk PPN.</p>
                </div>
              </div>
              
              <label class="flex items-start gap-3 cursor-pointer group mt-4 bg-orange-50 p-4 rounded-xl border border-orange-200">
                <input type="checkbox" v-model="form.agreeTc" required class="mt-1 w-5 h-5 text-orange-500 border-orange-300 rounded focus:ring-orange-500 shrink-0" />
                <span class="text-sm font-bold text-orange-900 group-hover:text-orange-700 transition-colors">Saya menyetujui Syarat dan Ketentuan yang berlaku. Apabila saya melanggar peraturan ini, saya bersedia menerima segala konsekuensi yang berlaku.</span>
              </label>
            </div>

          </form>

          <!-- Step 3: Pilih Durasi Sewa -->
          <div v-else-if="step === 3" class="space-y-6 max-w-2xl mx-auto py-4">
            <div class="text-center mb-6">
              <h4 class="font-bold text-xl text-ink-900 mb-2">Pilih Durasi Sewa Akun</h4>
              <p class="text-ink-500 text-sm">Pilih masa aktif untuk akun iklan Anda sebelum mengajukan pembuatan akun.</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- 1 Bulan -->
              <div @click="form.subscriptionMonths = 1; form.rentalFee = 150000" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all text-center', form.subscriptionMonths === 1 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <h5 class="font-bold text-ink-900 mb-1">1 Bulan</h5>
                <p class="text-2xl font-bold text-orange-600 mb-2">Rp 150.000</p>
                <p class="text-xs text-ink-500">Normal</p>
              </div>
              
              <!-- 3 Bulan -->
              <div @click="form.subscriptionMonths = 3; form.rentalFee = 350000" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all relative text-center', form.subscriptionMonths === 3 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <div class="absolute -top-3 inset-x-0 flex justify-center"><span class="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Hemat 22%</span></div>
                <h5 class="font-bold text-ink-900 mb-1 mt-1">3 Bulan</h5>
                <p class="text-2xl font-bold text-orange-600 mb-2">Rp 350.000</p>
                <p class="text-xs text-ink-500 line-through">Rp 450.000</p>
              </div>
              
              <!-- 6 Bulan -->
              <div @click="form.subscriptionMonths = 6; form.rentalFee = 792000" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all relative text-center', form.subscriptionMonths === 6 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <div class="absolute -top-3 inset-x-0 flex justify-center"><span class="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Hemat 12%</span></div>
                <h5 class="font-bold text-ink-900 mb-1 mt-1">6 Bulan</h5>
                <p class="text-2xl font-bold text-orange-600 mb-2">Rp 792.000</p>
                <p class="text-xs text-ink-500 line-through">Rp 900.000</p>
              </div>
            </div>

            <div class="mt-8">
              <label class="block text-sm font-medium text-ink-700 mb-2">Metode Pembayaran</label>
              <div class="relative">
                <select v-model="form.paymentMethod" class="w-full appearance-none pl-4 pr-10 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-sm transition-all cursor-pointer">
                  <optgroup label="Virtual Account">
                    <option value="BC">BCA Virtual Account</option>
                    <option value="BM">Mandiri Virtual Account</option>
                    <option value="BR">BRI Virtual Account</option>
                  </optgroup>
                  <optgroup label="E-Wallet & Retail">
                    <option value="OV">OVO</option>
                    <option value="SA">ShopeePay App</option>
                    <option value="DA">DANA</option>
                    <option value="SP">QRIS</option>
                  </optgroup>
                </select>
                <svg class="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 bg-white flex justify-end gap-3 border-t border-ink-100 shrink-0">
          <button @click="goBack" type="button" class="px-6 py-2.5 bg-white border border-ink-200 text-ink-700 hover:bg-ink-50 font-bold rounded-xl text-sm transition-colors shadow-sm">
            {{ step > 1 ? 'Kembali' : 'Batal' }}
          </button>
          
          <button 
            v-if="step === 2"
            type="submit"
            form="requestAdForm"
            :disabled="!isFormValid" 
            class="px-8 py-2.5 bg-orange-500 border border-orange-500 text-white hover:bg-orange-600 font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Lanjutkan
          </button>

          <button 
            v-if="step === 3"
            @click="submitPayment"
            :disabled="isSubmitting" 
            class="px-8 py-2.5 bg-orange-500 border border-orange-500 text-white hover:bg-orange-600 font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ isSubmitting ? 'Memproses...' : 'Bayar Sekarang' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal Instruksi -->
  <ModalInstructionBmModal v-model="showInstructionBm" :platformName="activePlatformName" />
</template>

<script setup lang="ts">
import { X, MonitorPlay } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  platformName?: string
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const toast = useToast()
const supabase = useSupabaseClient()
const { user } = useAuth()

const activePlatformName = ref(props.platformName || '')
const step = ref(props.platformName ? 2 : 1)

watch(() => props.platformName, (newVal) => {
  activePlatformName.value = newVal || ''
  step.value = newVal ? 2 : 1
})

const selectPlatform = (name: string) => {
  activePlatformName.value = name
  step.value = 2
}

const goBack = () => {
  if (step.value === 3) {
    step.value = 2
  } else if (step.value === 2 && !props.platformName) {
    step.value = 1
    activePlatformName.value = ''
  } else {
    closeModal()
  }
}

const isSubmitting = ref(false)
const showInstructionBm = ref(false)

const form = reactive({
  fullName: '',
  bmId: '',
  adCategory: '',
  targetUrl: '',
  socialLink: '',
  agree2fa1: false,
  agree2fa2: false,
  agreePolicy: false,
  agreeTc: false,
  subscriptionMonths: 1,
  rentalFee: 150000,
  paymentMethod: 'OV'
})

const platformLogo = computed(() => {
  if (activePlatformName.value.includes('Meta')) return '/icon-meta-ads.png'
  if (activePlatformName.value.includes('TikTok')) return '/tiktok.svg'
  if (activePlatformName.value.includes('Google')) return '/icon-google-ads.png'
  return '/icon-meta-ads.png'
})

const isFormValid = computed(() => {
  const isUrlValid = activePlatformName.value.includes('Meta') ? true : form.targetUrl.trim() !== ''
  const isSocialValid = activePlatformName.value.includes('Meta') ? form.socialLink.trim() !== '' : true

  return form.fullName.trim() !== '' && 
         form.bmId.trim() !== '' && 
         form.adCategory !== '' &&
         isUrlValid &&
         isSocialValid &&
         form.agree2fa1 && 
         form.agree2fa2 &&
         form.agreePolicy &&
         form.agreeTc
})

const closeModal = () => {
  emit('update:modelValue', false)
  // Reset form
  setTimeout(() => {
    form.fullName = ''
    form.bmId = ''
    form.adCategory = ''
    form.targetUrl = ''
    form.socialLink = ''
    form.agree2fa1 = false
    form.agree2fa2 = false
    form.agreePolicy = false
    form.agreeTc = false
  }, 300)
}

const formatUrl = () => {
  let url = form.targetUrl.trim()
  if (url && !/^https?:\/\//i.test(url)) {
    form.targetUrl = 'https://' + url
  }
}

const formatSocialUrl = () => {
  let url = form.socialLink.trim()
  if (url && !/^https?:\/\//i.test(url)) {
    form.socialLink = 'https://' + url
  }
}

const submitPayment = async () => {
  if (!isFormValid.value) return
  
  isSubmitting.value = true
  
  try {
    const uid = (user.value as any)?.id || (user.value as any)?.sub
    if (!uid) throw new Error('User tidak ditemukan. Silakan login kembali.')
    const email = (user.value as any)?.email
    const meta = (user.value as any)?.user_metadata || {}

    let dbPlatform = 'Meta Ads'
    if (activePlatformName.value.includes('TikTok')) dbPlatform = 'TikTok Ads'
    if (activePlatformName.value.includes('Google')) dbPlatform = 'Google Ads'
    
    // 1. Catat ke tabel ad_account_requests
    const requestPayload = {
      userId: uid,
      platform: dbPlatform,
      accountName: form.fullName,
      targetUrl: form.targetUrl,
      subscriptionMonths: form.subscriptionMonths,
      rentalFee: form.rentalFee,
      details: {
        full_name: form.fullName,
        ...(activePlatformName.value.includes('Google') ? { shared_email: form.bmId } : { bm_id: form.bmId }),
        ...(activePlatformName.value.includes('Meta') ? { social_link: form.socialLink } : {}),
        ad_category: form.adCategory
      }
    }
    
    const requestResponse = await $fetch<any>('/api/ads/request', {
      method: 'POST',
      body: requestPayload
    })

    if (!requestResponse || !requestResponse.requestId) {
      throw new Error('Gagal mencatat pengajuan')
    }

    // 2. Buat Payment Duitku
    const paymentResponse = await $fetch<any>('/api/duidku/create-subscription', {
      method: 'POST',
      body: {
        requestId: requestResponse.requestId,
        amount: form.rentalFee,
        method: form.paymentMethod,
        userId: uid,
        userEmail: email,
        userName: meta.full_name || form.fullName,
        userPhone: meta.phone || '0800000000'
      }
    })

    if (paymentResponse && paymentResponse.paymentUrl) {
      // Redirect ke Duitku
      window.location.href = paymentResponse.paymentUrl
    } else {
      throw new Error('Gagal mendapatkan link pembayaran')
    }
    
  } catch (err: any) {
    toast.addToast(err.message || err.data?.statusMessage || 'Gagal memproses pembayaran.', 'error')
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9; 
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
</style>
