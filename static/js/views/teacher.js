/* HOD & Teacher Dashboard View Controller — Dedicated Div A & Div B Approval Desks */
const TeacherView = {
  currentApprovalDiv: 'ALL',

  async renderDashboard() {
    try {
      const data = await API.get('/api/teacher/dashboard');
      const teacher = data.teacher || {};

      await fetchCloudDB(true);
      const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], users: [] };
      const allStudentUsers = (db.users || []).filter(u => u.role === 'STUDENT');
      const allStudentProfiles = db.students || [];

      const allStudentsList = [...allStudentProfiles];
      allStudentUsers.forEach(u => {
        if (!allStudentsList.some(s => s.user_id == u.id || (s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase()))) {
          allStudentsList.push(u);
        }
      });

      const pendingStudents = allStudentsList.filter(s => !s.status || s.status === 'PENDING_APPROVAL' || s.status === 'PENDING' || (s.status && s.status.toUpperCase().includes('PENDING')));

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

      const pendingStudentBannerHtml = pendingStudents.length > 0 ? `
        <div style="background: #fef3c7; border: 2px solid #f59e0b; color: #92400e; padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
              <div style="width: 48px; height: 48px; background: #fde68a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #b45309;">
                <i class="fa-solid fa-user-clock"></i>
              </div>
              <div>
                <strong style="font-size: 1.1rem; color: #78350f; display: block;">🎓 ${pendingStudents.length} New Student Sign up(s) Awaiting HOD Approval!</strong>
                <p style="font-size: 0.85rem; color: #92400e; margin: 0.2rem 0 0 0;">
                  Latest Pending: <strong>${pendingStudents[0].name || pendingStudents[0].email}</strong> (${pendingStudents[0].email || ''})
                </p>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-success" onclick="HodView.approveAllPendingRegistrations()" style="background: #16a34a; border-color: #16a34a; font-weight: 800; padding: 0.65rem 1.25rem; font-size: 0.95rem;">
                <i class="fa-solid fa-check-double"></i> APPROVE ALL (${pendingStudents.length}) NOW
              </button>
              <a href="#/hod/students" class="btn btn-primary" style="font-weight: 800; padding: 0.65rem 1.25rem;">
                <i class="fa-solid fa-users-gear"></i> View Registration Queue
              </a>
            </div>
          </div>
        </div>
      ` : '';

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
                <button onclick="App.openEditProfileModal()" class="btn btn-warning btn-sm" style="font-weight: 800; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none;"><i class="fa-solid fa-key"></i> HOD PIN & Account Settings</button>
                <a href="#/hod/approvals" class="btn btn-primary btn-sm"><i class="fa-solid fa-square-check"></i> HOD Approval Desk</a>
                <a href="#/hod/teachers" class="btn btn-black btn-sm"><i class="fa-solid fa-user-plus"></i> Add Teachers</a>
                <a href="#/hod/students" class="btn btn-black btn-sm"><i class="fa-solid fa-graduation-cap"></i> Register Students</a>
              </div>
            </div>
          </div>

          ${pendingStudentBannerHtml}

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
      await fetchCloudDB(true);
      const stdRes = await API.get('/api/hod/students').catch(() => ({ students: [] }));
      const allStudents = (stdRes.students || []).filter(s => s && (s.email || s.prn_no || s.roll_no) && s.name && s.name !== 'Student' && s.name !== 'N/A');
      const rawPendingStudents = allStudents.filter(s => 
        !s.status || s.status === 'PENDING_APPROVAL' || s.status === 'PENDING' || s.status.toUpperCase().includes('PENDING')
      );

      // Strict unique deduplication by email/PRN/name
      const uniquePendingMap = new Map();
      rawPendingStudents.forEach(s => {
        const key = (s.email || '').trim().toLowerCase() || (s.prn_no || '').trim() || (s.name || '').trim().toLowerCase();
        if (key && !uniquePendingMap.has(key)) {
          uniquePendingMap.set(key, s);
        }
      });
      const pendingStudents = Array.from(uniquePendingMap.values());

      const localDb = typeof getLocalDB === 'function' ? getLocalDB() : { certificates: [] };
      const data = await API.get('/api/teacher/certificates/pending').catch(() => ({ certificates: [] }));
      const allCerts = (data.certificates && Array.isArray(data.certificates) && data.certificates.length > 0) 
        ? data.certificates 
        : (localDb.certificates || []);

      // Sort: PENDING certificates at top, then by newest ID
      allCerts.sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
        return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
      });

      const getCertDiv = (c) => {
        if (c.division_name && (c.division_name.includes('B') || c.division_name.includes('2') || c.division_name.toLowerCase().includes('div b'))) return 'SE(ECE)-B';
        if (c.division_id == 2) return 'SE(ECE)-B';
        return 'SE(ECE)-A';
      };

      const countDivA = allCerts.filter(c => c.status === 'PENDING' && getCertDiv(c) === 'SE(ECE)-A').length;
      const countDivB = allCerts.filter(c => c.status === 'PENDING' && getCertDiv(c) === 'SE(ECE)-B').length;

      // 1. Build Student Signups Section (Always visible & informative)
      let pendingStudentsSectionHtml = '';
      if (pendingStudents.length > 0) {
        const studentRowsHtml = pendingStudents.map(s => {
          const safeName = (s.name || s.email || 'Student').replace(/'/g, "\\'");
          const safePrn = (s.prn_no || '').replace(/'/g, "\\'");
          const safeEmail = (s.email || '').replace(/'/g, "\\'");
          return `
            <tr>
              <td><strong style="font-size: 0.95rem; color: var(--text-main);">${s.name || s.email || 'Student'}</strong></td>
              <td><span style="font-family: monospace; font-weight: 700;">Roll: ${s.roll_no || 'N/A'} | PRN: ${s.prn_no || 'N/A'}</span></td>
              <td><span class="badge-role role-STUDENT" style="background: #eff6ff; color: var(--primary); font-weight: 800;">${s.division_name || 'SE(ECE)'} (${s.batch_name || 'A1'})</span></td>
              <td>${s.email || 'N/A'}</td>
              <td><span class="badge-status status-PENDING" style="background: #fef3c7; color: #d97706; border: 1px solid #fde68a; font-weight: 800;">AWAITING HOD ACCEPTANCE</span></td>
              <td>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                  <button class="btn btn-success btn-sm" onclick="HodView.approveStudentRegistration('${s.id}', '${safeName}', '${safePrn}', '${safeEmail}')" style="background: #16a34a; border-color: #16a34a; font-weight: 800;">
                    <i class="fa-solid fa-user-check"></i> Approve Registration
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="HodView.directResetPassword('${s.id}', '${safeName}')">
                    <i class="fa-solid fa-key"></i> Reset Pass
                  </button>
                  <button class="btn btn-danger btn-sm" onclick="HodView.deleteStudent('${s.id}', '${safeName}')">
                    <i class="fa-solid fa-trash-can"></i> Reject
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

        pendingStudentsSectionHtml = `
          <!-- 1. PENDING STUDENT REGISTRATIONS SECTION -->
          <div class="glass-panel" style="border: 2px solid #f59e0b; background: #fffbeb; margin-bottom: 2rem;">
            <div class="panel-header" style="border-bottom: 1px solid #fcd34d; padding-bottom: 0.75rem; margin-bottom: 1rem;">
              <h3 style="color: #b45309;">
                <i class="fa-solid fa-user-clock" style="color: #d97706;"></i> 
                New Student Registration Signups Awaiting HOD Acceptance 
                <span class="badge-whatsapp-top" style="position: relative; top: 0; right: 0; margin-left: 0.5rem;">${pendingStudents.length}</span>
              </h3>
            </div>
            <div class="table-responsive">
              <table class="custom-table" style="background: #ffffff; border-radius: var(--radius-md);">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll & PRN</th>
                    <th>Division & Batch</th>
                    <th>Email Address</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${studentRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        pendingStudentsSectionHtml = `
          <div class="glass-panel" style="background: #f0fdf4; border: 1px solid #bbf7d0; margin-bottom: 2rem; padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.5rem; color: #16a34a;"><i class="fa-solid fa-circle-check"></i></span>
                <div>
                  <h4 style="font-size: 1rem; font-weight: 800; color: #166534; margin: 0;">All Student Registrations are Approved & Active!</h4>
                  <p style="font-size: 0.83rem; color: #15803d; margin: 0.2rem 0 0 0;">There are no new pending student signups waiting for acceptance right now.</p>
                </div>
              </div>
              <a href="#/hod/students" class="btn btn-secondary btn-sm"><i class="fa-solid fa-users-gear"></i> Manage Student Roster</a>
            </div>
          </div>
        `;
      }

      // 2. Build Certificate Approvals Section
      if (!this.currentApprovalDiv) this.currentApprovalDiv = 'ALL';
      if (!this.currentCertApprovalTab) this.currentCertApprovalTab = 'PENDING';

      const filteredList = allCerts.filter(c => {
        if (!this.currentApprovalDiv || this.currentApprovalDiv === 'ALL') return true;
        return getCertDiv(c) === this.currentApprovalDiv;
      });

      const pendingCerts = filteredList.filter(c => c.status === 'PENDING');
      const approvedCerts = filteredList.filter(c => c.status === 'APPROVED' || c.status === 'REJECTED');

      const totalPendingCount = allCerts.filter(c => c.status === 'PENDING').length;
      const totalApprovedCount = allCerts.filter(c => c.status === 'APPROVED').length;

      // Pending Rows Generator
      const pendingRowsHtml = pendingCerts.map(c => `
        <tr data-div="${c.division_name}">
          <td>
            <strong>${c.student_name}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Roll: ${c.roll_no} | PRN: ${c.prn_no}</span>
          </td>
          <td><span class="badge-role role-STUDENT" style="background: #eff6ff; color: var(--primary); font-weight: 800;">${c.division_name} (${c.batch_name})</span></td>
          <td><strong>${c.title}</strong><br><span style="font-size: 0.75rem; color: var(--primary);">${c.event_name} (${c.category})</span></td>
          <td>${c.certificate_date}</td>
          <td><span class="badge-status status-PENDING" style="background: #fef3c7; color: #d97706; border: 1px solid #fde68a; font-weight: 800;"><i class="fa-solid fa-clock"></i> Awaiting Review</span></td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center;">
              <button class="btn btn-secondary btn-sm" onclick="StudentView.previewFile('${c.file_url || ''}', '${c.file_name || c.title}', '${(c.title || '').replace(/'/g, "\\'")}', '${(c.student_name || '').replace(/'/g, "\\'")}', '${c.id}')">
                <i class="fa-solid fa-eye"></i> View
              </button>
              <button class="btn btn-success btn-sm" onclick="TeacherView.openApproveModal('${c.id}')" style="background: #16a34a; border-color: #16a34a; font-weight: 800;">
                <i class="fa-solid fa-clipboard-check"></i> Approve
              </button>
              <button class="btn btn-danger btn-sm" onclick="TeacherView.openRejectModal('${c.id}')">
                <i class="fa-solid fa-xmark"></i> Reject
              </button>
              <button class="btn btn-danger btn-sm" onclick="TeacherView.deleteCertificate('${c.id}', '${(c.title || '').replace(/'/g, "\\'")}')" style="background: #b91c1c; border-color: #b91c1c;" title="Permanently Delete Certificate">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align: center; color: #16a34a; font-weight: 700; padding: 2.5rem;"><i class="fa-solid fa-circle-check" style="font-size: 1.5rem; display: block; margin-bottom: 0.5rem;"></i> All certificate requests are cleared! No pending submissions.</td></tr>`;

      // Approved / Processed Rows Generator
      const approvedRowsHtml = approvedCerts.map(c => {
        const isAppr = c.status === 'APPROVED';
        return `
          <tr data-div="${c.division_name}">
            <td>
              <strong>${c.student_name}</strong><br>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Roll: ${c.roll_no} | PRN: ${c.prn_no}</span>
            </td>
            <td><span class="badge-role role-STUDENT" style="background: #eff6ff; color: var(--primary); font-weight: 800;">${c.division_name} (${c.batch_name})</span></td>
            <td><strong>${c.title}</strong><br><span style="font-size: 0.75rem; color: var(--primary);">${c.event_name} (${c.category})</span></td>
            <td>${c.certificate_date}</td>
            <td>
              ${isAppr ? `
                <span class="badge-status status-APPROVED" style="font-weight: 800; background: #dcfce7; color: #15803d; padding: 0.35rem 0.6rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.3rem;">
                  <i class="fa-solid fa-circle-check"></i> Approved
                </span>
                <div style="font-size: 0.72rem; color: #166534; font-weight: 700; margin-top: 0.2rem;">Attendance Credited</div>
              ` : `
                <span class="badge-status status-REJECTED" style="font-weight: 800; background: #fee2e2; color: #b91c1c; padding: 0.35rem 0.6rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.3rem;">
                  <i class="fa-solid fa-circle-xmark"></i> Rejected
                </span>
                ${c.rejection_reason ? `<div style="font-size: 0.72rem; color: #b91c1c; margin-top: 0.2rem;">${c.rejection_reason}</div>` : ''}
              `}
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center;">
                <button class="btn btn-secondary btn-sm" onclick="StudentView.previewFile('${c.file_url || ''}', '${c.file_name || c.title}', '${(c.title || '').replace(/'/g, "\\'")}', '${(c.student_name || '').replace(/'/g, "\\'")}', '${c.id}')">
                  <i class="fa-solid fa-eye"></i> View
                </button>
                <button class="btn btn-secondary btn-sm" onclick="TeacherView.openApproveModal('${c.id}')" style="font-size: 0.78rem; padding: 0.25rem 0.5rem;" title="Modify attendance lecture credits">
                  <i class="fa-solid fa-pen-to-square"></i> Change Credits
                </button>
                <button class="btn btn-danger btn-sm" onclick="TeacherView.deleteCertificate('${c.id}', '${(c.title || '').replace(/'/g, "\\'")}')" style="background: #b91c1c; border-color: #b91c1c;" title="Permanently Delete Certificate">
                  <i class="fa-solid fa-trash-can"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No approved certificates history logged yet.</td></tr>`;

      return `
        <div class="dashboard-container">
          ${pendingStudentsSectionHtml}

          <!-- HOD Certificate Approvals Workspace -->
          <div class="glass-panel">
            <div class="panel-header">
              <h3><i class="fa-solid fa-file-signature" style="color: var(--primary);"></i> HOD Certificate Review & Approvals Desk</h3>
            </div>

            <!-- Top Level Switcher: Section 1 (Pending for Approval) vs Section 2 (Approved History) -->
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem;">
              <button type="button" class="btn ${this.currentCertApprovalTab === 'PENDING' ? 'btn-primary' : 'btn-secondary'}"
                onclick="TeacherView.switchCertApprovalTab('PENDING')"
                style="border-radius: var(--radius-md); font-weight: 800; display: flex; align-items: center; gap: 0.5rem; position: relative;">
                <i class="fa-solid fa-clock-rotate-left"></i> 1. Pending Approvals Queue ("To Be Approved")
                ${totalPendingCount > 0 ? `<span class="badge-whatsapp-top" style="position: relative; top: 0; right: 0;">${totalPendingCount}</span>` : ''}
              </button>

              <button type="button" class="btn ${this.currentCertApprovalTab === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}"
                onclick="TeacherView.switchCertApprovalTab('APPROVED')"
                style="border-radius: var(--radius-md); font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-circle-check" style="color: #22c55e;"></i> 2. Approved Certificates History ("Approved")
                <span style="background: rgba(0,0,0,0.08); padding: 0.15rem 0.5rem; border-radius: var(--radius-full); font-size: 0.78rem;">${totalApprovedCount}</span>
              </button>

              <button type="button" class="btn ${this.currentCertApprovalTab === 'ALL' ? 'btn-primary' : 'btn-secondary'}"
                onclick="TeacherView.switchCertApprovalTab('ALL')"
                style="border-radius: var(--radius-md); font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fa-solid fa-layer-group"></i> 3. All Combined Records
              </button>
            </div>

            <!-- Division A & Division B Filter Pills -->
            <div style="display: flex; gap: 0.65rem; margin-bottom: 1.5rem; background: #f8fafc; padding: 0.5rem 0.85rem; border-radius: var(--radius-full); border: 1px solid var(--border-color); flex-wrap: wrap; align-items: center;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);"><i class="fa-solid fa-filter"></i> Division:</span>
              <button type="button" class="btn ${this.currentApprovalDiv === 'SE(ECE)-A' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="TeacherView.switchApprovalDivision('SE(ECE)-A')" style="border-radius: var(--radius-full); font-weight: 800; font-size: 0.78rem;">
                Division A Desk ${countDivA > 0 ? `(${countDivA} pending)` : ''}
              </button>
              <button type="button" class="btn ${this.currentApprovalDiv === 'SE(ECE)-B' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="TeacherView.switchApprovalDivision('SE(ECE)-B')" style="border-radius: var(--radius-full); font-weight: 800; font-size: 0.78rem;">
                Division B Desk ${countDivB > 0 ? `(${countDivB} pending)` : ''}
              </button>
              <button type="button" class="btn ${this.currentApprovalDiv === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="TeacherView.switchApprovalDivision('ALL')" style="border-radius: var(--radius-full); font-weight: 800; font-size: 0.78rem;">
                All Divisions Combined
              </button>
            </div>

            <!-- SECTION 1: PENDING FOR APPROVAL TABLE -->
            ${(this.currentCertApprovalTab === 'PENDING' || this.currentCertApprovalTab === 'ALL') ? `
              <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                  <h4 style="font-size: 1.05rem; font-weight: 800; color: #b45309; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-hourglass-half" style="color: #d97706;"></i> 
                    Pending Approvals Queue (${pendingCerts.length} waiting for HOD review)
                  </h4>
                </div>
                <div class="table-responsive">
                  <table class="custom-table">
                    <thead style="background: #fffbeb;">
                      <tr>
                        <th>Student Details</th>
                        <th>Division & Batch</th>
                        <th>Certificate & Event</th>
                        <th>Certificate Date</th>
                        <th>Status</th>
                        <th>Review Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${pendingRowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

            <!-- SECTION 2: APPROVED & PROCESSED CERTIFICATES HISTORY TABLE -->
            ${(this.currentCertApprovalTab === 'APPROVED' || this.currentCertApprovalTab === 'ALL') ? `
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                  <h4 style="font-size: 1.05rem; font-weight: 800; color: #166534; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> 
                    Approved & Processed Certificates History (${approvedCerts.length} certificates)
                  </h4>
                </div>
                <div class="table-responsive">
                  <table class="custom-table">
                    <thead style="background: #f0fdf4;">
                      <tr>
                        <th>Student Details</th>
                        <th>Division & Batch</th>
                        <th>Certificate & Event</th>
                        <th>Certificate Date</th>
                        <th>Status & Credits</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${approvedRowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}

          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load approvals desk.</p></div>`;
    }
  },

  async renderPasswordApprovals() {
    try {
      await fetchCloudDB(true);
      const passRes = await API.get('/api/hod/password-requests').catch(() => ({ requests: [] }));
      const passRequests = passRes.requests || [];
      const pendingPassReqs = passRequests.filter(r => r.status === 'PENDING');

      const passRowsHtml = pendingPassReqs.map(r => `
        <tr>
          <td>
            <strong>${r.student_name || 'Student'}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Roll: ${r.roll_no || 'N/A'} | PRN: ${r.prn_no || 'N/A'}</span>
          </td>
          <td><span class="badge-role role-STUDENT" style="background: #eff6ff; color: var(--primary); font-weight: 800;">${r.division_name || 'SE(ECE)-A'} (${r.batch_name || 'A1'})</span></td>
          <td><strong>${r.student_email || r.email || 'N/A'}</strong></td>
          <td>${(r.created_at || '').replace('T', ' ').substring(0, 19)}</td>
          <td><span class="badge-status status-PENDING">PENDING HOD APPROVAL</span></td>
          <td>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              <button class="btn btn-success btn-sm" onclick="TeacherView.approvePasswordRequest('${r.id}')" style="background: #16a34a; border-color: #16a34a; font-weight: 800;">
                <i class="fa-solid fa-check"></i> Approve & Change Password
              </button>
              <button class="btn btn-danger btn-sm" onclick="TeacherView.rejectPasswordRequest('${r.id}')">
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
    if (!confirm('Accept and approve this student password reset request with the password they requested?')) return;
    try {
      Toast.info('Processing password approval...');
      const res = await API.post(`/api/hod/password-requests/${reqId}/approve`, {});
      Toast.success(res.message || 'Password change request approved!');
      if (window.App && App.updateBadges) await App.updateBadges();
      const container = document.getElementById('view-container');
      container.innerHTML = await this.renderPasswordApprovals();
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to approve password request.');
    }
  },

  async rejectPasswordRequest(reqId) {
    const reason = prompt('Enter reason for rejecting password change request:', 'Invalid request details');
    if (reason === null) return;
    try {
      Toast.info('Processing rejection...');
      const res = await API.post(`/api/hod/password-requests/${reqId}/reject`, { reason });
      Toast.success(res.message || 'Password request rejected.');
      if (window.App && App.updateBadges) await App.updateBadges();
      const container = document.getElementById('view-container');
      container.innerHTML = await this.renderPasswordApprovals();
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to reject password request.');
    }
  },

  switchApprovalDivision(divName) {
    this.currentApprovalDiv = divName;
    const container = document.getElementById('view-container');
    if (container) {
      this.renderApprovals().then(html => container.innerHTML = html);
    }
  },

  switchCertApprovalTab(tabName) {
    this.currentCertApprovalTab = tabName;
    const container = document.getElementById('view-container');
    if (container) {
      this.renderApprovals().then(html => container.innerHTML = html);
    }
  },

  approveModalState: null,

  async openApproveModal(certId) {
    try {
      const db = typeof getLocalDB === 'function' ? getLocalDB() : { certificates: [], students: [], users: [], timetable: [] };
      const cert = (db.certificates || []).find(c => String(c.id) === String(certId) || c.id === parseInt(certId)) || {};
      const student = (db.students || []).find(s => s.id == cert.student_id || s.user_id == cert.student_id) || 
                      (db.users || []).find(u => u.id == cert.student_id) || {};
      
      const studentDivId = student.division_id ? parseInt(student.division_id) : (student.division_name && student.division_name.includes('B') ? 2 : 1);
      const studentBatchId = student.batch_id ? parseInt(student.batch_id) : null;

      // Determine initial primary day of week from certificate date
      let initialDay = 'Monday';
      if (cert.certificate_date) {
        const d = new Date(cert.certificate_date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        if (!isNaN(d.getDay())) initialDay = days[d.getDay()];
      }
      if (initialDay === 'Sunday' || initialDay === 'Saturday') initialDay = 'Monday';

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

      // Helper to get timetable lectures for a specific day
      const getLecturesForDay = (dayName) => {
        const entries = (db.timetable || []).filter(t => {
          if (t.day_of_week !== dayName) return false;
          if (parseInt(t.division_id) !== studentDivId) return false;
          if (t.batch_id !== null && t.batch_id !== undefined && t.batch_id !== "") {
            if (studentBatchId !== null && parseInt(t.batch_id) !== studentBatchId) return false;
          }
          return true;
        });

        return entries.map((e, idx) => {
          const slot = db.time_slots ? db.time_slots.find(ts => ts.id === parseInt(e.time_slot_id)) : {};
          return {
            entry_id: e.id || (idx + 1),
            subject_name: e.subject_name || "Course Lecture",
            subject_code: e.subject_code || "ECE-TH-105",
            start_time: e.start_time || (slot ? slot.start_time : "08:30"),
            end_time: e.end_time || (slot ? slot.end_time : "09:30"),
            activity_type: e.activity_type || "THEORY",
            teacher_name: e.teacher_name || "Faculty",
            room_no: e.room_no || "Room 105"
          };
        });
      };

      const initialLectures = getLecturesForDay(initialDay);

      this.approveModalState = {
        certId: certId,
        cert: cert,
        student: student,
        studentDivId: studentDivId,
        studentBatchId: studentBatchId,
        numDays: 1,
        activeDayIndex: 0,
        days: [
          {
            day_of_week: initialDay,
            lectures: initialLectures,
            selected_ids: initialLectures.map(l => l.entry_id)
          }
        ]
      };

      document.getElementById('preview-modal-title').innerText = `HOD Certificate Approval & Attendance Compensation`;
      openModal('modal-file-preview');
      this.renderApproveModalUI();
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to load approval details.');
    }
  },

  renderApproveModalUI() {
    const s = this.approveModalState;
    if (!s) return;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const activeDay = s.days[s.activeDayIndex] || s.days[0];

    // 1. Calculate total selected lectures across all configured days
    let totalSelectedLectures = 0;
    s.days.forEach(d => {
      totalSelectedLectures += (d.selected_ids || []).length;
    });

    // 2. Day count duration pills (1 Day, 2 Days, 3 Days, 4 Days, 5 Days)
    const durationPillsHtml = [1, 2, 3, 4, 5].map(cnt => `
      <button type="button" class="btn btn-sm ${s.numDays === cnt ? 'btn-primary' : 'btn-secondary'}"
        onclick="TeacherView.setApproveDaysCount(${cnt})"
        style="padding: 0.35rem 0.85rem; font-weight: 800; font-size: 0.8rem; border-radius: var(--radius-full);">
        ${cnt} ${cnt === 1 ? 'Day' : 'Days'} Event
      </button>
    `).join('');

    // 3. Multi-Day Tab Selector (Day 1: Thursday, Day 2: Friday, etc.)
    let dayTabsHtml = '';
    if (s.numDays > 1) {
      dayTabsHtml = `
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; overflow-x: auto; padding-bottom: 0.3rem;">
          ${s.days.map((d, idx) => `
            <button type="button" class="btn btn-sm ${s.activeDayIndex === idx ? 'btn-primary' : 'btn-secondary'}"
              onclick="TeacherView.switchApproveActiveDay(${idx})"
              style="font-weight: 700; font-size: 0.82rem; border-radius: var(--radius-md); display: flex; align-items: center; gap: 0.4rem;">
              <i class="fa-solid fa-calendar-day"></i> Day ${idx + 1}: ${d.day_of_week}
              <span style="background: rgba(255,255,255,0.25); padding: 0.1rem 0.4rem; border-radius: var(--radius-full); font-size: 0.75rem;">
                ${(d.selected_ids || []).length} lec
              </span>
            </button>
          `).join('')}
        </div>
      `;
    }

    // 4. Current Day Dropdown Selector
    const dayOptions = daysOfWeek.map(d => 
      `<option value="${d}" ${d === activeDay.day_of_week ? 'selected' : ''}>${d}</option>`
    ).join('');

    // 5. Lectures Checkbox List for Current Day
    let lectureListHtml = '';
    const lectures = activeDay.lectures || [];
    if (lectures.length > 0) {
      lectureListHtml = lectures.map((l) => {
        const isChecked = (activeDay.selected_ids || []).includes(l.entry_id);
        return `
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); background: #ffffff; margin-bottom: 0.4rem; border-radius: var(--radius-md); cursor: pointer; transition: all 0.15s ease; border: 1.5px solid ${isChecked ? '#93c5fd' : '#e2e8f0'};" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
              <input type="checkbox" class="chk-lec-sel" data-id="${l.entry_id}" ${isChecked ? 'checked' : ''}
                onchange="TeacherView.toggleLectureSelection(${l.entry_id}, this.checked)"
                style="width: 20px; height: 20px; accent-color: var(--primary); cursor: pointer;">
              <div>
                <strong style="font-size: 0.95rem; color: var(--text-main); display: block;">${l.subject_name}</strong>
                <span style="font-size: 0.8rem; color: var(--text-muted);">
                  <i class="fa-solid fa-clock" style="color: var(--primary);"></i> ${l.start_time} – ${l.end_time} &nbsp;|&nbsp; 
                  <i class="fa-solid fa-tag"></i> ${l.subject_code} &nbsp;|&nbsp; 
                  <i class="fa-solid fa-location-dot" style="color: var(--accent-gold);"></i> ${l.room_no || 'Room 105'}
                </span>
              </div>
            </div>
            <span class="badge-role role-STUDENT" style="font-size: 0.78rem; font-weight: 800; padding: 0.3rem 0.65rem; border-radius: var(--radius-sm); background: ${l.activity_type === 'LAB' ? '#fef3c7' : '#eff6ff'}; color: ${l.activity_type === 'LAB' ? '#b45309' : 'var(--primary)'};">
              ${l.activity_type}
            </span>
          </label>
        `;
      }).join('');
    } else {
      lectureListHtml = `<div style="text-align: center; padding: 2rem; color: var(--text-muted); background: #f8fafc; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">No timetable classes scheduled for ${activeDay.day_of_week} in this student's division.</div>`;
    }

    const allChecked = lectures.length > 0 && (activeDay.selected_ids || []).length === lectures.length;

    const modalHtml = `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
        <!-- Certificate & Student Summary Header Box -->
        <div style="background: linear-gradient(135deg, #eff6ff, #f0fdf4); border: 1.5px solid #bfdbfe; border-radius: var(--radius-md); padding: 1.1rem; box-shadow: 0 2px 8px rgba(37,99,235,0.08);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px;">
                🏆 ${s.cert.category || 'EVENT'} CERTIFICATE APPROVAL
              </span>
              <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 0.25rem 0;">
                ${s.cert.title || 'Certificate Title'}
              </h4>
              <p style="font-size: 0.88rem; color: var(--text-muted); margin: 0;">
                Student: <strong style="color: var(--text-main);">${s.cert.student_name || s.student.name || 'Student'}</strong> &nbsp;|&nbsp; 
                Roll No: <strong style="color: var(--primary); font-family: monospace;">${s.cert.roll_no || s.student.roll_no || 'N/A'}</strong> &nbsp;|&nbsp; 
                PRN: <strong style="color: var(--primary); font-family: monospace;">${s.cert.prn_no || s.student.prn_no || 'N/A'}</strong> &nbsp;|&nbsp; 
                Division: <strong>${s.cert.division_name || s.student.division_name || 'SE(ECE)'}</strong>
              </p>
            </div>
            <span class="badge-status status-PENDING" style="background: #fef3c7; color: #d97706; border: 1px solid #fde68a; font-weight: 800; padding: 0.4rem 0.85rem; font-size: 0.82rem;">
              <i class="fa-solid fa-clock"></i> Awaiting HOD Approval
            </span>
          </div>
        </div>

        <!-- Event Duration / Number of Days Selector -->
        <div style="background: #ffffff; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
            <label style="font-size: 0.88rem; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 0.4rem; margin: 0;">
              <i class="fa-solid fa-business-time" style="color: var(--primary);"></i> Event Duration (How many days was student absent?):
            </label>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              ${durationPillsHtml}
            </div>
          </div>

          ${dayTabsHtml}

          <!-- Day Selection Row -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; background: #f8fafc; padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <label style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin: 0;">
                <i class="fa-solid fa-calendar-check" style="color: var(--primary);"></i> Timetable Day for ${s.numDays > 1 ? `Day ${s.activeDayIndex + 1}` : 'Attendance Credit'}:
              </label>
              <select class="form-control form-control-sm" style="font-weight: 800; width: 150px; border: 2px solid #2563eb;" onchange="TeacherView.changeDayOfWeekForActiveDay(this.value)">
                ${dayOptions}
              </select>
            </div>

            <span style="font-size: 0.82rem; font-weight: 800; color: var(--primary); background: #eff6ff; padding: 0.35rem 0.85rem; border-radius: var(--radius-full); border: 1px solid #bfdbfe;">
              ${(activeDay.selected_ids || []).length} of ${lectures.length} classes selected
            </span>
          </div>
        </div>

        <!-- Master Select All Toggle & Lecture Checkboxes List -->
        <div style="background: #ffffff; border: 1.5px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);">
            <label style="display: flex; align-items: center; gap: 0.6rem; font-weight: 800; font-size: 0.9rem; cursor: pointer; margin: 0; color: var(--text-main);">
              <input type="checkbox" ${allChecked ? 'checked' : ''} onchange="TeacherView.toggleSelectAllForActiveDay(this.checked)"
                style="width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer;">
              Select / Deselect All Classes on ${activeDay.day_of_week}
            </label>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Check lectures to compensate with 100% attendance</span>
          </div>

          <div style="max-height: 240px; overflow-y: auto; padding-right: 0.3rem;">
            ${lectureListHtml}
          </div>
        </div>

        <!-- Clean Modal Footer Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-top: 1.5px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-weight: 800; font-size: 0.92rem; color: #166534; background: #dcfce7; border: 1.5px solid #86efac; padding: 0.45rem 1rem; border-radius: var(--radius-full);">
              🎯 Total Attendance Compensation: <strong>${totalSelectedLectures} Lecture(s) / Lab(s)</strong> across ${s.numDays} day(s)
            </span>
          </div>

          <div style="display: flex; gap: 0.75rem;">
            <button type="button" class="btn btn-secondary" onclick="closeModal('modal-file-preview')" style="font-weight: 700; padding: 0.65rem 1.25rem;">
              <i class="fa-solid fa-xmark"></i> Cancel
            </button>
            <button type="button" class="btn btn-success" style="background: #16a34a; border-color: #16a34a; font-weight: 800; padding: 0.65rem 1.5rem; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);"
              onclick="TeacherView._submitMultiDayApprove()">
              <i class="fa-solid fa-certificate"></i> Approve Certificate & Award Attendance
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('preview-modal-body').innerHTML = modalHtml;
  },

  setApproveDaysCount(count) {
    const s = this.approveModalState;
    if (!s) return;
    s.numDays = count;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const db = typeof getLocalDB === 'function' ? getLocalDB() : { timetable: [] };

    // Helper to get timetable lectures for a specific day
    const getLecturesForDay = (dayName) => {
      const entries = (db.timetable || []).filter(t => {
        if (t.day_of_week !== dayName) return false;
        if (parseInt(t.division_id) !== s.studentDivId) return false;
        if (t.batch_id !== null && t.batch_id !== undefined && t.batch_id !== "") {
          if (s.studentBatchId !== null && parseInt(t.batch_id) !== s.studentBatchId) return false;
        }
        return true;
      });

      return entries.map((e, idx) => {
        const slot = db.time_slots ? db.time_slots.find(ts => ts.id === parseInt(e.time_slot_id)) : {};
        return {
          entry_id: e.id || (idx + 1),
          subject_name: e.subject_name || "Course Lecture",
          subject_code: e.subject_code || "ECE-TH-105",
          start_time: e.start_time || (slot ? slot.start_time : "08:30"),
          end_time: e.end_time || (slot ? slot.end_time : "09:30"),
          activity_type: e.activity_type || "THEORY",
          teacher_name: e.teacher_name || "Faculty",
          room_no: e.room_no || "Room 105"
        };
      });
    };

    // Expand or shrink days array
    while (s.days.length < count) {
      const nextIdx = s.days.length;
      const prevDayName = s.days[nextIdx - 1].day_of_week;
      const prevDayIndexInWeek = daysOfWeek.indexOf(prevDayName);
      const nextDayName = daysOfWeek[(prevDayIndexInWeek + 1) % daysOfWeek.length] || 'Tuesday';
      const lecs = getLecturesForDay(nextDayName);
      s.days.push({
        day_of_week: nextDayName,
        lectures: lecs,
        selected_ids: lecs.map(l => l.entry_id)
      });
    }

    if (s.days.length > count) {
      s.days = s.days.slice(0, count);
    }

    if (s.activeDayIndex >= count) {
      s.activeDayIndex = count - 1;
    }

    this.renderApproveModalUI();
  },

  switchApproveActiveDay(index) {
    if (!this.approveModalState) return;
    this.approveModalState.activeDayIndex = index;
    this.renderApproveModalUI();
  },

  changeDayOfWeekForActiveDay(newDayName) {
    const s = this.approveModalState;
    if (!s) return;
    const db = typeof getLocalDB === 'function' ? getLocalDB() : { timetable: [] };

    const entries = (db.timetable || []).filter(t => {
      if (t.day_of_week !== newDayName) return false;
      if (parseInt(t.division_id) !== s.studentDivId) return false;
      if (t.batch_id !== null && t.batch_id !== undefined && t.batch_id !== "") {
        if (s.studentBatchId !== null && parseInt(t.batch_id) !== s.studentBatchId) return false;
      }
      return true;
    });

    const newLectures = entries.map((e, idx) => {
      const slot = db.time_slots ? db.time_slots.find(ts => ts.id === parseInt(e.time_slot_id)) : {};
      return {
        entry_id: e.id || (idx + 1),
        subject_name: e.subject_name || "Course Lecture",
        subject_code: e.subject_code || "ECE-TH-105",
        start_time: e.start_time || (slot ? slot.start_time : "08:30"),
        end_time: e.end_time || (slot ? slot.end_time : "09:30"),
        activity_type: e.activity_type || "THEORY",
        teacher_name: e.teacher_name || "Faculty",
        room_no: e.room_no || "Room 105"
      };
    });

    s.days[s.activeDayIndex] = {
      day_of_week: newDayName,
      lectures: newLectures,
      selected_ids: newLectures.map(l => l.entry_id)
    };

    this.renderApproveModalUI();
  },

  toggleLectureSelection(entryId, isChecked) {
    const s = this.approveModalState;
    if (!s) return;
    const activeDay = s.days[s.activeDayIndex];
    if (!activeDay) return;

    activeDay.selected_ids = activeDay.selected_ids || [];
    if (isChecked) {
      if (!activeDay.selected_ids.includes(entryId)) activeDay.selected_ids.push(entryId);
    } else {
      activeDay.selected_ids = activeDay.selected_ids.filter(id => id !== entryId);
    }

    this.renderApproveModalUI();
  },

  toggleSelectAllForActiveDay(isChecked) {
    const s = this.approveModalState;
    if (!s) return;
    const activeDay = s.days[s.activeDayIndex];
    if (!activeDay) return;

    if (isChecked) {
      activeDay.selected_ids = (activeDay.lectures || []).map(l => l.entry_id);
    } else {
      activeDay.selected_ids = [];
    }

    this.renderApproveModalUI();
  },

  async _submitMultiDayApprove() {
    const s = this.approveModalState;
    if (!s) return;

    const certId = s.certId;
    const selected_days = s.days.map(d => ({
      day_of_week: d.day_of_week,
      entry_ids: d.selected_ids || []
    }));

    try {
      closeModal('modal-file-preview');
    } catch(e) {}

    try {
      Toast.info('Processing certificate approval & attendance credits...');
      const res = await API.post(`/api/teacher/certificates/${certId}/approve`, {
        selected_days: selected_days
      });
      Toast.success(res.message || '🎉 Certificate approved & attendance awarded!');
      if (window.App && App.updateBadges) await App.updateBadges();
      const container = document.getElementById('view-container');
      container.innerHTML = await TeacherView.renderApprovals();
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to approve certificate.');
    }
  },


  toggleFullDayApproval(checked) {
    const selectAllCb = document.getElementById('chk-select-all-lectures');
    if (selectAllCb) selectAllCb.checked = checked;
    document.querySelectorAll('.chk-lecture-entry').forEach(cb => cb.checked = checked);
  },

  toggleSelectAllLectures(checked) {
    document.querySelectorAll('.chk-lecture-entry').forEach(cb => cb.checked = checked);
    const fullDayCb = document.getElementById('chk-full-day-approval');
    if (fullDayCb) fullDayCb.checked = checked;
  },

  async openRejectModal(certId) {
    const reason = prompt('Enter rejection reason for this certificate submission:', 'Incomplete / Invalid Document');
    if (reason === null) return;
    try {
      const res = await API.post(`/api/teacher/certificates/${certId}/reject`, { reason: reason || 'Rejected by HOD' });
      Toast.success((res && res.message) || 'Certificate rejected.');
      if (window.App && App.updateBadges) await App.updateBadges();
      const container = document.getElementById('view-container');
      container.innerHTML = await TeacherView.renderApprovals();
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to reject certificate.');
    }
  },

  async deleteCertificate(certId, certTitle) {
    if (!confirm(`Are you sure you want to permanently delete this certificate "${certTitle || 'Document'}"?\n\nThis will remove it from all desks and student records.`)) return;
    try {
      Toast.info('Deleting certificate...');
      const res = await API.delete(`/api/teacher/certificates/${certId}`);
      Toast.success((res && res.message) || 'Certificate deleted permanently.');
      if (window.App && App.updateBadges) await App.updateBadges();
      const container = document.getElementById('view-container');
      container.innerHTML = await TeacherView.renderApprovals();
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to delete certificate.');
    }
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
