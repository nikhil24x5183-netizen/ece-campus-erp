/* Master System Reports View Controller — Ultra Compact Printable Student Activity Report */
const ReportsView = {
  async render() {
    try {
      const data = await API.get('/api/reports');
      const reports = data.reports || [];
      const cumulativeStudents = data.cumulative_student_summary || [];

      // 1. Build Cumulative Student Subject Summary Rows (Ultra Compact Horizontal Format)
      const cumulativeRows = cumulativeStudents.map((s, idx) => {
        const subjectPills = s.subjects.map(sub => `
          <span class="subject-print-pill" style="display: inline-block; background: #f1f5f9; border: 1px solid #cbd5e1; color: #0f172a; padding: 0.12rem 0.45rem; border-radius: 4px; font-size: 0.76rem; margin: 0.1rem 0.15rem;">
            <strong>${sub.subject_code}:</strong> ${sub.count}
          </span>
        `).join('');

        return `
          <tr>
            <td style="font-weight: 700; text-align: center; padding: 0.4rem;">${idx + 1}</td>
            <td style="padding: 0.4rem;">
              <strong style="font-size: 0.88rem; color: var(--text-main);">${s.student_name}</strong>
            </td>
            <td style="padding: 0.4rem;"><span style="font-family: monospace; font-size: 0.82rem; font-weight: 700;">PRN: ${s.prn_no}</span> (Roll: ${s.roll_no})</td>
            <td style="padding: 0.4rem;"><strong>${s.division_name}</strong> (${s.batch_name})</td>
            <td style="padding: 0.4rem;">
              <div style="display: flex; flex-wrap: wrap; gap: 0.15rem; align-items: center;">
                ${subjectPills}
              </div>
            </td>
            <td style="text-align: center; padding: 0.4rem;"><strong style="color: var(--accent-green); font-size: 0.9rem;">${s.total_accumulated_activities} Units</strong></td>
          </tr>
        `;
      }).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No approved student activity records accumulated yet.</td></tr>`;

      // 2. Build Certificate Logs Rows
      const certRows = reports.map(r => `
        <tr>
          <td><strong>${r.student_name}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">Roll: ${r.roll_no} | PRN: ${r.prn_no}</span></td>
          <td><span class="badge-role role-STUDENT">${r.division_name} (${r.batch_name})</span></td>
          <td><strong>${r.title}</strong><br><span style="font-size: 0.75rem; color: var(--primary);">${r.event_name} (${r.category})</span></td>
          <td>${r.certificate_date}</td>
          <td><span class="badge-status status-${r.status}">${r.status}</span></td>
          <td>
            <strong style="color: var(--accent-green); display: block; margin-bottom: 0.2rem;">${intVal(r.total_activities)} Activity Units</strong>
            <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">${r.breakdown_summary}</span>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No certificate records found.</td></tr>`;

      const currentDate = new Date().toISOString().split('T')[0];

      return `
        <div class="dashboard-container">
          <!-- Official Print Header (Visible only in PDF / Print) -->
          <div class="print-only-header" style="display: none; margin-bottom: 1rem; text-align: center; border-bottom: 2px solid #000; padding-bottom: 0.5rem;">
            <h3 style="font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; text-transform: uppercase; margin: 0;">Electronics & Computer Engineering Department</h3>
            <h4 style="font-size: 1rem; font-weight: 700; margin: 0.2rem 0 0;">Official Student Lecture & Activity Attendance Summary</h4>
            <p style="font-size: 0.78rem; color: #444; margin: 0.1rem 0 0;">Academic Year: 2026-27 | Date: ${currentDate}</p>
          </div>

          <!-- Cumulative Subject Attendance Counter Section -->
          <div class="glass-panel printable-panel" style="margin-bottom: 2rem;">
            <div class="panel-header no-print">
              <h3><i class="fa-solid fa-calculator" style="color: var(--primary);"></i> Student Cumulative Subject Attendance Report</h3>
              <button class="btn btn-primary btn-sm" onclick="Exporter.printPage()"><i class="fa-solid fa-print"></i> Export Official PDF / Print Report</button>
            </div>
            <p class="no-print" style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;">
              Compact official report detailing Student Name, PRN, Division, Batch, and accumulated lecture counts per subject:
            </p>
            <div class="table-responsive">
              <table class="custom-table print-clean-table">
                <thead>
                  <tr>
                    <th style="width: 45px; text-align: center;">Sr. No.</th>
                    <th>Student Name</th>
                    <th>PRN & Roll No.</th>
                    <th>Division & Batch</th>
                    <th>Accumulated Subject Lecture Counts</th>
                    <th style="text-align: center; width: 90px;">Total Units</th>
                  </tr>
                </thead>
                <tbody>
                  ${cumulativeRows}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Individual Certificate History Log (Hidden in Official Print Report) -->
          <div class="glass-panel no-print">
            <div class="panel-header">
              <h3><i class="fa-solid fa-chart-pie"></i> Certificate Submissions & Logs</h3>
              <div style="display: flex; gap: 0.75rem;">
                <button class="btn btn-secondary btn-sm" onclick="ReportsView.exportCSV()"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
              </div>
            </div>

            <!-- Filters -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div class="form-group" style="margin: 0;">
                <label>Division</label>
                <select id="filter-div" class="form-control" onchange="ReportsView.applyFilters()">
                  <option value="">All Divisions</option>
                  <option value="1">SE(ECE)-A</option>
                  <option value="2">SE(ECE)-B</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label>Status</label>
                <select id="filter-status" class="form-control" onchange="ReportsView.applyFilters()">
                  <option value="">All Statuses</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label>Start Date</label>
                <input type="date" id="filter-start-date" class="form-control" onchange="ReportsView.applyFilters()">
              </div>
              <div class="form-group" style="margin: 0;">
                <label>End Date</label>
                <input type="date" id="filter-end-date" class="form-control" onchange="ReportsView.applyFilters()">
              </div>
            </div>

            <div class="table-responsive">
              <table class="custom-table" id="table-reports">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Division & Batch</th>
                    <th>Certificate & Event</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Certificate Activity Breakdown</th>
                  </tr>
                </thead>
                <tbody id="tbody-reports">
                  ${certRows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load reports: ${err.message}</p></div>`;
    }
  },

  async applyFilters() {
    const divId = document.getElementById('filter-div').value;
    const status = document.getElementById('filter-status').value;
    const start = document.getElementById('filter-start-date').value;
    const end = document.getElementById('filter-end-date').value;

    let url = `/api/reports?division_id=${divId}&status=${status}&start_date=${start}&end_date=${end}`;
    try {
      const data = await API.get(url);
      const reports = data.reports || [];

      const rows = reports.map(r => `
        <tr>
          <td><strong>${r.student_name}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">Roll: ${r.roll_no} | PRN: ${r.prn_no}</span></td>
          <td><span class="badge-role role-STUDENT">${r.division_name} (${r.batch_name})</span></td>
          <td><strong>${r.title}</strong><br><span style="font-size: 0.75rem; color: var(--primary);">${r.event_name} (${r.category})</span></td>
          <td>${r.certificate_date}</td>
          <td><span class="badge-status status-${r.status}">${r.status}</span></td>
          <td>
            <strong style="color: var(--accent-green); display: block; margin-bottom: 0.2rem;">${intVal(r.total_activities)} Activity Units</strong>
            <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: 600;">${r.breakdown_summary}</span>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching report records found.</td></tr>`;

      document.getElementById('tbody-reports').innerHTML = rows;
    } catch (err) {
      Toast.error('Failed to apply filters.');
    }
  },

  async exportCSV() {
    const data = await API.get('/api/reports');
    Exporter.exportToCSV('ECE_Management_Master_Report', data.reports || []);
  }
};

function intVal(v) {
  return parseInt(v, 10) || 0;
}
