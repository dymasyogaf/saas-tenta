// Initialize Lucide Icons
lucide.createIcons();

// Tab switching logic
function switchTab(tabId) {
  // Hide all contents
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  // Deactivate all nav items
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  
  // Show selected content
  document.getElementById('view-' + tabId).classList.add('active');
  // Activate selected nav item if it exists
  const navItem = document.getElementById('nav-' + tabId);
  if (navItem) navItem.classList.add('active');
  
  // Update header title based on tab
  const titles = {
    'dashboard': 'Dashboard',
    'platform': 'Platform Iklan',
    'saldo': 'Saldo Iklan',
    'bermasalah': 'Iklan Bermasalah',
    'notifikasi': 'Pusat Pemberitahuan',
    'topup': 'My Balance'
  };
  if (titles[tabId]) document.getElementById('header-title').innerText = titles[tabId];

  // Close sidebar on mobile after clicking a tab
  if (window.innerWidth < 768) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (!sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('hidden');
    }
  }
}

// Mobile sidebar toggle
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobile-overlay');
  
  if (sidebar.classList.contains('-translate-x-full')) {
    // Open
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  } else {
    // Close
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

// Profile Menu toggle
function toggleProfileMenu() {
  const menu = document.getElementById('profile-menu');
  const notifMenu = document.getElementById('notification-menu');
  if (notifMenu) notifMenu.classList.add('hidden'); // Close notif if open
  
  if (menu.classList.contains('hidden')) {
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
}

// Notification Menu toggle
function toggleNotificationMenu() {
  const menu = document.getElementById('notification-menu');
  const profileMenu = document.getElementById('profile-menu');
  if (profileMenu) profileMenu.classList.add('hidden'); // Close profile if open
  
  if (menu.classList.contains('hidden')) {
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
}

// Filter Menu toggle
function toggleFilterMenu(menuId) {
  const menu = document.getElementById(menuId);
  if (menu) {
    if (menu.classList.contains('hidden')) {
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
  }
}

// Modal toggle
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (modal.classList.contains('hidden')) {
      modal.classList.remove('hidden');
      document.body.classList.add('overflow-hidden'); // prevent bg scroll
    } else {
      modal.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }
  }
}

// Balance Tab Switcher
function switchBalanceTab(clickedBtn, tabType) {
  const container = clickedBtn.parentElement;
  
  // Reset all buttons to inactive state
  const buttons = container.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.className = "whitespace-nowrap px-4 py-2.5 text-ink-500 hover:text-ink-900 font-medium text-sm rounded-lg transition-colors";
  });
  
  // Set active class on clicked button
  clickedBtn.className = "whitespace-nowrap px-4 py-2.5 bg-white text-orange-500 font-bold text-sm rounded-lg shadow-sm";
  
  // Toggle Tables
  const tableBerhasil = document.getElementById('table-berhasil');
  const tableTertunda = document.getElementById('table-tertunda');
  const tableTambahSaldo = document.getElementById('table-tambah-saldo');
  const tablePenarikan = document.getElementById('table-penarikan');
  const infoBanner = document.getElementById('info-banner-tertunda');
  
  // Toggle Filters
  const filtersDefault = document.getElementById('filters-default');
  const filtersTambahSaldo = document.getElementById('filters-tambah-saldo');
  const filtersPenarikan = document.getElementById('filters-penarikan');
  
  if (tableBerhasil) tableBerhasil.classList.add('hidden');
  if (tableTertunda) tableTertunda.classList.add('hidden');
  if (tableTambahSaldo) tableTambahSaldo.classList.add('hidden');
  if (tablePenarikan) tablePenarikan.classList.add('hidden');
  if (infoBanner) infoBanner.classList.add('hidden');
  if (filtersDefault) filtersDefault.classList.add('hidden');
  if (filtersTambahSaldo) filtersTambahSaldo.classList.add('hidden');
  if (filtersPenarikan) filtersPenarikan.classList.add('hidden');
  
  if (tabType === 'tertunda' || tabType === 'dibatalkan') {
    if (tableTertunda) tableTertunda.classList.remove('hidden');
    if (filtersDefault) filtersDefault.classList.remove('hidden');
    if (tabType === 'tertunda' && infoBanner) {
      infoBanner.classList.remove('hidden');
    }
  } else if (tabType === 'tambah-saldo') {
    if (tableTambahSaldo) tableTambahSaldo.classList.remove('hidden');
    if (filtersTambahSaldo) filtersTambahSaldo.classList.remove('hidden');
  } else if (tabType === 'penarikan') {
    if (tablePenarikan) tablePenarikan.classList.remove('hidden');
    if (filtersPenarikan) filtersPenarikan.classList.remove('hidden');
  } else {
    if (tableBerhasil) tableBerhasil.classList.remove('hidden');
    if (filtersDefault) filtersDefault.classList.remove('hidden');
  }
}

// Close menus when clicking outside
document.addEventListener('click', function(event) {
  const profileMenu = document.getElementById('profile-menu');
  const profileButton = event.target.closest('button[onclick="toggleProfileMenu()"]');
  
  const notifMenu = document.getElementById('notification-menu');
  const notifButton = event.target.closest('button[onclick="toggleNotificationMenu()"]');

  const filterMenu = document.getElementById('filter-debit-kredit');
  const filterButton = event.target.closest('button[onclick="toggleFilterMenu(\'filter-debit-kredit\')"]');
  
  if (!profileButton && profileMenu && !profileMenu.classList.contains('hidden')) {
    profileMenu.classList.add('hidden');
  }
  
  if (!notifButton && notifMenu && !notifMenu.classList.contains('hidden')) {
    notifMenu.classList.add('hidden');
  }

  // Close filter menu if clicked outside of menu and button
  if (!filterButton && filterMenu && !filterMenu.contains(event.target) && !filterMenu.classList.contains('hidden')) {
    filterMenu.classList.add('hidden');
  }
});

