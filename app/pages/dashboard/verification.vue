<template>
  <div class="max-w-7xl mx-auto space-y-8 pb-12">
    <!-- Intro State -->
    <div v-if="currentStep === 'intro'" class="space-y-8">
      <div>
        <h1 class="text-2xl font-display font-bold text-ink-900">{{ $t('verification.title') }}</h1>
        <p class="text-ink-500 text-sm mt-1">{{ $t('verification.subtitle') }}</p>
      </div>

      <!-- Banner Section -->
      <div class="bg-gradient-to-br from-orange-50 to-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-orange-100 relative overflow-hidden shadow-sm">
        <!-- Decorative background elements -->
        <div class="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div class="absolute bottom-0 right-1/4 w-48 h-48 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

        <div class="z-10 relative flex-1 space-y-6">
          <h2 class="text-2xl md:text-3xl font-display font-bold text-ink-900 leading-tight">{{ $t('verification.benefitsTitle') }}</h2>
          
          <ul class="space-y-4">
            <li class="flex items-start gap-3 text-ink-700">
              <CheckCircle2 class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <span class="font-medium">{{ $t('verification.benefit1') }}</span>
            </li>
            <li class="flex items-start gap-3 text-ink-700">
              <CheckCircle2 class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <span class="font-medium">{{ $t('verification.benefit2') }}</span>
            </li>
            <li class="flex items-start gap-3 text-ink-700">
              <CheckCircle2 class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <span class="font-medium">{{ $t('verification.benefit3') }}</span>
            </li>
            <li class="flex items-start gap-3 text-ink-700">
              <CheckCircle2 class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <span class="font-medium">{{ $t('verification.benefit4') }}</span>
            </li>
          </ul>

          <p class="text-orange-600 font-bold text-sm">{{ $t('verification.moreBenefits') }}</p>

          <div class="pt-2">
            <button @click="currentStep = 1" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-orange-500/20 transition-all w-full md:w-auto">
              Verifikasi Sekarang
            </button>
          </div>
        </div>

        <!-- Illustration -->
        <div class="w-full md:w-1/3 hidden md:flex justify-center z-10">
          <div class="relative w-56 h-56 flex items-center justify-center">
            <div class="absolute inset-0 bg-orange-100 rounded-full animate-pulse"></div>
            <div class="absolute inset-4 bg-orange-200 rounded-full"></div>
            <div class="relative bg-white p-6 rounded-2xl shadow-xl shadow-orange-500/10 rotate-3 border border-orange-50">
              <ScanFace class="w-20 h-20 text-orange-500" />
              <div class="absolute -bottom-4 -right-4 bg-green-500 text-white p-2 rounded-full border-4 border-white shadow-sm">
                <ShieldCheck class="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Steps Section -->
      <div class="pt-8">
        <h3 class="text-lg font-bold text-ink-900 mb-6 font-display">{{ $t('verification.stepsTitle') }}</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Step 1 -->
          <div class="bg-white border border-ink-100 rounded-2xl p-6 text-center relative shadow-sm">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink-900 text-white w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shadow-sm">1</div>
            <div class="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
              <FileText class="w-8 h-8" />
            </div>
            <h4 class="font-bold text-ink-900 mb-2">{{ $t('verification.step1Title') }}</h4>
            <p class="text-sm text-ink-500 leading-relaxed">{{ $t('verification.step1Desc') }}</p>
          </div>
          
          <!-- Step 2 -->
          <div class="bg-white border border-ink-100 rounded-2xl p-6 text-center relative shadow-sm">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink-900 text-white w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shadow-sm">2</div>
            <div class="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
              <ClipboardCheck class="w-8 h-8" />
            </div>
            <h4 class="font-bold text-ink-900 mb-2">{{ $t('verification.step2Title') }}</h4>
            <p class="text-sm text-ink-500 leading-relaxed">{{ $t('verification.step2Desc') }}</p>
          </div>
          
          <!-- Step 3 -->
          <div class="bg-white border border-ink-100 rounded-2xl p-6 text-center relative shadow-sm">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink-900 text-white w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shadow-sm">3</div>
            <div class="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
              <ShieldCheck class="w-8 h-8 ml-1" />
            </div>
            <h4 class="font-bold text-ink-900 mb-2">{{ $t('verification.step3Title') }}</h4>
            <p class="text-sm text-ink-500 leading-relaxed">{{ $t('verification.step3Desc') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Wizard Form State -->
    <div v-else>
      <div class="max-w-5xl mx-auto mb-6">
        <div class="flex items-center justify-between text-xs font-bold text-ink-500 mb-2">
          <span>{{ $t('verification.stepOf', { current: currentStep }) }}</span>
          <span>{{ Math.round((Number(currentStep) / 3) * 100) }}%</span>
        </div>
        <div class="w-full h-2 bg-ink-100 rounded-full overflow-hidden">
          <div class="h-full bg-orange-500 rounded-full transition-all duration-500" :style="{ width: `${(Number(currentStep) / 3) * 100}%` }"></div>
        </div>
      </div>
    </div>
    <div v-if="currentStep !== 'intro'" class="flex flex-col md:flex-row gap-8 lg:gap-12 max-w-5xl mx-auto">
      
      <!-- Stepper Sidebar -->
      <div class="w-full md:w-64 shrink-0 md:border-r border-ink-100 md:pr-8 py-4">
        <div class="space-y-8 relative hidden md:block">
          <!-- Vertical Line -->
          <div class="absolute top-4 bottom-4 left-[15px] w-px bg-ink-200 z-0"></div>
          
          <!-- Step 1 Indicator -->
          <div class="relative z-10 flex items-center gap-4">
            <div :class="currentStep >= 1 ? 'border-orange-500 bg-white text-orange-500' : 'border-ink-200 bg-ink-50 text-ink-400'" class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-sm transition-colors">1</div>
            <span :class="currentStep === 1 ? 'font-bold text-orange-500' : 'font-medium text-ink-700'">{{ $t('verification.step1HeaderTitle') }}</span>
          </div>
          
          <!-- Step 2 Indicator -->
          <div class="relative z-10 flex items-center gap-4">
            <div :class="currentStep >= 2 ? 'border-orange-500 bg-white text-orange-500' : 'border-ink-200 bg-ink-50 text-ink-400'" class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors">2</div>
            <span :class="currentStep === 2 ? 'font-bold text-orange-500' : 'font-medium text-ink-700'">{{ $t('verification.step2Title') }}</span>
          </div>
          
          <!-- Step 3 Indicator -->
          <div class="relative z-10 flex items-center gap-4">
            <div :class="currentStep >= 3 ? 'border-orange-500 bg-white text-orange-500' : 'border-ink-200 bg-ink-50 text-ink-400'" class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors">3</div>
            <span :class="currentStep === 3 ? 'font-bold text-orange-500' : 'font-medium text-ink-400'">{{ $t('verification.sidebarStep3') }}</span>
          </div>
        </div>

        <!-- Mobile Stepper (Horizontal) -->
        <div class="flex md:hidden justify-between relative px-2">
           <div class="absolute top-4 left-4 right-4 h-px bg-ink-200 z-0"></div>
           <div class="relative z-10 flex flex-col items-center gap-2">
             <div class="w-8 h-8 rounded-full border-2 border-orange-500 bg-white text-orange-500 flex items-center justify-center font-bold text-sm">1</div>
             <span class="text-xs font-bold text-orange-500">{{ $t('verification.mobileStep1') }}</span>
           </div>
           <div class="relative z-10 flex flex-col items-center gap-2">
             <div :class="currentStep >= 2 ? 'border-orange-500 bg-white text-orange-500' : 'border-ink-200 bg-ink-50 text-ink-400'" class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm">2</div>
             <span :class="currentStep >= 2 ? 'text-orange-500' : 'text-ink-400'" class="text-xs font-medium">{{ $t('verification.step2Title') }}</span>
           </div>
           <div class="relative z-10 flex flex-col items-center gap-2">
             <div :class="currentStep >= 3 ? 'border-orange-500 bg-white text-orange-500' : 'border-ink-200 bg-ink-50 text-ink-400'" class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm">3</div>
             <span :class="currentStep >= 3 ? 'text-orange-500' : 'text-ink-400'" class="text-xs font-medium">{{ $t('verification.mobileStep3') }}</span>
           </div>
        </div>
      </div>

      <!-- Step 1 Content -->
      <div v-if="currentStep === 1" class="flex-1">
        <!-- Form Header -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-ink-900 mb-1">{{ $t('verification.step1HeaderTitle') }}</h2>
          <p class="text-ink-500 text-sm">{{ $t('verification.step1HeaderDesc') }}</p>
        </div>

        <!-- Form Box -->
        <div class="bg-white border border-ink-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
          
          <!-- Foto KTP Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4">
            <!-- {{ $t('verification.uploadKtpBtn') }} -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1">{{ $t('verification.uploadKtpLabel') }}</label>
              <p class="text-xs text-ink-500 mb-3">Format: PNG/JPG (Maks 5 MB)</p>
              <div v-if="!selectedKTP">
                <label class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-md text-sm transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer w-full justify-center">
                  <Upload class="w-4 h-4" /> {{ $t('verification.uploadKtpBtn') }}
                  <input type="file" accept="image/png, image/jpeg, image/jpg" class="hidden" @change="handleFileUpload($event, 'ktp')" />
                </label>
              </div>
              <div v-else class="flex flex-col items-start gap-3">
                <div class="flex items-center gap-3 px-4 py-3 rounded-lg border w-full transition-colors" 
                     :class="isScanning ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'">
                  <Loader2 v-if="isScanning" class="w-5 h-5 text-orange-500 shrink-0 animate-spin" />
                  <CheckCircle2 v-else class="w-5 h-5 text-green-500 shrink-0" />
                  <span class="text-sm font-medium truncate">{{ isScanning ? $t('verification.scanningOcr') : selectedKTP.name }}</span>
                </div>
                <label v-if="!isScanning" class="text-orange-500 hover:text-orange-600 font-bold text-sm cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                  <Upload class="w-4 h-4" /> {{ $t('verification.changeBtn') }}
                  <input type="file" accept="image/png, image/jpeg, image/jpg" class="hidden" @change="handleFileUpload($event, 'ktp')" />
                </label>
              </div>
            </div>

            <!-- {{ $t('verification.uploadPasPhotoBtn') }} -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1">{{ $t('verification.uploadPasPhotoLabel') }}</label>
              <p class="text-xs text-ink-500 mb-3">Format: PNG/JPG (Maks 5 MB)</p>
              <div v-if="!selectedPasPhoto">
                <label class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-md text-sm transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer w-full justify-center">
                  <Upload class="w-4 h-4" /> {{ $t('verification.uploadPasPhotoBtn') }}
                  <input type="file" accept="image/png, image/jpeg, image/jpg" class="hidden" @change="handleFileUpload($event, 'pasphoto')" />
                </label>
              </div>
              <div v-else class="flex flex-col items-start gap-3">
                <div class="flex items-center gap-3 px-4 py-3 rounded-lg border w-full bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 class="w-5 h-5 text-green-500 shrink-0" />
                  <span class="text-sm font-medium truncate">{{ selectedPasPhoto.name }}</span>
                </div>
                <label class="text-orange-500 hover:text-orange-600 font-bold text-sm cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                  <Upload class="w-4 h-4" /> {{ $t('verification.changeBtn') }}
                  <input type="file" accept="image/png, image/jpeg, image/jpg" class="hidden" @change="handleFileUpload($event, 'pasphoto')" />
                </label>
              </div>
            </div>
          </div>

          <div class="space-y-5">
            <!-- Nama -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1">{{ $t('verification.nameLabel') }} <span class="text-ink-400 font-normal">{{ $t('verification.nameNote') }}</span></label>
              <input v-model="formData.name" type="text" class="w-full border border-ink-200 rounded-md px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white" />
            </div>

            <!-- NIK -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1">{{ $t('verification.nikLabel') }}</label>
              <input v-model="formData.nik" type="text" maxlength="20" class="w-full border rounded-md px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-1 bg-white transition-colors" :class="isNikValid ? 'border-ink-200 focus:border-orange-500 focus:ring-orange-500' : 'border-red-500 focus:border-red-500 focus:ring-red-500'" />
              <p v-if="!isNikValid" class="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><AlertCircle class="w-3 h-3"/> {{ $t('verification.nikError') }}</p>
            </div>

            <!-- Tanggal Lahir -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1">{{ $t('verification.dobLabel') }} <span class="text-ink-400 font-normal">{{ $t('verification.dobNote') }}</span></label>
              <input v-model="formData.dob" @input="handleDobInput" type="text" maxlength="10" class="w-full border rounded-md px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-1 bg-white transition-colors" :class="isDobValid ? 'border-ink-200 focus:border-orange-500 focus:ring-orange-500' : 'border-red-500 focus:border-red-500 focus:ring-red-500'" placeholder="DD-MM-YYYY" />
              <p v-if="!isDobValid" class="text-xs text-red-500 mt-1 font-medium flex items-center gap-1"><AlertCircle class="w-3 h-3"/> {{ $t('verification.dobError') }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <!-- Email (Disabled) -->
              <div>
                <label class="block text-sm font-bold text-ink-900 mb-1">{{ $t('verification.emailLabel') }} <span class="text-ink-400 font-normal">{{ $t('verification.emailNote') }}</span></label>
                <input type="text" :value="user?.email" disabled class="w-full border border-ink-100 rounded-md px-3 py-2.5 text-sm text-ink-500 bg-ink-50 cursor-not-allowed" />
              </div>

              <!-- Nomor HP (Disabled) -->
              <div>
                <label class="block text-sm font-bold text-ink-900 mb-1">{{ $t('verification.phoneLabel') }} <span class="text-ink-400 font-normal">{{ $t('verification.phoneNote') }}</span></label>
                <input type="text" :value="userPhone" disabled class="w-full border border-ink-100 rounded-md px-3 py-2.5 text-sm text-ink-500 bg-ink-50 cursor-not-allowed" />
              </div>
            </div>
          </div>
          
        </div>
        
        <div class="flex justify-end mt-6 gap-3">
          <button @click="currentStep = 'intro'" class="bg-white text-ink-500 font-bold py-3 px-6 rounded-lg text-sm hover:bg-ink-50 border border-ink-200 transition-all">{{ $t('verification.cancelBtn') }}</button>
          <button @click="currentStep = 2" :disabled="!isFormValid" class="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg text-sm hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Selanjutnya
          </button>
        </div>
      </div>
      
      <!-- Step 2: Ringkasan -->
      <div v-else-if="currentStep === 2" class="flex-1">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-ink-900 mb-1">{{ $t('verification.step2HeaderTitle') }}</h2>
          <p class="text-ink-500 text-sm">{{ $t('verification.step2HeaderDesc') }}</p>
        </div>

        <div class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-sm">
          <div class="p-6 border-b border-ink-50 bg-ink-50/50">
            <h3 class="font-bold text-ink-900 flex items-center gap-2"><User class="w-5 h-5 text-orange-500" /> {{ $t('verification.personalInfo') }}</h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-3 border-b border-ink-50 pb-4">
              <span class="col-span-1 text-ink-500 text-sm font-medium">{{ $t('verification.fullName') }}</span>
              <span class="col-span-2 text-ink-900 text-sm font-bold">{{ formData.name }}</span>
            </div>
            <div class="grid grid-cols-3 border-b border-ink-50 pb-4">
              <span class="col-span-1 text-ink-500 text-sm font-medium">{{ $t('verification.nikLabel') }}</span>
              <span class="col-span-2 text-ink-900 text-sm font-bold">{{ formData.nik }}</span>
            </div>
            <div class="grid grid-cols-3 border-b border-ink-50 pb-4">
              <span class="col-span-1 text-ink-500 text-sm font-medium">Tanggal Lahir</span>
              <span class="col-span-2 text-ink-900 text-sm font-bold">{{ formData.dob }}</span>
            </div>
            <div class="grid grid-cols-3 border-b border-ink-50 pb-4">
              <span class="col-span-1 text-ink-500 text-sm font-medium">Email</span>
              <span class="col-span-2 text-ink-900 text-sm font-bold">{{ user?.email }}</span>
            </div>
            <div class="grid grid-cols-3">
              <span class="col-span-1 text-ink-500 text-sm font-medium">Nomor WhatsApp</span>
              <span class="col-span-2 text-ink-900 text-sm font-bold">{{ userPhone }}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-6 gap-3">
          <button @click="currentStep = 1" class="bg-white text-ink-500 font-bold py-3 px-6 rounded-lg text-sm hover:bg-ink-50 border border-ink-200 transition-all">{{ $t('verification.backEditBtn') }}</button>
          <button @click="requestOTP" :disabled="isSendingOTP" class="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg text-sm hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Loader2 v-if="isSendingOTP" class="w-4 h-4 animate-spin" />
            <span>{{ $t('verification.sendOtpBtn') }}</span>
          </button>
        </div>
      </div>

      <!-- Step 3: Verifikasi OTP -->
      <div v-else-if="currentStep === 3" class="flex-1">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-ink-900 mb-1">{{ $t('verification.step3Title') }}</h2>
          <p class="text-ink-500 text-sm">{{ $t('verification.step3HeaderDesc') }} <span class="font-bold text-ink-900">{{ userPhone }}</span>.</p>
        </div>

        <div class="bg-white border border-ink-100 rounded-2xl p-6 md:p-8 shadow-sm text-center">
          <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare class="w-8 h-8" />
          </div>
          
          <div class="max-w-xs mx-auto">
            <input v-model="otpCode" type="text" maxlength="6" class="w-full text-center text-2xl tracking-[0.5em] font-bold border border-ink-200 rounded-xl px-4 py-4 text-ink-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 bg-ink-50 focus:bg-white transition-all" placeholder="••••••" />
            <p class="text-xs text-ink-500 mt-4">{{ $t('verification.resendOtpText') }} <button @click="requestOTP" :disabled="isSendingOTP" class="text-orange-500 font-bold hover:underline">{{ $t('verification.resendOtpBtn') }}</button></p>
          </div>
        </div>

        <div class="flex justify-end mt-6 gap-3">
          <button @click="currentStep = 2" class="bg-white text-ink-500 font-bold py-3 px-6 rounded-lg text-sm hover:bg-ink-50 border border-ink-200 transition-all">{{ $t('verification.backBtn') }}</button>
          <button @click="submitVerification" :disabled="isSubmitting || otpCode.length < 6" class="bg-orange-500 text-white font-bold py-3 px-8 rounded-lg text-sm hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>{{ isSubmitting ? $t('verification.processing') : $t('verification.verifyCompleteBtn') }}</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  CheckCircle2, 
  ScanFace, 
  ShieldCheck, 
  FileText, 
  ClipboardCheck, 
  AlertCircle,
  Upload,
  Loader2,
  User,
  MessageSquare
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard'
})

const { user } = useAuth()
const router = useRouter()
const supabase = useSupabaseClient()
const { csrf } = useCsrf()
const { t } = useI18n()
const { addToast } = useToast()

const currentStep = ref<number | 'intro'>('intro')

// Reactive Form Data
const formData = ref({
  name: '',
  nik: '',
  dob: ''
})

const handleDobInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '')
  if (val.length > 8) val = val.substring(0, 8)
  
  let formatted = val
  if (val.length > 4) {
    formatted = `${val.substring(0, 2)}-${val.substring(2, 4)}-${val.substring(4, 8)}`
  } else if (val.length > 2) {
    formatted = `${val.substring(0, 2)}-${val.substring(2, 4)}`
  }
  
  formData.value.dob = formatted
  input.value = formatted
}

