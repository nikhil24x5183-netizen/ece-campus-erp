/* HOD & Teacher Dashboard View Controller — Dedicated Div A & Div B Approval Desks */
const TeacherView = {
  currentApprovalDiv: 'SE(ECE)-A',

  async renderDashboard() {
    try {
      const data = await API.get('/api/teacher/dashboard');
      const teacher = data.teacher || {};

      const todayClasses = (data.today_classes || []).map(c => `
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--primary); font-size: 0.9rem;">${c.start_time} - ${c.end_time}</strong>
            <span class="badge-status status-APPROVED">${c.activity_type}</span>
          </div>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-top: 0.3rem;">${c.subject_name || 'Class'} (${c.subject_code || ''})</h4>
          <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            <span><i class="fa-solid fa-users" style="color: var(--primary);"></i> ${c.division_name || ''} ${c.batch_name ? '(' + c.batch_name + ')' : '(Whole Class)'}</span>
            <span><i class="fa-solid fa-location-dot" style="color: var(--accent-gold);"></i> ${c.room || 'Room N/A'}</span>
          </div>
        </div>
      `).join('') || `<p style="color: var(--text-muted);">No classes scheduled for today (${data.today_name}).</p>`;

      return `
        <div class="dashboard-container">
          <!-- HOD Welcome Header -->
          <div class="glass-panel" style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #bfdbfe;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1px;">ECE MANAGEMENT — HOD PORTAL</span>
                <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-top: 0.25rem;">Welcome, ${teacher.name || 'HOD'}</h2>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.2rem;">Teacher ID Code: ${teacher.teacher_id_code || 'HOD101'} | Department: ${teacher.department_name || 'ECE'} | ${teacher.designation || 'Head of Department'}</p>
              </div>
              <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                <a href="#/hod/approvals" class="btn btn-primary btn-sm"><i class="fa-solid fa-square-check"></i> HOD Approval Desk</a>
                <a href="#/hod/teachers" class="btn btn-black btn-sm"><i class="fa-solid fa-user-plus"></i> Add Teachers</a>
                <a href="#/hod/students" class="btn btn-black btn-sm"><i class="fa-solid fa-graduation-cap"></i> Register Students</a>
              </div>
            </div>
          </div>

          <!-- Stat Cards Grid -->
          <div class="stat-grid">
            <div class="stat-card">
              <div class="stat-info">
                <span>Pending Approvals</span>
                <h3 style="color: var(--accent-gold);">${data.pending_certificates}</h3>
              </div>
              <div class="stat-icon icon-amber"><i class="fa-solid fa-clock"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Approved Certs</span>
                <h3>${data.approved_certificates}</h3>
              </div>
              <div class="stat-icon icon-green"><i class="fa-solid fa-circle-check"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Rejected Certs</span>
                <h3>${data.rejected_certificates}</h3>
              </div>
              <div class="stat-icon icon-rose"><i class="fa-solid fa-circle-xmark"></i></div>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span>Total ECE Students</span>
                <h3>${data.total_students}</h3>
              </div>
              <div class="stat-icon icon-blue"><i class="fa-solid fa-users"></i></div>
            </div>
          </div>

          <!-- Today's Classes -->
          <div class="glass-panel">
            <div class="panel-header">
              <h3><i class="fa-solid fa-calendar-day"></i> Today's Assigned Classes (${data.today_name})</h3>
              <a href="#/hod/timetable" class="btn btn-secondary btn-sm"><i class="fa-solid fa-calendar-days"></i> Official Timetable</a>
            </div>
            ${todayClasses}
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load HOD dashboard.</p></div>`;
    }
  },

  async renderApprovals() {
    try {
      const data = await API.get('/api/teacher/certificates/pending');
      const pendingList = data.pending_certificates || [];

      const countDivA = pendingList.filter(c => c.division_name === 'SE(ECE)-A').length;
      const countDivB = pendingList.filter(c => c.division_name === 'SE(ECE)-B').length;

      const rows = pendingList.map(c => {
        const isHidden = (this.currentApprovalDiv !== 'ALL' && c.division_name !== this.currentApprovalDiv);
        return `
          <tr data-div="${c.division_name}" style="${isHidden ? 'display: none;' : ''}">
            <td>
              <strong>${c.student_name}</strong><br>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Roll: ${c.roll_no} | PRN: ${c.prn_no}</span>
            </td>
            <td><span class="badge-role role-STUDENT" style="background: #eff6ff; color: var(--primary); font-weight: 800;">${c.division_name} (${c.batch_name})</span></td>
            <td><strong>${c.title}</strong><br><span style="font-size: 0.75rem; color: var(--primary);">${c.event_name} (${c.category})</span></td>
            <td>${c.certificate_date}</td>
            <td><span class="badge-status status-PENDING">PENDING</span></td>
            <td>
              <div style="display: flex; gap: 0.4rem;">
                <button class="btn btn-secondary btn-sm" onclick="StudentView.previewFile('${c.file_url}', '${c.file_name}')">
                  <i class="fa-solid fa-eye"></i> View
                </button>
                <button class="btn btn-success btn-sm" onclick="TeacherView.openApproveModal(${c.id})">
                  <i class="fa-solid fa-check"></i> HOD Accept
                </button>
                <button class="btn btn-danger btn-sm" onclick="TeacherView.openRejectModal(${c.id})">
                  <i class="fa-solid fa-xmark"></i> Reject
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No pending certificates to review!</td></tr>`;

      return `
        <div class="dashboard-container">
          <!-- HOD Certificate Approvals Section ONLY -->
          <div class="glass-panel">
            <div class="panel-header">
              <h3><i class="fa-solid fa-file-signature" style="color: var(--primary);"></i> HOD Certificate Approvals Desk</h3>
            </div>

            <!-- Dedicated Division A & Division B Toggle Pills with WhatsApp-style Upper Badges -->
            <div style="display: flex; gap: 0.85rem; margin-bottom: 1.5rem; background: #f8fafc; padding: 0.65rem; border-radius: var(--radius-full); border: 1px solid var(--border-color); flex-wrap: wrap;">
              <button type="button" class="btn ${this.currentApprovalDiv === 'SE(ECE)-A' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-approval-div-a" onclick="TeacherView.switchApprovalDivision('SE(ECE)-A')" style="border-radius: var(--radius-full); font-weight: 800; position: relative;">
                <i class="fa-solid fa-users-viewfinder"></i> SE(ECE) Division A Desk 
                ${countDivA > 0 ? `<span class="badge-whatsapp-top">${countDivA}</span>` : ''}
              </button>

              <button type="button" class="btn ${this.currentApprovalDiv === 'SE(ECE)-B' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-approval-div-b" onclick="TeacherView.switchApprovalDivision('SE(ECE)-B')" style="border-radius: var(--radius-full); font-weight: 800; position: relative;">
                <i class="fa-solid fa-users-viewfinder"></i> SE(ECE) Division B Desk 
                ${countDivB > 0 ? `<span class="badge-whatsapp-top">${countDivB}</span>` : ''}
              </button>

              <button type="button" class="btn ${this.currentApprovalDiv === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-approval-div-all" onclick="TeacherView.switchApprovalDivision('ALL')" style="border-radius: var(--radius-full); font-weight: 800; position: relative;">
                <i class="fa-solid fa-layer-group"></i> Combined All Divisions Desk
                ${(countDivA + countDivB) > 0 ? `<span class="badge-whatsapp-top">${countDivA + countDivB}</span>` : ''}
              </button>
            </div>

            <div class="table-responsive">
              <table class="custom-table" id="table-approvals">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Division & Batch</th>
                    <th>Certificate Title & Event</th>
                    <th>Certificate Date</th>
                    <th>Status</th>
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
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load approvals desk.</p></div>`;
    }
  },

  async renderPasswordApprovals() {
    try {
      // Fetch HOD Password Reset Requests
      const passRes = await API.get('/api/hod/password-requests').catch(() => ({ requests: [] }));
      const passRequests = passRes.requests || [];
      const pendingPassReqs = passRequests.filter(r => r.status === 'PENDING');

      const passRowsHtml = pendingPassReqs.map(r => `
        <tr>
          <td>
            <strong>${r.student_name}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Roll: ${r.roll_no} | PRN: ${r.prn_no}</span>
          </td>
          <td><span class="badge-role role-STUDENT" style="background: #eff6ff; color: var(--primary); font-weight: 800;">${r.division_name} (${r.batch_name})</span></td>
          <td>${r.email}</td>
          <td>${r.created_at}</td>
          <td><span class="badge-status status-PENDING">PENDING HOD APPROVAL</span></td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-success btn-sm" onclick="TeacherView.approvePasswordRequest(${r.id})">
                <i class="fa-solid fa-check"></i> Approve & Change Password
              </button>
              <button class="btn btn-danger btn-sm" onclick="TeacherView.rejectPasswordRequest(${r.id})">
                <i class="fa-solid fa-xmark"></i> Reject
              </button>
            </div>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No pending student password change requests to review.</td></tr>`;

      return `
        <div class="dashboard-container">
          <div class="glass-panel" style="border-left: 4px solid var(--accent-gold);">
            <div class="panel-header">
              <h3>
                <i class="fa-solid fa-key" style="color: var(--accent-gold);"></i> 
                Student Password Reset Approvals Desk
                ${pendingPassReqs.length > 0 ? `<span class="badge-whatsapp-top" style="position: relative; top: 0; right: 0; margin-left: 0.5rem;">${pendingPassReqs.length}</span>` : ''}
              </h3>
            </div>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.5rem;">
              Dedicated Security Desk: Review and approve student password reset requests.
            </p>
            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Student Details</th>
                    <th>Division & Batch</th>
                    <th>Email Address</th>
                    <th>Requested At</th>
                    <th>Status</th>
                    <th>HOD Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${passRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load password approvals desk.</p></div>`;
    }
  },

  async approvePasswordRequest(reqId) {
    if (!confirm('Approve password change request for this student?')) return;
    try {
      const res = await API.post(`/api/hod/password-requests/${reqId}/approve`);
      Toast.success(res.message);
      const container = document.getElementById('view-container');
      container.innerHTML = await this.renderApprovals();
    } catch (err) {
      Toast.error(err.message || 'Failed to approve password request.');
    }
  },

  async rejectPasswordRequest(reqId) {
    const reason = prompt('Enter reason for rejecting password change request:', 'Invalid request details');
    if (reason === null) return;
    try {
      const res = await API.post(`/api/hod/password-requests/${reqId}/reject`, { reason });
      Toast.success(res.message);
      const container = document.getElementById('view-container');
      container.innerHTML = await this.renderApprovals();
    } catch (err) {
      Toast.error(err.message || 'Failed to reject password request.');
    }
  },

  switchApprovalDivision(divName) {
    this.currentApprovalDiv = divName;
    
    // Update active pill button classes
    const btnA = document.getElementById('btn-approval-div-a');
    const btnB = document.getElementById('btn-approval-div-b');
    const btnAll = document.getElementById('btn-approval-div-all');

    if (btnA) btnA.className = `btn ${divName === 'SE(ECE)-A' ? 'btn-primary' : 'btn-secondary'} btn-sm`;
    if (btnB) btnB.className = `btn ${divName === 'SE(ECE)-B' ? 'btn-primary' : 'btn-secondary'} btn-sm`;
    if (btnAll) btnAll.className = `btn ${divName === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`;

    // Filter table rows dynamically
    const rows = document.querySelectorAll('#table-approvals tbody tr');
    rows.forEach(tr => {
      const rowDiv = tr.getAttribute('data-div');
      if (divName === 'ALL' || !rowDiv || rowDiv === divName) {
        tr.style.display = '';
      } else {
        tr.style.display = 'none';
      }
    });
  },

  async openApproveModal(certId) {
    try {
      const res = await API.get(`/api/teacher/certificates/${certId}/preview-calculation`);
      if (!res.success) {
        Toast.error(res.message || 'Certificate preview failed.');
        return;
      }

      const cert = res.certificate || {};
      const dayName = res.day_of_week;
      const lectures = res.lectures || [];

      document.getElementById('approve-modal-subtitle').innerText = 
        `Student: ${cert.student_name} | Date: ${cert.certificate_date} (${dayName}) — Select lectures to mark attendance:`;

      const listContainer = document.getElementById('approve-lectures-list');

      if (!lectures.length) {
        listContainer.innerHTML = `<p style="padding: 1rem; color: var(--text-muted);">No scheduled lectures/labs found on ${dayName} for this student's division/batch.</p>`;
      } else {
        listContainer.innerHTML = lectures.map(l => `
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <input type="checkbox" class="chk-lecture-entry" value="${l.entry_id}" checked style="width: 18px; height: 18px;">
              <div>
                <strong style="color: var(--text-main); font-size: 0.9rem;">${l.subject_name} (${l.subject_code})</strong>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Slot: ${l.start_time} - ${l.end_time} | Type: ${l.activity_type}</div>
              </div>
            </div>
            <span class="badge-status status-APPROVED" style="font-size: 0.7rem;">+1.0 Unit</span>
          </label>
        `).join('');
      }

      document.getElementById('btn-confirm-approve-lectures').onclick = async () => {
        const checkedInputs = document.querySelectorAll('.chk-lecture-entry:checked');
        const selectedIds = Array.from(checkedInputs).map(cb => cb.value);

        try {
          const appRes = await API.post(`/api/teacher/certificates/${certId}/approve`, { selected_entry_ids: selectedIds });
          Toast.success(appRes.message || 'Certificate approved and activities recorded!');
          closeModal('modal-approve-lectures');
          const container = document.getElementById('view-container');
          container.innerHTML = await TeacherView.renderApprovals();
        } catch (err) {
          Toast.error(err.message || 'Failed to approve certificate.');
        }
      };

      openModal('modal-approve-lectures');
    } catch (err) {
      Toast.error('Failed to load lecture calculation preview.');
    }
  },

  toggleSelectAllLectures(checked) {
    document.querySelectorAll('.chk-lecture-entry').forEach(cb => cb.checked = checked);
  },

  openRejectModal(certId) {
    window.currentRejectCertId = certId;
    document.getElementById('reject-reason-input').value = '';
    
    document.getElementById('btn-confirm-reject').onclick = async () => {
      const reason = document.getElementById('reject-reason-input').value.trim();
      if (!reason) {
        Toast.error('Please enter a rejection reason.');
        return;
      }
      try {
        await API.post(`/api/teacher/certificates/${certId}/reject`, { reason });
        Toast.success('Certificate rejected.');
        closeModal('modal-reject-reason');
        const container = document.getElementById('view-container');
        container.innerHTML = await TeacherView.renderApprovals();
      } catch (err) {
        Toast.error(err.message || 'Failed to reject certificate.');
      }
    };

    openModal('modal-reject-reason');
  },

  async renderStudentSearch() {
    return `
      <div class="dashboard-container">
        <div class="glass-panel">
          <div class="panel-header">
            <h3><i class="fa-solid fa-magnifying-glass"></i> Student Activity Search & Lookup</h3>
          </div>
          <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
            <input type="text" id="search-student-query" class="form-control" placeholder="Search by Student Name, Roll Number, or PRN..." onkeyup="if(event.key==='Enter') TeacherView.executeStudentSearch()">
            <select id="search-student-div" class="form-control" style="width: 180px;">
              <option value="">All Divisions</option>
              <option value="1">SE(ECE)-A</option>
              <option value="2">SE(ECE)-B</option>
            </select>
            <button class="btn btn-primary" onclick="TeacherView.executeStudentSearch()"><i class="fa-solid fa-search"></i> Search</button>
          </div>
          <div id="student-search-results">
            <p style="color: var(--text-muted);">Enter query or select division to search students.</p>
          </div>
        </div>
      </div>
    `;
  },

  async executeStudentSearch() {
    const q = document.getElementById('search-student-query').value.trim();
    const divId = document.getElementById('search-student-div').value;
    try {
      const res = await API.get(`/api/teacher/students?q=${encodeURIComponent(q)}&division_id=${divId}`);
      const students = res.students || [];

      const cards = students.map(s => `
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div>
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${s.name}</h4>
            <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.2rem;">Roll No: ${s.roll_no} | PRN: ${s.prn_no} | Division: <strong>${s.division_name}</strong> (Batch ${s.batch_name})</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="TeacherView.viewStudentDetail(${s.id})">
            <i class="fa-solid fa-user"></i> View Profile & Activities
          </button>
        </div>
      `).join('') || `<p style="color: var(--text-muted);">No matching students found.</p>`;

      document.getElementById('student-search-results').innerHTML = cards;
    } catch (err) {
      Toast.error('Failed to search students.');
    }
  },

  async viewStudentDetail(studentId) {
    try {
      const data = await API.get(`/api/teacher/students/${studentId}`);
      const s = data.student || {};
      const summaryRows = (data.summary || []).map(sum => `<li><strong>${sum.subject_name} (${sum.subject_code}):</strong> ${sum.total_count} activities</li>`).join('') || '<li>No activities calculated.</li>';

      const html = `
        <div style="padding: 1rem;">
          <h3>${s.name} - Activity Profile</h3>
          <p style="color: var(--text-muted); margin-bottom: 1rem;">Roll No: ${s.roll_no} | PRN: ${s.prn_no} | Division: <strong>${s.division_name}</strong> (Batch ${s.batch_name})</p>
          <h4>Subject Activity Breakdown:</h4>
          <ul style="margin-left: 1.5rem; margin-bottom: 1.5rem; color: var(--text-main);">
            ${summaryRows}
          </ul>
        </div>
      `;
      document.getElementById('preview-modal-title').innerText = `Student Activity Profile`;
      document.getElementById('preview-modal-body').innerHTML = html;
      openModal('modal-file-preview');
    } catch (err) {
      Toast.error('Failed to load student details.');
    }
  }
};
