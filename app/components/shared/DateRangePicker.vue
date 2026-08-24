<template>
  <div class="relative shrink-0">
    <!-- Visual Button -->
    <button 
      @click="showDatePopover = !showDatePopover" 
      class="flex items-center gap-2 bg-white border border-ink-200 text-ink-700 py-2 px-3 rounded-lg text-sm hover:border-ink-300 transition-colors shadow-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 w-full justify-between"
    >
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4 text-ink-500" />
        <span class="font-medium whitespace-nowrap">{{ dateRangeText }}</span>
      </div>
    </button>
    
    <!-- Popover Content -->
    <div v-if="showDatePopover" class="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-ink-200 p-4 z-50 origin-top-left sm:origin-top-right">
      <h4 class="font-bold text-ink-900 mb-4">{{ $t('components.dateRangePicker.title') }}</h4>
      
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-ink-500 mb-1">{{ $t('components.dateRangePicker.startDate') }}</label>
          <input 
            v-model="tempStartDate" 
            type="date" 
            class="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-ink-700 bg-white" 
          />
        </div>
        <div>
          <label class="block text-xs text-ink-500 mb-1">{{ $t('components.dateRangePicker.endDate') }}</label>
          <input 
            v-model="tempEndDate" 
            type="date" 
            class="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 text-ink-700 bg-white" 
          />
        </div>
      </div>
      
      <button @click="applyDateFilter" class="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg text-sm transition-colors">
        {{ $t('components.dateRangePicker.apply') }}
      </button>
    </div>
    
    <!-- Overlay for closing popover when clicking outside -->
    <div v-if="showDatePopover" @click="showDatePopover = false" class="fixed inset-0 z-40"></div>
  </div>
</template>

<script setup lang="ts">
import { Calendar } from 'lucide-vue-next'
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  modelValue: { start: string; end: string }
}>()

const emit = defineEmits(['update:modelValue', 'change'])

const { t } = useI18n()
const showDatePopover = ref(false)

const tempStartDate = ref(props.modelValue.start)
const tempEndDate = ref(props.modelValue.end)

watch(() => props.modelValue, (newVal) => {
  tempStartDate.value = newVal.start
  tempEndDate.value = newVal.end
}, { deep: true })

const applyDateFilter = () => {
  emit('update:modelValue', { start: tempStartDate.value, end: tempEndDate.value })
  emit('change', { start: tempStartDate.value, end: tempEndDate.value })
  showDatePopover.value = false
}

const dateRangeText = computed(() => {
  if (!props.modelValue.start || !props.modelValue.end) return t('components.dateRangePicker.title')
  
  const format = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  
  return `${format(props.modelValue.start)} - ${format(props.modelValue.end)}`
})
</script>
