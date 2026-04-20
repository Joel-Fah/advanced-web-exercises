/* theme.js */
(function() {
  function applyTheme(theme) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(theme + '-mode');
    try { setSetting('theme', theme); } catch(e) {}
    const btn = document.getElementById('themeToggleSidebar');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<span>☀️</span><span>Light Mode</span>'
        : '<span>🌙</span><span>Dark Mode</span>';
    }
  }

  window.toggleTheme = function() {
    const current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  };

  window.initTheme = function() {
    let saved = 'light';
    try { saved = getSetting('theme', 'light'); } catch(e) {}
    applyTheme(saved);
  };

  document.addEventListener('DOMContentLoaded', function() {
    window.initTheme();
  });
})();
