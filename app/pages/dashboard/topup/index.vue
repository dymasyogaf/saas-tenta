<template>
  <div class="max-w-7xl mx-auto space-y-6 pb-12">
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



    <!-- Pending Ad Account Alert -->
    <div v-for="req in pendingAccountRequests" :key="req.id" class="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex gap-3 items-start shadow-sm animate-fade-in">
      <div class="mt-0.5 text-blue-600 bg-blue-100 p-1.5 rounded-full shrink-0">
        <Info class="w-5 h-5" />
      </div>
      <div>
        <h4 class="font-bold text-blue-900 text-sm mb-1">{{ $t('topup.alertPendingAccountTitle', { platform: req.platform === 'meta' || req.platform === 'Meta Ads' ? 'Meta Ads' : req.platform === 'google' || req.platform === 'Google Ads' ? 'Google Ads' : req.platform }) }}</h4>
        <p class="text-sm text-blue-800">{{ $t('topup.alertPendingAccountDesc', { platform: req.platform === 'meta' || req.platform === 'Meta Ads' ? 'Meta Ads' : req.platform === 'google' || req.platform === 'Google Ads' ? 'Google Ads' : req.platform, amount: formatRupiah(req.rental_fee || 150000) }) }}</p>
      </div>
    </div>

    <!-- Pending Budget Request Alert -->
    <div v-for="trx in pendingAllocations" :key="trx.id" class="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 flex gap-3 items-start shadow-sm animate-fade-in">
      <div class="mt-0.5 text-orange-600 bg-orange-100 p-1.5 rounded-full shrink-0">
        <Info class="w-5 h-5" />
      </div>
      <div>
        <h4 class="font-bold text-orange-900 text-sm mb-1">{{ $t('topup.alertPendingBudgetTitle') }}</h4>
        <p class="text-sm text-orange-800">{{ $t('topup.alertPendingBudgetDesc', { account: extractAccountName(trx.description), amount: formatRupiah(trx.amount) }) }}</p>
      </div>
    </div>

    <!-- Top Section: Summary Cards -->
    <div class="flex flex-col lg:flex-row gap-6 mb-8">
      <!-- Left Card: Saldo -->
      <div class="bg-white rounded-3xl border border-ink-200 shadow-sm overflow-hidden flex flex-col relative h-full lg:w-1/3">
        <div class="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent pointer-events-none"></div>
        <div class="p-6 relative z-10 flex-1 flex flex-col justify-center">
          <div class="flex items-center justify-between mb-4">
            <div>
              <p class="text-sm font-medium text-ink-500 mb-2">{{ $t('topup.mainBalance') }}</p>
              <h3 class="text-3xl font-display font-bold text-ink-900">{{ formatRupiah(isGlobal ? saldoStore.usdBalance : saldoStore.balance) }}</h3>
            </div>
          </div>
        
        <div class="flex items-center gap-3 mb-6">
          <button @click="handleTopup" :disabled="saldoStore.isLoading" class="w-full bg-orange-500 border-2 border-orange-500 text-white hover:bg-orange-600 font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
            {{ saldoStore.isLoading ? $t('topup.processing') : $t('topup.addBalance') }}
          </button>
          <button @click="openAllocateBudgetModal" class="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold py-2.5 rounded-lg text-sm transition-colors">
            {{ $t('topup.allocateBudgetBtn') }}
          </button>
        </div>
        
        <hr class="border-ink-100 mb-6">
        
        <div class="mb-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-ink-500">{{ $t('topup.activePackage') }}</p>
              <div class="flex items-center gap-2">
                <p class="text-lg font-bold text-ink-900 capitalize">{{ displayActivePackage || $t('topup.noneYet') }}</p>
                <span 
                  v-if="displayActivePackage" 
                  :class="displayIsPackageExpired ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
                  class="px-2 py-0.5 rounded-full text-xs font-semibold"
                >
                  {{ displayIsPackageExpired ? $t('topup.expired') : $t('topup.daysRemaining', { days: displayDaysRemaining }) }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-ink-500">{{ $t('topup.weeklyLimit') }}</p>
              <p class="text-lg font-bold text-ink-900">{{ formattedWeeklyLimit }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 mt-3">
            <button 
              @click="isSwitchPackageModalOpen = true" 
              class="flex-1 bg-white hover:bg-ink-50 text-ink-700 border border-ink-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <svg class="w-3.5 h-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              {{ $t('topup.switchPackage') }}
            </button>
            <button 
              @click="openUpdatePackageModal" 
              class="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ displayActivePackage ? $t('topup.renewUpgrade') : $t('topup.getPackage') }}
            </button>
          </div>
        </div>
        
          <div class="flex-1 flex flex-col p-6 text-center border-l border-ink-100">
            <p class="text-sm font-medium text-ink-500 mb-2">{{ $t('topup.heldBalance') }}</p>
            <p class="text-lg font-bold text-ink-900 mb-4">{{ formatRupiah(isGlobal ? saldoStore.usdPendingBalance : saldoStore.pendingBalance) }}</p>
            <p class="text-xs text-ink-400 mb-2">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1"></span>
              {{ pendingTrx.length }} {{ $t('topup.activeRequests') }}
            </p>
          </div>

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
          
          <div class="bg-ink-50/50 rounded-lg p-5 flex flex-col justify-center border border-ink-100/50">
            <div class="flex items-center gap-1 mb-2">
              <p class="text-sm font-medium text-ink-500">{{ $t('topup.totalInboundBalance') }}</p>
            </div>
            <div class="flex items-center gap-2 text-blue-600">
              <template v-if="saldoStore.isLoading">
                <h3 class="text-3xl font-display font-bold"><span class="inline-block w-24 h-8 bg-ink-200 rounded animate-pulse"></span></h3>
              </template>
              <template v-else>
                <h3 class="text-3xl font-display font-bold">{{ formatRupiah(filteredTotalTopup) }}</h3>
              </template>
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
            <Download class="w-4 h-4" /> {{ $t('topup.downloadReportBtn') }}
          </button>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="p-5 flex flex-col md:flex-row items-start md:items-center justify-end gap-3">
        <div class="relative w-full md:w-72">
          <input type="text" v-model="searchQuery" :placeholder="$t('topup.searchTxId')" class="pl-4 pr-10 py-2.5 border border-ink-200 rounded-lg text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
        
        <div class="relative w-full md:w-56 z-10">
          <BaseSelect 
            v-model="statusFilter" 
            :options="statusFilterOptions"
            wrapperClass="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2.5 px-4 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
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
                <div class="flex flex-col items-end gap-2">
                  <span class="px-2.5 py-1 text-xs font-bold rounded-full" 
                    :class="{
                      'bg-green-100 text-green-700': trx.status === 'success' || trx.status === 'settled',
                      'bg-orange-100 text-orange-700': trx.status === 'pending',
                      'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'expired'
                    }">
                    {{ trx.status.toUpperCase() }}
                  </span>
                  <button v-if="(trx.status === 'success' || trx.status === 'settled') && trx.type === 'topup'" @click="openInvoice(trx)" class="text-xs text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1 mt-1 transition-colors">
                    <FileText class="w-3.5 h-3.5" /> {{ $t('topup.viewInvoice') }}
                  </button>
                  <button v-else-if="trx.status === 'pending' && trx.type === 'topup'" @click="resumePayment(trx)" class="text-xs text-orange-500 hover:text-orange-600 font-bold underline mt-1">
                    {{ $t('topup.resumePayment') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal Top Up -->
    <Teleport to="body">
    <div v-if="isTopupModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-3 sm:p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl lg:max-w-3xl overflow-hidden relative border border-ink-100 flex flex-col max-h-[88vh] sm:max-h-[90vh] my-auto">
        <div class="p-4 sm:p-6 border-b border-ink-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 class="text-lg sm:text-xl font-display font-bold text-ink-900">{{ topupStep === 1 ? $t('topup.choosePackageTitle') : $t('topup.topupAdBalance') }}</h3>
            <p class="text-ink-500 text-xs sm:text-sm mt-0.5 sm:mt-1">{{ topupStep === 1 ? $t('topup.choosePackageSubtitle') : $t('topup.selectPackageAndNominal') }}</p>
          </div>
          <button @click="isTopupModalOpen = false" class="text-ink-400 hover:text-ink-700 bg-ink-50 p-2 rounded-full transition-colors">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div class="p-4 sm:p-6 overflow-y-auto">
          <!-- Wizard Step 1: Pilih Paket -->
          <div v-if="topupStep === 1" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Starter -->
              <div 
                @click="selectedPackage = 'starter'" 
                :class="[
                  'border-2 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between h-full relative overflow-hidden',
                  selectedPackage === 'starter' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-md' : 'border-ink-100 bg-white hover:border-ink-300 hover:shadow-sm'
                ]"
              >
                <div>
                  <div class="flex items-center justify-between mb-2 h-7">
                    <h4 class="font-bold text-lg text-ink-900">{{ $t('topup.starter') }}</h4>
                  </div>
                  <div class="flex items-baseline gap-1.5 mb-4">
                    <span class="text-3xl font-display font-black text-ink-900 shrink-0">5%</span>
                    <span class="text-[11px] font-semibold text-ink-400 uppercase tracking-wider shrink-0 whitespace-nowrap">{{ $t('topup.topupFee') }}</span>
                  </div>

                  <!-- Highlight Limit & Masa Aktif Box -->
                  <div class="bg-orange-100/80 border border-orange-200 text-orange-950 rounded-xl p-3 mb-4 text-xs font-medium space-y-1.5">
                    <div class="flex justify-between items-center gap-1">
                      <span class="text-orange-700 font-semibold shrink-0">{{ $t('topup.adLimitLabel') }}:</span>
                      <span class="font-bold text-orange-900 text-right">{{ isGlobal ? '$10,000' : (locale === 'en' ? 'IDR 5,000,000' : 'Rp 5.000.000') }} / {{ $t('topup.weekShort') }}</span>
                    </div>
                    <div class="flex justify-between items-center pt-1.5 border-t border-orange-200/60 gap-1">
                      <span class="text-orange-700 font-semibold shrink-0">{{ $t('topup.activePeriodLabel') }}:</span>
                      <span class="font-bold text-emerald-700 text-right">28 {{ $t('topup.days') }}</span>
                    </div>
                  </div>

                  <ul class="space-y-2.5 text-xs text-ink-700">
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t(isGlobal ? 'topup.starterFeature1Usd' : 'topup.starterFeature1') }}</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t('topup.starterFeature2') }}</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t('topup.starterFeature3') }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Growth -->
              <div 
                @click="selectedPackage = 'growth'" 
                :class="[
                  'border-2 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between h-full relative overflow-hidden',
                  selectedPackage === 'growth' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-md' : 'border-ink-100 bg-white hover:border-ink-300 hover:shadow-sm'
                ]"
              >
                <div>
                  <div class="flex items-center justify-between mb-2 h-7">
                    <h4 class="font-bold text-lg text-ink-900">{{ $t('topup.growth') }}</h4>
                    <span class="bg-orange-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shrink-0">
                      {{ $t('topup.mostPopular') }}
                    </span>
                  </div>
                  <div class="flex items-baseline gap-1.5 mb-4">
                    <span class="text-3xl font-display font-black text-ink-900 shrink-0">{{ isGlobal ? '4%' : '4.5%' }}</span>
                    <span class="text-[11px] font-semibold text-ink-400 uppercase tracking-wider shrink-0 whitespace-nowrap">{{ $t('topup.topupFee') }}</span>
                  </div>

                  <!-- Highlight Limit & Masa Aktif Box -->
                  <div class="bg-orange-100/80 border border-orange-200 text-orange-950 rounded-xl p-3 mb-4 text-xs font-medium space-y-1.5">
                    <div class="flex justify-between items-center gap-1">
                      <span class="text-orange-700 font-semibold shrink-0">{{ $t('topup.adLimitLabel') }}:</span>
                      <span class="font-bold text-orange-900 text-right">{{ isGlobal ? '$50,000' : (locale === 'en' ? 'IDR 15,000,000' : 'Rp 15.000.000') }} / {{ $t('topup.weekShort') }}</span>
                    </div>
                    <div class="flex justify-between items-center pt-1.5 border-t border-orange-200/60 gap-1">
                      <span class="text-orange-700 font-semibold shrink-0">{{ $t('topup.activePeriodLabel') }}:</span>
                      <span class="font-bold text-emerald-700 text-right">28 {{ $t('topup.days') }}</span>
                    </div>
                  </div>

                  <ul class="space-y-2.5 text-xs text-ink-700">
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t(isGlobal ? 'topup.growthFeature1Usd' : 'topup.growthFeature1') }}</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t('topup.growthFeature2') }}</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t('topup.growthFeature3') }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Scale -->
              <div 
                @click="selectedPackage = 'scale'" 
                :class="[
                  'border-2 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between h-full relative overflow-hidden',
                  selectedPackage === 'scale' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-md' : 'border-ink-100 bg-white hover:border-ink-300 hover:shadow-sm'
                ]"
              >
                <div>
                  <div class="flex items-center justify-between mb-2 h-7">
                    <h4 class="font-bold text-lg text-ink-900">{{ $t('topup.scale') }}</h4>
                  </div>
                  <div class="flex items-baseline gap-1.5 mb-4">
                    <span class="text-3xl font-display font-black text-ink-900 shrink-0">{{ isGlobal ? '3%' : '3.5%' }}</span>
                    <span class="text-[11px] font-semibold text-ink-400 uppercase tracking-wider shrink-0 whitespace-nowrap">{{ $t('topup.topupFee') }}</span>
                  </div>

                  <!-- Highlight Limit & Masa Aktif Box -->
                  <div class="bg-orange-100/80 border border-orange-200 text-orange-950 rounded-xl p-3 mb-4 text-xs font-medium space-y-1.5">
                    <div class="flex justify-between items-center gap-1">
                      <span class="text-orange-700 font-semibold shrink-0">{{ $t('topup.adLimitLabel') }}:</span>
                      <span class="font-bold text-orange-900 text-right">Unlimited</span>
                    </div>
                    <div class="flex justify-between items-center pt-1.5 border-t border-orange-200/60 gap-1">
                      <span class="text-orange-700 font-semibold shrink-0">{{ $t('topup.activePeriodLabel') }}:</span>
                      <span class="font-bold text-emerald-700 text-right">28 {{ $t('topup.days') }}</span>
                    </div>
                  </div>

                  <ul class="space-y-2.5 text-xs text-ink-700">
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t(isGlobal ? 'topup.scaleFeature1Usd' : 'topup.scaleFeature1') }}</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t('topup.scaleFeature2') }}</span>
                    </li>
                    <li class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-orange-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                      <span>{{ $t('topup.scaleFeature3') }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="mt-6 flex justify-end">
              <button @click="topupStep = 2" class="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm">{{ $t('topup.continue') }}</button>
            </div>
          </div>

          <!-- Wizard Step 2: Nominal & Metode -->
          <div v-if="topupStep === 2" class="space-y-6 max-w-lg mx-auto">
            <!-- Selected Package Header Banner -->
            <div class="bg-orange-50/80 border-2 border-orange-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-orange-500 text-white rounded-xl shadow-md shrink-0">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 001.946.806 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-semibold text-ink-500 uppercase tracking-wider">{{ selectedPackage ? $t('topup.selectedPackage') : $t('topup.detectedPackage') }}</span>
                    <h4 class="font-extrabold text-base text-ink-900 capitalize">{{ effectivePackage }}</h4>
                    <span class="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-extrabold rounded-full uppercase">
                      Fee {{ formattedFeePercent }}%
                    </span>
                  </div>
                  <p class="text-xs text-ink-600 mt-0.5">
                    Limit: <strong>{{ selectedPackageLimitText }}</strong> • {{ $t('topup.activeDurationLabel') }}: <strong class="text-emerald-700">28 {{ $t('topup.days') }}</strong>
                  </p>
                </div>
              </div>
              <button 
                @click="topupStep = 1" 
                class="text-xs font-bold text-orange-600 hover:text-orange-700 bg-white border border-orange-200 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                {{ $t('topup.selectPackageBtn') }}
              </button>
            </div>

            <div>
              <label class="block text-sm font-semibold text-ink-800 mb-1.5">{{ $t('topup.topupNominalLabel', { package: effectivePackage.charAt(0).toUpperCase() + effectivePackage.slice(1) }) }}</label>
              <p class="text-xs text-ink-500 mb-2">{{ $t('topup.rangeLabel', { min: formatRupiah(packageInfo.min), max: packageInfo.max === Infinity ? $t('topup.unlimited') : formatRupiah(packageInfo.max) }) }}</p>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-medium text-lg">{{ isGlobal ? '$' : 'Rp' }}</span>
                <input 
                  type="text" 
                  inputmode="numeric"
                  :value="formattedTopupAmount" 
                  @input="onAmountInput"
                  class="w-full pl-12 pr-4 py-3 bg-white border-2 border-ink-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 font-bold text-ink-900 text-lg transition-all" 
                />
              </div>
              <p v-if="!isValidTopup && topupAmount" class="text-xs font-medium text-red-500 mt-1.5">
                {{ $t('topup.invalidNominal', { package: effectivePackage.charAt(0).toUpperCase() + effectivePackage.slice(1), min: formatRupiah(packageInfo.min), max: packageInfo.max === Infinity ? $t('topup.unlimited') : formatRupiah(packageInfo.max) }) }}
              </p>
            </div>
            
            <div class="bg-ink-50 rounded-xl p-4 border border-ink-100 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-ink-500">{{ $t('topup.inboundBalanceLabel') }}</span>
                <span class="font-bold text-ink-900">{{ formatRupiah(Number(topupAmount) || 0) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-ink-500">{{ $t('topup.topupFeeLabel', { fee: formattedFeePercent }) }}</span>
                <span class="font-bold text-ink-900">{{ formatRupiah(feeAmount) }}</span>
              </div>
              <hr class="border-ink-200 my-2">
              <div class="flex justify-between text-base">
                <span class="font-bold text-ink-900">{{ $t('topup.totalPaymentLabel') }}</span>
                <span class="font-bold text-orange-600">{{ formatRupiah(totalAmount) }}</span>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-2.5">{{ $t('topup.paymentMethod') }}</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div v-for="method in paymentMethods" :key="method.value" 
                     @click="selectedMethod = method.value"
                     :class="['border-2 rounded-xl p-2 sm:p-3 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 h-20 sm:h-24 text-center relative', selectedMethod === method.value ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50']">
                  <div v-if="selectedMethod === method.value" class="absolute top-1.5 right-1.5 text-orange-500">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  </div>
                  <img :src="method.logo" :alt="method.name" class="h-5 sm:h-6 w-full object-contain" />
                  <span class="text-[11px] sm:text-xs font-bold text-ink-800 leading-tight">{{ method.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="topupStep === 2" class="p-3.5 sm:p-5 bg-ink-50 flex gap-2.5 sm:gap-3 border-t border-ink-100 shrink-0 mt-auto shadow-md relative z-10">
          <button @click="isTopupModalOpen = false" class="flex-1 bg-white border-2 border-ink-200 text-ink-700 hover:bg-ink-100 font-bold py-2.5 sm:py-3 rounded-xl transition-colors text-sm sm:text-base">{{ $t('topup.cancel') }}</button>
          <button @click="submitTopup" :disabled="saldoStore.isLoading || !isValidTopup" class="flex-1 bg-orange-500 border-2 border-orange-500 text-white hover:bg-orange-600 font-bold py-2.5 sm:py-3 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base">
            <span v-if="saldoStore.isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ saldoStore.isLoading ? $t('topup.processing') : `${$t('topup.pay')} ${formatRupiah(totalAmount)}` }}
          </button>
        </div>
      </div>
    </div>
    </Teleport>


    <!-- Allocate Budget Modal Component -->
    <ModalAllocateBudgetModal 
      :is-open="isAllocateBudgetModalOpen"
      @close="isAllocateBudgetModalOpen = false"
      @success="() => { adsStore.fetchAdAccounts(); saldoStore.fetchTransactions(); saldoStore.fetchSaldo(); }"
    />

    <InvoiceModal :is-open="isInvoiceModalOpen" :transaction="selectedInvoiceTransaction" @close="isInvoiceModalOpen = false" />
    <DashboardSwitchPackageModal :is-open="isSwitchPackageModalOpen" @close="isSwitchPackageModalOpen = false" />

    <!-- NOWPayments USDT QR Modal (Global/area.tentaklik.com only) -->
    <ModalNowPaymentQRModal
      :is-open="isQRModalOpen"
      :pay-data="nowPaymentData"
      @close="isQRModalOpen = false"
      @success="handleNowPaymentSuccess"
    />

  </div>
</template>

<script setup lang="ts">
import { Calendar, Wallet, Info, Download, Search, ChevronDown, X, Loader2, FileText } from 'lucide-vue-next'
import InvoiceModal from '~/components/dashboard/InvoiceModal.vue'
import { useSupabaseClient } from '#imports'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'
import { useI18n } from 'vue-i18n'
import { useToast } from '#imports'
import { useSupabaseUser, useCsrf } from '#imports'
import { useAppMode } from '~/composables/useAppMode'

const { t, locale } = useI18n()
const toast = useToast()
const router = useRouter()
const saldoStore = useSaldoStore()
const adsStore = useAdsStore()
const { csrf } = useCsrf()
const { isGlobal, isLocal } = useAppMode()

const paymentMethods = computed(() => {
  if (isGlobal.value) {
    return [
      { value: 'USDT_TRC20', name: 'USDT (TRC20)', logo: '/logos/usdt.svg' }
    ]
  }
  return [
    { value: 'M2', name: 'Mandiri VA', logo: '/logos/mandiri.png' },
    { value: 'I1', name: 'BNI VA', logo: '/logos/bni.png' },
    { value: 'B1', name: 'BSI VA', logo: '/logos/bsi.png' },
    { value: 'A1', name: 'ATM Bersama', logo: '/logos/atmbersama.png' },
    { value: 'FT', name: 'Alfamart', logo: '/logos/alfamart.svg' },
    { value: 'IR', name: 'Indomaret', logo: '/logos/indomaret.png' },
  ]
})

import BaseSelect from '~/components/ui/BaseSelect.vue'

definePageMeta({
  layout: 'dashboard',
})

onMounted(() => {
  saldoStore.fetchSaldo()
  saldoStore.fetchTransactions()
  fetchPendingRequests()
})

const isInvoiceModalOpen = ref(false)
const selectedInvoiceTransaction = ref<any>(null)

const openInvoice = (trx: any) => {
  selectedInvoiceTransaction.value = trx
  isInvoiceModalOpen.value = true
}

const resumePayment = (trx: any) => {
  if (!trx) return

  const txRef = trx.payment_gateway_ref || ''
  const txDesc = trx.description || ''
  const isUsdTrx = trx.currency === 'USD' || txRef.startsWith('NP-') || txRef.startsWith('USDT-') || txDesc.includes('USDT') || txDesc.includes('NOWPayments')

  let pd = trx.payment_data
  if (typeof pd === 'string') {
    try { pd = JSON.parse(pd) } catch (e) { pd = null }
  }

  // NOWPayments (USD / Crypto) Transaction
  if (isUsdTrx) {
    const payAddress = pd?.payAddress
    const payAmount = pd?.payAmount
    const paymentId = pd?.paymentId

    const rawAmt = parseFloat(String(payAmount || pd?.totalAmount || Number(trx.amount || 0) * 1.05))
    const formattedAmt = (!rawAmt || isNaN(rawAmt)) ? '31.50' : rawAmt.toFixed(2)

    const query: Record<string, string> = {
      orderId: String(pd?.merchantOrderId || trx.payment_gateway_ref || ''),
      paymentId: String(paymentId || ''),
      ref: String(trx.payment_gateway_ref || ''),
      payAddress: String(payAddress || ''),
      payAmount: formattedAmt,
      method: 'USDT TRC-20 (Crypto)',
      bank: 'USDT TRC-20',
      amount: String(pd?.totalAmount || (Number(trx.amount || 0) * 1.05)),
      net: String(pd?.netAmount || trx.amount || 0),
      fee: String(pd?.feeAmount || (Number(trx.amount || 0) * 0.05)),
      pkg: String(pd?.packageType || trx.package_selected || 'starter'),
      createdAt: String(trx.created_at || new Date().toISOString())
    }

    Object.keys(query).forEach(k => {
      if (query[k] === 'undefined' || query[k] === 'null' || !query[k]) {
        delete query[k]
      }
    })

    router.push({
      path: '/dashboard/topup/payment',
      query
    })
    return
  }

  if (!pd) return

  const query: Record<string, string> = {
    orderId: String(pd.merchantOrderId || trx.payment_gateway_ref || ''),
    ref: String(trx.payment_gateway_ref || ''),
    va: String(pd.vaNumber || pd.paymentCode || ''),
    bank: String(pd.method || 'M2'),
    bankCode: String(pd.bankCode || ''),
    method: String(pd.paymentName || 'Transfer Bank'),
    amount: String(pd.paymentAmount || trx.amount || 0),
    net: String(pd.netAmount || trx.amount || 0),
    fee: String(pd.feeAmount || 0),
    pkg: String(pd.packageType || trx.package_selected || 'starter'),
    createdAt: String(trx.created_at || new Date().toISOString())
  }

  // Hapus query yang kosong atau "undefined"
  Object.keys(query).forEach(k => {
    if (query[k] === 'undefined' || query[k] === 'null' || !query[k]) {
      delete query[k]
    }
  })
  
  router.push({
    path: '/dashboard/topup/payment',
    query
  })
}

const pendingAccountRequests = ref<any[]>([])

const pendingTrx = computed(() => {
  return saldoStore.transactions.filter(t => t.type === 'topup' && t.status === 'pending')
})

const pendingAllocations = computed(() => {
  return saldoStore.transactions.filter(t => t.type === 'payment' && t.status === 'pending' && t.description?.includes('Alokasi Anggaran'))
})

const extractAccountName = (desc: string) => {
  if (!desc) return ''
  const parts = desc.split(' - ')
  // Gabungkan kembali sisa array jika nama akun mengandung karakter strip (dash)
  return parts.length > 1 ? parts.slice(1).join(' - ') : desc
}

const fetchPendingRequests = async () => {
  const supabase = useSupabaseClient<any>()
  const u = useSupabaseUser()
  const uid = u.value?.id || (u.value as any)?.sub
  if (!uid) return
  
  const { data } = await supabase
    .from('ad_account_requests')
    .select('*')
    .eq('user_id', uid)
    .in('status', ['pending_review', 'processing'])
    
  if (data) {
    pendingAccountRequests.value = data
  }
}

const activeTab = ref('semua')
const isDatePopoverOpen = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')
const statusFilterOptions = computed(() => [
  { label: t('topup.allStatus'), value: 'all' },
  { label: t('topup.success'), value: 'success' },
  { label: t('topup.pending'), value: 'pending' },
  { label: t('topup.failed'), value: 'failed' },
])

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const getLocalYYYYMMDD = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const startDate = ref<string>(getLocalYYYYMMDD(thirtyDaysAgo))
const endDate = ref<string>(getLocalYYYYMMDD(today))

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
  if (isGlobal.value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(angka || 0)
  }
  if (locale.value === 'en') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(angka || 0)
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka || 0)
}

const filteredTotalTopup = computed(() => {
  const start = new Date(startDate.value)
  start.setHours(0, 0, 0, 0)
  const end = new Date(endDate.value)
  end.setHours(23, 59, 59, 999)
  
  return saldoStore.transactions.reduce((sum, trx) => {
    if (trx.type === 'topup' && (trx.status === 'success' || trx.status === 'settled')) {
      const trxDate = new Date(trx.created_at)
      if (trxDate >= start && trxDate <= end) {
        return sum + Number(trx.amount || 0)
      }
    }
    return sum
  }, 0)
})

const availableBalance = computed(() => {
  if (isGlobal.value) {
    return Number(saldoStore.usdBalance || 0) - Number(saldoStore.usdPendingBalance || 0)
  }
  return Number(saldoStore.balance || 0) - Number(saldoStore.pendingBalance || 0)
})

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
const selectedMethod = ref('M2')
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
    if (topupAmount.value === '' || topupAmount.value === null || topupAmount.value === undefined) return ''
    if (isGlobal.value) {
      return new Intl.NumberFormat('en-US').format(Number(topupAmount.value))
    }
    return new Intl.NumberFormat('id-ID').format(Number(topupAmount.value))
  },
  set: (val: string) => {
    if (!val) {
      topupAmount.value = ''
      return
    }
    if (isGlobal.value) {
      // USD mode: allow numbers and single decimal dot
      const cleanStr = val.replace(/,/g, '').replace(/[^0-9.]/g, '')
      topupAmount.value = cleanStr ? Number(cleanStr) : ''
    } else {
      // IDR mode: strip all non-digits (id-ID uses dots as thousand separators)
      const digitsOnly = val.replace(/\D/g, '')
      topupAmount.value = digitsOnly ? Number(digitsOnly) : ''
    }
  }
})

