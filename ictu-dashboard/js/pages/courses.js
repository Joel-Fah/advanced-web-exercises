/* courses.js */
let currentStudentId = null;
let editingCourseId = null;

document.addEventListener('DOMContentLoaded', function () {
  seedIfEmpty();
  currentStudentId = getUrlParam('student');
  initLayout('Courses');
  if (typeof AOS !== 'undefined') AOS.init({ duration: 600, once: true, offset: 60 });
  buildPage();
});

function buildPage() {
  const pc = document.getElementById('pageContent');

  if (!currentStudentId) {
    buildSelectStudentView(pc);
    return;
  }

  const student = getStudentById(currentStudentId);
  if (!student) {
    pc.innerHTML = `<div class="card empty-state"><div class="empty-state__icon">❌</div><div class="empty-state__title">Student Not Found</div><a href="/pages/courses.html" class="btn btn--terracotta">Go Back</a></div>`;
    return;
  }

  buildStudentCourseView(pc, student);
}

function buildSelectStudentView(pc) {
  const students = getAllStudents();
  pc.innerHTML = `
    <div class="page-header" data-aos="fade-right">
      <h1 class="section-title">Courses</h1>
      <p class="section-subtitle">Select a student to manage their course records.</p>
    </div>
    <div class="card" style="max-width:480px" data-aos="fade-up">
      <div class="form-group">
        <label class="form-label">Select Student</label>
        <select class="form-select" id="studentSelector" onchange="if(this.value) navigateTo('/pages/courses.html?student='+this.value)">
          <option value="">— Choose a student —</option>
          ${students.map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(s.fullName)} (${escapeHTML(s.id)})</option>`).join('')}
        </select>
      </div>
    </div>
  `;
}

function buildStudentCourseView(pc, student) {
  pc.innerHTML = `
    <div class="page-header" data-aos="fade-right">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4)">
        <div>
          <h1 class="section-title">Courses</h1>
          <p class="section-subtitle">Managing course records for this student.</p>
        </div>
        <a href="/pages/courses.html" class="btn btn--ghost btn--sm">← All Students</a>
      </div>
    </div>

    <div class="student-info-card" data-aos="fade-up" id="studentInfoCard"></div>

    <div id="courseFormPanel" style="display:none"></div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
      <h3 style="font-family:var(--font-serif);font-size:1.2rem">Course Records</h3>
      <button class="btn btn--terracotta btn--sm" onclick="openCourseForm()">➕ Add Course</button>
    </div>

    <div class="table-wrapper" data-aos="fade-up" data-aos-delay="100">
      <table class="data-table" id="courseTable">
        <thead>
          <tr>
            <th>#</th>
            <th>Code</th>
            <th>Course Name</th>
            <th>Credits</th>
            <th>Grade (/20)</th>
            <th>GPA Equiv.</th>
            <th>Semester</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="courseTbody"></tbody>
      </table>
    </div>
  `;

  renderStudentInfoCard(student);
  renderCoursesTable();

  document.getElementById('courseTbody').addEventListener('click', function (e) {
    const editBtn = e.target.closest('.btn-edit-course');
    const delBtn = e.target.closest('.btn-del-course');
    if (editBtn) openCourseForm(editBtn.dataset.id);
    if (delBtn) {
      const cid = delBtn.dataset.id;
      const course = getCourseById(cid);
      showConfirmModal({
        title: 'Remove Course',
        message: `Remove "${course ? course.courseName : cid}" from this student's record?`,
        confirmText: 'Remove', danger: true,
        onConfirm: () => { deleteCourse(cid); renderCoursesTable(); renderStudentInfoCard(student); showToast('Course removed.', 'success'); }
      });
    }
  });
}

function renderStudentInfoCard(student) {
  const card = document.getElementById('studentInfoCard');
  if (!card) return;
  const gpa = getAverageGPA(student.id);
  const courses = getCoursesByStudentId(student.id);
  card.innerHTML = `
    <div class="student-info-avatar">${getInitials(student.fullName)}</div>
    <div style="flex:1">
      <div class="student-info-name">${escapeHTML(student.fullName)}</div>
      <div class="student-info-id">${escapeHTML(student.id)}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <span class="badge badge--${student.faculty.toLowerCase()}">${escapeHTML(student.faculty)}</span>
        <span class="badge badge--dept">${escapeHTML(student.department)}</span>
        <span class="badge badge--level">L${student.level}</span>
        <span style="font-size:12px;color:var(--color-warm-silver)">${courses.length} course${courses.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
    <div class="student-info-gpa">
      <div class="student-info-gpa-val">${gpa > 0 ? gpa.toFixed(2) : '—'}</div>
      <div class="student-info-gpa-label">Avg GPA · ${gpa > 0 ? gpaLabel(gpa) : 'No courses'}</div>
    </div>
  `;
}

