<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4 md:p-6">
      <div ref="modalRef" class="bg-white rounded-2xl shadow-xl w-full max-w-lg sm:max-w-2xl lg:max-w-4xl overflow-hidden relative border border-ink-100 flex flex-col max-h-[95vh] md:max-h-[90vh]" role="dialog" aria-modal="true" aria-labelledby="request-ad-title">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-ink-100 flex items-center justify-between bg-white shrink-0">
          <div class="flex items-center gap-3">
            <div v-if="activePlatformName" class="w-12 h-12 bg-white border border-ink-100 rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
              <img :src="platformLogo" class="w-7 h-7 object-contain" />
            </div>
            <div>
              <h3 id="request-ad-title" class="font-display font-bold text-ink-900">{{ $t('modals.requestAd.title') }}</h3>
              <p v-if="activePlatformName" class="text-xs text-ink-500">{{ $t('modals.requestAd.subtitle') }} {{ activePlatformName }}</p>
              <p v-else class="text-xs text-ink-500">{{ $t('modals.requestAd.selectPlatform') }}</p>
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
            <button v-if="isTiktokEnabled" @click="selectPlatform('TikTok Ads')" class="bg-white border border-ink-200 p-6 rounded-xl hover:border-orange-500 hover:shadow-md transition-all text-center flex flex-col items-center gap-4">
              <img src="/tiktok.svg" class="w-12 h-12 object-contain" />
              <span class="font-bold text-ink-900">TikTok Ads</span>
            </button>
            <button v-else disabled class="relative bg-white border border-ink-200 p-6 rounded-xl text-center flex flex-col items-center gap-4 opacity-70 cursor-not-allowed overflow-hidden group">
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
              <h4 class="font-bold text-ink-900 text-lg mb-4">{{ $t('modals.requestAd.details') }}</h4>
              
              <div>
                <label class="block text-sm font-bold text-ink-900 mb-2">{{ $t('modals.requestAd.fullName') }} <span class="text-red-500">*</span></label>
                <input v-model="form.fullName" type="text" required :placeholder="$t('modals.requestAd.fullNamePlaceholder')" class="w-full px-4 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900" />
              </div>

              <div>
                <label class="block text-sm font-bold text-ink-900 mb-2">
                  <template v-if="activePlatformName.includes('Google')">Shared Email</template>
                  <template v-else>ID {{ activePlatformName.includes('TikTok') ? 'Business Center' : 'Business Manager' }}</template>
                  <span class="text-red-500">*</span>
                </label>
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input v-model="form.bmId" :type="activePlatformName.includes('Google') ? 'email' : 'text'" required :placeholder="activePlatformName.includes('Google') ? $t('modals.requestAd.sharedEmailPlaceholder') : $t('modals.requestAd.idPlaceholder') + ' ' + (activePlatformName.includes('TikTok') ? 'Business Center' : 'Business Manager')" class="w-full sm:flex-1 px-4 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900" />
                  <button v-if="!activePlatformName.includes('Google')" type="button" @click="showInstructionBm = true" class="text-sm font-semibold text-orange-500 hover:text-orange-600 whitespace-nowrap text-left transition-colors">{{ $t('modals.requestAd.howToGetId') }} {{ activePlatformName.includes('TikTok') ? 'Business Center' : 'Business Manager' }}</button>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-ink-900 mb-2">{{ $t('modals.requestAd.adCategory') }} <span class="text-red-500">*</span></label>
                <select v-model="form.adCategory" required class="w-full px-4 py-2.5 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 bg-white">
                  <option value="" disabled>{{ $t('modals.requestAd.categoryPlaceholder') }}</option>
                  <option value="UMKM">{{ $t('modals.requestAd.catUMKM') }}</option>
                  <option value="Produk Kecantikan">{{ $t('modals.requestAd.catBeauty') }}</option>
                  <option value="FnB">{{ $t('modals.requestAd.catFnb') }}</option>
                  <option value="Konsultan Pendidikan">{{ $t('modals.requestAd.catEdu') }}</option>
                  <option value="Fashion">{{ $t('modals.requestAd.catFashion') }}</option>
                  <option value="Lainnya">{{ $t('modals.requestAd.catOther') }}</option>
                </select>
              </div>

              <div v-if="activePlatformName.includes('Meta')">
                <label class="block text-sm font-bold text-ink-900 mb-2">{{ $t('modals.requestAd.socialLink') }} <span class="text-red-500">*</span></label>
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
                <label class="block text-sm font-bold text-ink-900 mb-2">{{ $t('modals.requestAd.targetUrl') }} <span v-if="!activePlatformName.includes('Meta')" class="text-red-500">*</span><span v-else class="text-ink-400 font-normal ml-1">{{ $t('modals.requestAd.optional') }}</span></label>
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
              <h4 class="font-bold text-ink-900 text-lg mb-2">{{ $t('modals.requestAd.security2fa') }}</h4>
              <p class="text-sm text-ink-700 leading-relaxed bg-ink-50 p-4 rounded-lg border border-ink-100">
                {{ $t('modals.requestAd.security2faDesc') }}
              </p>
              
              <div class="space-y-3 mt-4">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" v-model="form.agree2fa1" required class="mt-1 w-4 h-4 text-orange-500 border-ink-300 rounded focus:ring-orange-500 shrink-0" />
                  <span class="text-sm text-ink-600 group-hover:text-ink-900 transition-colors">{{ $t('modals.requestAd.agree2fa1') }}</span>
                </label>
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" v-model="form.agree2fa2" required class="mt-1 w-4 h-4 text-orange-500 border-ink-300 rounded focus:ring-orange-500 shrink-0" />
                  <span class="text-sm text-ink-600 group-hover:text-ink-900 transition-colors">{{ $t('modals.requestAd.agree2fa2') }}</span>
                </label>
              </div>
            </div>

            <!-- Section 3: Kebijakan Platform -->
            <div class="bg-white p-6 rounded-xl border border-ink-200 shadow-sm space-y-4">
              <h4 class="font-bold text-ink-900 text-lg mb-2">{{ $t('modals.requestAd.policyTitle') }} {{ activePlatformName.includes('Meta') ? 'Facebook' : activePlatformName }}</h4>
              <div class="bg-ink-50 p-4 rounded-lg border border-ink-100">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" v-model="form.agreePolicy" required class="mt-1 w-4 h-4 text-orange-500 border-ink-300 rounded focus:ring-orange-500 shrink-0" />
                  <span class="text-sm text-ink-600 group-hover:text-ink-900 transition-colors">{{ $t('modals.requestAd.agreePolicy') }}</span>
                </label>
              </div>
            </div>

            <!-- Section 4: {{ $t('modals.requestAd.tcTitle') }} -->
            <div class="bg-white p-6 rounded-xl border border-ink-200 shadow-sm space-y-4">
              <h4 class="font-bold text-ink-900 text-lg mb-2">{{ $t('modals.requestAd.tcTitle') }}</h4>
              
              <div class="bg-ink-50 border border-ink-200 rounded-lg p-4 h-64 overflow-y-auto text-xs text-ink-700 custom-scrollbar">
                <ModalTermsAndConditionsAdAccount />
              </div>
              
              <label class="flex items-start gap-3 cursor-pointer group mt-4 bg-orange-50 p-4 rounded-xl border border-orange-200">
                <input type="checkbox" v-model="form.agreeTc" required class="mt-1 w-5 h-5 text-orange-500 border-orange-300 rounded focus:ring-orange-500 shrink-0" />
                <span class="text-sm font-bold text-orange-900 group-hover:text-orange-700 transition-colors">Saya menyetujui {{ $t('modals.requestAd.tcTitle') }} yang berlaku. Apabila saya melanggar peraturan ini, saya bersedia menerima segala konsekuensi yang berlaku.</span>
              </label>
            </div>

          </form>

          <!-- Step 3: Pilih Durasi Sewa -->
          <div v-else-if="step === 3" class="space-y-6 max-w-2xl mx-auto py-4">
            <div class="text-center mb-6">
              <h4 class="font-bold text-xl text-ink-900 mb-2">{{ $t('modals.requestAd.selectDuration') }}</h4>
              <p class="text-ink-500 text-sm">{{ $t('modals.requestAd.durationDesc') }}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div @click="form.subscriptionMonths = 1; form.rentalFee = pricing.monthly" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all text-center', form.subscriptionMonths === 1 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <h5 class="font-bold text-ink-900 mb-1">1 {{ $t('modals.extendRent.month') }}</h5>
                <p class="text-2xl font-bold text-orange-600 mb-2">Rp {{ pricing.monthly.toLocaleString('id-ID') }}</p>
                <p class="text-xs text-ink-500">{{ $t('modals.extendRent.normal') }}</p>
              </div>

              <div @click="form.subscriptionMonths = 3; form.rentalFee = pricing.quarterly" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all relative text-center', form.subscriptionMonths === 3 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <div class="absolute -top-3 inset-x-0 flex justify-center"><span class="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ $t('modals.extendRent.save') }} 22%</span></div>
                <h5 class="font-bold text-ink-900 mb-1 mt-1">3 {{ $t('modals.extendRent.months') }}</h5>
                <p class="text-2xl font-bold text-orange-600 mb-2">Rp {{ pricing.quarterly.toLocaleString('id-ID') }}</p>
                <p class="text-xs text-ink-500 line-through">Rp {{ pricing.quarterlyOriginal.toLocaleString('id-ID') }}</p>
              </div>

              <div @click="form.subscriptionMonths = 6; form.rentalFee = pricing.semiannual" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all relative text-center', form.subscriptionMonths === 6 ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <div class="absolute -top-3 inset-x-0 flex justify-center"><span class="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{{ $t('modals.extendRent.save') }} 12%</span></div>
                <h5 class="font-bold text-ink-900 mb-1 mt-1">6 {{ $t('modals.extendRent.months') }}</h5>
                <p class="text-2xl font-bold text-orange-600 mb-2">Rp {{ pricing.semiannual.toLocaleString('id-ID') }}</p>
                <p class="text-xs text-ink-500 line-through">Rp {{ pricing.semiannualOriginal.toLocaleString('id-ID') }}</p>
              </div>
            </div>

            <div class="mt-8 bg-ink-50 rounded-xl p-4 border border-ink-100 flex items-center justify-between">
              <div>
                <p class="text-sm text-ink-500 mb-1">{{ $t('modals.extendRent.netBalance') }}</p>
                <p class="font-bold text-xl text-ink-900" :class="{'text-red-500': netBalance < form.rentalFee}">Rp {{ netBalance.toLocaleString('id-ID') }}</p>
              </div>
              <button type="button" v-if="netBalance < form.rentalFee" @click="() => navigateTo('/dashboard/topup')" class="px-4 py-2 bg-white border border-orange-200 text-orange-600 font-bold rounded-lg text-xs hover:bg-orange-50 transition-colors shadow-sm">
                {{ $t('modals.extendRent.topupNow') }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 bg-white flex justify-end gap-3 border-t border-ink-100 shrink-0">
          <button @click="goBack" type="button" class="px-6 py-2.5 bg-white border border-ink-200 text-ink-700 hover:bg-ink-50 font-bold rounded-xl text-sm transition-colors shadow-sm">
            {{ step > 1 ? $t('common.back') : $t('common.cancel') }}
          </button>
          
          <button 
            v-if="step === 2"
            type="submit"
            form="requestAdForm"
            :disabled="!isFormValid" 
            class="px-8 py-2.5 bg-orange-500 border border-orange-500 text-white hover:bg-orange-600 font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {{ $t('common.next') }}
          </button>

          <button 
            v-if="step === 3"
            @click="submitPayment"
            :disabled="isSubmitting || netBalance < form.rentalFee" 
            class="px-8 py-2.5 bg-orange-500 border border-orange-500 text-white hover:bg-orange-600 font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <template v-else-if="netBalance < form.rentalFee">{{ $t('modals.extendRent.insufficientBalance') }}</template>
            <template v-else>{{ $t('modals.extendRent.payNow') }}</template>
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal Instruksi -->
  <ModalInstructionBmModal v-model="showInstructionBm" :platformName="activePlatformName" />

  <!-- Modal Konfirmasi Tutup -->
  <ModalConfirmModal
    v-model:isOpen="showConfirmClose"
    title="Tutup Form?"
    message="Terdapat perubahan yang belum disimpan. Apakah Anda yakin ingin menutup form ini?"
    confirmText="Ya, Tutup"
    cancelText="Batal"
    type="warning"
    @confirm="forceCloseModal"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick } from 'vue'