const onAmountInput = (e: Event) => {
  const inputEl = e.target as HTMLInputElement
  const rawValue = inputEl.value

  if (!rawValue) {
    topupAmount.value = ''
    inputEl.value = ''
    return
  }

  if (isGlobal.value) {
    const cleanStr = rawValue.replace(/,/g, '').replace(/[^0-9.]/g, '')
    topupAmount.value = cleanStr ? Number(cleanStr) : ''
  } else {
    const digitsOnly = rawValue.replace(/\D/g, '')
    topupAmount.value = digitsOnly ? Number(digitsOnly) : ''
  }

  // Force DOM element to display formatted number immediately, blocking any typed letters
  nextTick(() => {
    inputEl.value = formattedTopupAmount.value
  })
}

const effectivePackage = computed(() => {
  if (selectedPackage.value) return selectedPackage.value
  const amt = Number(topupAmount.value) || 0
  if (isGlobal.value) {
    if (amt >= 51000) return 'scale'
    if (amt >= 11000) return 'growth'
    return 'starter'
  } else {
    if (amt >= 15500000) return 'scale'
    if (amt >= 5500000) return 'growth'
    return 'starter'
  }
})

const packageInfo = computed(() => {
  const pkg = effectivePackage.value
  if (isGlobal.value) {
    if (pkg === 'scale') return { fee: 0.03, min: selectedPackage.value ? 51000 : 30, max: Infinity }
    if (pkg === 'growth') return { fee: 0.04, min: selectedPackage.value ? 11000 : 30, max: selectedPackage.value ? 50000 : Infinity }
    return { fee: 0.05, min: 30, max: selectedPackage.value ? 10000 : Infinity }
  } else {
    if (pkg === 'scale') return { fee: 0.035, min: selectedPackage.value ? 15500000 : 300000, max: Infinity }
    if (pkg === 'growth') return { fee: 0.045, min: selectedPackage.value ? 5500000 : 300000, max: selectedPackage.value ? 15000000 : Infinity }
    return { fee: 0.05, min: 300000, max: selectedPackage.value ? 5000000 : Infinity }
  }
})

