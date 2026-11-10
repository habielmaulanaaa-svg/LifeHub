/**
 * LifeHub - All-in-One Productivity & Finance Manager
 * Features: Keuangan (Finance Tracker), Tugas (To-Do List), Catatan (Notes)
 * Storage: HTML5 localStorage
 */

// ==========================================
// DEFAULT CATEGORIES & SEED DATA
// ==========================================
const FINANCE_CATEGORIES = {
  expense: ['Makanan & Minuman', 'Transportasi', 'Belanja', 'Tagihan & Utilitas', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'],
  income: ['Gaji', 'Bonus & THR', 'Freelance & Bisnis', 'Investasi', 'Hadiah', 'Lainnya']
};

// Auto-reset seed data so everything starts fresh at zero
if (!localStorage.getItem('lifehub_v2_clean_start')) {
  localStorage.removeItem('lifehub_finance');
  localStorage.removeItem('lifehub_tasks');
  localStorage.removeItem('lifehub_notes');
  localStorage.setItem('lifehub_v2_clean_start', 'true');
}

const NOTE_COLORS = {
  white: 'bg-white border-slate-200',
  yellow: 'bg-amber-50/70 border-amber-200',
  blue: 'bg-sky-50/70 border-sky-200',
  green: 'bg-emerald-50/70 border-emerald-200',
  purple: 'bg-purple-50/70 border-purple-200'
};

const SEED_DATA = {
  finance: [],
  tasks: [],
  notes: []
};

// ==========================================
// STATE MANAGEMENT & LOCAL STORAGE
// ==========================================
class Store {
  static get(key) {
    const raw = localStorage.getItem(`lifehub_${key}`);
    if (!raw) {
      if (SEED_DATA[key]) {
        this.set(key, SEED_DATA[key]);
        return SEED_DATA[key];
      }
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  static set(key, value) {
    localStorage.setItem(`lifehub_${key}`, JSON.stringify(value));
  }

  static clearAll() {
    localStorage.removeItem('lifehub_finance');
    localStorage.removeItem('lifehub_tasks');
    localStorage.removeItem('lifehub_notes');
  }
}

let activeTab = 'dashboard';
let taskStatusFilter = 'all';
let expenseChartInstance = null;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatCurrency(amount) {
  return 'Rp ' + Number(amount).toLocaleString('id-ID');
}

function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initDateDisplay();
  initNavigation();
  initFormCategories();
  initEventListeners();
  renderAll();
});

function initDateDisplay() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = now.toLocaleDateString('id-ID', options);
  
  const dateEl = document.getElementById('currentDateDisplay');
  if (dateEl) dateEl.textContent = formattedDate;

  // Set default modal dates to today
  const today = now.toISOString().split('T')[0];
  const financeDateInput = document.getElementById('financeDate');
  const taskDueDateInput = document.getElementById('taskDueDate');
  if (financeDateInput) financeDateInput.value = today;
  if (taskDueDateInput) taskDueDateInput.value = today;

  // Update dynamic WIB greeting and user name
  updateGreetingDisplay();
}

// ==========================================
// USER PROFILE & TIME-BASED GREETING (WIB)
// ==========================================
function getUserName() {
  return localStorage.getItem('lifehub_user_name') || 'Habil';
}

function getWIBGreeting() {
  // Compute current hour in WIB (UTC+7)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (7 * 3600000));
  const hour = wibTime.getHours();

  // Aturan waktu WIB:
  // - 12 malam hingga pukul 8 (00:00 - 08:59): Selamat Pagi
  // - Pukul 9 hingga 11:59: Selamat Siang
  // - Pukul 12 hingga 4 sore (12:00 - 16:59): Selamat Sore
  // - Jam 5 sore hingga 12 malam (17:00 - 23:59): Selamat Malam
  if (hour >= 0 && hour < 9) {
    return 'Selamat Pagi';
  } else if (hour >= 9 && hour < 12) {
    return 'Selamat Siang';
  } else if (hour >= 12 && hour < 17) {
    return 'Selamat Sore';
  } else {
    return 'Selamat Malam';
  }
}

