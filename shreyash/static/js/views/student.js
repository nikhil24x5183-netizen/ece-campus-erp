/* Student Portal & Certificate Management View Controller */
const StudentView = {
  async renderDashboard() {
    try {
      const data = await API.get('/api/student/dashboard');
      const profile = App.currentProfile || {};

      const cumulativeCounters = (data.cumulative_subject_counters || []).map(s => `
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem 1.1rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: var(--text-main); font-size: 0.9rem;">${s.subject_name}</strong>
            <span style="font-size: 0.75rem; color: var(--primary); display: block;">${s.subject_code} (${s.activity_type})</span>
          </div>
          <span style="background: var(--primary); color: #ffffff; padding: 0.3rem 0.85rem; border-radius: var(--radius-full); font-weight: 800; font-size: 0.85rem;">
            Count: ${parseInt(s.cumulative_count, 10)}
          </span>
        </div>
      `).join('') || `<p style="color: var(--text-muted);">No accumulated subject attendance yet. Upload certificates to begin earning attendance credits!</p>`;

      const recentRows = (data.recent_activities || []).map(a => `
        <tr>
          <td>${a.activity_date}</td>
          <td><strong>${a.certificate_title}</strong><br><span style="font-size: 0.72rem; color: var(--text-muted);">${a.event_name}</span></td>
          <td>${a.subject_name}</td>
          <td><span class="badge-status status-APPROVED">${a.activity_type}</span></td>
          <td><strong>+${parseInt(a.lecture_count, 10)} Unit</strong></td>
        </tr>
      `).join('') || `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No activity history recorded yet.</td></tr>`;

      return `
        <div class="dashboard-container">
          <!-- Student Banner -->
          <div class="glass-panel" style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #bfdbfe;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1px;">STUDENT PORTAL</span>
                <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-top: 0.25rem;">Welcome, ${profile.name || 'Student'}</h2>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.2rem;">
                  Roll No: ${profile.roll_no || 'N/A'} | PRN: ${profile.prn_no || 'N/A'} | Department: ${profile.department_name || 'ECE'} | Division: <strong>${profile.division_name || 'SE(ECE)-A'}</strong> (Batch ${profile.batch_name || 'A1'})
                </p>
              </div>
              <button class="btn btn-primary" onclick="window.location.hash='#/student/upload'">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload Certificate
              </button>
            </div>
          </div>

          <!-- Stat Cards -->
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-info">
                <span>Approved Certs</span>
                <h3>${data.approved_certificates}</h3>
              </div>
              <div class="stat-icon icon-green"><i class="fa-solid fa-circle-check"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Pending Review</span>
                <h3>${data.pending_certificates}</h3>
              </div>
              <div class="stat-icon icon-amber"><i class="fa-solid fa-clock"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Rejected</span>
                <h3>${data.rejected_certificates}</h3>
              </div>
              <div class="stat-icon icon-rose"><i class="fa-solid fa-circle-xmark"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Total Accumulated Activities</span>
                <h3>${parseInt(data.total_activities, 10)}</h3>
              </div>
              <div class="stat-icon icon-blue"><i class="fa-solid fa-chart-simple"></i></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
            <!-- Accumulated Subject Attendance Counters -->
            <div class="glass-panel">
              <div class="panel-header">
                <h3><i class="fa-solid fa-calculator" style="color: var(--primary);"></i> Cumulative Subject Attendance Counters</h3>
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem;">
                Accumulated total lecture/lab attendance credits earned per subject (Count incremented on certificate approval):
              </p>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${cumulativeCounters}
              </div>
            </div>

            <!-- Recent Activities -->
            <div class="glass-panel">
              <div class="panel-header">
                <h3><i class="fa-solid fa-history"></i> Recent Approved Activity Credits</h3>
              </div>
              <div class="table-responsive">
                <table class="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Subject</th>
                      <th>Type</th>
                      <th>Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentRows}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load student dashboard: ${err.message}</p></div>`;
    }
  },

  async renderUploadForm() {
    return `
      <div class="dashboard-container">
        <div class="glass-panel" style="max-width: 750px; margin: 0 auto;">
          <div class="panel-header">
            <h3><i class="fa-solid fa-cloud-arrow-up" style="color: var(--primary);"></i> Upload Activity / Achievement Certificate</h3>
            <a href="#/student/certificates" class="btn btn-secondary btn-sm"><i class="fa-solid fa-list"></i> View My Submissions</a>
          </div>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.75rem;">
            Submit your hackathon, workshop, paper publication, NPTEL, or co-curricular certificate for faculty review and attendance credit calculation.
          </p>

          <form id="form-certificate-upload-page" onsubmit="StudentView.handleUploadPage(event)">
            <div class="form-group">
              <label>Certificate Title <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="page-cert-title" class="form-control" placeholder="e.g. 1st Prize in National Web Hackathon 2026" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label>Event Name / Organizer <span style="color: var(--accent-rose);">*</span></label>
                <input type="text" id="page-cert-event" class="form-control" placeholder="e.g. IEEE Tech Fest / College Sports" required>
              </div>

              <div class="form-group">
                <label>Category <span style="color: var(--accent-rose);">*</span></label>
                <select id="page-cert-category" class="form-control" required>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Publication">Paper Publication</option>
                  <option value="NPTEL/Coursera">NPTEL / Online Certification</option>
                  <option value="Other">Other Co-Curricular</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Certificate Event Date <span style="color: var(--accent-rose);">*</span></label>
              <input type="date" id="page-cert-date" class="form-control" required>
            </div>

            <div class="form-group">
              <label>Description / Details</label>
              <textarea id="page-cert-desc" class="form-control" rows="3" placeholder="Brief details about your role, achievements, or project..."></textarea>
            </div>

            <div class="form-group">
              <label>Upload Document File (PDF / PNG / JPG) <span style="color: var(--accent-rose);">*</span></label>
              <input type="file" id="page-cert-file" class="form-control" accept=".pdf,.png,.jpg,.jpeg" required>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
              <a href="#/student/certificates" class="btn btn-secondary">Cancel</a>
              <button type="submit" id="btn-page-upload-submit" class="btn btn-primary" style="padding: 0.85rem 2rem;">
                <i class="fa-solid fa-paper-plane"></i> Submit Certificate for Review
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  async handleUploadPage(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-page-upload-submit');
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading...';
    btnSubmit.disabled = true;

    const formData = new FormData();
    formData.append('title', document.getElementById('page-cert-title').value);
    formData.append('event_name', document.getElementById('page-cert-event').value);
    formData.append('category', document.getElementById('page-cert-category').value);
    formData.append('certificate_date', document.getElementById('page-cert-date').value);
    formData.append('description', document.getElementById('page-cert-desc').value);
    formData.append('file', document.getElementById('page-cert-file').files[0]);

    try {
      const res = await API.upload('/api/student/certificates', formData);
      Toast.success(res.message || 'Certificate uploaded successfully!');
      window.location.hash = '#/student/certificates';
    } catch (err) {
      Toast.error(err.message || 'Failed to upload certificate.');
      btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Certificate for Review';
      btnSubmit.disabled = false;
    }
  },

  async renderCertificates() {
    try {
      const data = await API.get('/api/student/certificates');
      const certificates = data.certificates || [];

      const rows = certificates.map(c => `
        <tr>
          <td><strong>${c.title}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${c.description || ''}</span></td>
          <td>${c.event_name}</td>
          <td><span class="badge-role role-STUDENT">${c.category}</span></td>
          <td>${c.certificate_date}</td>
          <td>
            <span class="badge-status status-${c.status}">${c.status}</span>
            ${c.status === 'REJECTED' && c.rejection_reason ? `<div style="font-size: 0.72rem; color: var(--accent-rose); margin-top: 0.2rem;">Reason: ${c.rejection_reason}</div>` : ''}
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="StudentView.previewFile('${c.file_url}', '${c.file_name}')">
              <i class="fa-solid fa-eye"></i> View Document
            </button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No certificates uploaded yet. Click "Upload New Certificate" above to submit your first certificate.</td></tr>`;

      return `
        <div class="dashboard-container">
          <div class="glass-panel">
            <div class="panel-header">
              <h3><i class="fa-solid fa-file-contract" style="color: var(--primary);"></i> My Certificate Submissions</h3>
              <a href="#/student/upload" class="btn btn-primary btn-sm">
                <i class="fa-solid fa-cloud-arrow-up"></i> Upload New Certificate
              </a>
            </div>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Title & Description</th>
                    <th>Event / Activity</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Document Action</th>
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
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load certificates.</p></div>`;
    }
  },

  async renderProfile() {
    const profile = App.currentProfile || {};
    return `
      <div class="dashboard-container">
        <div class="glass-panel" style="max-width: 650px; margin: 0 auto;">
          <div class="panel-header">
            <h3><i class="fa-solid fa-id-card" style="color: var(--primary);"></i> Student Academic Profile</h3>
          </div>
          <div style="display: flex; gap: 1.5rem; align-items: center; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1.5rem;">
            <div class="user-avatar" style="width: 70px; height: 70px; font-size: 1.8rem; background: var(--primary);">
              ${(profile.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 800; color: var(--text-main);">${profile.name || 'Student Name'}</h2>
              <p style="color: var(--primary); font-weight: 700; font-size: 0.9rem;">Electronics & Computer Engineering Department</p>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Roll Number</span>
              <p style="font-weight: 800; font-size: 1.1rem; color: var(--text-main); margin-top: 0.2rem;">${profile.roll_no || 'N/A'}</p>
            </div>

            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">PRN Number</span>
              <p style="font-weight: 800; font-size: 1.1rem; color: var(--text-main); margin-top: 0.2rem;">${profile.prn_no || 'N/A'}</p>
            </div>

            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Division</span>
              <p style="font-weight: 800; font-size: 1.1rem; color: var(--primary); margin-top: 0.2rem;">${profile.division_name || 'SE(ECE)-A'}</p>
            </div>

            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Assigned Batch</span>
              <p style="font-weight: 800; font-size: 1.1rem; color: var(--accent-gold); margin-top: 0.2rem;">Batch ${profile.batch_name || 'A1'}</p>
            </div>

            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Email Address</span>
              <p style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-top: 0.2rem;">${profile.email || ''}</p>
            </div>

            <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Academic Year</span>
              <p style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-top: 0.2rem;">${profile.academic_year || '2026-27'}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  previewFile(url, fileName) {
    document.getElementById('preview-modal-title').innerText = `File Preview: ${fileName}`;
    const body = document.getElementById('preview-modal-body');

    if (url.endsWith('.pdf')) {
      body.innerHTML = `<iframe src="${url}" style="width: 100%; height: 500px; border: none; border-radius: var(--radius-md);"></iframe>`;
    } else {
      body.innerHTML = `<img src="${url}" style="max-width: 100%; max-height: 500px; border-radius: var(--radius-md); object-fit: contain;" alt="Certificate Preview">`;
    }

    openModal('modal-file-preview');
  }
};