const formattedFeePercent = computed(() => {
  return Number((packageInfo.value.fee * 100).toFixed(2)).toString()
})

const displayActivePackage = computed(() => {
  return isGlobal.value ? saldoStore.usdActivePackage : saldoStore.activePackage
})

const displayIsPackageExpired = computed(() => {
  return isGlobal.value ? saldoStore.isUsdPackageExpired : saldoStore.isPackageExpired
})

const displayDaysRemaining = computed(() => {
  return isGlobal.value ? saldoStore.usdDaysRemaining : saldoStore.daysRemaining
})

const selectedPackageLimitText = computed(() => {
  const pkg = effectivePackage.value
  if (pkg === 'scale') return 'Unlimited'
  if (pkg === 'growth') return isGlobal.value ? '$50,000 / week' : 'Rp 15.000.000 / mgg'
  return isGlobal.value ? '$30 - $10,000' : 'Rp 300.000 - Rp 5.000.000'
})

const formattedWeeklyLimit = computed(() => {
  if (isGlobal.value) {
    return saldoStore.formattedUsdWeeklyLimit
  }
  return saldoStore.formattedWeeklyLimit
})

watch(selectedPackage, (newPkg) => {
  if (newPkg) {
    topupAmount.value = packageInfo.value.min
  }
})

