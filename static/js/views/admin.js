/* Admin ERP Dashboard & System Management View Controller */
const AdminView = {
  async renderDashboard() {
    try {
      const meta = await API.get('/api/admin/meta');

      return `
        <div class="dashboard-container">
          <div class="glass-panel" style="background: linear-gradient(135deg, rgba(236,72,153,0.15), rgba(99,102,241,0.15)); border-color: var(--secondary);">
            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700;">Admin ERP Control Panel</h2>
            <p style="color: var(--text-muted); margin-top: 0.2rem;">Full System Administration: Departments, Divisions, Batches, Subjects, Timetables, and Permissions.</p>
          </div>

          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-info">
                <span>Departments</span>
                <h3>${(meta.departments || []).length}</h3>
              </div>
              <div class="stat-icon icon-blue"><i class="fa-solid fa-building-columns"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Divisions</span>
                <h3>${(meta.divisions || []).length}</h3>
              </div>
              <div class="stat-icon icon-green"><i class="fa-solid fa-layer-group"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Batches</span>
                <h3>${(meta.batches || []).length}</h3>
              </div>
              <div class="stat-icon icon-amber"><i class="fa-solid fa-users-rectangle"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Subjects</span>
                <h3>${(meta.subjects || []).length}</h3>
              </div>
              <div class="stat-icon icon-rose"><i class="fa-solid fa-book"></i></div>
            </div>
          </div>

          <!-- Quick Action Modules -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
            <div class="glass-panel" style="cursor: pointer;" onclick="window.location.hash='#/admin/timetable'">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="stat-icon icon-blue" style="width: 54px; height: 54px; font-size: 1.5rem;"><i class="fa-solid fa-calendar-days"></i></div>
                <div>
                  <h3 style="font-size: 1.1rem; font-weight: 700; color: #fff;">Timetable Management</h3>
                  <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;">Configure master college timetable, parallel batch slots & copy tools.</p>
                </div>
              </div>
            </div>

            <div class="glass-panel" style="cursor: pointer;" onclick="window.location.hash='#/admin/subjects'">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="stat-icon icon-green" style="width: 54px; height: 54px; font-size: 1.5rem;"><i class="fa-solid fa-book-open"></i></div>
                <div>
                  <h3 style="font-size: 1.1rem; font-weight: 700; color: #fff;">Subject Management</h3>
                  <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;">Add/edit theory, lab & tutorial subjects with credit points.</p>
                </div>
              </div>
            </div>

            <div class="glass-panel" style="cursor: pointer;" onclick="window.location.hash='#/reports'">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="stat-icon icon-amber" style="width: 54px; height: 54px; font-size: 1.5rem;"><i class="fa-solid fa-chart-pie"></i></div>
                <div>
                  <h3 style="font-size: 1.1rem; font-weight: 700; color: #fff;">Master System Reports</h3>
                  <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;">Export multi-filter reports to CSV, Excel, and PDF.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load Admin ERP control panel.</p></div>`;
    }
  },

  async renderSubjects() {
    try {
      const meta = await API.get('/api/admin/meta');
      const subjects = meta.subjects || [];

      const rows = subjects.map(s => `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td><span class="tt-code">${s.code}</span></td>
          <td><span class="badge-status status-APPROVED">${s.type}</span></td>
          <td>${s.credits} Credits</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="Toast.info('Subject edit modal')">Edit</button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No subjects found.</td></tr>`;

      return `
        <div class="dashboard-container">
          <div class="glass-panel">
            <div class="panel-header">
              <h3><i class="fa-solid fa-book"></i> Subject Management</h3>
              <button class="btn btn-primary btn-sm" onclick="Toast.info('Use database seeder or API to create subjects')"><i class="fa-solid fa-plus"></i> Add New Subject</button>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Credits</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load subjects.</p></div>`;
    }
  }
};
