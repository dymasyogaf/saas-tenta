<template>
  <div ref="target" class="relative w-full">
    <button 
      type="button"
      @click="isOpen = !isOpen"
      :class="[
        'w-full text-left flex justify-between items-center focus:outline-none transition-colors',
        wrapperClass || 'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-orange-500 bg-white'
      ]"
    >
      <slot name="selected" :label="getLabel()" :value="modelValue">
        <span :class="modelValue ? 'text-slate-900' : 'text-slate-500'" class="truncate block">
          {{ getLabel() }}
        </span>
      </slot>
      <ChevronDown class="w-4 h-4 text-slate-400 shrink-0 ml-2" />
    </button>
    
    <div 
      v-if="isOpen" 
      class="absolute z-[60] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto py-1"
    >
      <button 
        v-if="placeholder"
        type="button" 
        @click="selectOption('')" 
        class="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 truncate transition-colors"
      >
        {{ placeholder }}
      </button>
      <button 
        v-for="(opt, index) in options" 
        :key="opt.value || index" 
        type="button" 
        @click="selectOption(opt.value)" 
        class="w-full text-left px-3 py-2 text-sm text-slate-900 hover:bg-slate-50 transition-colors border-t border-slate-50 first:border-t-0"
      >
        <slot name="option" :option="opt">
          <span class="truncate block">{{ opt.label }}</span>
        </slot>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string | number
  options: { label: string, value: string | number, [key: string]: any }[]
  placeholder?: string
  wrapperClass?: string
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const target = ref(null)

onClickOutside(target, () => {
  isOpen.value = false
})

const selectOption = (val: string | number) => {
  emit('update:modelValue', val)
  isOpen.value = false
}

const getLabel = () => {
  const selected = props.options.find(o => o.value === props.modelValue)
  return selected ? selected.label : (props.placeholder || 'Pilih...')
}
</script>