const isValidTopup = computed(() => {
  const amt = Number(topupAmount.value)
  if (isNaN(amt) || !amt) return false
  if (amt < packageInfo.value.min) return false
  if (packageInfo.value.max !== Infinity && amt > packageInfo.value.max) return false
  return true
})

const feeAmount = computed(() => {
  if (isGlobal.value) {
    return Number(topupAmount.value) * packageInfo.value.fee
  }
  return Math.round(Number(topupAmount.value) * packageInfo.value.fee)
})

const totalAmount = computed(() => {
  return Number(topupAmount.value) + feeAmount.value
})

const handleTopup = () => {
  isTopupModalOpen.value = true
  topupStep.value = 2
  selectedPackage.value = ''
  topupAmount.value = isGlobal.value ? 30 : 300000
  selectedMethod.value = isGlobal.value ? 'USDT_TRC20' : 'M2'
}

const openUpdatePackageModal = () => {
  isTopupModalOpen.value = true
  topupStep.value = 1
  selectedPackage.value = (isGlobal.value ? saldoStore.usdActivePackage : saldoStore.activePackage) || 'starter'
  topupAmount.value = isGlobal.value ? 30 : 300000
}

// NOWPayments QR Modal state
const isQRModalOpen = ref(false)
const nowPaymentData = ref<{
  paymentId: string
  payAddress: string
  payAmount: number
  merchantOrderId: string
  netAmount: number
  feeAmount: number
  totalAmount: number
  packageType: string
  expirationEstimate: string
} | null>(null)

