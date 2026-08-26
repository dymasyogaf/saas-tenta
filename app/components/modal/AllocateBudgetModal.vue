<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 bg-ink-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      @click.self="close"
    >
      <div class="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative border border-ink-100 flex flex-col">
        <div class="p-6">
          <!-- Modal Header -->
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-display font-bold text-ink-900">{{ $t('modals.allocateBudget.title') }}</h3>
            <button @click="close" class="text-ink-400 hover:text-ink-600 p-1.5 rounded-full hover:bg-ink-50 transition-colors">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <div class="space-y-5">
            <!-- Account Selector -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1.5">{{ $t('modals.allocateBudget.selectAccount') }}</label>
              <BaseSelect 
                v-model="allocateSelectedAccount" 
                :options="accountOptions"
                :placeholder="`-- ${$t('modals.allocateBudget.selectAccountPlaceholder')} --`"
                wrapperClass="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-xl text-ink-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm font-medium"
              />
            </div>

            <!-- Available Balance Box -->
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div>
                <p class="text-xs font-medium text-blue-600 mb-0.5">{{ $t('modals.allocateBudget.availableBalanceLabel') }}</p>
                <p class="text-lg font-bold text-blue-700">{{ formatCurrency(availableBalance) }}</p>
              </div>
              <Wallet class="w-6 h-6 text-blue-400" />
            </div>

            <!-- Amount Input -->
            <div>
              <label class="block text-sm font-bold text-ink-900 mb-1.5">{{ $t('modals.allocateBudget.amountLabel') }}</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-bold text-sm sm:text-base">{{ isGlobal ? '$' : (locale === 'en' ? 'IDR' : 'Rp') }}</span>
                <input 
                  type="text" 
                  v-model="allocateAmountInput" 
                  @input="formatAllocateInput" 
                  :placeholder="locale === 'en' ? '1,000,000' : '1.000.000'" 
                  :class="[
                    'w-full pr-4 py-3 bg-white border border-ink-200 rounded-xl text-ink-900 text-lg font-bold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:font-normal placeholder:text-ink-300 shadow-2xs',
                    isGlobal ? 'pl-9' : (locale === 'en' ? 'pl-14' : 'pl-11')
                  ]"
                />
              </div>
              <p v-if="allocateAmount > availableBalance" class="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                <Info class="w-3.5 h-3.5 shrink-0" /> {{ $t('modals.allocateBudget.insufficientBalance') }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex gap-3">
            <button 
              @click="close" 
              class="flex-1 px-4 py-3 border border-ink-200 text-ink-700 rounded-xl font-bold hover:bg-ink-50 transition-colors text-sm"
            >
              {{ $t('common.cancel') }}
            </button>
            <button 
              @click="submitAllocateBudget" 
              :disabled="isAllocatingBudget || !allocateSelectedAccount || allocateAmount <= 0 || allocateAmount > availableBalance" 
              class="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              <Loader2 v-if="isAllocatingBudget" class="w-4 h-4 animate-spin" />
              {{ isAllocatingBudget ? $t('common.processing') : $t('modals.allocateBudget.submitBtn') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, unref } from 'vue'
import { X, Wallet, Info, Loader2 } from 'lucide-vue-next'
import BaseSelect from '~/components/ui/BaseSelect.vue'
import { useI18n } from 'vue-i18n'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'
import { useToast } from '#imports'
import { useCsrf } from '#imports'
import { useAppMode } from '~/composables/useAppMode'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  initialAccountId: { type: String, default: '' }
})

const emit = defineEmits(['close', 'success'])

const { t, locale } = useI18n()
const saldoStore = useSaldoStore()
const adsStore = useAdsStore()
const toast = useToast()
const { csrf } = useCsrf()
const { isGlobal } = useAppMode()

const allocateSelectedAccount = ref('')
const allocateAmountInput = ref('')
const allocateAmount = ref(0)
const isAllocatingBudget = ref(false)

const accountOptions = computed(() => {
  return (adsStore.adAccounts || []).map((acc: any) => ({
    label: `${acc.name} (${acc.platform})`,
    value: acc.id
  }))
})

const availableBalance = computed(() => {
  return isGlobal.value ? saldoStore.usdBalance : saldoStore.balance
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    allocateSelectedAccount.value = props.initialAccountId || ''
    allocateAmountInput.value = ''
    allocateAmount.value = 0
  }
}, { immediate: true })

watch(() => props.initialAccountId, (newVal) => {
  if (newVal) {
    allocateSelectedAccount.value = newVal
  }
})

const formatCurrency = (val: number) => {
  if (isGlobal.value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)
  }
  if (locale.value === 'en') {
    return 'IDR ' + new Intl.NumberFormat('en-US').format(val || 0)
  }
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(val || 0)
}

const formatAllocateInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value.replace(/\D/g, '')
  if (!val) {
    allocateAmountInput.value = ''
    allocateAmount.value = 0
    return
  }
  allocateAmount.value = parseInt(val, 10)
  allocateAmountInput.value = new Intl.NumberFormat(locale.value === 'en' ? 'en-US' : 'id-ID').format(allocateAmount.value)
}

const close = () => {
  emit('close')
}

const submitAllocateBudget = async () => {
  if (!allocateSelectedAccount.value || allocateAmount.value <= 0 || allocateAmount.value > availableBalance.value) {
    return
  }

  isAllocatingBudget.value = true
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch<any>('/api/ads/add-budget', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: {
        accountId: allocateSelectedAccount.value,
        amount: allocateAmount.value
      }
    })

    toast.addToast(res?.message || 'Permintaan anggaran berhasil dikirim', 'success')

    await saldoStore.fetchSaldo()
    await saldoStore.fetchTransactions()
    await adsStore.fetchAdAccounts()

    emit('success')
    close()
  } catch (error: any) {
    toast.addToast(error.data?.message || error.message || 'Gagal mengalokasikan anggaran', 'error')
  } finally {
    isAllocatingBudget.value = false
  }
}
</script>