// Toggle steps in platform iklan
function toggleSteps(btn) {
  const card = btn.closest('.card-wrapper');
  const stepsContainer = card.querySelector('.steps-container');
  const showBtn = card.querySelector('.show-btn');
  
  if (stepsContainer.classList.contains('hidden')) {
    stepsContainer.classList.remove('hidden');
    showBtn.classList.add('hidden');
  } else {
    stepsContainer.classList.add('hidden');
    showBtn.classList.remove('hidden');
  }
}

// Toast notification for dummy interactions
function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-4 right-4 z-[100] flex flex-col gap-2';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  
  // Set colors based on type
  const bgColors = {
    info: 'bg-ink-900',
    success: 'bg-green-600',
    warning: 'bg-orange-500',
    error: 'bg-red-600'
  };
  
  const bgColor = bgColors[type] || bgColors.info;
  
  toast.className = `${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300`;
  
  // Icon based on type
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  if (type === 'warning') iconName = 'alert-triangle';
  if (type === 'error') iconName = 'alert-circle';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 shrink-0"></i>
    <p class="text-sm font-medium">${message}</p>
  `;
  
  container.appendChild(toast);
  
  // Re-init icons for the new toast
  lucide.createIcons({
    root: toast
  });

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Specific tab switching for Profile sub-tabs
function switchProfileTab(tabId, btn) {
  const container = btn.parentElement;
  
  // Update styling
  container.querySelectorAll('button').forEach(b => {
    // reset all to inactive
    b.className = 'w-full flex items-center justify-between px-6 py-4 border-b border-ink-100 hover:bg-ink-50 transition-colors text-left';
    b.innerHTML = `<span class="font-medium text-ink-500 text-sm">${b.innerText}</span>`;
  });
  
  // set active
  btn.className = 'w-full flex items-center justify-between px-6 py-4 border-b border-ink-100 hover:bg-ink-50 transition-colors bg-orange-50/50 text-left';
  btn.innerHTML = `<span class="font-semibold text-orange-500 text-sm">${btn.innerText}</span><i data-lucide="chevron-right" class="w-4 h-4 text-orange-500"></i>`;
  
  lucide.createIcons();

  // Hide all contents
  document.querySelectorAll('.profile-content').forEach(el => el.classList.add('hidden'));
  
  // Show target
  const target = document.getElementById('profile-' + tabId);
  if (target) {
    target.classList.remove('hidden');
  }
}

// Specific tab switching for Iklan Bermasalah sub-tabs
function switchBermasalahTab(tabId, btn) {
  const container = btn.parentElement;
  
  // Update styling
  container.querySelectorAll('.bermasalah-tab-btn').forEach(b => {
    b.classList.remove('text-orange-500', 'border-orange-500', 'font-semibold');
    b.classList.add('text-ink-500', 'border-transparent', 'font-medium', 'hover:text-ink-700');
  });
  
  btn.classList.remove('text-ink-500', 'border-transparent', 'font-medium', 'hover:text-ink-700');
  btn.classList.add('text-orange-500', 'border-orange-500', 'font-semibold');
  
  // Hide all contents
  document.querySelectorAll('.bermasalah-content').forEach(el => el.classList.add('hidden'));
  
  // Show target
  const target = document.getElementById('bermasalah-' + tabId);
  if (target) {
    target.classList.remove('hidden');
  }
}

// Specific tab switching for Saldo Iklan sub-tabs
function switchSaldoTab(tabId, btn) {
  // Update styling
  const container = btn.parentElement;
  
  container.querySelectorAll('.saldo-tab-btn').forEach(b => {
    b.classList.remove('text-orange-500', 'border-orange-500', 'font-semibold');
    b.classList.add('text-ink-600', 'border-transparent', 'font-medium', 'hover:text-ink-900');
  });
  
  btn.classList.remove('text-ink-600', 'border-transparent', 'font-medium', 'hover:text-ink-900');
  btn.classList.add('text-orange-500', 'border-orange-500', 'font-semibold');

  // Hide all contents
  document.querySelectorAll('.saldo-content').forEach(el => el.classList.add('hidden'));
  
  // Show target
  const target = document.getElementById('saldo-' + tabId);
  if (target) {
    target.classList.remove('hidden');
  }

  // Toggle Date Filter Visibility
  const dateFilter = document.getElementById('saldo-date-filter');
  const penggantiFilters = document.getElementById('saldo-pengganti-filters');
  
  if (dateFilter) {
    if (tabId === 'histori-topup' || tabId === 'histori-pindah' || tabId === 'histori-pengganti') {
      dateFilter.classList.remove('hidden');
    } else {
      dateFilter.classList.add('hidden');
    }
  }

  if (penggantiFilters) {
    if (tabId === 'histori-pengganti') {
      penggantiFilters.classList.remove('hidden');
      penggantiFilters.classList.add('sm:flex');
    } else {
      penggantiFilters.classList.add('hidden');
      penggantiFilters.classList.remove('sm:flex');
    }
  }
}
