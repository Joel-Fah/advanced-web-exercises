function validateStudentId(id) {
  if (!id || !id.trim()) return { valid: false, message: 'Student ID is required' };
  const pattern = /^ICTU(20[0-9]{2})([0-9]{4})$/;
  if (!pattern.test(id.trim())) return { valid: false, message: 'Format must be ICTUYYYYXXXX (e.g. ICTU20241234)' };
  const year = parseInt(id.substring(4, 8));
  const curr = new Date().getFullYear();
  if (year > curr + 1) return { valid: false, message: `Year ${year} is too far in the future` };
  if (year < 2000) return { valid: false, message: `Year ${year} seems too early` };
  return { valid: true };
}

function validateEmail(email) {
  if (!email || !email.trim()) return { valid: false, message: 'Email is required' };
  // Robust: handles multi-part TLDs like .edu.cm, subdomains, dots/hyphens/plus in local
  const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9._+\-]*[a-zA-Z0-9])?@([a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
  if (!pattern.test(email.trim())) return { valid: false, message: 'Enter a valid email address' };
  return { valid: true };
}

function validateFullName(name) {
  if (!name || !name.trim()) return { valid: false, message: 'Full name is required' };
  if (name.trim().length < 3) return { valid: false, message: 'Name must be at least 3 characters' };
  if (!/^[a-zA-ZÀ-ÿ\s'\-]+$/.test(name.trim())) return { valid: false, message: 'Name can only contain letters, spaces, hyphens and apostrophes' };
  return { valid: true };
}

function validateFaculty(faculty) {
  if (!faculty) return { valid: false, message: 'Please select a faculty' };
  if (!FACULTIES[faculty]) return { valid: false, message: 'Invalid faculty selected' };
  return { valid: true };
}

function validateDepartment(dept, faculty) {
  if (!dept) return { valid: false, message: 'Please select a department' };
  if (faculty && FACULTIES[faculty] && !FACULTIES[faculty].departments[dept]) return { valid: false, message: 'Invalid department for selected faculty' };
  return { valid: true };
}

function validateLevel(level) {
  const l = parseInt(level);
  if (!level && level !== 0) return { valid: false, message: 'Please select a level' };
  if (isNaN(l) || l < 1 || l > 4) return { valid: false, message: 'Level must be between 1 and 4' };
  return { valid: true };
}

function validateCourseCode(code) {
  if (!code || !code.trim()) return { valid: false, message: 'Course code is required' };
  if (!/^[A-Z]{2,4}[0-9]{3,4}$/.test(code.trim().toUpperCase())) return { valid: false, message: 'Format: 2-4 letters + 3-4 digits (e.g. CSC301)' };
  return { valid: true };
}

function validateCourseName(name) {
  if (!name || !name.trim()) return { valid: false, message: 'Course name is required' };
  if (name.trim().length < 3) return { valid: false, message: 'Course name is too short' };
  return { valid: true };
}

function validateCredits(credits) {
  const c = parseInt(credits);
  if (!credits && credits !== 0) return { valid: false, message: 'Credits required' };
  if (isNaN(c) || c < 1 || c > 6) return { valid: false, message: 'Credits must be between 1 and 6' };
  return { valid: true };
}

function validateGrade(grade) {
  const g = parseFloat(grade);
  if (grade === '' || grade === null || grade === undefined) return { valid: false, message: 'Grade is required' };
  if (isNaN(g) || g < 0 || g > 20) return { valid: false, message: 'Grade must be between 0 and 20' };
  return { valid: true };
}

function validateSemester(sem) {
  if (!sem || !sem.trim()) return { valid: false, message: 'Semester is required' };
  if (!/^\d{4}-S[12]$/.test(sem.trim())) return { valid: false, message: 'Format: YYYY-S1 or YYYY-S2 (e.g. 2024-S1)' };
  return { valid: true };
}

/* ===== UI HELPER ===== */
function setFieldState(fieldId, state, message) {
  const input = document.getElementById(fieldId);
  const error = document.getElementById('err-' + fieldId);
  if (!input) return;
  input.classList.remove('is-valid', 'is-invalid');
  if (state === 'valid') input.classList.add('is-valid');
  if (state === 'invalid') {
    input.classList.add('is-invalid');
    if (error) error.textContent = message || '';
  } else {
    if (error) error.textContent = '';
  }
}

function validateAndSet(fieldId, validatorFn, ...args) {
  const el = document.getElementById(fieldId);
  if (!el) return true;
  const result = validatorFn(el.value, ...args);
  setFieldState(fieldId, result.valid ? 'valid' : 'invalid', result.message);
  return result.valid;
}
