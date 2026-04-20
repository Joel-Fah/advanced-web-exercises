const STORAGE_KEYS = {
  STUDENTS: 'ictu_students',
  COURSES: 'ictu_courses',
  SETTINGS: 'ictu_settings',
};

/* ===== STUDENTS ===== */
function getAllStudents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]'); }
  catch { return []; }
}

function getStudentById(id) {
  return getAllStudents().find(s => s.id === id) || null;
}

function saveStudent(student) {
  const students = getAllStudents();
  const idx = students.findIndex(s => s.id === student.id);
  student.updatedAt = new Date().toISOString();
  if (idx >= 0) { students[idx] = student; }
  else { student.createdAt = new Date().toISOString(); students.push(student); }
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

function saveStudents(arr) {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(arr));
}

function deleteStudent(id) {
  const students = getAllStudents().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  const courses = getAllCourses().filter(c => c.studentId !== id);
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

function studentIdExists(id) {
  return getAllStudents().some(s => s.id === id);
}

/* ===== COURSES ===== */
function getAllCourses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSES) || '[]'); }
  catch { return []; }
}

function getCoursesByStudentId(studentId) {
  return getAllCourses().filter(c => c.studentId === studentId);
}

function getCourseById(courseId) {
  return getAllCourses().find(c => c.courseId === courseId) || null;
}

function saveCourse(course) {
  const courses = getAllCourses();
  const idx = courses.findIndex(c => c.courseId === course.courseId);
  course.updatedAt = new Date().toISOString();
  if (idx >= 0) { courses[idx] = course; }
  else { course.createdAt = new Date().toISOString(); courses.push(course); }
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

function deleteCourse(courseId) {
  const courses = getAllCourses().filter(c => c.courseId !== courseId);
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

/* ===== GPA ===== */
function gradeToGPA(grade) {
  const g = parseFloat(grade);
  if (isNaN(g)) return 0;
  if (g >= 16) return 4.0;
  if (g >= 14) return 3.5;
  if (g >= 12) return 3.0;
  if (g >= 10) return 2.5;
  if (g >= 8)  return 2.0;
  if (g >= 6)  return 1.5;
  return 1.0;
}

function gpaLabel(gpa) {
  if (gpa >= 3.8) return 'Excellent';
  if (gpa >= 3.5) return 'Distinction';
  if (gpa >= 3.0) return 'Merit';
  if (gpa >= 2.5) return 'Credit';
  if (gpa >= 2.0) return 'Pass';
  return 'Fail';
}

function getAverageGPA(studentId) {
  const courses = getCoursesByStudentId(studentId);
  if (!courses.length) return 0;
  const gpas = courses.map(c => gradeToGPA(c.grade));
  const avg = gpas.reduce((a, b) => a + b, 0) / gpas.length;
  return parseFloat(avg.toFixed(2));
}

function getUniversityAvgGPA() {
  const students = getAllStudents();
  if (!students.length) return 0;
  const gpas = students.map(s => getAverageGPA(s.id)).filter(g => g > 0);
  if (!gpas.length) return 0;
  return parseFloat((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2));
}

function getDepartmentStats() {
  const students = getAllStudents();
  const stats = {};
  for (const s of students) {
    if (!stats[s.department]) {
      stats[s.department] = { count: 0, totalGPA: 0, faculty: s.faculty };
    }
    stats[s.department].count++;
    stats[s.department].totalGPA += getAverageGPA(s.id);
  }
  for (const dept of Object.values(stats)) {
    dept.avgGPA = dept.count > 0 ? parseFloat((dept.totalGPA / dept.count).toFixed(2)) : 0;
  }
  return stats;
}

/* ===== SETTINGS ===== */
function getSetting(key, defaultValue = null) {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    return key in settings ? settings[key] : defaultValue;
  } catch { return defaultValue; }
}

function setSetting(key, value) {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
    settings[key] = value;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {}
}

/* ===== SEED DATA ===== */
function seedIfEmpty() {
  if (getAllStudents().length > 0) return;
  const seed = [
    { id:'ICTU20241001', fullName:'Fah Joel Xavier Dejon', email:'dejonfahjoel.xavier@ictuniversity.edu.cm', faculty:'ICT', department:'CSC', level:3 },
    { id:'ICTU20241002', fullName:'Amina Bello Ngassa', email:'amina.bello@gmail.com', faculty:'BMS', department:'ACC', level:2 },
    { id:'ICTU20241003', fullName:'Carlos Mengue Essono', email:'carlos.mengue@yahoo.fr', faculty:'ICT', department:'CYS', level:1 },
    { id:'ICTU20241004', fullName:'Fatima Nkrumah Abena', email:'f.nkrumah@ictuniversity.edu.cm', faculty:'BMS', department:'FIN', level:4 },
    { id:'ICTU20241005', fullName:'Thomas Eba Manga', email:'thomas.eba@outlook.com', faculty:'ICT', department:'SEN', level:2 },
  ];
  const now = new Date().toISOString();
  seed.forEach(s => { s.createdAt = now; s.updatedAt = now; saveStudent(s); });
  const sampleCourses = [
    { studentId:'ICTU20241001', courseCode:'CSC301', courseName:'Data Structures', credits:4, grade:16, semester:'2024-S1' },
    { studentId:'ICTU20241001', courseCode:'CSC302', courseName:'Algorithms', credits:3, grade:14.5, semester:'2024-S1' },
    { studentId:'ICTU20241001', courseCode:'CSC303', courseName:'Database Systems', credits:4, grade:18, semester:'2024-S2' },
    { studentId:'ICTU20241002', courseCode:'ACC201', courseName:'Financial Accounting', credits:4, grade:13, semester:'2024-S1' },
    { studentId:'ICTU20241002', courseCode:'ACC202', courseName:'Cost Accounting', credits:3, grade:15, semester:'2024-S1' },
    { studentId:'ICTU20241003', courseCode:'CYS101', courseName:'Intro to Cybersecurity', credits:3, grade:12, semester:'2024-S1' },
    { studentId:'ICTU20241003', courseCode:'NET101', courseName:'Networking Basics', credits:4, grade:11, semester:'2024-S1' },
    { studentId:'ICTU20241004', courseCode:'FIN401', courseName:'Investment Analysis', credits:4, grade:17, semester:'2024-S2' },
    { studentId:'ICTU20241004', courseCode:'FIN402', courseName:'Corporate Finance', credits:3, grade:16, semester:'2024-S2' },
    { studentId:'ICTU20241005', courseCode:'SEN201', courseName:'Software Architecture', credits:4, grade:15, semester:'2024-S1' },
  ];
  sampleCourses.forEach(c => {
    c.courseId = generateId();
    c.createdAt = now; c.updatedAt = now;
    saveCourse(c);
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
