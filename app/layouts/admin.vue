<template>
  <div class="flex h-screen overflow-hidden font-sans antialiased bg-ink-50">
    <!-- Mobile Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-ink-900/50 z-40 lg:hidden transition-opacity"
      @click="isSidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'w-64 bg-ink-900 border-r border-ink-800 flex flex-col fixed inset-y-0 left-0 z-50',
        'transform transition-transform duration-300 shrink-0',
        'lg:relative lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-ink-800">
        <NuxtLink to="/admin" class="flex items-center gap-2">
          <img src="/logo-full.png" alt="Tentaklik Logo" class="h-7 w-auto brightness-0 invert" />
          <span class="text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded-full mt-1">ADMIN</span>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div class="px-4 mb-2">
          <p class="text-[10px] font-bold text-ink-400 tracking-wider uppercase">Menu Operasional</p>
        </div>
        
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-ink-300 hover:bg-ink-800 hover:text-white transition-colors text-left font-medium text-sm"
          :class="{ 'bg-ink-800 text-orange-500 border-l-2 border-orange-500': isActiveRoute(item.to) }"
          @click="isSidebarOpen = false"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span class="truncate">{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="ml-auto shrink-0 bg-orange-600 text-white py-0.5 px-2 rounded-full text-[10px] font-bold"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>
      
      <!-- User / Role Info Sidebar Bottom -->
      <div class="p-4 border-t border-ink-800">
        <div class="flex items-center gap-3 px-2 py-2">
           <div class="w-8 h-8 rounded-full bg-ink-800 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
             {{ userInitials }}
           </div>
           <div class="overflow-hidden">
             <p class="text-sm font-bold text-white truncate">{{ userName }}</p>
             <p class="text-[10px] text-ink-400 font-medium">{{ getRoleName(user?.user_metadata?.role || 'super_admin') }}</p>
           </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden bg-ink-50">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-ink-200 flex items-center justify-between px-4 sm:px-6 shrink-0 gap-2 shadow-sm">
        <!-- Mobile: menu + logo -->
        <div class="flex items-center gap-2 sm:gap-4 lg:hidden shrink-0">
          <button class="text-ink-600 hover:text-orange-600 shrink-0" @click="isSidebarOpen = true">
            <Menu class="w-6 h-6" />
          </button>
          <div class="flex items-center gap-1">
             <img src="/logo-full.png" alt="Logo" class="h-6 w-auto" />
             <span class="text-xs font-bold bg-orange-100 text-orange-700 px-2 rounded-md">ADMIN</span>
          </div>
        </div>

        <!-- Desktop: page title -->
        <div class="hidden lg:block">
          <h2 class="text-xl font-display font-bold text-ink-900">{{ pageTitle }}</h2>
        </div>

        <!-- Right side actions -->
        <div class="flex items-center gap-3 sm:gap-5">
          <NuxtLink
            to="/dashboard"
            class="text-sm font-medium text-ink-500 hover:text-orange-600 flex items-center gap-2 transition-colors border border-ink-200 bg-white px-3 py-1.5 rounded-lg hover:bg-orange-50"
          >
            <LogOut class="w-4 h-4" /> Klien Dasbor
          </NuxtLink>
          
          <!-- Profile Dropdown -->
          <div class="relative pl-4 border-l border-ink-200">
            <button
              class="flex items-center gap-3 hover:bg-ink-50 p-1.5 rounded-xl transition-colors"
              @click="isProfileOpen = !isProfileOpen"
            >
              <div class="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-200">
                {{ userInitials }}
              </div>
              <ChevronDown class="w-4 h-4 text-ink-500" />
            </button>

            <!-- Profile Menu -->
            <div
              v-if="isProfileOpen"
              class="absolute right-0 top-full mt-2 w-48 bg-white border border-ink-200 rounded-xl shadow-lg py-2 z-50"
            >
              <button
                @click="handleLogout"
                class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50 transition-colors group text-left"
              >
                <LogOut class="w-4 h-4 text-ink-400 group-hover:text-red-500" />
                <span class="font-semibold text-ink-700 group-hover:text-red-600">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content (scrollable) -->
      <div class="flex-1 overflow-auto p-4 md:p-8">
        <slot />
      </div>
    </main>

    <!-- Click outside to close dropdowns -->
    <div
      v-if="isProfileOpen"
      class="fixed inset-0 z-40"
      @click="isProfileOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  ShieldCheck,
  Megaphone,
  WalletCards,
  Users,
  UserCog,
  ChevronDown,
  Menu,
  LogOut
} from 'lucide-vue-next'

