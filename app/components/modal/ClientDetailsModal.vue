<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-lg font-bold text-slate-900">Detail Klien (KYC)</h3>
            <p class="text-sm text-slate-500 mt-1">Data rahasia - Khusus Tim Audit & Super Admin</p>
          </div>
          <button @click="$emit('close')" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto flex-1">
          <div v-if="pending" class="flex flex-col items-center justify-center py-12">
            <Loader2 class="w-8 h-8 animate-spin text-orange-500 mb-4" />
            <p class="text-slate-500 text-sm">Mengambil data rahasia...</p>
          </div>
          <div v-else-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
            {{ error }}
          </div>
          <div v-else-if="details" class="space-y-8">
            
            <!-- Identitas Pribadi -->
            <div>
              <h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User class="w-4 h-4 text-orange-500" /> Data Identitas
              </h4>
              <div class="bg-slate-50 border border-slate-100 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap</p>
                  <p class="text-sm font-semibold text-slate-900">{{ details.verification_details?.name || details.full_name || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                  <p class="text-sm font-semibold text-slate-900">{{ details.email || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor Induk Kependudukan (NIK)</p>
                  <p class="text-sm font-semibold text-slate-900 font-mono">{{ details.verification_details?.nik || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Lahir</p>
                  <p class="text-sm font-semibold text-slate-900">{{ details.verification_details?.dob || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor Handphone</p>
                  <p class="text-sm font-semibold text-slate-900">{{ details.phone || '-' }}</p>
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status Verifikasi</p>
                  <span class="inline-flex px-2 py-0.5 text-xs font-bold rounded-full uppercase"
                    :class="{
                      'bg-green-100 text-green-700': details.verification_status === 'verified',
                      'bg-orange-100 text-orange-700': details.verification_status === 'pending',
                      'bg-slate-200 text-slate-600': !details.verification_status || details.verification_status === 'unverified'
                    }">
                    {{ details.verification_status || 'unverified' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Dokumen KYC -->
            <div>
              <h4 class="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileImage class="w-4 h-4 text-orange-500" /> Dokumen Unggahan
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <!-- KTP -->
                <div class="space-y-2">
                  <p class="text-xs font-bold text-slate-500">Foto KTP</p>
                  <div class="aspect-[1.6/1] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center group cursor-pointer" @click="openLightbox(details.verification_details?.ktp_signed_url)">
                    <img v-if="details.verification_details?.ktp_signed_url" :src="details.verification_details.ktp_signed_url" class="w-full h-full object-cover" />
                    <div v-else class="text-slate-400 text-xs flex flex-col items-center gap-2">
                      <ImageOff class="w-6 h-6" /> Tidak ada KTP
                    </div>
                    <div v-if="details.verification_details?.ktp_signed_url" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 class="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <!-- Pas Foto / Selfie -->
                <div class="space-y-2">
                  <p class="text-xs font-bold text-slate-500">Pas Foto / Selfie</p>
                  <div class="aspect-[3/4] md:aspect-[1.6/1] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative flex items-center justify-center group cursor-pointer" @click="openLightbox(details.verification_details?.pasphoto_signed_url)">
                    <img v-if="details.verification_details?.pasphoto_signed_url" :src="details.verification_details.pasphoto_signed_url" class="w-full h-full object-cover" />
                    <div v-else class="text-slate-400 text-xs flex flex-col items-center gap-2">
                      <ImageOff class="w-6 h-6" /> Tidak ada Pas Foto
                    </div>
                    <div v-if="details.verification_details?.pasphoto_signed_url" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 class="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
        
        <!-- Footer / Actions -->
        <div class="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button @click="$emit('close')" class="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">Tutup</button>
        </div>
      </div>
    </div>

    <!-- Lightbox for Image Preview -->
    <div v-if="lightboxImage" class="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 cursor-pointer" @click="lightboxImage = null">
      <button class="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
        <X class="w-8 h-8" />
      </button>
      <img :src="lightboxImage" class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" @click.stop />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X, User, FileImage, ImageOff, Loader2, Maximize2 } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'

const props = defineProps<{
  clientId: string
}>()

const emit = defineEmits(['close'])

const pending = ref(true)
const error = ref<string | null>(null)
const details = ref<any>(null)
const lightboxImage = ref<string | null>(null)

const { csrf } = useCsrf()

onMounted(async () => {
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch<any>(`/api/admin/clients/${props.clientId}`, {
      headers: csrfToken ? { 'csrf-token': csrfToken } : {}
    })
    details.value = res.data
  } catch (err: any) {
    error.value = err.data?.statusMessage || err.message || 'Gagal memuat data.'
  } finally {
    pending.value = false
  }
})

const openLightbox = (url: string | undefined | null) => {
  if (url) lightboxImage.value = url
}
</script>
