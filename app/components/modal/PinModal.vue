<template>
  <!-- Modal Buat PIN -->
  <div v-if="modelValue" class="fixed inset-0 z-[60]">
    <div class="fixed inset-0 bg-ink-900/50 transition-opacity" @click="close"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative transform transition-all">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 pb-2">
          <h3 class="font-bold text-ink-900 text-xl">Buat PIN</h3>
          <button @click="close" class="text-ink-400 hover:text-ink-600 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <!-- Body -->
        <div class="px-6 py-6 text-center space-y-6">
          <div class="flex justify-center">
             <div class="relative text-yellow-400">
               <Lock class="w-16 h-16" fill="currentColor" />
               <Key class="w-8 h-8 absolute -bottom-2 -right-3 fill-current text-yellow-400 stroke-white stroke-2" />
             </div>
          </div>
          
          <div>
            <h4 class="font-bold text-ink-900 text-lg mb-2">Masukkan PIN baru</h4>
            <p class="text-ink-500 text-sm">Masukkan 6 digit PIN baru kamu</p>
          </div>
          
          <div class="flex items-center justify-center gap-2 sm:gap-3">
            <input v-for="i in 6" :key="i" type="password" maxlength="1" class="w-10 h-12 sm:w-12 sm:h-14 border border-ink-200 rounded-lg text-center text-xl font-bold text-ink-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-5 border-t border-ink-100 flex justify-end gap-3 mt-4">
          <button @click="close" class="border border-orange-500 text-orange-500 font-bold py-2.5 px-6 rounded-md text-sm hover:bg-orange-50 transition-colors">
            Batal
          </button>
          <button class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-md text-sm transition-colors">
            Lanjut
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, Lock, Key } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const close = () => {
  emit('update:modelValue', false)
}
</script>