// Auto-fill phone from user_metadata
const userPhone = computed(() => {
  return (user.value?.user_metadata as any)?.phone || ''
})

const selectedKTP = ref<File | null>(null)
const selectedPasPhoto = ref<File | null>(null)
const isScanning = ref(false)

const isNikValid = computed(() => formData.value.nik.length === 0 || /^\d{8,20}$/.test(formData.value.nik))
const isDobValid = computed(() => formData.value.dob.length === 0 || /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/.test(formData.value.dob))

const isFormValid = computed(() => {
  return formData.value.name.trim().length > 2 && 
         /^\d{8,20}$/.test(formData.value.nik) && 
         /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/.test(formData.value.dob) &&
         selectedKTP.value !== null &&
         selectedPasPhoto.value !== null
})

const handleFileUpload = (event: Event, type: 'ktp' | 'pasphoto') => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (!file) return
    
    // Validasi Format
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      addToast(t('verification.invalidFormat'), 'error')
      target.value = ''
      return
    }

    // Validasi Ukuran (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      addToast(t('verification.invalidSize'), 'error')
      target.value = ''
      return
    }

    if (type === 'ktp') {
      selectedKTP.value = file
      addToast(t('verification.ktpSuccess'), 'success')
    } else {
      selectedPasPhoto.value = file
      addToast(t('verification.pasPhotoSuccess'), 'success')
    }
  }
}

