<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="close"></div>
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h3 class="text-lg font-bold text-slate-900">{{ $t('modals.addStaff.title') }}</h3>
          <p class="text-xs text-slate-500 mt-1">{{ $t('modals.addStaff.subtitle') }}</p>
        </div>
        <button @click="close" class="text-slate-400 hover:text-slate-600 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-slate-200">
        <button 
          @click="activeTab = 'promote'"
          class="flex-1 py-3 text-sm font-semibold text-center transition-colors border-b-2"
          :class="activeTab === 'promote' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          {{ $t('modals.addStaff.tabPromote') }}
        </button>
        <button 
          @click="activeTab = 'create'"
          class="flex-1 py-3 text-sm font-semibold text-center transition-colors border-b-2"
          :class="activeTab === 'create' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
        >
          {{ $t('modals.addStaff.tabCreate') }}
        </button>
      </div>

      <div class="p-6 pb-32 overflow-y-auto">
        <!-- Error Message -->
        <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-start gap-2">
          <AlertCircle class="w-4 h-4 mt-0.5 shrink-0" />
          <p>{{ errorMsg }}</p>
        </div>

        <!-- TAB 1: PROMOTE -->
        <div v-if="activeTab === 'promote'" class="space-y-4">
          <p class="text-sm text-slate-600 mb-2">{{ $t('modals.addStaff.promoteDesc') }}</p>
          
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">{{ $t('modals.addStaff.selectRole') }}</label>
            <BaseSelect 
              v-model="formPromote.role" 
              :options="roleOptions"
              :placeholder="$t('modals.addStaff.selectRolePlaceholder')" 
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">{{ $t('modals.addStaff.selectClient') }}</label>
            <BaseSelect 
              v-model="formPromote.user_id" 
              :options="clientOptions"
              :placeholder="$t('modals.addStaff.selectClientPlaceholder')"
            >
              <template #option="{ option }">
                <span class="block font-medium truncate">{{ option.label }}</span>
                <span class="block text-[11px] text-slate-400 truncate">{{ option.email }}</span>
              </template>
            </BaseSelect>
          </div>

        </div>

        <!-- TAB 2: CREATE -->
        <div v-if="activeTab === 'create'" class="space-y-4">
          <p class="text-sm text-slate-600 mb-2">{{ $t('modals.addStaff.createDesc') }}</p>
          
          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">{{ $t('modals.addStaff.selectRole') }}</label>
            <BaseSelect 
              v-model="formCreate.role" 
              :options="roleOptions"
              :placeholder="$t('modals.addStaff.selectRolePlaceholder')" 
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">{{ $t('modals.addStaff.fullName') }}</label>
            <input v-model="formCreate.full_name" type="text" :placeholder="$t('modals.addStaff.fullNamePlaceholder')" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">{{ $t('modals.addStaff.email') }}</label>
            <input v-model="formCreate.email" type="email" :placeholder="$t('modals.addStaff.emailPlaceholder')" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-slate-700">{{ $t('modals.addStaff.password') }}</label>
            <input v-model="formCreate.password" type="text" :placeholder="$t('modals.addStaff.passwordPlaceholder')" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          </div>

        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
        <button @click="close" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
          {{ $t('common.cancel') }}
        </button>
        <button 
          @click="submit" 
          :disabled="isLoading"
          class="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <span v-if="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          {{ activeTab === 'promote' ? $t('modals.addStaff.promoteBtn') : $t('modals.addStaff.createBtn') }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { X, AlertCircle } from 'lucide-vue-next'
import { ref, watch, unref, computed } from 'vue'
import BaseSelect from '~/components/ui/BaseSelect.vue'
import { useI18n, useToast, useCsrf } from '#imports'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['update:isOpen', 'success'])

const { t } = useI18n()
const activeTab = ref('promote')
const isLoading = ref(false)
const errorMsg = ref('')
const clients = ref<any[]>([])

const formPromote = ref({
  user_id: '',
  role: ''
})

const formCreate = ref({
  full_name: '',
  email: '',
  password: '',
  role: ''
})

const roleOptions = [
  { label: 'Tim Audit', value: 'admin_compliance' },
  { label: 'Tim Iklan', value: 'admin_ads_ops' },
  { label: 'Tim Keuangan', value: 'admin_finance' },
  { label: 'Super Admin', value: 'super_admin' },
]

const clientOptions = computed(() => {
  return clients.value.map(c => ({
    label: c.full_name || 'Tanpa Nama',
    value: c.id,
    email: c.email
  }))
})

// Ambil daftar klien saat modal dibuka
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    resetForm()
    fetchClients()
  }
})

const fetchClients = async () => {
  try {
    const data = await $fetch('/api/admin/clients')
    // Hanya klien biasa (jangan promosikan admin jadi admin)
    clients.value = (data as any[]).filter(c => !c.role || c.role === 'client')
  } catch (err) {
    console.error(err)
  }
}

const close = () => {
  emit('update:isOpen', false)
}

const resetForm = () => {
  errorMsg.value = ''
  formPromote.value = { user_id: '', role: '' }
  formCreate.value = { full_name: '', email: '', password: '', role: '' }
}

const submit = async () => {
  errorMsg.value = ''
  isLoading.value = true

  try {
    const payload = activeTab.value === 'promote' 
      ? { action: 'promote', ...formPromote.value }
      : { action: 'create', ...formCreate.value }

    const { csrf } = useCsrf()
    const csrfToken = unref(csrf)
    const response = await $fetch('/api/admin/staff', {
      method: 'POST',
      headers: csrfToken ? { 'csrf-token': csrfToken } : {},
      body: payload
    })

    const toast = useToast()
    toast.addToast((response as any).message || t('common.success'), 'success')
    emit('success')
    close()
  } catch (error: any) {
    errorMsg.value = error.data?.statusMessage || error.message || t('common.error')
  } finally {
    isLoading.value = false
  }
}
</script>