// Auth state
const { user, logout } = useAuth()
const router = useRouter()

const userName = computed(() => {
  return user.value?.user_metadata?.full_name || user.value?.email || 'Admin'
})

const userInitials = computed(() => {
  const name = userName.value
  if (!name || name === 'Admin') return 'A'
  return name.substring(0, 2).toUpperCase()
})

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

// Sidebar state
const isSidebarOpen = ref(false)

// Dropdown states
const isProfileOpen = ref(false)

const { data: badges } = useFetch('/api/admin/badges', { key: 'admin-badges' })

const pendingKycCount = computed(() => badges.value?.kyc || 0)
const pendingAdsCount = computed(() => badges.value?.ads || 0)
const pendingFinanceCount = computed(() => badges.value?.finance || 0)

const userRole = computed(() => user.value?.user_metadata?.role || 'admin')

// Helper Konversi Jabatan
const getRoleName = (role: string) => {
  const map: Record<string, string> = {
    'admin_compliance': 'Tim Audit (Kepatuhan)',
    'admin_ads_ops': 'Tim Ops Iklan',
    'admin_finance': 'Tim Keuangan',
    'super_admin': 'Super Admin'
  }
  return map[role] || role
}

// Navigation items
const navItems = computed(() => {
  const role = userRole.value
  const items = [
    { to: '/admin', label: 'Dashboard Admin', icon: LayoutDashboard },
    { 
      to: '/admin/verifications', 
      label: 'Tim Audit (eKYC)', 
      icon: ShieldCheck, 
      badge: pendingKycCount.value > 0 ? pendingKycCount.value.toString() : undefined,
      allowed: ['super_admin', 'admin_compliance']
    },
    { 
      to: '/admin/ads-ops', 
      label: 'Tim Ads Ops', 
      icon: Megaphone, 
      badge: pendingAdsCount.value > 0 ? pendingAdsCount.value.toString() : undefined,
      allowed: ['super_admin', 'admin_ads_ops'] 
    },
    { 
      to: '/admin/finance', 
      label: 'Tim Finance', 
      icon: WalletCards, 
      badge: pendingFinanceCount.value > 0 ? pendingFinanceCount.value.toString() : undefined,
      allowed: ['super_admin', 'admin_finance'] 
    },
    { to: '/admin/clients', label: 'Daftar Klien', icon: Users, allowed: ['super_admin', 'admin_finance', 'admin_ads_ops', 'admin_compliance'] },
    { to: '/admin/users', label: 'Manajemen Akses', icon: UserCog, allowed: ['super_admin'] },
  ]
  
  return items.filter(item => !item.allowed || item.allowed.includes(role))
})

// Active route detection
const route = useRoute()

function isActiveRoute(path: string) {
  if (path === '/admin') {
    return route.path === '/admin' || route.path === '/admin/'
  }
  return route.path.startsWith(path)
}

// Dynamic page title
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': 'Dashboard Admin',
    '/admin/verifications': 'Verifikasi Identitas Klien',
    '/admin/ads-ops': 'Manajemen Akun Iklan',
    '/admin/finance': 'Audit Keuangan & Mutasi',
    '/admin/clients': 'Daftar Klien (CRM)',
    '/admin/users': 'Manajemen Pengguna',
  }
  return titles[route.path] || 'Panel Admin'
})
</script>
