<template>
  <div class="max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">{{ $t('topup.title') }}</h2>
      <div class="flex gap-3">
        <div class="relative">
          <button @click="isDatePopoverOpen = !isDatePopoverOpen" class="bg-white border border-ink-200 text-ink-600 hover:text-ink-900 hover:border-ink-300 px-4 py-2.5 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm">
            <Calendar class="w-4 h-4" /> {{ formattedDateRange }}
          </button>
          
          <div v-if="isDatePopoverOpen" class="absolute top-full mt-2 right-0 bg-white border border-ink-200 rounded-xl shadow-lg p-4 w-72 z-10">
            <h5 class="text-sm font-bold text-ink-900 mb-3">{{ $t('topup.selectDateRange') }}</h5>
            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-ink-500 mb-1">{{ $t('topup.startDate') }}</label>
                <input type="date" v-model="startDate" class="w-full bg-white border border-ink-200 text-ink-900 px-3 py-2 rounded-md text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-medium text-ink-500 mb-1">{{ $t('topup.endDate') }}</label>
                <input type="date" v-model="endDate" class="w-full bg-white border border-ink-200 text-ink-900 px-3 py-2 rounded-md text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none" />
              </div>
              <button @click="applyDateFilter" class="w-full bg-orange-500 text-white font-bold py-2 rounded-md text-sm mt-2 hover:bg-orange-600 transition-colors">{{ $t('topup.apply') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Section: Summary Cards -->
    <div class="flex flex-col lg:flex-row gap-6 mb-8">
      <!-- Left Card: Saldo -->
      <div class="bg-white border border-ink-100 rounded-xl p-6 lg:w-1/3 shadow-sm flex flex-col">
        <p class="text-sm font-medium text-ink-500 mb-2">{{ $t('topup.mainBalance') }}</p>
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-8 bg-orange-500 rounded-md flex items-center justify-center text-white shrink-0">
            <Wallet class="w-5 h-5" />
          </div>
          <h3 class="text-3xl font-display font-bold text-ink-900">{{ formatRupiah(saldoStore.balance) }}</h3>
        </div>
        
        <div class="flex items-center gap-3 mb-6">
          <button @click="handleTopup" :disabled="saldoStore.isLoading" class="w-full bg-orange-500 border-2 border-orange-500 text-white hover:bg-orange-600 font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {{ saldoStore.isLoading ? $t('topup.processing') : $t('topup.addBalance') }}
          </button>
        </div>
        
        <hr class="border-ink-100 mb-6">
        
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-sm font-medium text-ink-500">{{ $t('topup.activePackage') }}</p>
            <p class="text-lg font-bold text-ink-900 capitalize">{{ saldoStore.activePackage || $t('topup.noneYet') }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-ink-500">{{ $t('topup.weeklyLimit') }}</p>
            <p class="text-lg font-bold text-ink-900">{{ saldoStore.weeklyLimit ? formatRupiah(saldoStore.weeklyLimit) : '-' }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-1 mb-2">
          <p class="text-sm font-medium text-ink-500">{{ $t('topup.pendingTopup') }}</p>
          <Info class="w-3.5 h-3.5 text-ink-400" />
        </div>
        <p class="text-lg font-bold text-ink-900 mb-4">{{ formatRupiah(saldoStore.pendingBalance) }}</p>

        <div class="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-auto">
          <p class="text-xs font-medium text-orange-600 mb-1">{{ $t('topup.rentActivePeriod') }}</p>
          <div v-if="activeRentals.accounts.length > 0" class="space-y-2.5">
            <div v-for="acc in activeRentals.accounts" :key="acc.account_id" class="flex items-center justify-between">
              <div>
                <p class="text-sm font-bold text-ink-900">{{ acc.name }}</p>
                <p class="text-xs text-ink-600 font-medium">{{ $t('topup.expiresOn') }} {{ formatDate(acc.subscription_expires_at) }}</p>
              </div>
            </div>
            <NuxtLink 
              v-if="activeRentals.total > 2"
              to="/dashboard/profile?tab=layanan"
              class="block text-center text-xs font-semibold text-orange-600 hover:text-orange-700 pt-1 border-t border-orange-200 mt-2"
            >
              {{ $t('topup.seeAll', { count: activeRentals.total }) }}
            </NuxtLink>
          </div>
          <div v-else>
            <p class="text-sm font-bold text-ink-900">{{ $t('topup.noSubscriptions') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Right Card: Laporan -->
      <div class="bg-white border border-ink-100 rounded-xl p-6 lg:w-2/3 shadow-sm flex flex-col">
        <h4 class="text-base font-bold text-ink-900 mb-4">{{ $t('topup.adsReport') }} <span class="text-ink-500 font-normal">({{ formattedDateRange }})</span></h4>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <!-- Laporan Utama: Ad Spend -->
          <div class="bg-ink-50/50 rounded-lg p-5 flex flex-col justify-center border border-ink-100/50">
            <div class="flex items-center gap-1 mb-2">
              <p class="text-sm font-medium text-ink-500">{{ $t('topup.totalAdSpend') }}</p>
              <Info class="w-3.5 h-3.5 text-ink-400" />
            </div>
            <div class="flex items-center gap-2 text-orange-500">
              <h3 class="text-3xl font-display font-bold text-ink-900">
                <span v-if="adsStore.isLoading" class="inline-block w-24 h-8 bg-ink-200 rounded animate-pulse"></span>
                <template v-else>{{ formatRupiah(adsStore.totalSpend) }}</template>
              </h3>
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-4">
            <div class="bg-ink-50/50 rounded-lg p-4 flex flex-col justify-center border border-ink-100/50">
              <div class="flex items-center gap-1 mb-1">
                <p class="text-xs font-medium text-ink-500">{{ $t('topup.totalInboundBalance') }}</p>
              </div>
              <template v-if="saldoStore.isFetchingSaldo">
                <div class="inline-block w-20 h-6 bg-ink-200 rounded animate-pulse mt-1"></div>
              </template>
              <template v-else>
                <p class="text-lg font-bold text-ink-900">{{ formatRupiah(saldoStore.balance) }}</p>
              </template>
            </div>
            
            <div class="flex gap-4">
              <div class="bg-ink-50/50 rounded-lg p-4 flex-1 border border-ink-100/50">
                <div class="flex items-center gap-1 mb-1">
                  <p class="text-xs font-medium text-ink-500">{{ $t('topup.managementFee') }}</p>
                </div>
                <p class="text-base font-bold text-ink-900">Rp 0</p>
              </div>
              
              <div class="bg-ink-50/50 rounded-lg p-4 flex-1 border border-ink-100/50">
                <div class="flex items-center gap-1 mb-1">
                  <p class="text-xs font-medium text-ink-500">{{ $t('topup.totalRefund') }}</p>
                </div>
                <p class="text-base font-bold text-ink-900">Rp 0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Tabs and Table -->
    <div class="bg-white border border-ink-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
      <!-- Tabs & Download -->
      <div class="flex flex-col xl:flex-row xl:items-center justify-between border-b border-ink-100 p-2 gap-4">
        <div class="flex overflow-x-auto hide-scrollbar bg-ink-50 p-1.5 rounded-xl flex-1 max-w-full gap-1">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'whitespace-nowrap px-4 py-2.5 text-sm rounded-lg transition-colors',
              activeTab === tab.id
                ? 'bg-white text-orange-500 font-bold shadow-sm'
                : 'text-ink-500 hover:text-ink-900 font-medium'
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="px-2 xl:px-4 shrink-0 pb-2 xl:pb-0">
          <button @click="downloadReport" class="w-full xl:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
            <Download class="w-4 h-4" /> Download Laporan Transaksi
          </button>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="p-5 flex flex-col md:flex-row items-start md:items-center justify-end gap-3">
        <div class="relative w-full md:w-72">
          <input type="text" v-model="searchQuery" :placeholder="$t('topup.searchTxId')" class="pl-4 pr-10 py-2.5 border border-ink-200 rounded-lg text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
        
        <div class="relative w-full md:w-56">
          <select v-model="statusFilter" class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2.5 pl-4 pr-10 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
            <option value="all">{{ $t('topup.allStatus') }}</option>
            <option value="success">{{ $t('topup.success') }}</option>
            <option value="pending">{{ $t('topup.pending') }}</option>
            <option value="failed">{{ $t('topup.failed') }}</option>
          </select>
          <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        </div>
      </div>
      
      <!-- Tables -->
      <div class="w-full overflow-x-auto pb-4 pt-1">
        <table class="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr class="border-b border-ink-100 text-xs font-bold text-orange-500 uppercase tracking-wider">
              <th class="px-6 py-4">{{ $t('topup.date') }}</th>
              <th class="px-6 py-4">{{ $t('topup.txType') }}</th>
              <th class="px-6 py-4">{{ $t('topup.nominal') }}</th>
              <th class="px-6 py-4">{{ $t('topup.description') }}</th>
              <th class="px-6 py-4 text-right">{{ $t('topup.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredTransactions.length === 0">
              <td colspan="5" class="px-6 py-24 text-center">
                <p class="text-ink-500 text-sm font-medium">{{ $t('topup.noData') }}</p>
              </td>
            </tr>
            <tr v-for="trx in filteredTransactions" :key="trx.id" class="border-b border-ink-50 hover:bg-ink-50/50">
              <td class="px-6 py-4 text-sm font-medium text-ink-900">{{ formatDate(trx.created_at) }}</td>
              <td class="px-6 py-4 text-sm font-bold" :class="trx.type === 'topup' ? 'text-green-600' : 'text-orange-600'">
                {{ trx.type === 'topup' ? $t('topup.topupBalance') : $t('topup.adAllocation') }}
              </td>
              <td class="px-6 py-4 text-sm font-bold text-ink-900">{{ formatRupiah(trx.amount) }}</td>
              <td class="px-6 py-4 text-sm text-ink-500">{{ trx.description || '-' }}</td>
              <td class="px-6 py-4 text-right">
                <span class="px-2.5 py-1 text-xs font-bold rounded-full" 
                  :class="{
                    'bg-green-100 text-green-700': trx.status === 'success' || trx.status === 'settled',
                    'bg-orange-100 text-orange-700': trx.status === 'pending',
                    'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'expired'
                  }">
                  {{ trx.status.toUpperCase() }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal Top Up -->
    <div v-if="isTopupModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg sm:max-w-2xl lg:max-w-3xl overflow-hidden relative border border-ink-100 flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-ink-100 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-display font-bold text-ink-900">{{ $t('topup.topupAdBalance') }}</h3>
            <p class="text-ink-500 text-sm mt-1">{{ $t('topup.selectPackageAndNominal') }}</p>
          </div>
          <button @click="isTopupModalOpen = false" class="text-ink-400 hover:text-ink-700 bg-ink-50 p-2 rounded-full">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto">
          <!-- Wizard Step 1: Pilih Paket -->
          <div v-if="topupStep === 1" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Starter -->
              <div @click="selectedPackage = 'starter'" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all', selectedPackage === 'starter' ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <h4 class="font-bold text-lg text-ink-900 mb-2">{{ $t('topup.starter') }}</h4>
                <p class="text-3xl font-display font-bold text-ink-900 mb-4">5% <span class="text-sm font-medium text-ink-500">{{ $t('topup.topupFee') }}</span></p>
                <ul class="space-y-2 text-sm text-ink-700">
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.starterFeature1') }}</li>
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.starterFeature2') }}</li>
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.starterFeature3') }}</li>
                </ul>
              </div>

              <!-- Growth -->
              <div @click="selectedPackage = 'growth'" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all relative', selectedPackage === 'growth' ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <div class="absolute -top-3 inset-x-0 flex justify-center"><span class="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">{{ $t('topup.mostPopular') }}</span></div>
                <h4 class="font-bold text-lg text-ink-900 mb-2 mt-2">{{ $t('topup.growth') }}</h4>
                <p class="text-3xl font-display font-bold text-ink-900 mb-4">4.5% <span class="text-sm font-medium text-ink-500">{{ $t('topup.topupFee') }}</span></p>
                <ul class="space-y-2 text-sm text-ink-700">
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.growthFeature1') }}</li>
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.starterFeature2') }}</li>
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.growthFeature3') }}</li>
                </ul>
              </div>

              <!-- Scale -->
              <div @click="selectedPackage = 'scale'" :class="['border-2 rounded-xl p-5 cursor-pointer transition-all', selectedPackage === 'scale' ? 'border-orange-500 bg-orange-50' : 'border-ink-100 hover:border-ink-300']">
                <h4 class="font-bold text-lg text-ink-900 mb-2">{{ $t('topup.scale') }}</h4>
                <p class="text-3xl font-display font-bold text-ink-900 mb-4">3.5% <span class="text-sm font-medium text-ink-500">{{ $t('topup.topupFee') }}</span></p>
                <ul class="space-y-2 text-sm text-ink-700">
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.scaleFeature1') }}</li>
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.starterFeature2') }}</li>
                  <li class="flex items-start gap-2"><svg class="w-5 h-5 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> {{ $t('topup.scaleFeature3') }}</li>
                </ul>
              </div>
            </div>
            
            <div class="mt-6 flex justify-end">
              <button @click="topupStep = 2" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm">{{ $t('topup.continue') }}</button>
            </div>
          </div>

          <!-- Wizard Step 2: Nominal & Metode -->
          <div v-if="topupStep === 2" class="space-y-6 max-w-md mx-auto">
            <div>
              <div class="flex items-center gap-2 mb-2 text-orange-600 font-bold text-sm cursor-pointer hover:underline w-max" @click="topupStep = 1">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> Kembali ke Pilih Paket
              </div>
              <label class="block text-sm font-medium text-ink-700 mb-2">{{ $t('topup.topupNominalLabel', { package: selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1) }) }}</label>
              <p class="text-xs text-ink-500 mb-2">{{ $t('topup.rangeLabel', { min: formatRupiah(packageInfo.min), max: packageInfo.max === Infinity ? $t('topup.unlimited') : formatRupiah(packageInfo.max) }) }}</p>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-medium text-lg">Rp</span>
                <input type="text" v-model="formattedTopupAmount" class="w-full pl-12 pr-4 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-lg transition-all" />
              </div>
              <p v-if="!isValidTopup && topupAmount" class="text-xs font-medium text-red-500 mt-1">{{ $t('topup.invalidNominal') }}</p>
            </div>
            
            <div class="bg-ink-50 rounded-xl p-4 border border-ink-100 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-ink-500">{{ $t('topup.inboundBalanceLabel') }}</span>
                <span class="font-bold text-ink-900">{{ formatRupiah(Number(topupAmount) || 0) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-ink-500">{{ $t('topup.topupFeeLabel', { fee: packageInfo.fee * 100 }) }}</span>
                <span class="font-bold text-ink-900">{{ formatRupiah(feeAmount) }}</span>
              </div>
              <hr class="border-ink-200 my-2">
              <div class="flex justify-between text-base">
                <span class="font-bold text-ink-900">{{ $t('topup.totalPaymentLabel') }}</span>
                <span class="font-bold text-orange-600">{{ formatRupiah(totalAmount) }}</span>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-2">{{ $t('topup.paymentMethod') }}</label>
              <div class="relative">
                <select v-model="selectedMethod" class="w-full appearance-none pl-4 pr-10 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-sm transition-all cursor-pointer">
                  <optgroup :label="$t('topup.virtualAccount')">
                    <option value="BC">BCA Virtual Account</option>
                    <option value="BM">Mandiri Virtual Account</option>
                    <option value="BR">BRI Virtual Account</option>
                  </optgroup>
                  <optgroup :label="$t('topup.ewallet')">
                    <option value="OV">OVO</option>
                    <option value="SA">ShopeePay App</option>
                    <option value="DA">DANA</option>
                    <option value="SP">QRIS</option>
                  </optgroup>
                </select>
                <ChevronDown class="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="topupStep === 2" class="p-5 bg-ink-50 flex gap-3 border-t border-ink-100 shrink-0 mt-auto">
          <button @click="isTopupModalOpen = false" class="flex-1 bg-white border-2 border-ink-200 text-ink-700 hover:bg-ink-100 font-bold py-3 rounded-xl transition-colors">{{ $t('topup.cancel') }}</button>
          <button @click="submitTopup" :disabled="saldoStore.isLoading || !isValidTopup" class="flex-1 bg-orange-500 border-2 border-orange-500 text-white hover:bg-orange-600 font-bold py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <span v-if="saldoStore.isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ saldoStore.isLoading ? $t('topup.processing') : `${$t('topup.pay')} ${formatRupiah(totalAmount)}` }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Calendar, Wallet, Info, Download, Search, ChevronDown } from 'lucide-vue-next'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'

const { t } = useI18n()
const toast = useToast()
const saldoStore = useSaldoStore()
const adsStore = useAdsStore()

definePageMeta({
  layout: 'dashboard',
})

const activeTab = ref('semua')
const isDatePopoverOpen = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const startDate = ref<string>(thirtyDaysAgo.toISOString().split('T')[0] as string)
const endDate = ref<string>(today.toISOString().split('T')[0] as string)

const formattedDateRange = computed(() => {
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  
  const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
  const startStr = new Intl.DateTimeFormat('id-ID', formatOptions).format(start)
  const endStr = new Intl.DateTimeFormat('id-ID', formatOptions).format(end)
  
  return `${startStr} - ${endStr}`
})

const applyDateFilter = async () => {
  isDatePopoverOpen.value = false
  await adsStore.fetchAllPerformance(startDate.value, endDate.value)
}

const tabs = [
  { id: 'semua', label: t('topup.allTransactions') },
  { id: 'topup', label: t('topup.topupHistory') }
]

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka || 0)
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(d)
}

const filteredTransactions = computed(() => {
  let trxs = saldoStore.transactions
  
  // Date filter logic
  const start = new Date(startDate.value)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate.value)
  end.setHours(23, 59, 59, 999)
  
  trxs = trxs.filter(t => {
    if (!t.created_at) return false
    const d = new Date(t.created_at)
    return d >= start && d <= end
  })

  // Tab filter
  if (activeTab.value !== 'semua') {
    trxs = trxs.filter(t => t.type === activeTab.value)
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    trxs = trxs.filter(t => {
      if (statusFilter.value === 'success') return ['success', 'settled'].includes(t.status?.toLowerCase())
      if (statusFilter.value === 'failed') return ['failed', 'expired', 'cancelled'].includes(t.status?.toLowerCase())
      return t.status?.toLowerCase() === statusFilter.value
    })
  }

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    trxs = trxs.filter(t => {
      return (t.id && t.id.toLowerCase().includes(query)) || 
             (t.description && t.description.toLowerCase().includes(query)) ||
             (t.payment_gateway_ref && t.payment_gateway_ref.toLowerCase().includes(query))
    })
  }
  
  return trxs
})

const downloadReport = () => {
  if (filteredTransactions.value.length === 0) {
    toast.addToast(t('topup.noDataDownload'), 'error')
    return
  }

  const headers = ['Tanggal', 'ID Transaksi', 'Jenis Mutasi', 'Nominal', 'Keterangan', 'Status']
  
  const csvContent = [
    headers.join(','),
    ...filteredTransactions.value.map(t => {
      const date = formatDate(t.created_at).replace(/,/g, '')
      const id = t.id
      const type = t.type === 'topup' ? 'Top Up Saldo' : 'Alokasi Iklan'
      const amount = t.amount
      const desc = `"${(t.description || '-').replace(/"/g, '""')}"`
      const status = (t.status || '').toUpperCase()
      return `${date},${id},${type},${amount},${desc},${status}`
    })
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `laporan_transaksi_${formattedDateRange.value.replace(/ /g, '_')}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const isTopupModalOpen = ref(false)
const topupStep = ref(1)
const selectedPackage = ref('starter')
const topupAmount = ref<number | ''>('')
const selectedMethod = ref('OV')
const user = useSupabaseUser()

const activeRentals = computed(() => {
  if (!adsStore.adAccounts || adsStore.adAccounts.length === 0) return { accounts: [], total: 0 };
  const accountsWithExpiry = adsStore.adAccounts.filter(a => a.subscription_expires_at);
  if (accountsWithExpiry.length === 0) return { accounts: [], total: 0 };
  
  const sorted = [...accountsWithExpiry].sort((a, b) => new Date(a.subscription_expires_at).getTime() - new Date(b.subscription_expires_at).getTime());
  
  return {
    accounts: sorted.slice(0, 2),
    total: sorted.length
  };
})

const formattedTopupAmount = computed({
  get: () => {
    if (!topupAmount.value) return ''
    return new Intl.NumberFormat('id-ID').format(Number(topupAmount.value))
  },
  set: (val: string) => {
    const numericString = val.replace(/\D/g, '')
    topupAmount.value = numericString ? Number(numericString) : ''
  }
})

const packageInfo = computed(() => {
  if (selectedPackage.value === 'starter') return { fee: 0.05, min: 300000, max: 5000000 }
  if (selectedPackage.value === 'growth') return { fee: 0.045, min: 5000000, max: 15000000 }
  if (selectedPackage.value === 'scale') return { fee: 0.035, min: 15000000, max: Infinity }
  return { fee: 0, min: 0, max: 0 }
})

watch(selectedPackage, () => {
  topupAmount.value = packageInfo.value.min
})

const isValidTopup = computed(() => {
  const amt = Number(topupAmount.value)
  return !isNaN(amt) && amt >= packageInfo.value.min && amt <= packageInfo.value.max
})

const feeAmount = computed(() => {
  return Math.round(Number(topupAmount.value) * packageInfo.value.fee)
})

const totalAmount = computed(() => {
  return Number(topupAmount.value) + feeAmount.value
})

const handleTopup = () => {
  isTopupModalOpen.value = true
  topupStep.value = 1
  selectedPackage.value = 'starter'
  topupAmount.value = 300000
  selectedMethod.value = 'OV'
}

const submitTopup = async () => {
  if (!isValidTopup.value) return
  await saldoStore.topup(topupAmount.value as number, user.value, selectedMethod.value, selectedPackage.value)
  if (!saldoStore.error) {
    isTopupModalOpen.value = false
  }
}

onMounted(async () => {
  // Cek apakah user baru saja kembali dari halaman Duitku (Return URL)
  const route = useRoute()
  const router = useRouter()
  
  if (route.query.merchantOrderId) {
    try {
      // Panggil API check-status yang baru kita buat untuk verifikasi proaktif
      // Berguna terutama di localhost karena webhook tidak bisa masuk
      await $fetch('/api/duidku/check-status', {
        params: { orderId: route.query.merchantOrderId }
      })
      toast.addToast(t('topup.syncSuccess'), 'success')
      
      // Bersihkan URL agar tidak ter-trigger ulang saat refresh
      router.replace({ query: {} })
    } catch (error) {
      console.error(t('topup.syncFailed'), error)
    }
  }

  saldoStore.fetchSaldo()
  saldoStore.fetchTransactions()
  await adsStore.fetchAllPerformance(startDate.value, endDate.value)
})
</script>