const handleNowPaymentSuccess = () => {
  isQRModalOpen.value = false
  nowPaymentData.value = null
  isTopupModalOpen.value = false
  topupStep.value = 1
  // Refresh saldo and transactions
  saldoStore.fetchSaldo()
  saldoStore.fetchTransactions()
  toast.addToast('Payment successful! Your USD balance has been updated.', 'success')
}

const submitTopup = async () => {
  if (!isValidTopup.value) return
  const pkgToUse = effectivePackage.value
  
  if (isGlobal.value) {
    saldoStore.isLoading = true
    try {
      const response = await $fetch<any>('/api/nowpayments/create-payment', {
        method: 'POST',
        headers: unref(csrf) ? { 'x-csrf-token': unref(csrf), 'csrf-token': unref(csrf) } : {},
        body: {
          amount: topupAmount.value,
          packageType: pkgToUse
        }
      })
      if (response && response.success) {
        isTopupModalOpen.value = false
        const rawPay = response.payAmount ? parseFloat(String(response.payAmount)) : Number(response.totalAmount)
        const formattedPay = (!rawPay || isNaN(rawPay)) ? '31.50' : rawPay.toFixed(2)

        router.push({
          path: '/dashboard/topup/payment',
          query: {
            orderId: response.merchantOrderId,
            paymentId: response.paymentId,
            ref: response.merchantOrderId,
            payAddress: response.payAddress,
            payAmount: formattedPay,
            method: 'USDT TRC-20 (Crypto)',
            bank: 'USDT TRC-20',
            amount: String(response.totalAmount),
            net: String(response.netAmount),
            fee: String(response.feeAmount),
            pkg: response.packageType,
            createdAt: new Date().toISOString()
          }
        })
      }
    } catch (err: any) {
      console.error('NOWPayments submit error:', err)
      const msg = err.data?.statusMessage || err.data?.message || err.statusMessage || err.message || 'Failed to create payment'
      toast.addToast(msg, 'error')
    } finally {
      saldoStore.isLoading = false
    }
    return
  }

  const csrfToken = unref(csrf)
  await saldoStore.topup(topupAmount.value as number, user.value, selectedMethod.value, pkgToUse, csrfToken)
  if (!saldoStore.error) {
    isTopupModalOpen.value = false
    topupStep.value = 1
  }
}