function updateGreetingDisplay() {
  const greeting = getWIBGreeting();
  const name = getUserName();

  const greetingEl = document.getElementById('pageGreeting');
  if (greetingEl) {
    greetingEl.textContent = `${greeting}, ${name}`;
  }

  const sidebarNameEl = document.getElementById('sidebarUserName');
  if (sidebarNameEl) {
    sidebarNameEl.textContent = name;
  }

  const avatarInitialEl = document.getElementById('sidebarAvatarInitial');
  if (avatarInitialEl) {
    avatarInitialEl.textContent = name.charAt(0).toUpperCase() || 'H';
  }
}

function openProfileModal() {
  const input = document.getElementById('inputProfileName');
  if (input) input.value = getUserName();
  openModal('modalProfile');
}

function handleProfileSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('inputProfileName');
  const newName = input.value.trim() || 'Habil';
  localStorage.setItem('lifehub_user_name', newName);
  closeModal('modalProfile');
  updateGreetingDisplay();
}

function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Mobile menu drawer
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('mobileBackdrop');

  if (mobileMenuBtn && sidebar && backdrop) {
    const toggleMobileMenu = () => {
      const isOpen = !sidebar.classList.contains('-translate-x-full');
      if (isOpen) {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
      } else {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
      }
    };

    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    backdrop.addEventListener('click', toggleMobileMenu);

    const closeMobileMenuBtn = document.getElementById('closeMobileMenuBtn');
    if (closeMobileMenuBtn) {
      closeMobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
  }

  // Handle sidebar transition smooth chart update
  if (sidebar) {
    sidebar.addEventListener('transitionend', () => {
      if (expenseChartInstance) {
        expenseChartInstance.resize();
      }
    });
  }
}

function switchTab(tabId) {
  activeTab = tabId;

  // Update tabs visibility
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.add('hidden');
  });
  const activeSection = document.getElementById(`tab-${tabId}`);
  if (activeSection) activeSection.classList.remove('hidden');

  // Update sidebar active buttons styling
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isCurrent = btn.getAttribute('data-tab') === tabId;
    if (isCurrent) {
      btn.className = 'nav-btn w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-white bg-indigo-600 shadow-sm shadow-indigo-100';
    } else {
      btn.className = 'nav-btn w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900';
    }
  });

  // Close mobile drawer if opened
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('mobileBackdrop');
  if (sidebar && !sidebar.classList.contains('-translate-x-full') && window.innerWidth < 768) {
    sidebar.classList.add('-translate-x-full');
    backdrop?.classList.add('hidden');
  }

  // Refresh tab-specific views
  if (tabId === 'dashboard') {
    renderDashboard();
  } else if (tabId === 'finance') {
    renderFinance();
  } else if (tabId === 'tasks') {
    renderTasks();
  } else if (tabId === 'notes') {
    renderNotes();
  }
}

function initFormCategories() {
  const financeTypeRadios = document.querySelectorAll('input[name="financeType"]');
  financeTypeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      populateFinanceCategorySelect(e.target.value);
    });
  });
  populateFinanceCategorySelect('expense');

  // Populate finance filter category dropdown
  const filterCatSelect = document.getElementById('financeFilterCategory');
  if (filterCatSelect) {
    const allCategories = Array.from(new Set([...FINANCE_CATEGORIES.expense, ...FINANCE_CATEGORIES.income]));
    allCategories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      filterCatSelect.appendChild(opt);
    });
  }
}

