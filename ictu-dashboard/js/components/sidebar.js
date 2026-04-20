/* sidebar.js */
const NAV_ITEMS = [
  { icon: '🏠', label: 'Dashboard', href: '/index.html', match: 'index' },
  { icon: '👥', label: 'Students', href: '/pages/students.html', match: 'students' },
  { icon: '✏️', label: 'Register Student', href: '/pages/register.html', match: 'register' },
  { icon: '📚', label: 'Courses', href: '/pages/courses.html', match: 'courses' },
  { icon: '📊', label: 'Reports & PV', href: '/pages/reports.html', match: 'reports' },
  { icon: '📥', label: 'Import CSV', href: '/pages/import.html', match: 'import' },
];

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const path = window.location.pathname;

  const navHTML = NAV_ITEMS.map(item => {
    const isActive = path.includes(item.match) || (item.match === 'index' && (path === '/' || path.endsWith('index.html')));
    return `<a href="${item.href}" class="nav-link ${isActive ? 'nav-link--active' : ''}">
      <span class="nav-link__icon">${item.icon}</span>
      <span class="nav-link__label">${item.label}</span>
    </a>`;
  }).join('');

  const total = getAllStudents ? getAllStudents().length : 0;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <span class="sidebar-logo__wordmark">ICT University</span>
      <span class="sidebar-logo__sub">Student Portal</span>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Navigation</div>
      ${navHTML}
    </nav>
    <div class="sidebar-footer">
      <button class="theme-toggle-btn" id="themeToggleSidebar" onclick="toggleTheme()">
        <span>🌙</span><span>Dark Mode</span>
      </button>
      <div class="sidebar-version">v1.0.0 · ${total} students enrolled</div>
    </div>
  `;

  initTheme();
}

function renderTopbar(title) {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  topbar.innerHTML = `
    <div class="topbar-left">
      <button class="btn btn--ghost btn--icon hamburger-btn" id="hamburgerBtn" aria-label="Menu" onclick="toggleSidebar()">☰</button>
      <div class="topbar-title">${title || ''}</div>
    </div>
    <div class="topbar-right">
      <span class="topbar-greeting">${getGreeting()}, Administrator</span>
      <span class="topbar-date">${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</span>
    </div>
  `;
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar) return;
  sidebar.classList.toggle('is-open');
  if (overlay) overlay.classList.toggle('is-active');
}

function initLayout(pageTitle) {
  renderSidebar();
  renderTopbar(pageTitle);
  // Create overlay if not exists
  if (!document.getElementById('sidebarOverlay')) {
    const ov = document.createElement('div');
    ov.className = 'sidebar-overlay';
    ov.id = 'sidebarOverlay';
    ov.onclick = toggleSidebar;
    document.body.appendChild(ov);
  }
}
