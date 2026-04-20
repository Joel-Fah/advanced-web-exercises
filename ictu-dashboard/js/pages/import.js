/* import.js */
let parsedRows = [];

document.addEventListener('DOMContentLoaded', function () {
  seedIfEmpty();
  initLayout('Import CSV');
  if (typeof AOS !== 'undefined') AOS.init({ duration: 600, once: true, offset: 60 });
  buildPage();
});

function buildPage() {
  const pc = document.getElementById('pageContent');
  pc.innerHTML = `
    <div class="page-header" data-aos="fade-right">
      <h1 class="section-title">Import Students via CSV</h1>
      <p class="section-subtitle">Bulk-register students by uploading a formatted CSV file. Invalid rows will be skipped and reported.</p>
    </div>

    <div class="import-layout" data-aos="fade-up">
      <div class="card">
        <h3 style="font-family:var(--font-serif);font-size:1.1rem;margin-bottom:var(--space-4)">📋 CSV Format</h3>
        <p style="font-size:13px;color:var(--color-stone-gray);margin-bottom:var(--space-4)">Your CSV must have these exact column headers in the first row:</p>
        <table class="csv-format-table">
          <thead><tr><th>Column</th><th>Example</th><th>Rules</th></tr></thead>
          <tbody>
            <tr><td>StudentID</td><td>ICTU20241001</td><td>ICTUYYYYXXXX format</td></tr>
            <tr><td>FullName</td><td>Fah Joel Xavier</td><td>Min 3 chars</td></tr>
            <tr><td>Email</td><td>joel@ictuniversity.edu.cm</td><td>Valid email</td></tr>
            <tr><td>Faculty</td><td>ICT or BMS</td><td>Exact match</td></tr>
            <tr><td>Department</td><td>CSC</td><td>Valid dept code</td></tr>
            <tr><td>Level</td><td>2</td><td>1, 2, 3 or 4</td></tr>
          </tbody>
        </table>
        <div style="margin-top:var(--space-5)">
          <button class="btn btn--dark btn--sm" onclick="downloadTemplate()">📥 Download Template CSV</button>
        </div>
      </div>

      <div>
        <div class="drop-zone" id="dropZone" onclick="document.getElementById('csvFileInput').click()" data-aos="zoom-in">
          <div class="drop-zone__icon">📁</div>
          <div class="drop-zone__title">Drop CSV file here</div>
          <div class="drop-zone__text">or click to browse · .csv files only</div>
          <input type="file" id="csvFileInput" accept=".csv" style="display:none" onchange="handleFileSelect(this.files[0])">
        </div>
        <div class="alert alert--info" style="margin-top:var(--space-4)">
          <span>ℹ️</span>
          <span>Duplicate Student IDs (already in system or within the file) will be automatically skipped.</span>
        </div>
      </div>
    </div>

    <div id="previewSection" style="display:none" data-aos="fade-up">
      <div class="import-preview-header">
        <h3 style="font-family:var(--font-serif);font-size:1.2rem">Preview</h3>
        <div class="import-summary" id="importSummary"></div>
      </div>
      <div class="table-wrapper" style="margin-bottom:var(--space-5)">
        <table class="data-table" id="previewTable">
          <thead>
            <tr>
              <th>#</th>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Faculty</th>
              <th>Department</th>
              <th>Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="previewTbody"></tbody>
        </table>
      </div>
      <div style="display:flex;gap:var(--space-3);justify-content:flex-end">
        <button class="btn btn--ghost" onclick="resetImport()">✕ Clear</button>
        <button class="btn btn--terracotta" id="importBtn" onclick="doImport()">📥 Import Valid Records</button>
      </div>
    </div>
  `;

  setupDropZone();
}

