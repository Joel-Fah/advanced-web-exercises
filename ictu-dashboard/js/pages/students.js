/* students.js */
let allStudents = [];
let sortKey = 'createdAt';
let sortDir = 'desc';
let searchQuery = '';
let filterFaculty = '';
let filterDept = '';
let filterLevel = '';

document.addEventListener('DOMContentLoaded', function () {
  seedIfEmpty();
  initLayout('Students');
  if (typeof AOS !== 'undefined') AOS.init({ duration: 600, once: true, offset: 60, easing: 'ease-out-cubic' });
  buildPage();
});

function buildPage() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="page-header" data-aos="fade-right">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4)">
        <div>
          <h1 class="section-title">Students</h1>
          <p class="section-subtitle">Manage all enrolled students across ICT University.</p>
        </div>
        <a href="/pages/register.html" class="btn btn--terracotta">✏️ Add Student</a>
      </div>
    </div>

    <div class="toolbar" data-aos="fade-up">
      <div class="toolbar-left">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input class="form-input" type="text" id="searchInput" placeholder="Search by name or ID…">
        </div>
      </div>
      <div class="toolbar-right">
        <select class="form-select" id="filterFaculty" style="width:auto">
          <option value="">All Faculties</option>
          <option value="ICT">ICT</option>
          <option value="BMS">BMS</option>
        </select>
        <select class="form-select" id="filterDept" style="width:auto">
          <option value="">All Departments</option>
        </select>
        <select class="form-select" id="filterLevel" style="width:auto">
          <option value="">All Levels</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
        </select>
        <select class="form-select" id="sortSelect" style="width:auto">
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
          <option value="fullName:asc">Name A–Z</option>
          <option value="fullName:desc">Name Z–A</option>
          <option value="gpa:desc">GPA High–Low</option>
          <option value="gpa:asc">GPA Low–High</option>
        </select>
      </div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
      <span class="student-count-label" id="countLabel"></span>
      <a href="/pages/import.html" class="btn btn--ghost btn--sm">📥 Bulk Import</a>
    </div>

    <div class="table-wrapper" data-aos="fade-up" data-aos-delay="100">
      <table class="data-table" id="studentTable">
        <thead>
          <tr>
            <th style="width:36px">#</th>
            <th data-sort="id">Student ID</th>
            <th data-sort="fullName">Full Name</th>
            <th>Faculty</th>
            <th>Department</th>
            <th data-sort="level">Level</th>
            <th data-sort="gpa">Avg GPA</th>
            <th>Courses</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody id="studentTbody"></tbody>
      </table>
    </div>
  `;

  allStudents = getAllStudents();
  setupListeners();
  renderTable();
}

function setupListeners() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', debounce(() => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderTable();
  }, 200));

  document.getElementById('filterFaculty').addEventListener('change', function () {
    filterFaculty = this.value;
    filterDept = '';
    populateDeptFilter(this.value);
    renderTable();
  });

  document.getElementById('filterDept').addEventListener('change', function () {
    filterDept = this.value;
    renderTable();
  });

  document.getElementById('filterLevel').addEventListener('change', function () {
    filterLevel = this.value;
    renderTable();
  });

  document.getElementById('sortSelect').addEventListener('change', function () {
    const [key, dir] = this.value.split(':');
    sortKey = key; sortDir = dir;
    renderTable();
  });

  document.getElementById('studentTable').addEventListener('click', function (e) {
    const th = e.target.closest('th[data-sort]');
    if (th) {
      const key = th.dataset.sort;
      if (sortKey === key) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
      else { sortKey = key; sortDir = 'asc'; }
      renderTable();
    }
  });

  // Event delegation for row buttons
  document.getElementById('studentTbody').addEventListener('click', function (e) {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn = e.target.closest('.btn-delete');
    const courseBtn = e.target.closest('.btn-courses');
    if (editBtn) navigateTo('/pages/register.html?edit=' + editBtn.dataset.id);
    if (courseBtn) navigateTo('/pages/courses.html?student=' + courseBtn.dataset.id);
    if (delBtn) {
      const id = delBtn.dataset.id;
      const student = getStudentById(id);
      showConfirmModal({
        title: 'Delete Student',
        message: `Are you sure you want to delete ${student ? student.fullName : id}? All their course records will also be removed.`,
        confirmText: 'Delete', danger: true,
        onConfirm: () => {
          const row = document.querySelector(`tr[data-id="${id}"]`);
          if (row) {
            row.classList.add('row-exit');
            setTimeout(() => row.classList.add('row-exit-active'), 10);
            setTimeout(() => { deleteStudent(id); allStudents = getAllStudents(); renderTable(); showToast('Student deleted.', 'success'); }, 320);
          } else {
            deleteStudent(id); allStudents = getAllStudents(); renderTable(); showToast('Student deleted.', 'success');
          }
        }
      });
    }
  });
}

function populateDeptFilter(faculty) {
  const sel = document.getElementById('filterDept');
  sel.innerHTML = '<option value="">All Departments</option>';
  if (faculty && FACULTIES[faculty]) {
    Object.entries(FACULTIES[faculty].departments).forEach(([code, name]) => {
      const opt = document.createElement('option');
      opt.value = code; opt.textContent = `${code} — ${name}`;
      sel.appendChild(opt);
    });
  }
  sel.value = '';
}

function getFiltered() {
  let data = [...allStudents];
  if (searchQuery) data = data.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery) ||
    s.id.toLowerCase().includes(searchQuery) ||
    (s.email && s.email.toLowerCase().includes(searchQuery))
  );
  if (filterFaculty) data = data.filter(s => s.faculty === filterFaculty);
  if (filterDept) data = data.filter(s => s.department === filterDept);
  if (filterLevel) data = data.filter(s => String(s.level) === filterLevel);

  data.sort((a, b) => {
    let va, vb;
    if (sortKey === 'gpa') { va = getAverageGPA(a.id); vb = getAverageGPA(b.id); }
    else { va = (a[sortKey] || '').toString().toLowerCase(); vb = (b[sortKey] || '').toString().toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return data;
}

function renderTable() {
  const tbody = document.getElementById('studentTbody');
  const label = document.getElementById('countLabel');
  const filtered = getFiltered();
  if (label) label.textContent = `${filtered.length} student${filtered.length !== 1 ? 's' : ''} found`;

  // Update sort headers
  document.querySelectorAll('#studentTable th[data-sort]').forEach(th => {
    th.classList.remove('sorted', 'desc');
    if (th.dataset.sort === sortKey) { th.classList.add('sorted'); if (sortDir === 'desc') th.classList.add('desc'); }
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <div class="empty-state__title">No students found</div>
        <div class="empty-state__text">Try adjusting your search or filters.</div>
        <a href="/pages/register.html" class="btn btn--terracotta btn--sm">Add Student</a>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach((s, i) => {
    const gpa = getAverageGPA(s.id);
    const courseCount = getCoursesByStudentId(s.id).length;
    const tr = document.createElement('tr');
    tr.dataset.id = s.id;
    tr.innerHTML = `
      <td style="color:var(--color-stone-gray);font-size:12px">${i + 1}</td>
      <td><span class="font-mono text-sm">${escapeHTML(s.id)}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:30px;height:30px;border-radius:50%;background:var(--color-terracotta);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-family:var(--font-serif);flex-shrink:0">${getInitials(s.fullName)}</div>
          <div>
            <div style="font-weight:500;font-size:14px">${escapeHTML(s.fullName)}</div>
            <div style="font-size:11px;color:var(--color-stone-gray)">${escapeHTML(s.email || '')}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge--${s.faculty.toLowerCase()}">${escapeHTML(s.faculty)}</span></td>
      <td><span class="badge badge--dept">${escapeHTML(s.department)}</span></td>
      <td><span class="badge badge--level">L${s.level}</span></td>
      <td><span class="badge ${gpaClass(gpa)}">${gpa > 0 ? gpa.toFixed(2) : '—'}</span></td>
      <td style="text-align:center;color:var(--color-stone-gray)">${courseCount}</td>
      <td>
        <div class="action-cell">
          <button class="btn btn--ghost btn--icon btn--sm btn-courses" data-id="${escapeHTML(s.id)}" title="View Courses">📚</button>
          <button class="btn btn--ghost btn--icon btn--sm btn-edit" data-id="${escapeHTML(s.id)}" title="Edit">✏️</button>
          <button class="btn btn--danger-ghost btn--icon btn--sm btn-delete" data-id="${escapeHTML(s.id)}" title="Delete">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