const isSwitchPackageModalOpen = ref(false)
const isAllocateBudgetModalOpen = ref(false)
const allocateSelectedAccount = ref('')
const allocateAmountInput = ref('')
const allocateAmount = ref(0)
const isAllocatingBudget = ref(false)

const openAllocateBudgetModal = () => {
  allocateSelectedAccount.value = ''
  allocateAmountInput.value = ''
  allocateAmount.value = 0
  isAllocateBudgetModalOpen.value = true
}

const formatAllocateInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value.replace(/\D/g, '')
  if (!val) {
    allocateAmountInput.value = ''
    allocateAmount.value = 0
    return
  }
  allocateAmount.value = parseInt(val, 10)
  allocateAmountInput.value = new Intl.NumberFormat(isGlobal.value ? 'en-US' : (locale.value === 'en' ? 'en-US' : 'id-ID')).format(allocateAmount.value)
}

const submitAllocateBudget = async () => {
  if (!allocateSelectedAccount.value || allocateAmount.value <= 0 || allocateAmount.value > availableBalance.value) {
    return
  }
  
  isAllocatingBudget.value = true
  try {
    const csrfToken = unref(csrf)
    const res = await $fetch('/api/ads/add-budget', {
      method: 'POST',
      headers: csrfToken ? { 'x-csrf-token': csrfToken, 'csrf-token': csrfToken } : {},
      body: {
        accountId: allocateSelectedAccount.value,
        amount: allocateAmount.value,
        isGlobal: isGlobal.value
      }
    })
    
    toast.addToast((res as any).message || (isGlobal.value ? 'Budget allocation request successfully submitted' : 'Permintaan anggaran berhasil dikirim'), 'success')
    
    // Refresh data
    await saldoStore.fetchSaldo()
    await saldoStore.fetchTransactions()
    await adsStore.fetchAdAccounts()
    isAllocateBudgetModalOpen.value = false
  } catch (error: any) {
    toast.addToast(error.data?.statusMessage || error.data?.message || error.message || (isGlobal.value ? 'Failed to allocate budget' : 'Gagal mengalokasikan anggaran'), 'error')
  } finally {
    isAllocatingBudget.value = false
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
      
      const orderId = route.query.merchantOrderId as string
      // Bersihkan URL agar tidak ter-trigger ulang saat refresh
      router.replace({ query: {} })

      // Ambil transaksi terbaru untuk menampilkan modal invoice
      await saldoStore.fetchTransactions()
      const foundTx = saldoStore.transactions.find(t => t.payment_gateway_ref === orderId || t.payment_data?.merchantOrderId === orderId)
      if (foundTx && (foundTx.status === 'success' || foundTx.status === 'settled')) {
        openInvoice(foundTx)
      }
    } catch (error) {
      console.error(t('topup.syncFailed'), error)
    }
  }

  if (route.query.action === 'topup') {
    handleTopup()
  } else if (route.query.action === 'update_package' || route.query.action === 'update' || route.query.action === 'package') {
    openUpdatePackageModal()
  }

  saldoStore.fetchSaldo()
  saldoStore.fetchTransactions()
  adsStore.fetchAdAccounts()
  await adsStore.fetchAllPerformance(startDate.value, endDate.value)
  fetchPendingRequests()
})
</script>