import { X, MonitorPlay } from 'lucide-vue-next'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'

const props = defineProps<{
  modelValue: boolean
  platformName?: string
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const toast = useToast()
const supabase = useSupabaseClient()
const { user } = useAuth()
const runtimeConfig = useRuntimeConfig()
const { t } = useI18n()

const pricing = {
  monthly: Number(runtimeConfig.public.pricingMonthly),
  quarterly: Number(runtimeConfig.public.pricingQuarterly),
  quarterlyOriginal: Number(runtimeConfig.public.pricingQuarterlyOriginal),
  semiannual: Number(runtimeConfig.public.pricingSemiannual),
  semiannualOriginal: Number(runtimeConfig.public.pricingSemiannualOriginal),
  managementFeeInfo: String(runtimeConfig.public.managementFeeInfo),
}

const isTiktokEnabled = computed(() => String(runtimeConfig.public.tiktokAdsEnabled) === 'true')
const activePlatformName = ref(props.platformName || '')
const step = ref(props.platformName ? 2 : 1)

const saldo = ref(0)
const pendingSaldo = ref(0)
const netBalance = computed(() => saldo.value - pendingSaldo.value)

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

watch(() => props.platformName, (newVal) => {
  activePlatformName.value = newVal || ''
  step.value = newVal ? 2 : 1
})

const modalRef = ref<HTMLElement | null>(null)
const { activate, deactivate } = useFocusTrap(modalRef, {
  escapeDeactivates: false,
  allowOutsideClick: true,
})

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    activate()
  } else {
    deactivate()
  }
})

