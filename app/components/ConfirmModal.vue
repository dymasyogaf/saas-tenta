<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isVisible" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-ink-900/40 backdrop-blur-sm" @click="type === 'confirm' ? cancel() : confirm()"></div>
        
        <!-- Modal Content -->
        <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-ink-100">
          <div class="p-6">
            <h3 class="text-lg font-bold text-ink-900 mb-2">{{ title }}</h3>
            <p class="text-ink-600 text-sm whitespace-pre-line">{{ message }}</p>
          </div>
          <div class="px-6 py-4 bg-ink-50 flex justify-end gap-3 border-t border-ink-100">
            <button 
              v-if="type === 'confirm'"
              @click="cancel" 
              class="px-4 py-2 text-sm font-bold text-ink-600 hover:bg-ink-100 rounded-xl transition-colors"
            >
              {{ cancelLabel }}
            </button>
            <button 
              @click="confirm" 
              class="px-4 py-2 text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 rounded-xl transition-colors shadow-sm focus:ring-4 focus:ring-orange-500/20"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { isVisible, title, message, confirmLabel, cancelLabel, type, confirm, cancel } = useConfirm()
</script>
