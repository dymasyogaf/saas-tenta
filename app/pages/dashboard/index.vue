<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Total Saldo Aktif</p>
        <h3 class="text-3xl font-display font-bold text-ink-900">Rp 35.500.000</h3>
        <p class="text-sm text-green-600 mt-3 flex items-center gap-1 font-medium">
          <TrendingUp class="w-4 h-4" /> +12% dari bulan lalu
        </p>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Akun Iklan Berjalan</p>
        <h3 class="text-3xl font-display font-bold text-ink-900">4</h3>
        <p class="text-sm text-ink-500 mt-3">2 Meta, 1 Google, 1 TikTok</p>
      </div>
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-ink-100">
        <p class="text-sm font-medium text-ink-500 mb-2">Iklan Butuh Perhatian</p>
        <h3 class="text-3xl font-display font-bold text-orange-600">2</h3>
        <p class="text-sm text-orange-600 mt-3 flex items-center gap-1 font-medium">
          <AlertCircle class="w-4 h-4" /> Cek segera
        </p>
      </div>
    </div>

    <!-- Campaign Performance Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-ink-100 overflow-hidden mt-8">
      <div class="px-6 py-5 border-b border-ink-100 flex justify-between items-center">
        <h4 class="font-display font-bold text-lg text-ink-900">Performa Kampanye Teratas</h4>
        <button class="text-sm text-orange-500 font-bold hover:text-orange-600">Lihat Semua</button>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <!-- Meta Campaign -->
          <div class="flex items-center justify-between p-4 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors">
            <div class="flex items-center gap-4">
              <img src="/icon-meta-ads.png" alt="Meta" class="w-12 h-12 rounded-xl shadow-sm border border-ink-100 object-contain bg-white p-2" />
              <div>
                <p class="font-bold text-ink-900 text-base">Promo Kemerdekaan - Meta</p>
                <p class="text-sm text-ink-500">Berjalan • Spend: Rp 6.750.000</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-display font-bold text-ink-900 text-lg">ROAS 3.2x</p>
              <p class="text-sm font-medium text-green-600">Sangat Bagus</p>
            </div>
          </div>

          <!-- Google Campaign -->
          <div class="flex items-center justify-between p-4 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors">
            <div class="flex items-center gap-4">
              <img src="/icon-google-ads.png" alt="Google" class="w-12 h-12 rounded-xl shadow-sm border border-ink-100 object-contain bg-white p-2" />
              <div>
                <p class="font-bold text-ink-900 text-base">Brand Awareness - Google</p>
                <p class="text-sm text-ink-500">Berjalan • Spend: Rp 1.800.000</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-display font-bold text-ink-900 text-lg">ROAS 1.8x</p>
              <p class="text-sm font-medium text-orange-500">Normal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, AlertCircle } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
})
</script>
