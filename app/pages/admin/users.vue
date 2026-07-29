<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">Manajemen Akses Karyawan</h2>
        <p class="text-slate-500 text-sm mt-1">Atur hak akses Tim Audit, Tim Iklan, dan Tim Keuangan Anda.</p>
      </div>
      <button @click="isModalOpen = true" class="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm shadow-orange-500/20">
        <UserPlus class="w-4 h-4" /> Tambah Staf Baru
      </button>
    </div>

    <!-- Alert Super Admin -->
    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
      <ShieldAlert class="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
      <div>
        <h3 class="text-sm font-bold text-indigo-900">Ruang Khusus Super Admin</h3>
        <p class="text-xs text-indigo-700 mt-1">Halaman ini mengontrol siapa yang memiliki kunci ke "brankas" bisnis Anda. Pastikan berhati-hati saat memberikan jabatan <b>Super Admin</b> atau <b>Finance</b> kepada seseorang.</p>
      </div>
    </div>

    <!-- Table Container -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th class="px-6 py-4">Karyawan</th>
              <th class="px-6 py-4">Jabatan (Role)</th>
              <th class="px-6 py-4">Tanggal Diangkat</th>
              <th class="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Loading Skeleton -->
            <tr v-if="pending" v-for="i in 3" :key="'skel'+i" class="animate-pulse bg-white">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-ink-200 shrink-0"></div>
                  <div class="space-y-2">
                    <div class="h-4 w-32 bg-ink-200 rounded"></div>
                    <div class="h-3 w-24 bg-ink-200 rounded"></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4"><div class="h-6 w-32 bg-ink-200 rounded-full"></div></td>
              <td class="px-6 py-4"><div class="h-4 w-24 bg-ink-200 rounded"></div></td>
              <td class="px-6 py-4"><div class="h-8 w-8 bg-ink-200 rounded-lg mx-auto"></div></td>
            </tr>
            
            <!-- Empty State -->
            <tr v-else-if="staffList.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-500">
                <ShieldX class="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p class="font-medium text-slate-600">Belum ada staf yang diangkat.</p>
                <p class="text-xs mt-1">Klik tombol 'Tambah Staf Baru' untuk mulai mendelegasikan tugas.</p>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr v-else v-for="staff in staffList" :key="staff.id" class="hover:bg-slate-50 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border"
                    :class="getRoleColor(staff.role, 'avatar')">
                    {{ staff.full_name ? staff.full_name.substring(0,2).toUpperCase() : 'ST' }}
                  </div>
                  <div>
                    <p class="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{ staff.full_name || 'Tanpa Nama' }}</p>
                    <p class="text-xs text-slate-500">{{ staff.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 text-[11px] font-bold rounded-full border"
                  :class="getRoleColor(staff.role, 'badge')">
                  {{ getRoleName(staff.role) }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600">
                {{ new Date(staff.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
              </td>
              <td class="px-6 py-4 text-center">
                <button @click="confirmRevoke(staff)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cabut Akses (Pecat)">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <AddStaffModal 
      v-model:isOpen="isModalOpen" 
      @success="refresh" 
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="isDeleteModalOpen = false"></div>
      <div class="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
          <TriangleAlert class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-slate-900 text-center mb-2">Cabut Akses Admin?</h3>
        <p class="text-sm text-slate-500 text-center mb-6">
          Anda yakin ingin mencabut akses <span class="font-bold text-slate-700">{{ staffToDelete?.full_name || 'karyawan ini' }}</span>? Karyawan ini akan dikembalikan menjadi Klien biasa.
        </p>
        <div class="flex gap-3">
          <button @click="isDeleteModalOpen = false" class="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors">
            Batal
          </button>
          <button @click="executeRevoke" class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-sm">
            Ya, Cabut
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { UserPlus, ShieldAlert, ShieldX, Trash2, TriangleAlert } from 'lucide-vue-next'
import AddStaffModal from '~/components/modal/AddStaffModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'] // Sebaiknya dilindungi lagi dengan 'super_admin' middleware nantinya
})

const isModalOpen = ref(false)

const { data: staffList, pending, refresh } = useFetch<any[]>('/api/admin/staff')

const { addToast } = useToast()

const isDeleteModalOpen = ref(false)
const staffToDelete = ref<any>(null)

const confirmRevoke = (staff: any) => {
  staffToDelete.value = staff
  isDeleteModalOpen.value = true
}

const executeRevoke = async () => {
  if (!staffToDelete.value) return
  isDeleteModalOpen.value = false
  
  try {
    await ($fetch as any)('/api/admin/staff', {
      method: 'POST',
      body: { action: 'revoke', user_id: staffToDelete.value.id }
    })
    addToast('Akses berhasil dicabut!', 'success')
    refresh()
  } catch (error: any) {
    addToast(error.message || 'Gagal mencabut akses', 'error')
  } finally {
    staffToDelete.value = null
  }
}

// Helper Konversi Jabatan
const getRoleName = (role: string) => {
  const map: Record<string, string> = {
    'admin_compliance': 'Tim Audit (Kepatuhan)',
    'admin_ads_ops': 'Tim Ops Iklan',
    'admin_finance': 'Tim Keuangan',
    'super_admin': 'Super Admin',
    'client': 'Klien Biasa'
  }
  return map[role] || role
}

// Helper Warna
const getRoleColor = (role: string, type: 'avatar' | 'badge') => {
  if (type === 'badge') {
    switch (role) {
      case 'super_admin': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'admin_finance': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'admin_ads_ops': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'admin_compliance': return 'bg-orange-50 text-orange-700 border-orange-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  } else {
    switch (role) {
      case 'super_admin': return 'bg-indigo-100 text-indigo-600 border-indigo-200'
      case 'admin_finance': return 'bg-emerald-100 text-emerald-600 border-emerald-200'
      case 'admin_ads_ops': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'admin_compliance': return 'bg-orange-100 text-orange-600 border-orange-200'
      default: return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }
}
</script>
