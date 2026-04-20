/* reports.js */
document.addEventListener('DOMContentLoaded', function () {
  seedIfEmpty();
  initLayout('Reports & PV');
  if (typeof AOS !== 'undefined') AOS.init({ duration: 600, once: true, offset: 60 });
  buildPage();
});

function buildPage() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="page-header" data-aos="fade-right">
      <h1 class="section-title">Reports & Procès Verbal</h1>
      <p class="section-subtitle">Generate academic PV reports as PDF documents. Filter by scope, preview, then download.</p>
    </div>

    <div class="report-layout" data-aos="fade-up">
      <!-- LEFT: Config -->
      <div class="card report-config">
        <h3 style="font-family:var(--font-serif);font-size:1.2rem;margin-bottom:var(--space-5)">Report Configuration</h3>

        <div class="form-section-title" style="margin-bottom:var(--space-3)">Report Scope</div>
        <div class="report-type-opts" id="reportTypeOpts">
          <label class="report-type-opt"><input type="radio" name="reportType" value="overall" checked> 🌍 Overall University</label>
          <label class="report-type-opt"><input type="radio" name="reportType" value="faculty"> 🏛️ By Faculty</label>
          <label class="report-type-opt"><input type="radio" name="reportType" value="department"> 🗂️ By Department</label>
        </div>

        <div id="facultyFilter" style="display:none;margin-bottom:var(--space-4)">
          <div class="form-group">
            <label class="form-label">Faculty</label>
            <select class="form-select" id="reportFaculty" onchange="onFacultyChange()">
              <option value="">Select Faculty</option>
              <option value="ICT">ICT — Information & Communication Technology</option>
              <option value="BMS">BMS — Business & Management Sciences</option>
            </select>
          </div>
        </div>

        <div id="deptFilter" style="display:none;margin-bottom:var(--space-4)">
          <div class="form-group">
            <label class="form-label">Department</label>
            <select class="form-select" id="reportDept" onchange="updatePreview()">
              <option value="">Select Department</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:var(--space-4)">
          <label class="form-label">Semester Filter</label>
          <select class="form-select" id="reportSemester" onchange="updatePreview()">
            <option value="">All Semesters</option>
          </select>
        </div>

        <div class="form-group" style="margin-bottom:var(--space-5)">
          <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;font-size:14px;color:var(--color-olive-gray)">
            <input type="checkbox" id="includeRanking" checked style="accent-color:var(--color-terracotta)"> Include Student Rankings
          </label>
          <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;font-size:14px;color:var(--color-olive-gray);margin-top:8px">
            <input type="checkbox" id="includeStats" checked style="accent-color:var(--color-terracotta)"> Include Statistics Section
          </label>
          <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;font-size:14px;color:var(--color-olive-gray);margin-top:8px">
            <input type="checkbox" id="includeCourses" checked style="accent-color:var(--color-terracotta)"> Include Course Details
          </label>
        </div>

        <button class="btn btn--terracotta btn--full btn--lg" onclick="generatePDF()" id="generateBtn">
          📄 Generate PDF
        </button>
      </div>

      <!-- RIGHT: Preview -->
      <div>
        <div class="card" style="margin-bottom:var(--space-5)" id="previewCard">
          <h3 style="font-family:var(--font-serif);font-size:1.1rem;margin-bottom:var(--space-4)">📋 Report Preview</h3>
          <div id="previewContent"></div>
        </div>

        <div class="card" id="rankingPreviewCard">
          <h3 style="font-family:var(--font-serif);font-size:1.1rem;margin-bottom:var(--space-4)">🏆 Student Rankings</h3>
          <div class="table-wrapper">
            <table class="data-table rank-table" id="rankingTable">
              <thead>
                <tr>
                  <th style="width:50px">Rank</th>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Avg GPA</th>
                  <th>Grade</th>
                  <th>Courses</th>
                </tr>
              </thead>
              <tbody id="rankingTbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  populateSemesters();
  setupReportListeners();
  updatePreview();
}

function populateSemesters() {
  const courses = getAllCourses();
  const sems = [...new Set(courses.map(c => c.semester))].sort().reverse();
  const sel = document.getElementById('reportSemester');
  sems.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s; opt.textContent = s;
    sel.appendChild(opt);
  });
}

function getReportType() {
  const checked = document.querySelector('input[name="reportType"]:checked');
  return checked ? checked.value : 'overall';
}