function setupDropZone() {
  const dz = document.getElementById('dropZone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
  dz.addEventListener('drop', e => {
    e.preventDefault();
    dz.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });
}

function handleFileSelect(file) {
  if (!file) return;
  if (!file.name.endsWith('.csv')) { showToast('Please upload a .csv file.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2) { showToast('CSV file is empty or has no data rows.', 'error'); return; }

  const headers = lines[0].split(',').map(h => h.trim());
  const expected = ['StudentID', 'FullName', 'Email', 'Faculty', 'Department', 'Level'];
  const missingHeaders = expected.filter(h => !headers.includes(h));
  if (missingHeaders.length) {
    showToast(`Missing columns: ${missingHeaders.join(', ')}`, 'error');
    return;
  }

  const seenIds = new Set();
  parsedRows = lines.slice(1).map((line, idx) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });

    const id = row['StudentID'];
    const errors = [];

    const idRes = validateStudentId(id);
    if (!idRes.valid) errors.push(idRes.message);
    else if (studentIdExists(id)) errors.push('ID already registered');
    else if (seenIds.has(id)) errors.push('Duplicate in this file');
    else seenIds.add(id);

    const nameRes = validateFullName(row['FullName']);
    if (!nameRes.valid) errors.push(nameRes.message);

    const emailRes = validateEmail(row['Email']);
    if (!emailRes.valid) errors.push(emailRes.message);

    if (!row['Faculty'] || !FACULTIES[row['Faculty']]) errors.push('Invalid faculty');
    else if (!FACULTIES[row['Faculty']].departments[row['Department']]) errors.push('Invalid department for faculty');

    const lvl = parseInt(row['Level']);
    if (isNaN(lvl) || lvl < 1 || lvl > 4) errors.push('Level must be 1–4');

    return {
      rowNum: idx + 2,
      id: id,
      fullName: row['FullName'],
      email: row['Email'],
      faculty: row['Faculty'],
      department: row['Department'],
      level: lvl,
      errors,
      status: errors.length === 0 ? 'valid' : (errors.some(e => e.includes('already')) ? 'duplicate' : 'invalid'),
    };
  });

  renderPreview();
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

function renderPreview() {
  const section = document.getElementById('previewSection');
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const valid = parsedRows.filter(r => r.status === 'valid').length;
  const dupes = parsedRows.filter(r => r.status === 'duplicate').length;
  const invalid = parsedRows.filter(r => r.status === 'invalid').length;

  document.getElementById('importSummary').innerHTML = `
    <div class="import-summary-item"><span style="color:var(--color-success)">✅</span> <strong>${valid}</strong> valid</div>
    <div class="import-summary-item"><span style="color:var(--color-warning)">⚠️</span> <strong>${dupes}</strong> duplicates</div>
    <div class="import-summary-item"><span style="color:var(--color-error)">❌</span> <strong>${invalid}</strong> invalid</div>
    <div class="import-summary-item"><span style="color:var(--color-stone-gray)">📄</span> <strong>${parsedRows.length}</strong> total rows</div>
  `;

  const importBtn = document.getElementById('importBtn');
  if (importBtn) {
    importBtn.disabled = valid === 0;
    importBtn.textContent = `📥 Import ${valid} Valid Record${valid !== 1 ? 's' : ''}`;
  }

  const tbody = document.getElementById('previewTbody');
  tbody.innerHTML = '';
  parsedRows.forEach(row => {
    const tr = document.createElement('tr');
    const statusHtml = row.status === 'valid'
      ? '<span style="color:var(--color-success)">✅ Valid</span>'
      : `<span style="color:${row.status === 'duplicate' ? 'var(--color-warning)' : 'var(--color-error)'}">❌ ${row.errors[0]}</span>`;

    tr.innerHTML = `
      <td style="color:var(--color-stone-gray);font-size:12px">${row.rowNum}</td>
      <td class="font-mono text-sm">${escapeHTML(row.id || '—')}</td>
      <td>${escapeHTML(row.fullName || '—')}</td>
      <td style="font-size:12px">${escapeHTML(row.email || '—')}</td>
      <td>${escapeHTML(row.faculty || '—')}</td>
      <td>${escapeHTML(row.department || '—')}</td>
      <td>${isNaN(row.level) ? '—' : 'L' + row.level}</td>
      <td>${statusHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

function doImport() {
  const valid = parsedRows.filter(r => r.status === 'valid');
  if (!valid.length) { showToast('No valid records to import.', 'warning'); return; }

  const now = new Date().toISOString();
  valid.forEach(row => {
    saveStudent({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      faculty: row.faculty,
      department: row.department,
      level: row.level,
      createdAt: now,
      updatedAt: now,
    });
  });

  const dupes = parsedRows.filter(r => r.status === 'duplicate').length;
  const invalid = parsedRows.filter(r => r.status === 'invalid').length;
  showToast(`✅ ${valid.length} imported · ${dupes + invalid} skipped`, 'success', 5000);
  setTimeout(() => navigateTo('/pages/students.html'), 1800);
}

function resetImport() {
  parsedRows = [];
  document.getElementById('previewSection').style.display = 'none';
  document.getElementById('csvFileInput').value = '';
}

function downloadTemplate() {
  const headers = 'StudentID,FullName,Email,Faculty,Department,Level';
  const examples = [
    'ICTU20241001,Fah Joel Xavier Dejon,dejonfahjoel.xavier@ictuniversity.edu.cm,ICT,CSC,3',
    'ICTU20241002,Amina Bello Ngassa,amina.bello@gmail.com,BMS,ACC,2',
    'ICTU20241003,Carlos Mengue Essono,carlos.mengue@yahoo.fr,ICT,CYS,1',
  ].join('\n');
  downloadCSV(headers + '\n' + examples, 'ictu_students_template.csv');
  showToast('Template downloaded!', 'success');
}
