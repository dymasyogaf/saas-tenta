<template>
  <div class="w-full overflow-x-auto pb-4 pt-1">
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
</template>

<script setup lang="ts">
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
</script>