watch(step, (newStep) => {
  if (newStep === 3) {
    fetchBalance()
  }
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
const showConfirmClose = ref(false)

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
  rentalFee: pricing.monthly,
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

const isDirty = computed(() => {
  return form.fullName !== '' || 
         form.bmId !== '' || 
         form.targetUrl !== '' || 
         form.socialLink !== '' || 
         form.adCategory !== ''
})

const closeModal = () => {
  if (isDirty.value) {
    showConfirmClose.value = true
    return
  }
  forceCloseModal()
}

const forceCloseModal = () => {
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
  if (netBalance.value < form.rentalFee) {
    toast.addToast(t('modals.extendRent.errorInsufficient'), 'error')
    return
  }
  
  isSubmitting.value = true
  
  try {
    const uid = (user.value as any)?.id || (user.value as any)?.sub
    if (!uid) throw new Error(t('modals.requestAd.errNoUser'))

    let dbPlatform = 'Meta Ads'
    if (activePlatformName.value.includes('TikTok')) dbPlatform = 'TikTok Ads'
    if (activePlatformName.value.includes('Google')) dbPlatform = 'Google Ads'
    
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
    
    const { csrf } = useCsrf()
    const csrfToken = unref(csrf)
    const requestResponse = await $fetch<any>('/api/ads/request', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: requestPayload
    })

    if (!requestResponse || !requestResponse.requestId) {
      throw new Error(t('modals.requestAd.errFailRecord'))
    }

    toast.addToast(t('modals.requestAd.successMsg'), 'success')
    emit('success')
    forceCloseModal()
    
  } catch (err: any) {
    toast.addToast(err.message || err.data?.statusMessage || t('modals.extendRent.errorProcess'), 'error')
  } finally {
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