// Logic OTP & Submit
const isSendingOTP = ref(false)
const otpCode = ref('')
const isSubmitting = ref(false)

const requestOTP = async () => {
  if (!userPhone.value) {
    addToast(t('verification.phoneNotFound'), 'error')
    return
  }
  
  isSendingOTP.value = true
  try {
    await $fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'csrf-token': csrf },
      body: { phone: userPhone.value }
    })
    
    addToast(t('verification.otpSent'), 'success')
    currentStep.value = 3
  } catch (err: any) {
    const cleanError = err.data?.statusMessage || err.data?.message || err.message || t('verification.otpSendFailed')
    addToast(cleanError, 'error')
  } finally {
    isSendingOTP.value = false
  }
}

const submitVerification = async () => {
  isSubmitting.value = true
  try {
    // 1. Verifikasi OTP
    await $fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'csrf-token': csrf },
      body: { phone: userPhone.value, code: otpCode.value }
    })
    // 2. Upload File ke Supabase Storage via Server (Aman dari RLS)
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve((reader.result as string).split(',')[1] || '')
        reader.onerror = error => reject(error)
      })
    }

    const ktpBase64 = await fileToBase64(selectedKTP.value!)
    const pasPhotoBase64 = await fileToBase64(selectedPasPhoto.value!)

    const uploadResponse = await $fetch('/api/upload-kyc', {
      method: 'POST',
      headers: { 'csrf-token': csrf },
      body: {
        userId: user.value?.id || user.value?.sub,
        ktp_base64: ktpBase64,
        ktp_mime: selectedKTP.value!.type,
        pasphoto_base64: pasPhotoBase64,
        pasphoto_mime: selectedPasPhoto.value!.type,
        nama: formData.value.name,
        nik: formData.value.nik,
        tanggal_lahir: formData.value.dob
      }
    })

    const ktpUrl = (uploadResponse as any).ktp_url
    const pasPhotoUrl = (uploadResponse as any).pasphoto_url

    // 3. Tembak data ke Webhook Google Sheet (Hanya URL, bukan Base64 raksasa)
    try {
      await $fetch('/api/webhook/ekyc', {
        method: 'POST',
        headers: { 'csrf-token': csrf },
        body: {
          nama: formData.value.name,
          nik: formData.value.nik,
          tanggal_lahir: formData.value.dob,
          email: user.value?.email,
          no_hp: userPhone.value,
          ktp_url: ktpUrl,
          pasphoto_url: pasPhotoUrl
        }
      })
    } catch (webhookErr) {
      console.warn('Webhook gagal, tapi data aman di Supabase:', webhookErr)
    }
    
    
    addToast(t('verification.submitSuccess'), 'success')
    
    // 4. Redirect ke Dashboard dengan Hard Reload agar Layout (Banner) ter-refresh
    window.location.href = '/dashboard'
    
    
  } catch (err: any) {
    const cleanError = err.data?.statusMessage || err.data?.message || err.message || t('verification.submitFailed')
    addToast(cleanError, 'error')
  } finally {
    isSubmitting.value = false
  }
}
</script>