function populateFinanceCategorySelect(type) {
  const select = document.getElementById('financeCategorySelect');
  if (!select) return;
  select.innerHTML = '';
  const categories = FINANCE_CATEGORIES[type] || [];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function initEventListeners() {
  // Quick Add Button
  const quickAddBtn = document.getElementById('quickAddBtn');
  if (quickAddBtn) {
    quickAddBtn.addEventListener('click', () => {
      if (activeTab === 'finance') openFinanceModal();
      else if (activeTab === 'tasks') openTaskModal();
      else if (activeTab === 'notes') openNoteModal();
      else {
        // From Dashboard, prompt which one to add
        openFinanceModal();
      }
    });
  }

  // Backup & Restore
  document.getElementById('btnExportData')?.addEventListener('click', exportData);
  document.getElementById('importFileInput')?.addEventListener('change', importData);
  document.getElementById('btnResetData')?.addEventListener('click', resetAllData);
}

function renderAll() {
  renderDashboard();
  renderFinance();
  renderTasks();
  renderNotes();
}

// ==========================================
// DASHBOARD LOGIC
// ==========================================
function renderDashboard() {
  const finance = Store.get('finance');
  const tasks = Store.get('tasks');
  const notes = Store.get('notes');

  // Metrics: Keuangan
  let totalIncome = 0;
  let totalExpense = 0;
  finance.forEach(item => {
    const amt = Number(item.amount) || 0;
    if (item.type === 'income') totalIncome += amt;
    else totalExpense += amt;
  });
  const balance = totalIncome - totalExpense;

  document.getElementById('dashTotalBalance').textContent = formatCurrency(balance);
  document.getElementById('dashTotalIncome').textContent = `+ ${formatCurrency(totalIncome)}`;
  document.getElementById('dashTotalExpense').textContent = `- ${formatCurrency(totalExpense)}`;

  // Metrics: Tasks
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const totalTasksCount = tasks.length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasks.length / totalTasksCount) * 100) : 0;

  document.getElementById('dashPendingTasksCount').textContent = pendingTasks.length;
  document.getElementById('dashTaskCompletionRate').textContent = `${completionPercentage}% target tercapai (${completedTasks.length}/${totalTasksCount})`;

  // Badge sidebar
  const badgePending = document.getElementById('badgePendingTasks');
  if (badgePending) {
    if (pendingTasks.length > 0) {
      badgePending.textContent = pendingTasks.length;
      badgePending.classList.remove('hidden');
    } else {
      badgePending.classList.add('hidden');
    }
  }

  // Dashboard Chart: Expense Breakdown
  renderExpenseChart(finance);

  // Dashboard Top Urgent Tasks
  renderDashboardUrgentTasks(pendingTasks, tasks.length);

  // Dashboard Recent Notes
  renderDashboardRecentNotes(notes);
}

function renderExpenseChart(finance) {
  const expenses = finance.filter(item => item.type === 'expense');
  const chartCanvas = document.getElementById('expenseCategoryChart');
  const emptyState = document.getElementById('chartEmptyState');
  if (!chartCanvas) return;

  if (expenses.length === 0) {
    chartCanvas.classList.add('hidden');
    emptyState?.classList.remove('hidden');
    if (expenseChartInstance) {
      expenseChartInstance.destroy();
      expenseChartInstance = null;
    }
    return;
  }

  chartCanvas.classList.remove('hidden');
  emptyState?.classList.add('hidden');

  // Aggregate by category
  const categoryTotals = {};
  expenses.forEach(item => {
    categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  const colors = [
    '#f43f5e', '#fb923c', '#fbbf24', '#34d399', 
    '#38bdf8', '#818cf8', '#c084fc', '#94a3b8'
  ];

  if (expenseChartInstance) {
    expenseChartInstance.destroy();
  }

  const ctx = chartCanvas.getContext('2d');
  expenseChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" },
            boxWidth: 12,
            padding: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw || 0;
              return ` ${context.label}: ${formatCurrency(val)}`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });
}

