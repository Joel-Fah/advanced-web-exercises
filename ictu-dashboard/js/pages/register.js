/* register.js */
let editMode = false;
let editStudentId = null;

document.addEventListener('DOMContentLoaded', function () {
  seedIfEmpty();
  editStudentId = getUrlParam('edit');
  editMode = !!editStudentId;
  initLayout(editMode ? 'Edit Student' : 'Register Student');
  if (typeof AOS !== 'undefined') AOS.init({ duration: 600, once: true, offset: 60 });
  buildForm();
  if (editMode) loadEditData();
});

function buildForm() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="page-header" data-aos="fade-right">
      <h1 class="section-title">${editMode ? 'Edit Student' : 'Register Student'}</h1>
      <p class="section-subtitle">${editMode ? 'Update student information below.' : 'Fill in the form below to enroll a new student.'}</p>
    </div>

    <div class="card form-card" data-aos="fade-up">
      <div class="form-section-title">Personal Information</div>
      <div class="form-grid form-grid-2" style="margin-bottom:var(--space-6)">
        <div class="form-group form-col-full">
          <label class="form-label" for="studentId">Student ID <span class="required">*</span></label>
          <input class="form-input font-mono" type="text" id="studentId" placeholder="ICTU20241234" maxlength="12" ${editMode ? 'readonly' : ''}>
          <span class="form-hint">Format: ICTUYYYYXXXX (e.g. ICTU20241234)</span>
          <span class="form-error" id="err-studentId"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="fullName">Full Name <span class="required">*</span></label>
          <input class="form-input" type="text" id="fullName" placeholder="e.g. Fah Joel Xavier Dejon">
          <span class="form-error" id="err-fullName"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="email">Email Address <span class="required">*</span></label>
          <input class="form-input" type="email" id="email" placeholder="e.g. john.doe@ictuniversity.edu.cm" autocomplete="off">
          <span class="form-hint">Accepts all formats including university emails</span>
          <span class="form-error" id="err-email"></span>
        </div>
      </div>

      <div class="form-section-title">Academic Information</div>
      <div class="form-grid form-grid-3">
        <div class="form-group">
          <label class="form-label" for="faculty">Faculty <span class="required">*</span></label>
          <select class="form-select" id="faculty">
            <option value="">Select Faculty</option>
            <option value="ICT">ICT — Information & Communication Technology</option>
            <option value="BMS">BMS — Business & Management Sciences</option>
          </select>
          <span class="form-error" id="err-faculty"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="department">Department <span class="required">*</span></label>
          <select class="form-select" id="department" disabled>
            <option value="">Select Faculty first</option>
          </select>
          <span class="form-error" id="err-department"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="level">Academic Level <span class="required">*</span></label>
          <select class="form-select" id="level">
            <option value="">Select Level</option>
            <option value="1">Year 1 — Freshman</option>
            <option value="2">Year 2 — Sophomore</option>
            <option value="3">Year 3 — Junior</option>
            <option value="4">Year 4 — Senior</option>
          </select>
          <span class="form-error" id="err-level"></span>
        </div>
      </div>

      <div class="divider"></div>
      <div class="form-actions">
        <a href="/pages/students.html" class="btn btn--ghost">Cancel</a>
        <button class="btn btn--terracotta" id="submitBtn" onclick="submitForm()">
          ${editMode ? '💾 Update Student' : '✏️ Register Student'}
        </button>
      </div>
    </div>
  `;

  setupFormListeners();
}

function setupFormListeners() {
  document.getElementById('faculty').addEventListener('change', function () {
    populateDepartments(this.value);
    validateAndSet('faculty', validateFaculty);
  });

  document.getElementById('department').addEventListener('change', function () {
    const faculty = document.getElementById('faculty').value;
    validateAndSet('department', validateDepartment, faculty);
  });

  document.getElementById('studentId').addEventListener('blur', function () {
    const res = validateStudentId(this.value);
    setFieldState('studentId', res.valid ? 'valid' : 'invalid', res.message);
    if (res.valid && !editMode && studentIdExists(this.value.trim())) {
      setFieldState('studentId', 'invalid', 'This Student ID is already registered');
    }
  });
  document.getElementById('fullName').addEventListener('blur', () => validateAndSet('fullName', validateFullName));
  document.getElementById('email').addEventListener('blur', () => validateAndSet('email', validateEmail));
  document.getElementById('level').addEventListener('change', () => validateAndSet('level', validateLevel));

  // Live ID format hint
  document.getElementById('studentId').addEventListener('input', function () {
    this.value = this.value.toUpperCase();
  });
}

function populateDepartments(faculty) {
  const sel = document.getElementById('department');
  sel.innerHTML = '<option value="">Select Department</option>';
  sel.disabled = true;
  if (faculty && FACULTIES[faculty]) {
    Object.entries(FACULTIES[faculty].departments).forEach(([code, name]) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = `${code} — ${name}`;
      sel.appendChild(opt);
    });
    sel.disabled = false;
  }
}

function loadEditData() {
  const student = getStudentById(editStudentId);
  if (!student) { showToast('Student not found', 'error'); navigateTo('/pages/students.html'); return; }

  document.getElementById('studentId').value = student.id;
  document.getElementById('fullName').value = student.fullName;
  document.getElementById('email').value = student.email || '';
  document.getElementById('faculty').value = student.faculty;
  populateDepartments(student.faculty);
  document.getElementById('department').value = student.department;
  document.getElementById('level').value = student.level;

  // Mark as valid
  ['studentId', 'fullName', 'email', 'faculty', 'department', 'level'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value) el.classList.add('is-valid');
  });
}

function submitForm() {
  const idEl = document.getElementById('studentId');
  const nameEl = document.getElementById('fullName');
  const emailEl = document.getElementById('email');
  const facultyEl = document.getElementById('faculty');
  const deptEl = document.getElementById('department');
  const levelEl = document.getElementById('level');

  const idRes = validateStudentId(idEl.value);
  setFieldState('studentId', idRes.valid ? 'valid' : 'invalid', idRes.message);
  if (idRes.valid && !editMode && studentIdExists(idEl.value.trim())) {
    setFieldState('studentId', 'invalid', 'This Student ID is already registered');
  }

  const v1 = validateAndSet('fullName', validateFullName);
  const v2 = validateAndSet('email', validateEmail);
  const v3 = validateAndSet('faculty', validateFaculty);
  const v4 = validateAndSet('department', validateDepartment, facultyEl.value);
  const v5 = validateAndSet('level', validateLevel);

  const idOk = idRes.valid && (editMode || !studentIdExists(idEl.value.trim()));
  if (!idOk || !v1 || !v2 || !v3 || !v4 || !v5) {
    showToast('Please fix the errors before submitting.', 'error');
    // Focus first invalid
    const first = document.querySelector('.form-input.is-invalid, .form-select.is-invalid');
    if (first) first.focus();
    return;
  }

  const student = {
    id: idEl.value.trim().toUpperCase(),
    fullName: nameEl.value.trim(),
    email: emailEl.value.trim(),
    faculty: facultyEl.value,
    department: deptEl.value,
    level: parseInt(levelEl.value),
  };

  saveStudent(student);
  showToast(editMode ? 'Student updated successfully!' : 'Student registered successfully!', 'success');
  setTimeout(() => navigateTo('/pages/students.html'), 1200);
}
