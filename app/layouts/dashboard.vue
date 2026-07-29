<template>
  <div class="flex h-screen overflow-hidden font-sans antialiased">
    <!-- Mobile Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 bg-ink-900/50 z-40 lg:hidden transition-opacity"
      @click="isSidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'w-64 bg-white border-r border-ink-100 flex flex-col fixed inset-y-0 left-0 z-50',
        'transform transition-transform duration-300 shrink-0',
        'lg:relative lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-ink-100">
        <NuxtLink to="/dashboard" class="flex items-center">
          <img src="/logo-full.png" alt="Tentaklik Logo" class="h-7 w-auto" />
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left text-sm"
          :class="isActiveRoute(item.to) ? 'bg-orange-50 text-orange-600 font-bold' : 'text-ink-600 hover:bg-orange-50 hover:text-orange-600 font-medium'"
          @click="isSidebarOpen = false"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          <span class="truncate">{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="ml-auto shrink-0 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-[10px] font-bold"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-ink-100 flex items-center justify-between px-4 sm:px-6 shrink-0 gap-2">
        <!-- Mobile: menu + logo -->
        <div class="flex items-center gap-2 sm:gap-4 lg:hidden shrink-0">
          <button class="text-ink-600 hover:text-orange-500 shrink-0" @click="isSidebarOpen = true">
            <Menu class="w-6 h-6" />
          </button>
          <img src="/logo-full.png" alt="Tentaklik Logo" class="h-5 sm:h-6 w-auto shrink-0 object-contain" />
        </div>

        <!-- Desktop: page title -->
        <div class="hidden lg:block">
          <h2 class="text-xl font-display font-bold text-ink-900">{{ pageTitle }}</h2>
        </div>

        <!-- Right side actions -->
        <div class="flex items-center gap-3 sm:gap-5">
          <!-- Notification Bell -->
          <div class="relative">
            <button class="text-ink-500 hover:text-orange-500 transition-colors relative mt-1" @click="toggleNotif">
              <Bell class="w-5 h-5" />
              <span v-if="unreadCount > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                {{ unreadCount }}
              </span>
            </button>

            <!-- Notification Popup -->
            <div
              v-if="isNotifOpen"
              class="absolute right-0 md:-right-4 top-full mt-4 w-72 md:w-80 bg-white border border-ink-100 rounded-xl shadow-lg shadow-ink-900/5 z-50 flex flex-col"
            >
              <div class="flex items-center justify-between p-4 border-b border-ink-100">
                <h3 class="font-semibold text-ink-900">Notifikasi</h3>
                <button class="p-1.5 bg-ink-50 hover:bg-ink-100 rounded-md text-ink-500 transition-colors">
                  <Settings class="w-4 h-4" />
                </button>
              </div>
              <div class="flex flex-col h-72 overflow-y-auto">
                <div v-if="notifications.length === 0" class="p-8 flex flex-col items-center justify-center text-center h-full">
                  <div class="w-24 h-24 mb-6 bg-ink-50 rounded-full flex items-center justify-center text-ink-300 relative">
                    <Bell class="w-10 h-10" />
                    <span class="absolute top-2 right-2 text-ink-400 font-bold text-xs transform rotate-12">zZ</span>
                  </div>
                  <p class="text-ink-500 text-sm">Saat ini anda tidak memiliki notifikasi</p>
                </div>
                <div v-else class="divide-y divide-ink-100">
                  <div 
                    v-for="notif in notifications" 
                    :key="notif.id"
                    @click="viewNotification(notif)"
                    class="p-4 hover:bg-ink-50 cursor-pointer transition-colors relative"
                    :class="{'bg-orange-50/30': !notif.is_read}"
                  >
                    <div v-if="!notif.is_read" class="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500"></div>
                    <div class="pl-3">
                      <p class="text-xs font-bold text-ink-900 mb-1">{{ notif.title }}</p>
                      <p class="text-xs text-ink-600 line-clamp-2">{{ stripHtml(notif.message) }}</p>
                      <p class="text-[10px] text-ink-400 mt-2">{{ new Date(notif.created_at).toLocaleDateString('id-ID') }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="p-4 border-t border-ink-100 text-center">
                <NuxtLink
                  to="/dashboard/notifikasi"
                  class="w-full text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center justify-center gap-1.5"
                  @click="isNotifOpen = false"
                >
                  Lihat Selengkapnya <ArrowRight class="w-4 h-4" />
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Top Up Button -->
          <NuxtLink
            to="/dashboard/topup"
            class="bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0"
          >
            <Plus class="w-4 h-4 shrink-0" />
            <span class="hidden sm:inline">Top Up Saldo</span>
            <span class="sm:hidden">Top Up</span>
          </NuxtLink>

          <!-- Profile Dropdown -->
          <div class="relative pl-4 border-l border-ink-100">
            <button
              class="flex items-center gap-3 hover:bg-ink-50 p-1.5 rounded-xl transition-colors"
              @click="isProfileOpen = !isProfileOpen"
            >
              <div class="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                {{ userInitials }}
              </div>
              <span class="font-bold text-ink-900 hidden lg:block">{{ userName }}</span>
              <ChevronDown class="w-4 h-4 text-ink-900" />
            </button>

            <!-- Profile Menu -->
            <div
              v-if="isProfileOpen"
              class="absolute right-0 top-full mt-2 w-56 bg-white border border-ink-100 rounded-xl shadow-lg shadow-ink-900/5 py-2 z-50"
            >
              <NuxtLink
                to="/dashboard/profile"
                class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-ink-50 transition-colors group"
                @click="isProfileOpen = false"
              >
                <span class="font-semibold text-ink-900 group-hover:text-orange-600">Profil</span>
                <div class="flex items-center gap-1.5 px-2 py-1 rounded-full border border-orange-500 text-orange-600 bg-orange-50 text-[10px] font-bold uppercase tracking-wider">
                  <Gem class="w-3 h-3" /> {{ saldoStore.activePackage || 'GRATIS' }}
                </div>
              </NuxtLink>
              <div class="h-px bg-ink-100 my-1" />
              
              <!-- Link Beralih ke Admin -->
              <NuxtLink
                v-if="user?.user_metadata?.role && user.user_metadata.role !== 'client'"
                to="/admin"
                class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50 transition-colors group text-left border-b border-ink-100"
              >
                <ShieldCheck class="w-4 h-4 text-ink-400 group-hover:text-orange-500" />
                <span class="font-semibold text-ink-900 group-hover:text-orange-600">Beralih ke Admin</span>
              </NuxtLink>

              <button
                @click="handleLogout"
                class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ink-50 transition-colors group text-left"
              >
                <span class="font-semibold text-ink-900 group-hover:text-red-600">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content (scrollable) -->
      <div class="flex-1 overflow-auto p-4 md:p-8">
        <DashboardVerificationBanner />
        <NuxtErrorBoundary>
          <slot />
          <template #error="{ error, clearError }">
            <div class="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl flex flex-col items-center justify-center text-center mt-4">
              <TriangleAlert class="w-12 h-12 mb-2 text-red-500" />
              <h3 class="font-bold text-lg mb-1">Terjadi Kesalahan</h3>
              <p class="text-sm opacity-80 mb-4">{{ error.message }}</p>
              <button @click="clearError" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Coba Lagi</button>
            </div>
          </template>
        </NuxtErrorBoundary>
      </div>
    </main>

    <!-- Click outside to close dropdowns -->
    <div
      v-if="isNotifOpen || isProfileOpen"
      class="fixed inset-0 z-40"
      @click="isNotifOpen = false; isProfileOpen = false"
    />

    <!-- Floating WhatsApp -->
    <SharedFloatingWhatsApp />

    <!-- Notification Detail Modal -->
    <div v-if="selectedNotif" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div class="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" @click="selectedNotif = null"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-ink-100 flex items-center justify-between shrink-0">
          <h3 class="font-bold text-lg text-ink-900">{{ selectedNotif.title }}</h3>
          <button @click="selectedNotif = null" class="p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-50 rounded-full transition-colors">
            <Plus class="w-5 h-5 rotate-45" />
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1 text-sm text-ink-700 prose prose-sm prose-orange max-w-none">
          <div v-html="selectedNotif.message"></div>
        </div>
        <div class="p-4 border-t border-ink-100 bg-ink-50 rounded-b-2xl shrink-0 flex justify-end">
          <button @click="selectedNotif = null" class="px-5 py-2 bg-white border border-ink-200 text-ink-700 font-semibold rounded-xl hover:bg-ink-50 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSaldoStore } from '~/stores/saldo'
import {
  LayoutDashboard,
  MonitorPlay,
  Wallet,
  TriangleAlert,
  Bell,
  Plus,
  ChevronDown,
  ArrowRight,
  Settings,
  Gem,
  Menu,
  ShieldCheck,
  Headset,
  Gift
} from 'lucide-vue-next'

const { user, logout } = useAuth()
const router = useRouter()
const saldoStore = useSaldoStore()
const supabase = useSupabaseClient<any>()

const notifications = ref<any[]>([])
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

const stripHtml = (html: string) => {
  if (!html) return ''
  return html.replace(/<[^>]*>?/gm, ' ').trim()
}

const toggleNotif = async () => {
  isNotifOpen.value = !isNotifOpen.value
  if (isNotifOpen.value) {
    await fetchNotifications()
  }
}

const fetchNotifications = async () => {
  if (!user.value) {
    console.log('fetchNotifications: user is null')
    return
  }
  
  try {
    const userId = user.value.id || user.value.sub
    const data = await $fetch<any[]>('/api/notifications', {
      params: {
        userId: userId || 'MISSING',
        _t: Date.now()
      }
    })
    console.log('fetchNotifications Data:', data)
    if (data) {
      notifications.value = data
    }
  } catch (err: any) {
    console.error('fetchNotifications Error:', err)
  }
}

const selectedNotif = ref<any>(null)

const viewNotification = async (notif: any) => {
  selectedNotif.value = notif
  isNotifOpen.value = false // close dropdown
  if (!notif.is_read) {
    notif.is_read = true
    await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
  }
}

onMounted(() => {
  // Hanya fetch jika belum ada (untuk menghindari double fetch di halaman saldo/topup)
  if (saldoStore.activePackage === null) {
    saldoStore.fetchSaldo()
  }
  fetchNotifications()
})

const userName = computed(() => {
  return user.value?.user_metadata?.full_name || user.value?.email || 'User'
})

const userInitials = computed(() => {
  const name = userName.value
  if (!name || name === 'User') return 'U'
  return name.substring(0, 2).toUpperCase()
})

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

// Sidebar state
const isSidebarOpen = ref(false)

// Dropdown states
const isNotifOpen = ref(false)
const isProfileOpen = ref(false)

// Navigation items
interface NavItem {
  to: string
  label: string
  icon: any
  badge?: string
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/platform', label: 'Platform Iklan', icon: MonitorPlay },
  { to: '/dashboard/saldo', label: 'Saldo Iklan', icon: Wallet },
  { to: '/dashboard/bermasalah', label: 'Iklan Bermasalah', icon: TriangleAlert },
  { to: '/dashboard/referral', label: 'Affiliate', icon: Gift },
  { to: '/dashboard/support', label: 'Bantuan Tiket', icon: Headset },
]

// Active route detection
const route = useRoute()

function isActiveRoute(path: string) {
  if (path === '/dashboard') {
    return route.path === '/dashboard' || route.path === '/dashboard/'
  }
  return route.path.startsWith(path)
}

// Dynamic page title
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/platform': 'Platform Iklan',
    '/dashboard/saldo': 'Saldo Iklan',
    '/dashboard/bermasalah': 'Iklan Bermasalah',
    '/dashboard/notifikasi': 'Pusat Pemberitahuan',
    '/dashboard/topup': 'My Balance by Pivot',
    '/dashboard/profile': 'Profile',
    '/dashboard/support': 'Pusat Bantuan',
  }
  return titles[route.path] || 'Dashboard'
})
</script>
