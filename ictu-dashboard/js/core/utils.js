/* utils.js */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function debounce(fn, delay) {
  let t;
  return function(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function navigateTo(url) {
  window.location.href = url;
}

function gpaClass(gpa) {
  if (gpa >= 3.5) return 'badge--gpa-high';
  if (gpa >= 2.5) return 'badge--gpa-mid';
  return 'badge--gpa-low';
}

function rankMedal(rank) {
  if (rank === 1) return '<span class="rank-1">🥇</span>';
  if (rank === 2) return '<span class="rank-2">🥈</span>';
  if (rank === 3) return '<span class="rank-3">🥉</span>';
  return `<span style="color:var(--color-stone-gray);font-size:13px">#${rank}</span>`;
}

function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return `${year}-S${month <= 6 ? 1 : 2}`;
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