function setupReportListeners() {
  document.querySelectorAll('input[name="reportType"]').forEach(radio => {
    radio.addEventListener('change', function () {
      const type = this.value;
      document.getElementById('facultyFilter').style.display = (type === 'faculty' || type === 'department') ? 'block' : 'none';
      document.getElementById('deptFilter').style.display = (type === 'department') ? 'block' : 'none';
      updatePreview();
    });
  });
  document.getElementById('includeRanking').addEventListener('change', updatePreview);
  document.getElementById('includeStats').addEventListener('change', updatePreview);
}

function onFacultyChange() {
  const faculty = document.getElementById('reportFaculty').value;
  const deptSel = document.getElementById('reportDept');
  deptSel.innerHTML = '<option value="">All Departments</option>';
  if (faculty && FACULTIES[faculty]) {
    Object.entries(FACULTIES[faculty].departments).forEach(([code, name]) => {
      const opt = document.createElement('option');
      opt.value = code; opt.textContent = `${code} — ${name}`;
      deptSel.appendChild(opt);
    });
  }
  updatePreview();
}

function getFilteredStudents() {
  let students = getAllStudents();
  const type = getReportType();
  const faculty = document.getElementById('reportFaculty') ? document.getElementById('reportFaculty').value : '';
  const dept = document.getElementById('reportDept') ? document.getElementById('reportDept').value : '';
  const semester = document.getElementById('reportSemester').value;

  if (type === 'faculty' && faculty) students = students.filter(s => s.faculty === faculty);
  if (type === 'department' && dept) students = students.filter(s => s.department === dept);

  // Filter by semester if chosen (keep students who have at least one course in that semester)
  if (semester) {
    const coursesInSem = getAllCourses().filter(c => c.semester === semester).map(c => c.studentId);
    students = students.filter(s => coursesInSem.includes(s.id));
  }

  return students;
}

function getRankedStudents(students, semester) {
  return students
    .map(s => {
      let courses = getCoursesByStudentId(s.id);
      if (semester) courses = courses.filter(c => c.semester === semester);
      const gpas = courses.map(c => gradeToGPA(c.grade));
      const avg = gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : 0;
      return { ...s, avgGPA: parseFloat(avg.toFixed(2)), courseCount: courses.length };
    })
    .filter(s => s.courseCount > 0)
    .sort((a, b) => b.avgGPA - a.avgGPA || a.fullName.localeCompare(b.fullName));
}

