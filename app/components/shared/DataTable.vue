<template>
  <div class="relative w-full group">
    <!-- Left shadow indicator -->
    <div 
      class="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-ink-100/50 to-transparent opacity-0 transition-opacity z-10" 
      :class="{ 'opacity-100': !isAtStart }"
    ></div>
    
    <!-- Right shadow indicator -->
    <div 
      class="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-ink-100/50 to-transparent opacity-0 transition-opacity z-10" 
      :class="{ 'opacity-100': !isAtEnd }"
    ></div>

    <div class="w-full overflow-x-auto pb-4 pt-1" @scroll="onScroll" ref="scrollContainer">
      <table class="w-full text-left border-collapse min-w-[800px]">
      <thead>
        <tr class="border-b border-ink-100 text-xs font-bold text-orange-500 uppercase tracking-wider">
          <th 
            v-for="col in columns" 
            :key="col.key"
            class="px-6 py-4"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td :colspan="columns.length" class="px-6 py-24 text-center">
            <p class="text-ink-500 text-sm font-medium">{{ emptyMessage }}</p>
          </td>
        </tr>
        <tr 
          v-else
          v-for="(row, index) in rows" 
          :key="index"
          class="border-b border-ink-50 hover:bg-ink-50/50 transition-colors"
        >
          <td 
            v-for="col in columns" 
            :key="col.key"
            class="px-6 py-4 text-sm text-ink-900"
          >
            <slot :name="col.key" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
export interface TableColumn {
  key: string
  label: string
}

withDefaults(defineProps<{
  columns: TableColumn[]
  rows: Record<string, any>[]
  emptyMessage?: string
}>(), {
  emptyMessage: 'Data tidak ditemukan'
})

const scrollContainer = ref<HTMLElement | null>(null)
const isAtStart = ref(true)
const isAtEnd = ref(true) // Default to true so it doesn't blink if not scrollable

const checkScroll = () => {
  if (!scrollContainer.value) return
  const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.value
  isAtStart.value = scrollLeft <= 0
  isAtEnd.value = Math.ceil(scrollLeft + clientWidth) >= scrollWidth
}

const onScroll = () => {
  checkScroll()
}

onMounted(() => {
  // Use timeout to wait for data render
  setTimeout(checkScroll, 100)
  window.addEventListener('resize', checkScroll)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScroll)
})
</script>