function renderDashboardUrgentTasks(pendingTasks, totalTasks = 0) {
  const container = document.getElementById('dashUrgentTasksList');
  if (!container) return;

  if (pendingTasks.length === 0) {
    const iconSvg = totalTasks > 0
      ? `<svg class="w-10 h-10 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
      : `<svg class="w-10 h-10 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`;

    container.innerHTML = `
      <div class="h-40 flex flex-col items-center justify-center text-slate-400">
        ${iconSvg}
        <p class="text-xs font-medium">${totalTasks > 0 ? 'Hebat! Semua tugas telah selesai.' : 'Belum ada tugas tercatat.'}</p>
      </div>
    `;
    return;
  }

  // Sort by priority (Tinggi first) and then by date
  const sorted = [...pendingTasks].sort((a, b) => {
    const priorityWeight = { 'Tinggi': 3, 'Sedang': 2, 'Rendah': 1 };
    const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (pDiff !== 0) return pDiff;
    return new Date(a.dueDate) - new Date(b.dueDate);
  }).slice(0, 4);

  let html = '';
  sorted.forEach(task => {
    const badgeColor = task.priority === 'Tinggi' 
      ? 'bg-rose-100 text-rose-700' 
      : task.priority === 'Sedang' 
      ? 'bg-amber-100 text-amber-700' 
      : 'bg-emerald-100 text-emerald-700';

    html += `
      <div class="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/70 transition-colors">
        <div class="flex items-center space-x-2.5 sm:space-x-3 overflow-hidden min-w-0">
          <input type="checkbox" onchange="toggleTask('${task.id}')" class="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer flex-shrink-0">
          <div class="truncate">
            <p class="text-xs font-semibold text-slate-800 truncate">${escapeHtml(task.title)}</p>
            <p class="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <i class="fa-regular fa-calendar text-[9px] sm:text-[10px]"></i> ${formatDateIndo(task.dueDate)}
            </p>
          </div>
        </div>
        <span class="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor} whitespace-nowrap ml-2">
          ${task.priority}
        </span>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderDashboardRecentNotes(notes) {
  const container = document.getElementById('dashRecentNotesGrid');
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `
      <div class="col-span-1 md:col-span-3 py-8 flex flex-col items-center justify-center text-slate-400">
        <svg class="w-9 h-9 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        <p class="text-xs font-medium">Belum ada catatan. Klik tombol Entri Baru untuk mulai menulis.</p>
      </div>
    `;
    return;
  }

  const recent = [...notes].slice(0, 3);
  let html = '';

  recent.forEach(note => {
    const colorClasses = NOTE_COLORS[note.color] || NOTE_COLORS.white;
    html += `
      <div class="p-3.5 sm:p-4 rounded-xl border ${colorClasses} hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer" onclick="switchTab('notes')">
        <div>
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-md">${escapeHtml(note.category)}</span>
            <span class="text-[9px] sm:text-[10px] text-slate-400">${note.updatedAt || ''}</span>
          </div>
          <h4 class="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1 mb-1">${escapeHtml(note.title)}</h4>
          <p class="text-[11px] sm:text-xs text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed whitespace-pre-line">${escapeHtml(note.content)}</p>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ==========================================
// KEUANGAN (FINANCE) LOGIC
// ==========================================
function renderFinance() {
  const finance = Store.get('finance');
  const typeFilter = document.getElementById('financeFilterType')?.value || 'all';
  const catFilter = document.getElementById('financeFilterCategory')?.value || 'all';

  // Calculate summaries
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  finance.forEach(item => {
    const amt = Number(item.amount) || 0;
    if (item.type === 'income') {
      totalIncome += amt;
      incomeCount++;
    } else {
      totalExpense += amt;
      expenseCount++;
    }
  });

  const netBalance = totalIncome - totalExpense;
  const balanceEl = document.getElementById('financeTotalBalance');
  if (balanceEl) balanceEl.textContent = formatCurrency(netBalance);

  document.getElementById('financeIncomeSum').textContent = formatCurrency(totalIncome);
  document.getElementById('financeIncomeCount').textContent = `${incomeCount} transaksi`;

  document.getElementById('financeExpenseSum').textContent = formatCurrency(totalExpense);
  document.getElementById('financeExpenseCount').textContent = `${expenseCount} transaksi`;

  const healthStatusEl = document.getElementById('financeHealthStatus');
  if (healthStatusEl) {
    if (netBalance > 0) {
      healthStatusEl.textContent = 'Surplus (Aman)';
      healthStatusEl.className = 'font-semibold text-emerald-300';
    } else if (netBalance === 0) {
      healthStatusEl.textContent = 'Imbang';
      healthStatusEl.className = 'font-semibold text-amber-200';
    } else {
      healthStatusEl.textContent = 'Defisit (Hati-hati)';
      healthStatusEl.className = 'font-semibold text-rose-300';
    }
  }

  // Filter list
  let filtered = finance.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (catFilter !== 'all' && item.category !== catFilter) return false;
    return true;
  });

  // Sort newest date first
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const tbody = document.getElementById('financeTableBody');
  const emptyState = document.getElementById('financeEmptyState');

  if (filtered.length === 0) {
    if (tbody) tbody.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  let rowsHtml = '';
  filtered.forEach(item => {
    const isIncome = item.type === 'income';
    const amountColor = isIncome ? 'text-emerald-600' : 'text-rose-600';
    const amountSign = isIncome ? '+' : '-';
    const badgeType = isIncome 
      ? '<span class="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">Pemasukan</span>' 
      : '<span class="bg-rose-50 text-rose-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">Pengeluaran</span>';

    rowsHtml += `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-6 text-xs text-slate-500 whitespace-nowrap">${formatDateIndo(item.date)}</td>
        <td class="py-3 px-6 font-medium text-slate-800">
          <div class="flex items-center gap-2">
            <span>${escapeHtml(item.desc)}</span>
            ${badgeType}
          </div>
        </td>
        <td class="py-3 px-6 text-xs text-slate-600">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs">
            <i class="fa-solid fa-tag text-[10px] text-slate-400"></i> ${escapeHtml(item.category)}
          </span>
        </td>
        <td class="py-3 px-6 text-right font-bold ${amountColor} whitespace-nowrap">
          ${amountSign} ${formatCurrency(item.amount)}
        </td>
        <td class="py-3 px-6 text-center whitespace-nowrap">
          <button onclick="deleteFinance('${item.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="Hapus transaksi">
            <i class="fa-regular fa-trash-can text-sm"></i>
          </button>
        </td>
      </tr>
    `;
  });

  if (tbody) tbody.innerHTML = rowsHtml;
}

function openFinanceModal() {
  document.getElementById('financeForm').reset();
  document.getElementById('financeDate').value = new Date().toISOString().split('T')[0];
  populateFinanceCategorySelect('expense');
  openModal('modalFinance');
}

function handleFinanceSubmit(e) {
  e.preventDefault();
  const type = document.querySelector('input[name="financeType"]:checked')?.value || 'expense';
  const amount = Number(document.getElementById('financeAmount').value);
  const desc = document.getElementById('financeDesc').value.trim();
  const category = document.getElementById('financeCategorySelect').value;
  const date = document.getElementById('financeDate').value;

  if (!amount || !desc || !category || !date) return;

  const newItem = {
    id: 'f-' + Date.now(),
    type,
    amount,
    desc,
    category,
    date
  };

  const list = Store.get('finance');
  list.unshift(newItem);
  Store.set('finance', list);

  closeModal('modalFinance');
  renderAll();
}

function deleteFinance(id) {
  if (!confirm('Apakah kamu yakin ingin menghapus transaksi ini?')) return;
  let list = Store.get('finance');
  list = list.filter(item => item.id !== id);
  Store.set('finance', list);
  renderAll();
}

// ==========================================
// TUGAS & TARGET (TASKS) LOGIC
// ==========================================
function renderTasks() {
  const tasks = Store.get('tasks');
  const priorityFilter = document.getElementById('taskPriorityFilter')?.value || 'all';

  // Overall Statistics
  const completedList = tasks.filter(t => t.completed);
  const pendingList = tasks.filter(t => !t.completed);
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completedList.length / total) * 100) : 0;

  document.getElementById('taskCountTotal').textContent = total;
  document.getElementById('taskCountCompleted').textContent = completedList.length;
  document.getElementById('taskCountPending').textContent = pendingList.length;
  document.getElementById('taskProgressPercentage').textContent = `${pct}%`;
  document.getElementById('taskProgressBar').style.width = `${pct}%`;

  // Filter tasks
  let filtered = tasks.filter(t => {
    if (taskStatusFilter === 'pending' && t.completed) return false;
    if (taskStatusFilter === 'completed' && !t.completed) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const listContainer = document.getElementById('taskListContainer');
  const emptyState = document.getElementById('taskEmptyState');

  if (filtered.length === 0) {
    if (listContainer) listContainer.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  let html = '';
  filtered.forEach(task => {
    const isDone = task.completed;
    const textStyle = isDone ? 'line-through text-slate-400' : 'text-slate-800';
    const badgeColor = task.priority === 'Tinggi' 
      ? 'bg-rose-100 text-rose-700' 
      : task.priority === 'Sedang' 
      ? 'bg-amber-100 text-amber-700' 
      : 'bg-emerald-100 text-emerald-700';

    html += `
      <li class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <input type="checkbox" onchange="toggleTask('${task.id}')" ${isDone ? 'checked' : ''} class="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer">
          <div class="min-w-0">
            <p class="text-sm font-medium ${textStyle} truncate">${escapeHtml(task.title)}</p>
            <div class="flex items-center gap-2 mt-1 flex-wrap">
              <span class="text-[10px] text-slate-400 flex items-center gap-1">
                <i class="fa-regular fa-calendar text-[9px]"></i> ${formatDateIndo(task.dueDate)}
              </span>
              <span class="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                ${escapeHtml(task.category)}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor} whitespace-nowrap">
            ${task.priority}
          </span>
          <button onclick="deleteTask('${task.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors" title="Hapus tugas">
            <i class="fa-regular fa-trash-can text-sm"></i>
          </button>
        </div>
      </li>
    `;
  });

  if (listContainer) listContainer.innerHTML = html;
}

function setTaskFilter(filter) {
  taskStatusFilter = filter;
  document.querySelectorAll('.task-filter-btn').forEach(btn => {
    btn.className = 'task-filter-btn px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:text-slate-900';
  });
  const currentBtn = document.getElementById(`taskFilterBtn-${filter}`);
  if (currentBtn) {
    currentBtn.className = 'task-filter-btn px-3 py-1.5 rounded-lg font-semibold bg-white text-indigo-600 shadow-sm';
  }
  renderTasks();
}

function openTaskModal() {
  document.getElementById('taskForm').reset();
  document.getElementById('taskDueDate').value = new Date().toISOString().split('T')[0];
  openModal('modalTask');
}

function handleTaskSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const category = document.getElementById('taskCategory').value;
  const dueDate = document.getElementById('taskDueDate').value;

  if (!title || !dueDate) return;

  const newTask = {
    id: 't-' + Date.now(),
    title,
    priority,
    category,
    dueDate,
    completed: false
  };

  const tasks = Store.get('tasks');
  tasks.unshift(newTask);
  Store.set('tasks', tasks);

  closeModal('modalTask');
  renderAll();
}

function toggleTask(id) {
  const tasks = Store.get('tasks');
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    Store.set('tasks', tasks);
    renderAll();
  }
}

function deleteTask(id) {
  let tasks = Store.get('tasks');
  tasks = tasks.filter(t => t.id !== id);
  Store.set('tasks', tasks);
  renderAll();
}

// ==========================================
// CATATAN (NOTES) LOGIC
// ==========================================
function renderNotes() {
  const notes = Store.get('notes');
  const searchKey = document.getElementById('noteSearchInput')?.value.toLowerCase().trim() || '';
  const categoryFilter = document.getElementById('noteCategoryFilter')?.value || 'all';

  let filtered = notes.filter(n => {
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (searchKey) {
      const matchTitle = n.title.toLowerCase().includes(searchKey);
      const matchContent = n.content.toLowerCase().includes(searchKey);
      return matchTitle || matchContent;
    }
    return true;
  });

  const gridContainer = document.getElementById('notesGridContainer');
  const emptyState = document.getElementById('notesEmptyState');

  if (filtered.length === 0) {
    if (gridContainer) gridContainer.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  let html = '';
  filtered.forEach(note => {
    const colorClasses = NOTE_COLORS[note.color] || NOTE_COLORS.white;

    html += `
      <div class="rounded-2xl border ${colorClasses} p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-white/70 px-2 py-0.5 rounded-md border border-slate-200/50">
              ${escapeHtml(note.category)}
            </span>
            <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button onclick="editNote('${note.id}')" class="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-white/80" title="Edit catatan">
                <i class="fa-regular fa-pen-to-square text-xs"></i>
              </button>
              <button onclick="deleteNote('${note.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white/80" title="Hapus catatan">
                <i class="fa-regular fa-trash-can text-xs"></i>
              </button>
            </div>
          </div>
          <h4 class="text-base font-bold text-slate-900 mb-2 leading-snug">${escapeHtml(note.title)}</h4>
          <p class="text-xs text-slate-700 whitespace-pre-line leading-relaxed">${escapeHtml(note.content)}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-200/40 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tersimpan</span>
          <span>${note.updatedAt || ''}</span>
        </div>
      </div>
    `;
  });

  if (gridContainer) gridContainer.innerHTML = html;
}

function openNoteModal(editId = null) {
  const form = document.getElementById('noteForm');
  form.reset();
  document.getElementById('noteEditId').value = editId || '';

  if (editId) {
    document.getElementById('noteModalHeading').textContent = 'Edit Catatan';
    const notes = Store.get('notes');
    const existing = notes.find(n => n.id === editId);
    if (existing) {
      document.getElementById('noteTitle').value = existing.title;
      document.getElementById('noteCategory').value = existing.category;
      document.getElementById('noteColor').value = existing.color || 'white';
      document.getElementById('noteContent').value = existing.content;
    }
  } else {
    document.getElementById('noteModalHeading').textContent = 'Tulis Catatan Baru';
  }

  openModal('modalNote');
}

function handleNoteSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('noteEditId').value;
  const title = document.getElementById('noteTitle').value.trim();
  const category = document.getElementById('noteCategory').value;
  const color = document.getElementById('noteColor').value;
  const content = document.getElementById('noteContent').value.trim();

  if (!title || !content) return;

  const nowFormatted = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  let notes = Store.get('notes');

  if (editId) {
    notes = notes.map(n => {
      if (n.id === editId) {
        return { ...n, title, category, color, content, updatedAt: nowFormatted };
      }
      return n;
    });
  } else {
    const newNote = {
      id: 'n-' + Date.now(),
      title,
      category,
      color,
      content,
      updatedAt: nowFormatted
    };
    notes.unshift(newNote);
  }

  Store.set('notes', notes);
  closeModal('modalNote');
  renderAll();
}

function editNote(id) {
  openNoteModal(id);
}

function deleteNote(id) {
  if (!confirm('Apakah kamu yakin ingin menghapus catatan ini?')) return;
  let notes = Store.get('notes');
  notes = notes.filter(n => n.id !== id);
  Store.set('notes', notes);
  renderAll();
}

// ==========================================
// MODAL HELPERS
// ==========================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// Close modals when clicking backdrop
window.addEventListener('click', (e) => {
  ['modalFinance', 'modalTask', 'modalNote', 'modalProfile'].forEach(id => {
    const el = document.getElementById(id);
    if (el && e.target === el) {
      closeModal(id);
    }
  });
});

// ==========================================
// DATA EXPORT / IMPORT / RESET
// ==========================================
function exportData() {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    finance: Store.get('finance'),
    tasks: Store.get('tasks'),
    notes: Store.get('notes')
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifehub-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.finance && Array.isArray(data.finance)) Store.set('finance', data.finance);
      if (data.tasks && Array.isArray(data.tasks)) Store.set('tasks', data.tasks);
      if (data.notes && Array.isArray(data.notes)) Store.set('notes', data.notes);

      alert('Data berhasil diimpor!');
      renderAll();
    } catch (err) {
      alert('Format file JSON tidak valid!');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (confirm('PERINGATAN: Tindakan ini akan menghapus semua data keuangan, tugas, dan catatan secara permanen. Lanjutkan?')) {
    Store.clearAll();
    renderAll();
    alert('Semua data telah direset ke setelan awal.');
  }
}