function updatePreview() {
  const students = getFilteredStudents();
  const semester = document.getElementById('reportSemester').value;
  const ranked = getRankedStudents(students, semester);
  const type = getReportType();
  const deptStats = {};
  students.forEach(s => {
    if (!deptStats[s.department]) deptStats[s.department] = { count: 0, gpas: [] };
    const gpa = getAverageGPA(s.id);
    deptStats[s.department].count++;
    if (gpa > 0) deptStats[s.department].gpas.push(gpa);
  });
  const allGpas = students.map(s => getAverageGPA(s.id)).filter(g => g > 0);
  const overallAvg = allGpas.length ? (allGpas.reduce((a, b) => a + b, 0) / allGpas.length).toFixed(2) : 'N/A';
  const activeCourses = getAllCourses().filter(c => students.some(s => s.id === c.studentId)).length;

  const scopeLabel = type === 'overall' ? 'Full University' :
    type === 'faculty' ? `Faculty: ${document.getElementById('reportFaculty').value || 'All'}` :
    `Department: ${document.getElementById('reportDept').value || 'All'}`;

  document.getElementById('previewContent').innerHTML = `
    <div style="background:rgba(201,100,66,0.06);border-radius:var(--radius-lg);padding:var(--space-4);margin-bottom:var(--space-4)">
      <div style="font-size:12px;color:var(--color-stone-gray);margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Scope</div>
      <div style="font-weight:600;font-size:15px">${escapeHTML(scopeLabel)}</div>
    </div>
    <div class="preview-stat"><span class="preview-stat-label">Students included</span><span class="preview-stat-val">${students.length}</span></div>
    <div class="preview-stat"><span class="preview-stat-label">Total courses</span><span class="preview-stat-val">${activeCourses}</span></div>
    <div class="preview-stat"><span class="preview-stat-label">Avg GPA</span><span class="preview-stat-val">${overallAvg}</span></div>
    <div class="preview-stat"><span class="preview-stat-label">Active departments</span><span class="preview-stat-val">${Object.keys(deptStats).length}</span></div>
    <div class="preview-stat"><span class="preview-stat-label">Semester</span><span class="preview-stat-val">${semester || 'All'}</span></div>
  `;

  // Rankings preview
  const tbody = document.getElementById('rankingTbody');
  if (!ranked.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:var(--space-8)"><div class="empty-state__icon">🏆</div><div class="empty-state__text">No data to rank.</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = ranked.slice(0, 10).map((s, i) => `
    <tr>
      <td style="text-align:center">${rankMedal(i + 1)}</td>
      <td>
        <div style="font-weight:500;font-size:14px">${escapeHTML(s.fullName)}</div>
        <div class="font-mono text-xs" style="color:var(--color-stone-gray)">${escapeHTML(s.id)}</div>
      </td>
      <td><span class="badge badge--dept">${escapeHTML(s.department)}</span></td>
      <td><span class="badge ${gpaClass(s.avgGPA)}">${s.avgGPA.toFixed(2)}</span></td>
      <td style="font-size:13px;color:var(--color-olive-gray)">${gpaLabel(s.avgGPA)}</td>
      <td style="text-align:center;color:var(--color-stone-gray)">${s.courseCount}</td>
    </tr>`).join('');
}

function generatePDF() {
  if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
    showToast('PDF library not loaded. Check your connection.', 'error');
    return;
  }
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Generating…';

  setTimeout(() => {
    try {
      buildPDF();
    } catch (e) {
      console.error(e);
      showToast('PDF generation failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '📄 Generate PDF';
    }
  }, 100);
}

function buildPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const students = getFilteredStudents();
  const semester = document.getElementById('reportSemester').value;
  const type = getReportType();
  const facultyVal = document.getElementById('reportFaculty') ? document.getElementById('reportFaculty').value : '';
  const deptVal = document.getElementById('reportDept') ? document.getElementById('reportDept').value : '';
  const includeRanking = document.getElementById('includeRanking').checked;
  const includeStats = document.getElementById('includeStats').checked;
  const includeCourses = document.getElementById('includeCourses').checked;
  const ranked = getRankedStudents(students, semester);

  const scopeLine = type === 'overall' ? 'Scope: Full University' :
    type === 'faculty' ? `Faculty: ${facultyVal ? FACULTIES[facultyVal]?.label : 'All'}` :
    `Department: ${deptVal ? getDeptName(deptVal) : 'All'} (${deptVal || ''})`;

  // HEADER
  doc.setFillColor(20, 20, 19);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(250, 249, 245);
  doc.text('ICT UNIVERSITY', 105, 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(201, 100, 66);
  doc.text('PROCÈS VERBAL — RÉSULTATS ACADÉMIQUES', 105, 24, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(176, 174, 165);
  doc.text(scopeLine, 105, 31, { align: 'center' });
  doc.text(`Semester: ${semester || 'All'} · Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, 37, { align: 'center' });

  let y = 48;

  // SUMMARY STATS
  const allGpas = students.map(s => getAverageGPA(s.id)).filter(g => g > 0);
  const overallAvg = allGpas.length ? (allGpas.reduce((a, b) => a + b, 0) / allGpas.length).toFixed(2) : 'N/A';
  const totalCourses = getAllCourses().filter(c => students.some(s => s.id === c.studentId)).length;

  doc.setFillColor(245, 244, 237);
  doc.roundedRect(15, y, 180, 20, 3, 3, 'F');
  doc.setFontSize(9); doc.setTextColor(94, 93, 89);
  doc.text(`Total Students: ${students.length}`, 22, y + 8);
  doc.text(`Total Courses: ${totalCourses}`, 75, y + 8);
  doc.text(`Avg GPA: ${overallAvg}`, 130, y + 8);
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 162, y + 8);
  y += 28;

  // MAIN STUDENT TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11); doc.setTextColor(20, 20, 19);
  doc.text('STUDENT ROSTER', 15, y);
  y += 4;

  const studentRows = ranked.map((s, i) => [
    i + 1,
    s.id,
    s.fullName,
    s.faculty,
    s.department,
    `L${s.level}`,
    s.avgGPA > 0 ? s.avgGPA.toFixed(2) : '—',
    gpaLabel(s.avgGPA),
    s.courseCount,
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Student ID', 'Full Name', 'Fac.', 'Dept', 'Lvl', 'GPA', 'Grade', 'Courses']],
    body: studentRows,
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3 },
    headStyles: { fillColor: [201, 100, 66], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 249, 245] },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, font: 'courier' },
      2: { cellWidth: 48 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 9, halign: 'center' },
      6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 20 },
      8: { cellWidth: 14, halign: 'center' },
    },
  });
  y = doc.lastAutoTable.finalY + 10;

  // RANKINGS
  if (includeRanking && ranked.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11); doc.setTextColor(20, 20, 19);
    doc.text('STUDENT RANKINGS', 15, y);
    y += 4;

    const rankRows = ranked.map((s, i) => [
      i === 0 ? '🥇 1st' : i === 1 ? '🥈 2nd' : i === 2 ? '🥉 3rd' : `#${i + 1}`,
      s.fullName,
      s.id,
      s.department,
      `L${s.level}`,
      s.avgGPA.toFixed(2),
      gpaLabel(s.avgGPA),
    ]);

    doc.autoTable({
      startY: y,
      head: [['Rank', 'Full Name', 'Student ID', 'Dept', 'Lvl', 'GPA', 'Mention']],
      body: rankRows,
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [48, 48, 46], textColor: 250, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 249, 245] },
      margin: { left: 15, right: 15 },
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  // COURSE DETAILS
  if (includeCourses && students.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11); doc.setTextColor(20, 20, 19);
    doc.text('COURSE DETAIL RECORDS', 15, y);
    y += 4;

    const courseRows = [];
    students.forEach(s => {
      let courses = getCoursesByStudentId(s.id);
      if (semester) courses = courses.filter(c => c.semester === semester);
      courses.forEach(c => {
        courseRows.push([s.id, s.fullName.split(' ')[0] + ' ' + (s.fullName.split(' ').slice(-1)[0] || ''), c.courseCode, c.courseName, c.credits, c.grade + '/20', gradeToGPA(c.grade).toFixed(1), c.semester]);
      });
    });

    if (courseRows.length) {
      doc.autoTable({
        startY: y,
        head: [['Student ID', 'Name', 'Code', 'Course Name', 'Cr.', 'Grade', 'GPA', 'Sem.']],
        body: courseRows,
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [77, 76, 72], textColor: 250, fontSize: 7.5 },
        alternateRowStyles: { fillColor: [250, 249, 245] },
        margin: { left: 15, right: 15 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }
  }

  // STATS SECTION
  if (includeStats) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11); doc.setTextColor(20, 20, 19);
    doc.text('DEPARTMENT STATISTICS', 15, y);
    y += 4;

    const deptStat = {};
    students.forEach(s => {
      if (!deptStat[s.department]) deptStat[s.department] = { count: 0, gpas: [], faculty: s.faculty };
      deptStat[s.department].count++;
      const g = getAverageGPA(s.id);
      if (g > 0) deptStat[s.department].gpas.push(g);
    });

    const deptRows = Object.entries(deptStat).map(([code, d]) => {
      const avg = d.gpas.length ? (d.gpas.reduce((a, b) => a + b, 0) / d.gpas.length).toFixed(2) : 'N/A';
      return [code, getDeptName(code), d.faculty, d.count, avg];
    }).sort((a, b) => b[3] - a[3]);

    doc.autoTable({
      startY: y,
      head: [['Code', 'Department', 'Faculty', 'Students', 'Avg GPA']],
      body: deptRows,
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 3 },
      headStyles: { fillColor: [48, 48, 46], textColor: 250, fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 249, 245] },
      margin: { left: 15, right: 15 },
    });
  }

  // FOOTER on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(20, 20, 19);
    doc.rect(0, 284, 210, 13, 'F');
    doc.setFontSize(7.5); doc.setTextColor(176, 174, 165);
    doc.text('ICT University — Confidential Academic Record — Not for public distribution', 15, 291);
    doc.text(`Page ${i} of ${pageCount}`, 195, 291, { align: 'right' });
  }

  // Filename
  const dateStr = new Date().toISOString().slice(0, 10);
  const scopeTag = type === 'overall' ? 'University' : type === 'faculty' ? facultyVal : deptVal;
  const semTag = semester ? `_${semester}` : '';
  doc.save(`PV_${scopeTag}${semTag}_${dateStr}.pdf`);
  showToast('PDF generated and downloaded!', 'success');
}
