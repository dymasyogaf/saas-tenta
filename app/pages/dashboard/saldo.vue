<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <h2 class="text-2xl font-display font-bold text-ink-900">{{ $t('saldo.myBalance') }}</h2>
      
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <!-- Date Filter -->
        <div v-if="['list-saldo', 'histori-topup', 'histori-pindah', 'histori-tambahan', 'histori-pengganti'].includes(activeTab)" class="block">
          <SharedDateRangePicker v-model="dateRange" />
        </div>
        
        <!-- Filters for Histori Akun Pengganti -->
        <div v-if="activeTab === 'histori-pengganti'" class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div class="relative w-full sm:w-44">
            <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm cursor-pointer">
              <option>{{ $t('saldo.selectPlatform') }}</option>
              <option>Meta Ads</option>
              <option>Tiktok Ads</option>
              <option>Google Ads</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
          <div class="relative w-full sm:w-56">
            <select class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm cursor-pointer">
              <option>{{ $t('saldo.allStatus') }}</option>
              <option>{{ $t('saldo.waitingApproval') }}</option>
              <option>{{ $t('saldo.beingProcessed') }}</option>
              <option>{{ $t('saldo.approved') }}</option>
              <option>{{ $t('saldo.requestRejected') }}</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-ink-200 mb-6 flex gap-8 overflow-x-auto hide-scrollbar whitespace-nowrap">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id" 
        :class="[
          'pb-3.5 text-sm px-1 border-b-2 transition-colors',
          activeTab === tab.id 
            ? 'font-semibold text-orange-500 border-orange-500' 
            : 'font-medium text-ink-600 hover:text-ink-900 border-transparent'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>
    
    <!-- Tab Contents -->
    
    <!-- List Saldo -->
    <div v-if="activeTab === 'list-saldo'">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <button 
            @click="syncAds"
            :disabled="adsStore.isFetchingAccounts"
            class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-md text-sm font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': adsStore.isFetchingAccounts }" />
            {{ $t('saldo.syncNow') }}
          </button>
          
          <button 
            @click="isRequestModalOpen = true"
            class="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 border border-orange-600 text-white rounded-md text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
          >
            <PlusCircle class="w-4 h-4" />
            {{ $t('saldo.addAccount') }}
          </button>
        </div>
        <div class="flex items-center gap-3 w-full lg:w-auto mt-4 sm:mt-0">
          <div class="relative min-w-[140px] shrink-0">
            <select v-model="sortOrder" class="appearance-none pl-4 pr-10 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 bg-white cursor-pointer">
              <option value="terbaru">{{ $t('saldo.newest') }}</option>
              <option value="terlama">{{ $t('saldo.oldest') }}</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
          <div class="relative w-full lg:w-72">
            <input v-model="searchQuery" type="text" :placeholder="$t('saldo.searchAccount')" class="pl-4 pr-10 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
            <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
          </div>
        </div>
      </div>
      
      <div class="overflow-x-auto bg-white border border-ink-200 rounded-xl shadow-sm hide-scrollbar" style="scrollbar-width: thin;">
        <table class="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr class="border-b border-ink-200 bg-ink-50/50 text-[11px] font-bold text-ink-500 uppercase tracking-wider">
              <th class="py-4 px-5 whitespace-nowrap">
                <div class="flex items-center gap-1.5 w-max">
                  {{ $t('saldo.table.accountId') }}
                  <SharedTooltip :text="$t('saldo.table.accountIdTooltip')">
                    <Info class="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 transition-colors cursor-help" />
                  </SharedTooltip>
                </div>
              </th>
              <th class="py-4 px-5 whitespace-nowrap">
                <div class="flex items-center gap-1.5 w-max">
                  {{ $t('saldo.table.accountName') }}
                  <SharedTooltip :text="$t('saldo.table.accountNameTooltip')">
                    <Info class="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 transition-colors cursor-help" />
                  </SharedTooltip>
                </div>
              </th>
              <th class="py-4 px-5 whitespace-nowrap">
                <div class="flex items-center gap-1.5 w-max">
                  {{ $t('saldo.table.platform') }}
                  <SharedTooltip :text="$t('saldo.table.platformTooltip')">
                    <Info class="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 transition-colors cursor-help" />
                  </SharedTooltip>
                </div>
              </th>
              <th class="py-4 px-5 whitespace-nowrap">
                <div class="flex items-center gap-1.5 w-max">
                  {{ $t('saldo.table.balance') }}
                  <SharedTooltip :text="$t('saldo.table.balanceTooltip')">
                    <Info class="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 transition-colors cursor-help" />
                  </SharedTooltip>
                </div>
              </th>
              <th class="py-4 px-5 whitespace-nowrap">
                <div class="flex items-center gap-1.5 w-max">
                  {{ $t('saldo.table.limit') }}
                  <SharedTooltip :text="$t('saldo.table.limitTooltip')">
                    <Info class="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 transition-colors cursor-help" />
                  </SharedTooltip>
                </div>
              </th>
              <th class="py-4 px-5 whitespace-nowrap">
                <div class="flex items-center gap-1.5 w-max">
                  {{ $t('saldo.table.usage') }}
                  <SharedTooltip :text="$t('saldo.table.usageTooltip')">
                    <Info class="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 transition-colors cursor-help" />
                  </SharedTooltip>
                </div>
              </th>
              <th class="py-4 px-5 whitespace-nowrap">
                <div class="flex items-center gap-1.5 w-max">
                  {{ $t('saldo.table.dailySpend') }}
                  <SharedTooltip :text="$t('saldo.table.dailySpendTooltip')">
                    <Info class="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 transition-colors cursor-help" />
                  </SharedTooltip>
                </div>
              </th>
              <th class="py-4 px-5 whitespace-nowrap">
                <div class="flex items-center gap-1.5 w-max">
                  {{ $t('saldo.table.lastUpdate') }}
                  <SharedTooltip :text="$t('saldo.table.lastUpdateTooltip')">
                    <Info class="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 transition-colors cursor-help" />
                  </SharedTooltip>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="text-[13px] text-ink-900 divide-y divide-ink-100">
            <!-- Skeleton Loading -->
            <tr v-if="adsStore.isFetchingAccounts" v-for="i in 3" :key="'skeleton-'+i">
              <td colspan="9" class="p-4">
                <div class="flex items-center gap-4 animate-pulse">
                  <div class="h-6 bg-ink-200 rounded w-1/4"></div>
                  <div class="h-6 bg-ink-200 rounded w-1/4"></div>
                  <div class="h-6 bg-ink-200 rounded w-1/4"></div>
                </div>
              </td>
            </tr>
            <!-- Actual Data -->
            <tr v-else-if="filteredAdAccounts.length > 0" v-for="account in filteredAdAccounts" :key="account.id" class="transition-colors group border-b border-ink-100 relative" :class="getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0 ? 'bg-ink-50/50' : 'hover:bg-ink-50/50'">
              
              <!-- Kolom Pertama dengan Overlay Badge (Center Row) -->
              <td class="py-4 px-5 whitespace-nowrap static">
                
                <div v-if="getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center pointer-events-auto">
                  <div class="bg-ink-700 text-white font-bold px-6 py-1.5 rounded-full -rotate-6 shadow-xl uppercase tracking-widest text-sm border-2 border-white shadow-ink-900/20">
                    {{ $t('saldo.adsPaused') }}
                  </div>
                  <button 
                    @click="openExtendRentModal(account)" 
                    class="mt-3 bg-red-500 text-white font-bold px-6 py-2 text-xs rounded-full shadow hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-md transition-all active:translate-y-0"
                  >
                    {{ $t('saldo.extendNow') }}
                  </button>
                </div>
                
                <span class="font-medium text-ink-600 inline-block" :class="{'opacity-30 grayscale blur-[1.5px] pointer-events-none': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0}">
                  {{ account.account_id }}
                </span>
              </td>
              <td class="py-4 px-5 font-medium text-ink-900 whitespace-nowrap" :class="{'opacity-30 grayscale blur-[1.5px] pointer-events-none': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0}">
                <div>{{ account.name }}</div>
                <div v-if="account.subscription_expires_at" class="mt-1.5 flex flex-wrap items-center gap-2">
                  <div class="text-[11px] text-ink-500 flex items-center gap-1">
                    <span>{{ $t('saldo.rentRemaining') }}</span>
                    <span 
                      class="font-bold px-1.5 py-0.5 rounded" 
                      :class="{
                        'bg-red-50 text-red-600': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0,
                        'bg-orange-50 text-orange-600': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! > 0 && getDaysLeftNum(account.subscription_expires_at)! <= 5,
                        'text-ink-900': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! > 5
                      }"
                    >
                      {{ calculateDaysLeft(account.subscription_expires_at) }}
                    </span>
                  </div>
                  <button 
                    v-if="getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 5"
                    @click="openExtendRentModal(account)" 
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm transition-all flex items-center gap-1"
                    :class="getDaysLeftNum(account.subscription_expires_at)! <= 0 ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-orange-500 text-white hover:bg-orange-600'"
                  >
                    {{ $t('saldo.extend') }}
                  </button>
                </div>
              </td>
              <td class="py-4 px-5" :class="{'opacity-30 grayscale blur-[1.5px] pointer-events-none': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0}">
                <div class="flex items-center gap-2.5 font-bold text-ink-800">
                  <div v-if="account.platform === 'Meta'" class="w-6 h-6 flex items-center justify-center shrink-0">
                    <img src="/icon-meta-ads.png" alt="Meta" class="w-5 h-5 object-contain" />
                  </div>
                  <div v-else-if="account.platform === 'Google'" class="w-6 h-6 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" class="w-5 h-5">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div v-else class="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <span class="text-[11px] font-bold">T</span>
                  </div>
                  {{ account.platform }}
                </div>
              </td>
              <td class="py-4 px-5 min-w-[200px]" :class="{'opacity-30 grayscale blur-[1.5px] pointer-events-none': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0}">
                <!-- Nominal & API indicator -->
                <div class="flex items-center gap-2 whitespace-nowrap mb-1.5">
                  <span class="font-bold text-[14px]" :class="getBudgetColor(account)">
                    {{ formatCurrency(Math.max(0, account.saldo)) }}
                  </span>
                  <span v-if="account.api_balance_active" class="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600" title="Sinkron dari API platform">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                </div>

                <!-- Progress bar -->
                <div class="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="getBudgetBarColor(account)"
                    :style="{ width: getBudgetUsagePercent(account) + '%' }"
                  ></div>
                </div>

                <!-- Info text: {{ $t('saldo.used') }} / total -->
                <div class="flex items-center justify-between mt-1">
                  <span class="text-[10px] text-ink-400 font-medium">
                    {{ formatCompact(getBudgetSpent(account)) }} / {{ formatCompact(getBudgetTotal(account)) }} {{ $t('saldo.used') }}
                  </span>
                  <span class="text-[10px] font-bold" :class="getBudgetColor(account)">
                    {{ getBudgetUsagePercent(account) }}%
                  </span>
                </div>

                <!-- Warning states -->
                <div v-if="account.saldo <= 0" class="mt-1.5">
                  <NuxtLink to="/dashboard/topup" class="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-bold px-2 py-1 rounded-md hover:bg-red-100 transition-colors">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ $t('saldo.budgetEmpty') }}
                  </NuxtLink>
                </div>
                <div v-else-if="account.saldo <= (0.2 * getBudgetTotal(account))" class="mt-1.5">
                  <span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {{ $t('saldo.budgetLow') }}
                  </span>
                </div>
              </td>
              <td class="py-4 px-5 min-w-[200px]" :class="{'opacity-30 grayscale blur-[1.5px] pointer-events-none': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0}">
                <!-- Nominal limit -->
                <div class="flex items-center gap-2 whitespace-nowrap mb-1.5">
                  <span class="font-bold text-[14px]" :class="getLimitColor(account)">
                    {{ formatCurrency(account.limit) }}
                  </span>
                </div>

                <!-- Progress bar -->
                <div class="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500"
                    :class="getLimitBarColor(account)"
                    :style="{ width: getLimitUsagePercent(account) + '%' }"
                  ></div>
                </div>

                <!-- Info text: {{ $t('saldo.used') }} / total -->
                <div class="flex items-center justify-between mt-1">
                  <span class="text-[10px] text-ink-400 font-medium">
                    {{ formatCompact(account.penggunaan) }} / {{ formatCompact(account.limit) }} {{ $t('saldo.used') }}
                  </span>
                  <span class="text-[10px] font-bold" :class="getLimitColor(account)">
                    {{ getLimitUsagePercent(account) }}%
                  </span>
                </div>
              </td>
              <td class="py-4 px-5 whitespace-nowrap" :class="{'opacity-30 grayscale blur-[1.5px] pointer-events-none': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0}">
                <div class="font-bold text-[13px] text-ink-900">
                  {{ formatCurrency(account.penggunaan) }}
                </div>
              </td>
              <td class="py-4 px-5 whitespace-nowrap" :class="{'opacity-30 grayscale blur-[1.5px] pointer-events-none': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0}">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-[13px] text-ink-900">{{ account.daily_limit ? formatCurrency(account.daily_limit) : $t('saldo.notSet') }}</span>
                  <button @click="openDailyLimitModal(account)" class="text-ink-400 hover:text-orange-500 transition-colors p-1" :title="$t('saldo.dailyLimitModal.title')">
                    <svg class="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
                  </button>
                </div>
              </td>
              <td class="py-4 px-5 text-ink-500 text-[13px] whitespace-nowrap" :class="{'opacity-30 grayscale blur-[1.5px] pointer-events-none': getDaysLeftNum(account.subscription_expires_at) !== null && getDaysLeftNum(account.subscription_expires_at)! <= 0}">{{ formatLastUpdated(account.updated_at) }}</td>
            </tr>
            <!-- Empty State -->
            <tr v-else>
              <td colspan="9" class="p-8 text-center text-ink-500">
                {{ searchQuery ? $t('saldo.noMatchingAccounts') : $t('saldo.noData') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="flex justify-between items-center mt-4 text-sm text-ink-500">
        <div class="flex items-center gap-2">
          <select v-model.number="perPage" class="border border-ink-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 bg-white cursor-pointer font-medium">
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
          </select>
          <span class="text-xs">{{ $t('saldo.ofAccounts', { count: allFilteredAdAccounts.length }) }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage <= 1" class="p-1.5 border border-ink-200 rounded-md hover:bg-ink-50 hover:text-ink-700 transition-colors bg-white disabled:opacity-40"><ChevronLeft class="w-4 h-4" /></button>
          <button class="py-1 px-3 border border-orange-500 bg-orange-50 text-orange-600 rounded-md font-bold">{{ currentPage }}</button>
          <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage >= totalPages" class="p-1.5 border border-ink-200 rounded-md hover:bg-ink-50 hover:text-ink-700 transition-colors bg-white disabled:opacity-40"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Histori Top Up -->
    <div v-else-if="activeTab === 'histori-topup'">
      <div class="flex justify-end mb-4">
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div class="relative w-full sm:w-48">
            <select v-model="filterStatusTopup" class="w-full appearance-none bg-white border border-ink-200 text-ink-700 py-2 pl-4 pr-10 rounded-md text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer">
              <option value="all">{{ $t('saldo.allStatus') }}</option>
              <option value="success">{{ $t('saldo.filterSuccess') }}</option>
              <option value="pending">{{ $t('saldo.filterPending') }}</option>
              <option value="failed">{{ $t('saldo.filterFailed') }}</option>
            </select>
            <ChevronDown class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <template v-else>
        <div v-if="filteredTransactions.length > 0" class="space-y-4">
          <div v-for="trx in filteredTransactions" :key="trx.id" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl hover:border-orange-200 transition-colors shadow-sm">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" 
                :class="{
                  'bg-green-100 text-green-600': trx.type === 'topup' || trx.type === 'refund',
                  'bg-blue-100 text-blue-600': trx.type === 'transfer',
                  'bg-orange-100 text-orange-600': trx.type === 'payment'
                }">
                <ArrowDown v-if="trx.type === 'topup' || trx.type === 'refund'" class="w-5 h-5" />
                <ArrowUpRight v-else-if="trx.type === 'transfer'" class="w-5 h-5" />
                <CreditCard v-else class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-ink-900 text-sm">
                  {{ trx.type === 'topup' ? $t('saldo.trxType.topUp') :
                     trx.type === 'transfer' ? $t('saldo.trxType.adAllocation') :
                     trx.type === 'payment' ? $t('saldo.trxType.adBilling') :
                     trx.type === 'refund' ? $t('saldo.trxType.refund') : trx.type }}
                </p>
                <p class="text-[12px] text-ink-500 mt-1">{{ trx.description || '-' }}</p>
                <p class="text-[10px] text-ink-400 mt-0.5">{{ new Date(trx.created_at).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US') }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-display font-bold text-base" 
                :class="(trx.type === 'topup' || trx.type === 'refund') ? 'text-green-600' : 'text-ink-900'">
                {{ (trx.type === 'topup' || trx.type === 'refund') ? '+' : '-' }}{{ formatCurrency(trx.amount) }}
              </p>
              <span class="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold"
                :class="{
                  'bg-green-100 text-green-700': trx.status === 'success',
                  'bg-orange-100 text-orange-700': trx.status === 'pending',
                  'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'cancelled'
                }">
                {{ trx.status.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
        <SharedEmptyState v-else />
      </template>
    </div>

    <!-- Histori Pindah Saldo -->
    <div v-else-if="activeTab === 'histori-pindah'">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <button class="bg-ink-50 border border-ink-100 text-ink-500 px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 hover:bg-ink-100 hover:text-ink-700 transition-colors">
          <Download class="w-4 h-4" /> {{ $t('saldo.downloadReport') }}
        </button>
        <div class="relative w-full md:w-64">
          <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input type="text" :placeholder="$t('saldo.searchTransfer')" class="pl-9 pr-4 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
        </div>
      </div>
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <template v-else>
        <div v-if="filteredTransactions.length > 0" class="space-y-4">
          <div v-for="trx in filteredTransactions" :key="trx.id" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl hover:border-orange-200 transition-colors shadow-sm">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" 
                :class="{
                  'bg-green-100 text-green-600': trx.type === 'topup' || trx.type === 'refund',
                  'bg-blue-100 text-blue-600': trx.type === 'transfer',
                  'bg-orange-100 text-orange-600': trx.type === 'payment'
                }">
                <ArrowDown v-if="trx.type === 'topup' || trx.type === 'refund'" class="w-5 h-5" />
                <ArrowUpRight v-else-if="trx.type === 'transfer'" class="w-5 h-5" />
                <CreditCard v-else class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-ink-900 text-sm">
                  {{ trx.type === 'topup' ? $t('saldo.trxType.topUp') :
                     trx.type === 'transfer' ? $t('saldo.trxType.adAllocation') :
                     trx.type === 'payment' ? $t('saldo.trxType.adBilling') :
                     trx.type === 'refund' ? $t('saldo.trxType.refund') : trx.type }}
                </p>
                <p class="text-[12px] text-ink-500 mt-1">{{ trx.description || '-' }}</p>
                <p class="text-[10px] text-ink-400 mt-0.5">{{ new Date(trx.created_at).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US') }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-display font-bold text-base" 
                :class="(trx.type === 'topup' || trx.type === 'refund') ? 'text-green-600' : 'text-ink-900'">
                {{ (trx.type === 'topup' || trx.type === 'refund') ? '+' : '-' }}{{ formatCurrency(trx.amount) }}
              </p>
              <span class="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold"
                :class="{
                  'bg-green-100 text-green-700': trx.status === 'success',
                  'bg-orange-100 text-orange-700': trx.status === 'pending',
                  'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'cancelled'
                }">
                {{ trx.status.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
        <div v-else>
          <SharedEmptyState />
          <div v-if="activeTab === 'histori-tambahan'" class="text-xs text-gray-400 mt-4 text-center">
            Debug Info: Total trx = {{ saldoStore.transactions?.length || 0 }}. Types = {{ Array.from(new Set((saldoStore.transactions || []).map((t: any) => t.type))).join(', ') }}
          </div>
        </div>
      </template>
    </div>
    
    <!-- Histori Akun Tambahan -->
    <div v-else-if="activeTab === 'histori-tambahan'">
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <template v-else>
        <div v-if="filteredTransactions.length > 0" class="space-y-4">
          <div v-for="trx in filteredTransactions" :key="trx.id" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl hover:border-orange-200 transition-colors shadow-sm">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                <CreditCard class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-ink-900 text-sm">{{ $t('saldo.trxType.adBilling') }}</p>
                <p class="text-[12px] text-ink-500 mt-1">{{ trx.description || '-' }}</p>
                <p class="text-[10px] text-ink-400 mt-0.5">{{ new Date(trx.created_at).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US') }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-display font-bold text-base text-ink-900">
                -{{ formatCurrency(trx.amount) }}
              </p>
              <span class="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold"
                :class="{
                  'bg-green-100 text-green-700': trx.status === 'success',
                  'bg-orange-100 text-orange-700': trx.status === 'pending',
                  'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'cancelled'
                }">
                {{ trx.status.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
        <SharedEmptyState v-else />
      </template>
    </div>
    
    <!-- Histori Akun Pengganti -->
    <div v-else-if="activeTab === 'histori-pengganti'">
      <div class="flex justify-end mb-4">
        <div class="relative w-full md:w-72">
          <input type="text" :placeholder="$t('saldo.searchAccount')" class="pl-4 pr-10 py-2 border border-ink-200 rounded-md text-sm w-full focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-ink-900 placeholder:text-ink-400 bg-white" />
          <Search class="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
        </div>
      </div>
      <!-- Skeleton Loading for Table -->
      <div v-if="saldoStore.isFetchingTransactions" class="space-y-4">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl animate-pulse">
          <div class="flex items-center gap-4 w-1/2">
            <div class="w-10 h-10 bg-ink-200 rounded-lg shrink-0"></div>
            <div class="space-y-2 w-full">
              <div class="h-4 bg-ink-200 rounded w-1/3"></div>
              <div class="h-3 bg-ink-200 rounded w-1/4"></div>
            </div>
          </div>
          <div class="h-8 bg-ink-200 rounded w-24"></div>
        </div>
      </div>
      <template v-else>
        <div v-if="filteredTransactions.length > 0" class="space-y-4">
          <div v-for="trx in filteredTransactions" :key="trx.id" class="flex items-center justify-between p-4 bg-white border border-ink-100 rounded-xl hover:border-orange-200 transition-colors shadow-sm">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
                <CreditCard class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-ink-900 text-sm">{{ $t('saldo.trxType.adBilling') }}</p>
                <p class="text-[12px] text-ink-500 mt-1">{{ trx.description || '-' }}</p>
                <p class="text-[10px] text-ink-400 mt-0.5">{{ new Date(trx.created_at).toLocaleString(locale === 'id' ? 'id-ID' : 'en-US') }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-display font-bold text-base text-ink-900">
                -{{ formatCurrency(trx.amount) }}
              </p>
              <span class="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold"
                :class="{
                  'bg-green-100 text-green-700': trx.status === 'success',
                  'bg-orange-100 text-orange-700': trx.status === 'pending',
                  'bg-red-100 text-red-700': trx.status === 'failed' || trx.status === 'cancelled'
                }">
                {{ trx.status.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
        <SharedEmptyState v-else />
      </template>
    </div>

    <!-- Modal Pengajuan Akun -->
    <ModalRequestAdAccountModal 
      v-model="isRequestModalOpen"
      platformName=""
    />

    <!-- Modal Perpanjang Sewa -->
    <ModalExtendRentModal 
      v-model="isExtendRentModalOpen"
      :account="selectedAccountForExtend"
      @success="() => { adsStore.fetchAdAccounts(); saldoStore.fetchTransactions(); }"
    />

    <!-- Modal Set Daily Limit -->
    <div v-if="isDailyLimitModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div class="px-6 pt-6 pb-4 border-b border-ink-100 flex justify-between items-center">
          <h3 class="text-xl font-display font-bold text-ink-900">{{ $t('saldo.dailyLimitModal.title') }}</h3>
          <button @click="isDailyLimitModalOpen = false" class="text-ink-400 hover:text-ink-600 transition-colors">
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="p-6">
          <label class="block text-sm font-medium text-ink-700 mb-2">{{ $t('saldo.dailyLimitModal.label') }}</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500 font-medium">Rp</span>
            <input type="text" v-model="formattedDailyLimitInput" class="w-full pl-11 pr-4 py-2.5 border border-ink-200 rounded-lg text-ink-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium" placeholder="100.000" />
          </div>
          <p class="text-[11px] text-ink-500 mt-2">{{ $t('saldo.dailyLimitModal.desc') }}</p>
        </div>
        <div class="px-6 py-4 bg-ink-50 flex gap-3 justify-end border-t border-ink-100">
          <button @click="isDailyLimitModalOpen = false" class="px-4 py-2 text-sm font-bold text-ink-600 hover:bg-ink-200 rounded-lg transition-colors">{{ $t('common.cancel') }}</button>
          <button @click="saveDailyLimit" :disabled="isSavingDailyLimit" class="px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50">
            {{ isSavingDailyLimit ? $t('saldo.dailyLimitModal.saving') : $t('saldo.dailyLimitModal.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, ChevronDown, Search, Download, ArrowDown, ArrowUpRight, CreditCard, PlusCircle, ChevronLeft, ChevronRight, RefreshCw, Info } from 'lucide-vue-next'
import { ref, onMounted, computed } from 'vue'
import { useSaldoStore } from '~/stores/saldo'
import { useAdsStore } from '~/stores/ads'
import { useToast } from '~/composables/useToast'

definePageMeta({
  layout: 'dashboard',
})

const { t, locale } = useI18n()
const isRequestModalOpen = ref(false)

const saldoStore = useSaldoStore()
const adsStore = useAdsStore()

const searchQuery = ref('')
const sortOrder = ref('terbaru')
const currentPage = ref(1)
const perPage = ref(10)

const allFilteredAdAccounts = computed(() => {
  let list = [...adsStore.adAccounts]
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((acc: any) =>
      (acc.account_id && acc.account_id.toLowerCase().includes(q)) ||
      (acc.name && acc.name.toLowerCase().includes(q))
    )
  }

  if (sortOrder.value === 'terlama') {
    list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  } else {
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(allFilteredAdAccounts.value.length / perPage.value)))

const filteredAdAccounts = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return allFilteredAdAccounts.value.slice(start, start + perPage.value)
})

watch([searchQuery, perPage], () => { currentPage.value = 1 })

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat(locale.value === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0)
}

const formatCompact = (value: number) => {
  if (!value || value <= 0) return 'Rp 0'
  const m = t('saldo.compact.million')
  const k = t('saldo.compact.thousand')
  if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1).replace('.0', '')}${m}`
  if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)}${k}`
  return `Rp ${value}`
}

const getBudgetTotal = (account: any) => {
  // Prioritas: api_budget_total (dari platform API), fallback ke penggunaan + saldo
  if (account.api_budget_total !== undefined && account.api_budget_total > 0) {
    return account.api_budget_total
  }
  return (account.penggunaan || 0) + Math.max(0, account.saldo || 0)
}

const getBudgetSpent = (account: any) => {
  // Prioritas: api_amount_spent (dari platform API), fallback ke penggunaan
  if (account.api_amount_spent !== undefined && account.api_amount_spent > 0) {
    return account.api_amount_spent
  }
  return account.penggunaan || 0
}

const getBudgetUsagePercent = (account: any) => {
  const total = getBudgetTotal(account)
  const spent = getBudgetSpent(account)
  if (total <= 0) return 100
  return Math.min(100, Math.round((spent / total) * 100))
}

const getBudgetColor = (account: any) => {
  const pct = getBudgetUsagePercent(account)
  if (pct >= 100 || account.saldo <= 0) return 'text-red-500'
  if (pct >= 80) return 'text-amber-500'
  return 'text-ink-900'
}

const getBudgetBarColor = (account: any) => {
  const pct = getBudgetUsagePercent(account)
  if (pct >= 100 || account.saldo <= 0) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-400'
  if (pct >= 50) return 'bg-blue-500'
  return 'bg-emerald-500'
}

const getLimitUsagePercent = (account: any) => {
  const limit = account.limit || 0
  const spent = account.penggunaan || 0
  if (limit <= 0) return 0
  return Math.min(100, Math.round((spent / limit) * 100))
}

const getLimitColor = (account: any) => {
  const pct = getLimitUsagePercent(account)
  if (pct >= 100) return 'text-red-500'
  if (pct >= 80) return 'text-amber-500'
  return 'text-ink-900'
}

const getLimitBarColor = (account: any) => {
  const pct = getLimitUsagePercent(account)
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-400'
  if (pct >= 50) return 'bg-blue-500'
  return 'bg-emerald-500'
}

const formatLastUpdated = (dateStr: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat(locale.value === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(d)
}

const calculateDaysLeft = (dateStr: string) => {
  if (!dateStr) return '-'
  const diffDays = getDaysLeftNum(dateStr)
  if (diffDays === null) return '-'
  if (diffDays <= 0) return t('saldo.expired')
  return diffDays + ' ' + t('saldo.days')
}

const getDaysLeftNum = (dateStr: string) => {
  if (!dateStr) return null
  const end = new Date(dateStr)
  const today = new Date()
  end.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffTime = end.getTime() - today.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

const syncAds = async () => {
  const lastSync = localStorage.getItem('last_ads_sync')
  if (lastSync) {
    const timeDiff = new Date().getTime() - new Date(lastSync).getTime()
    if (timeDiff < 5 * 60 * 1000) { // 5 menit
      const remainingMs = 5 * 60 * 1000 - timeDiff
      const remainingMinutes = Math.floor(remainingMs / 60000)
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000)
      
      let timeString = ''
      if (remainingMinutes > 0) {
        timeString += `${remainingMinutes} ${t('saldo.toast.minutes')} `
      }
      timeString += `${remainingSeconds} ${t('saldo.toast.seconds')}`

      const toast = useToast()
      toast.addToast(t('saldo.toast.syncTooFast', { time: timeString }), 'error')
      return
    }
  }

  localStorage.setItem('last_ads_sync', new Date().toISOString())
  
  const toast = useToast()
  if (dateRange.value.start && dateRange.value.end) {
    await adsStore.fetchLiveSpendOnly(dateRange.value.start, dateRange.value.end)
  } else {
    await adsStore.fetchLiveSpendOnly()
  }
  toast.addToast(t('saldo.toast.syncSuccess'), 'success')
}

const showPicComingSoon = () => {
  const toast = useToast()
  toast.addToast(t('saldo.toast.picComingSoon'), 'info')
}

const isExtendRentModalOpen = ref(false)
const selectedAccountForExtend = ref<any>(null)

const openExtendRentModal = (account: any) => {
  selectedAccountForExtend.value = account
  isExtendRentModalOpen.value = true
}

const isDailyLimitModalOpen = ref(false)
const dailyLimitInput = ref<number | null>(null)
const selectedAccountForLimit = ref<any>(null)
const isSavingDailyLimit = ref(false)

const formattedDailyLimitInput = computed({
  get: () => {
    if (!dailyLimitInput.value) return ''
    return new Intl.NumberFormat('id-ID').format(Number(dailyLimitInput.value))
  },
  set: (val: string) => {
    const numericString = val.replace(/\D/g, '')
    dailyLimitInput.value = numericString ? Number(numericString) : null
  }
})

const openDailyLimitModal = (account: any) => {
  selectedAccountForLimit.value = account
  dailyLimitInput.value = account.daily_limit || null
  isDailyLimitModalOpen.value = true
}

const saveDailyLimit = async () => {
  if (!selectedAccountForLimit.value) return
  if (!confirm(t('saldo.dailyLimitModal.confirmChange'))) return
  isSavingDailyLimit.value = true
  try {
    await $fetch('/api/ads/set-daily-limit', {
      method: 'POST',
      headers: {
        'csrf-token': unref(useCsrf().csrf)
      },
      body: {
        accountId: selectedAccountForLimit.value.id,
        dailyLimit: dailyLimitInput.value
      }
    })
    const toast = useToast()
    toast.addToast(t('saldo.toast.dailyLimitSuccess'), 'success')
    isDailyLimitModalOpen.value = false
    adsStore.fetchAdAccounts()
  } catch (err: any) {
    const toast = useToast()
    toast.addToast(err.statusMessage || t('saldo.toast.dailyLimitFailed'), 'error')
  } finally {
    isSavingDailyLimit.value = false
  }
}

const activeTab = ref('list-saldo')

const today = new Date()
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(today.getDate() - 30)

const formatDateForInput = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const dateRange = ref({ start: '', end: '' })

watch(dateRange, (newVal) => {
  if (activeTab.value === 'list-saldo' && newVal.start && newVal.end) {
    adsStore.fetchLiveSpendOnly(newVal.start, newVal.end)
  }
})

const tabs = computed(() => [
  { id: 'list-saldo', label: t('saldo.tabs.balanceList') },
  { id: 'histori-topup', label: t('saldo.tabs.topUpHistory') },
  { id: 'histori-tambahan', label: t('saldo.tabs.additionalHistory') },
  { id: 'histori-pengganti', label: t('saldo.tabs.replacementHistory') },
])

const filterStatusTopup = ref('all')

const filteredTransactions = computed(() => {
  if (!saldoStore.transactions) return []
  
  let result = saldoStore.transactions
  
  // Tanggal filter
  if (dateRange.value.start && dateRange.value.end) {
    const start = new Date(dateRange.value.start)
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)
    
    result = result.filter((t: any) => {
      const d = new Date(t.created_at)
      return d >= start && d <= end
    })
  }
  
  if (activeTab.value === 'histori-topup') {
    let topups = result.filter((t: any) => t.type === 'topup')
    if (filterStatusTopup.value !== 'all') {
      topups = topups.filter((t: any) => {
        if (filterStatusTopup.value === 'failed') return t.status === 'failed' || t.status === 'cancelled'
        return t.status === filterStatusTopup.value
      })
    }
    return topups
  } else if (activeTab.value === 'histori-tambahan') {
    return result.filter((t: any) => t.type === 'payment')
  } else if (activeTab.value === 'histori-pengganti') {
    return result.filter((t: any) => t.type === 'pengganti')
  }
  
  return result
})

onMounted(() => {
  saldoStore.fetchTransactions()
  adsStore.fetchAdAccounts()
})
</script>
