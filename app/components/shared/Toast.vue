<template>
  <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    <TransitionGroup 
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform translate-y-10 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-10 opacity-0"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        :class="[
          'text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto',
          bgColors[toast.type]
        ]"
      >
        <component :is="icons[toast.type]" class="w-5 h-5 shrink-0" />
        <p class="text-sm font-medium">{{ toast.message }}</p>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-vue-next'

const { toasts } = useToast()

const bgColors = {
  info: 'bg-ink-900',
  success: 'bg-green-600',
  warning: 'bg-orange-500',
  error: 'bg-red-600'
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle
}
</script>