function renderCoursesTable() {
  const tbody = document.getElementById('courseTbody');
  if (!tbody) return;
  const courses = getCoursesByStudentId(currentStudentId);

  if (!courses.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <div class="empty-state__icon">📚</div>
        <div class="empty-state__title">No courses added yet</div>
        <div class="empty-state__text">Add course records to track this student's GPA.</div>
        <button class="btn btn--terracotta btn--sm" onclick="openCourseForm()">Add First Course</button>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  courses.forEach((c, i) => {
    const gpa = gradeToGPA(c.grade);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--color-stone-gray);font-size:12px">${i + 1}</td>
      <td><span class="font-mono text-sm" style="color:var(--color-terracotta)">${escapeHTML(c.courseCode)}</span></td>
      <td style="font-weight:500">${escapeHTML(c.courseName)}</td>
      <td style="text-align:center">${c.credits}</td>
      <td><strong>${c.grade}</strong><span style="color:var(--color-stone-gray)">/20</span></td>
      <td><span class="badge ${gpaClass(gpa)}">${gpa.toFixed(1)}</span></td>
      <td><span class="font-mono text-sm">${escapeHTML(c.semester)}</span></td>
      <td>
        <div class="action-cell">
          <button class="btn btn--ghost btn--icon btn--sm btn-edit-course" data-id="${escapeHTML(c.courseId)}" title="Edit">✏️</button>
          <button class="btn btn--danger-ghost btn--icon btn--sm btn-del-course" data-id="${escapeHTML(c.courseId)}" title="Remove">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openCourseForm(courseId) {
  editingCourseId = courseId || null;
  const panel = document.getElementById('courseFormPanel');
  if (!panel) return;
  const course = courseId ? getCourseById(courseId) : null;

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="course-panel">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-5)">
        <h4 style="font-family:var(--font-serif)">${course ? 'Edit Course' : 'Add New Course'}</h4>
        <button class="btn btn--ghost btn--sm" onclick="closeCourseForm()">✕ Cancel</button>
      </div>
      <div class="form-grid form-grid-3">
        <div class="form-group">
          <label class="form-label">Course Code <span class="required">*</span></label>
          <input class="form-input font-mono" type="text" id="courseCode" placeholder="e.g. CSC301" value="${course ? escapeHTML(course.courseCode) : ''}">
          <span class="form-error" id="err-courseCode"></span>
        </div>
        <div class="form-group" style="grid-column:span 2">
          <label class="form-label">Course Name <span class="required">*</span></label>
          <input class="form-input" type="text" id="courseName" placeholder="e.g. Data Structures" value="${course ? escapeHTML(course.courseName) : ''}">
          <span class="form-error" id="err-courseName"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Credits <span class="required">*</span></label>
          <input class="form-input" type="number" id="courseCredits" min="1" max="6" placeholder="1–6" value="${course ? course.credits : ''}">
          <span class="form-error" id="err-courseCredits"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Grade (/20) <span class="required">*</span></label>
          <input class="form-input" type="number" id="courseGrade" min="0" max="20" step="0.5" placeholder="0–20" value="${course ? course.grade : ''}">
          <span class="form-error" id="err-courseGrade"></span>
        </div>
        <div class="form-group">
          <label class="form-label">Semester <span class="required">*</span></label>
          <input class="form-input font-mono" type="text" id="courseSemester" placeholder="2024-S1" value="${course ? escapeHTML(course.semester) : getCurrentSemester()}">
          <span class="form-hint">Format: YYYY-S1 or YYYY-S2</span>
          <span class="form-error" id="err-courseSemester"></span>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-3);justify-content:flex-end;margin-top:var(--space-5)">
        <button class="btn btn--ghost" onclick="closeCourseForm()">Cancel</button>
        <button class="btn btn--terracotta" onclick="saveCourseRecord()">💾 ${course ? 'Update' : 'Save'} Course</button>
      </div>
    </div>
  `;

  document.getElementById('courseCode').addEventListener('input', function () { this.value = this.value.toUpperCase(); });
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeCourseForm() {
  const panel = document.getElementById('courseFormPanel');
  if (panel) panel.style.display = 'none';
  editingCourseId = null;
}

function saveCourseRecord() {
  const v1 = validateAndSet('courseCode', validateCourseCode);
  const v2 = validateAndSet('courseName', validateCourseName);
  const v3 = validateAndSet('courseCredits', validateCredits);
  const v4 = validateAndSet('courseGrade', validateGrade);
  const v5 = validateAndSet('courseSemester', validateSemester);

  if (!v1 || !v2 || !v3 || !v4 || !v5) { showToast('Please fix form errors.', 'error'); return; }

  const course = {
    courseId: editingCourseId || generateId(),
    studentId: currentStudentId,
    courseCode: document.getElementById('courseCode').value.trim().toUpperCase(),
    courseName: document.getElementById('courseName').value.trim(),
    credits: parseInt(document.getElementById('courseCredits').value),
    grade: parseFloat(document.getElementById('courseGrade').value),
    semester: document.getElementById('courseSemester').value.trim(),
  };

  saveCourse(course);
  closeCourseForm();
  renderCoursesTable();
  const student = getStudentById(currentStudentId);
  if (student) renderStudentInfoCard(student);
  showToast(editingCourseId ? 'Course updated!' : 'Course added!', 'success');
  editingCourseId = null;
}
