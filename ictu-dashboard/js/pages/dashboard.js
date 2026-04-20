/* dashboard.js */
document.addEventListener('DOMContentLoaded', function () {
  seedIfEmpty();
  initLayout('Dashboard');
  renderDashboard();
  if (typeof AOS !== 'undefined') AOS.init({ duration: 600, once: true, offset: 60, easing: 'ease-out-cubic' });
});

function renderDashboard() {
  const students = getAllStudents();
  const courses = getAllCourses();
  const deptStats = getDepartmentStats();
  const avgGPA = getUniversityAvgGPA();
  const activeDepts = Object.keys(deptStats).length;
  const currentSem = getCurrentSemester();
  const thisTermCourses = courses.filter(c => c.semester === currentSem).length;

  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="page-header" data-aos="fade-right">
      <h1 class="section-title">Dashboard</h1>
      <p class="section-subtitle">Welcome to the ICT University Student Management Portal. Here's an overview of the current academic state.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card" data-aos="fade-up" data-aos-delay="0">
        <div class="stat-card__icon">👥</div>
        <div class="stat-card__value" id="statTotal">${students.length}</div>
        <div class="stat-card__label">Enrolled Students</div>
      </div>
      <div class="stat-card" data-aos="fade-up" data-aos-delay="100">
        <div class="stat-card__icon">🎓</div>
        <div class="stat-card__value" id="statGPA">${avgGPA > 0 ? avgGPA.toFixed(2) : '—'}</div>
        <div class="stat-card__label">University Avg GPA</div>
      </div>
      <div class="stat-card" data-aos="fade-up" data-aos-delay="200">
        <div class="stat-card__icon">🏛️</div>
        <div class="stat-card__value" id="statDepts">${activeDepts}</div>
        <div class="stat-card__label">Active Departments</div>
      </div>
      <div class="stat-card" data-aos="fade-up" data-aos-delay="300">
        <div class="stat-card__icon">📅</div>
        <div class="stat-card__value" id="statCourses">${thisTermCourses}</div>
        <div class="stat-card__label">Courses This Semester</div>
      </div>
    </div>

    <div class="two-col" data-aos="fade-up" data-aos-delay="100">
      <div class="card">
        <h3 style="font-family:var(--font-serif);font-size:1.2rem;margin-bottom:var(--space-5);">Department Breakdown</h3>
        <div id="deptBreakdown"></div>
      </div>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5);">
          <h3 style="font-family:var(--font-serif);font-size:1.2rem;">Recent Students</h3>
          <a href="/pages/students.html" class="btn btn--ghost btn--sm">View all →</a>
        </div>
        <div id="recentStudents"></div>
      </div>
    </div>
  `;

  renderDeptBreakdown(deptStats, students.length);
  renderRecentStudents(students);
}

function renderDeptBreakdown(deptStats, total) {
  const el = document.getElementById('deptBreakdown');
  if (!el) return;
  const entries = Object.entries(deptStats).sort((a, b) => b[1].count - a[1].count);
  if (!entries.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state__icon">🏛️</div><p class="empty-state__text">No department data yet.</p></div>';
    return;
  }
  el.innerHTML = entries.map(([code, data]) => {
    const pct = total > 0 ? Math.round((data.count / total) * 100) : 0;
    return `
      <div class="dept-breakdown-row">
        <span class="dept-code">${escapeHTML(code)}</span>
        <span class="dept-name">${escapeHTML(getDeptName(code))}</span>
        <div class="dept-bar-wrap"><div class="progress-bar"><div class="progress-bar__fill" style="width:${pct}%"></div></div></div>
        <span class="dept-count">${data.count}</span>
      </div>`;
  }).join('');
}

function renderRecentStudents(students) {
  const el = document.getElementById('recentStudents');
  if (!el) return;
  const recent = [...students].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
  if (!recent.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state__icon">👥</div><p class="empty-state__text">No students yet.</p></div>';
    return;
  }
  el.innerHTML = recent.map(s => {
    const gpa = getAverageGPA(s.id);
    return `
      <div class="recent-student-card" onclick="navigateTo('/pages/courses.html?student=${s.id}')">
        <div class="recent-avatar">${getInitials(s.fullName)}</div>
        <div style="flex:1;min-width:0">
          <div class="recent-name">${escapeHTML(s.fullName)}</div>
          <div class="recent-meta">${escapeHTML(s.id)} · ${escapeHTML(s.department)}</div>
        </div>
        <span class="badge ${gpaClass(gpa)}">${gpa > 0 ? gpa.toFixed(2) : 'N/A'}</span>
      </div>`;
  }).join('');
}
