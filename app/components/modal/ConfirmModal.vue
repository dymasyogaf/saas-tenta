<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-ink-900/40 backdrop-blur-sm transition-opacity" 
        @click="handleCancel"
      ></div>
      
      <!-- Modal Content -->
      <div 
        class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all scale-100 opacity-100"
        role="dialog"
        aria-modal="true"
      >
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div 
              class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
              :class="iconBgClass"
            >
              <component :is="iconComponent" class="w-6 h-6" :class="iconColorClass" />
            </div>
            <div class="pt-1">
              <h3 class="text-lg font-bold text-ink-900 mb-2">{{ title || $t('common.confirmation') }}</h3>
              <p class="text-sm text-ink-600 leading-relaxed">{{ message }}</p>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-ink-50/50 flex justify-end gap-3 border-t border-ink-100">
          <button 
            @click="handleCancel" 
            class="px-5 py-2.5 bg-white border border-ink-200 text-ink-700 hover:bg-ink-50 font-bold rounded-xl text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-ink-200"
          >
            {{ cancelText || $t('common.cancel') }}
          </button>
          
          <button 
            @click="handleConfirm" 
            class="px-5 py-2.5 text-white font-bold rounded-xl text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="confirmBtnClass"
          >
            {{ confirmText || $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Info, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: ''
  },
  cancelText: {
    type: String,
    default: ''
  },
  type: {
    type: String as () => 'danger' | 'warning' | 'info',
    default: 'warning'
  }
})

const emit = defineEmits(['update:isOpen', 'confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
  emit('update:isOpen', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:isOpen', false)
}

const iconComponent = computed(() => {
  switch (props.type) {
    case 'danger': return AlertCircle
    case 'warning': return AlertTriangle
    case 'info': return Info
    default: return AlertTriangle
  }
})

const iconBgClass = computed(() => {
  switch (props.type) {
    case 'danger': return 'bg-red-100'
    case 'warning': return 'bg-orange-100'
    case 'info': return 'bg-blue-100'
    default: return 'bg-orange-100'
  }
})

const iconColorClass = computed(() => {
  switch (props.type) {
    case 'danger': return 'text-red-600'
    case 'warning': return 'text-orange-600'
    case 'info': return 'text-blue-600'
    default: return 'text-orange-600'
  }
})

const confirmBtnClass = computed(() => {
  switch (props.type) {
    case 'danger': return 'bg-red-500 hover:bg-red-600 border border-red-500 focus:ring-red-500'
    case 'warning': return 'bg-orange-500 hover:bg-orange-600 border border-orange-500 focus:ring-orange-500'
    case 'info': return 'bg-blue-500 hover:bg-blue-600 border border-blue-500 focus:ring-blue-500'
    default: return 'bg-orange-500 hover:bg-orange-600 border border-orange-500 focus:ring-orange-500'
  }
})
</script>
