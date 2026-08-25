/* HOD Panel — Faculty & Student Management with Separate Div A and Div B Sections */
const HodView = {
  currentStudentDivFilter: 'ALL',

  async renderTeachers() {
    try {
      const data = await API.get('/api/hod/teachers');
      const teachers = data.teachers || [];

      const rows = teachers.map(t => `
        <tr>
          <td><strong style="color: var(--text-main); font-size: 0.95rem;">${t.name}</strong></td>
          <td><span style="font-family: monospace; font-weight: 700; color: var(--primary);">${t.teacher_id_code}</span></td>
          <td>${t.email}</td>
          <td><span class="badge-role role-TEACHER">${t.designation || 'Faculty'}</span></td>
          <td><span class="badge-status status-APPROVED">ACTIVE</span></td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="HodView.deleteTeacher(${t.id}, '${t.name.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No faculty members registered yet.</td></tr>`;

      return `
        <div class="dashboard-container">
          <!-- Add Faculty Header & Panel -->
          <div class="glass-panel">
            <div class="panel-header">
              <h3><i class="fa-solid fa-chalkboard-user" style="color: var(--primary);"></i> Faculty / Teacher Management</h3>
              <button class="btn btn-primary btn-sm" onclick="openModal('modal-add-teacher')">
                <i class="fa-solid fa-user-plus"></i> Add New Faculty Member
              </button>
            </div>
            <p style="color: var(--text-muted); font-size: 0.88rem; margin-bottom: 1.5rem;">
              Registered teachers and faculty members in the Electronics & Computer Engineering Department:
            </p>

            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Faculty Name</th>
                    <th>Teacher ID Code</th>
                    <th>Email Address</th>
                    <th>Designation</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Add Teacher Modal -->
        <div class="modal-overlay" id="modal-add-teacher">
          <div class="modal-content" style="max-width: 550px;">
            <div class="modal-header">
              <h3><i class="fa-solid fa-user-plus" style="color: var(--primary);"></i> Add New Faculty Member</h3>
              <button class="modal-close" onclick="closeModal('modal-add-teacher')">&times;</button>
            </div>
            <form id="form-add-teacher" onsubmit="HodView.handleAddTeacher(event)">
              <div class="form-group">
                <label>Faculty Full Name <span style="color: var(--accent-rose);">*</span></label>
                <input type="text" id="add-teacher-name" class="form-control" placeholder="e.g. Prof. R. K. Joshi" required>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label>Teacher ID Code <span style="color: var(--accent-rose);">*</span></label>
                  <input type="text" id="add-teacher-code" class="form-control" placeholder="e.g. T103" required>
                </div>

                <div class="form-group">
                  <label>Designation <span style="color: var(--accent-rose);">*</span></label>
                  <select id="add-teacher-designation" class="form-control" required>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Faculty Email Address <span style="color: var(--accent-rose);">*</span></label>
                <input type="email" id="add-teacher-email" class="form-control" placeholder="e.g. rkjoshi@campus.edu" required>
              </div>

              <div class="form-group">
                <label>Password <span style="color: var(--accent-rose);">*</span></label>
                <div class="password-toggle-group">
                  <input type="password" id="add-teacher-password" class="form-control" placeholder="Enter Password" required>
                  <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('add-teacher-password', this)" title="Show/Hide Password">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('modal-add-teacher')">Cancel</button>
                <button type="submit" id="btn-submit-teacher" class="btn btn-primary">Register Faculty</button>
              </div>
            </form>
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load faculty members.</p></div>`;
    }
  },

  async handleAddTeacher(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-teacher');
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Registering...';
    btnSubmit.disabled = true;

    const payload = {
      name: document.getElementById('add-teacher-name').value,
      teacher_id_code: document.getElementById('add-teacher-code').value,
      designation: document.getElementById('add-teacher-designation').value,
      email: document.getElementById('add-teacher-email').value,
      password: document.getElementById('add-teacher-password').value
    };

    try {
      const res = await API.post('/api/hod/teachers', payload);
      Toast.success(res.message || 'Faculty member registered.');
      closeModal('modal-add-teacher');
      const container = document.getElementById('view-container');
      container.innerHTML = await HodView.renderTeachers();
    } catch (err) {
      Toast.error(err.message || 'Failed to register faculty member.');
      btnSubmit.innerHTML = 'Register Faculty';
      btnSubmit.disabled = false;
    }
  },

  async deleteTeacher(id, name) {
    if (!confirm(`Are you sure you want to delete faculty member ${name}?`)) return;

    try {
      const res = await API.del(`/api/hod/teachers/${id}`);
      Toast.success(res.message || 'Faculty member deleted.');
      const container = document.getElementById('view-container');
      container.innerHTML = await HodView.renderTeachers();
    } catch (err) {
      Toast.error(err.message || 'Failed to delete faculty member.');
    }
  },

  async renderStudents() {
    try {
      await fetchCloudDB(true);
      const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], users: [] };
      // Deduplicate students strictly by unique (division + roll_no)
      const stMap = new Map();
      (db.students || []).forEach(s => {
        if (!s || !s.name || s.name === 'Student' || !s.roll_no) return;
        const isB = (s.division_id == 2) || (s.division_name && s.division_name.includes('B'));
        const divKey = isB ? 'B' : 'A';
        const key = divKey + '_' + String(parseInt(s.roll_no) || s.roll_no);
        if (!stMap.has(key)) {
          stMap.set(key, { ...s, division_name: isB ? 'SE(ECE)-B' : 'SE(ECE)-A', division_id: isB ? 2 : 1 });
        }
      });

      const students = Array.from(stMap.values());

      const divAStudents = students.filter(s => s.division_id === 1 || s.division_name === 'SE(ECE)-A')
        .sort((a, b) => (parseInt(a.roll_no) || 0) - (parseInt(b.roll_no) || 0));
      const divBStudents = students.filter(s => s.division_id === 2 || s.division_name === 'SE(ECE)-B')
        .sort((a, b) => (parseInt(a.roll_no) || 0) - (parseInt(b.roll_no) || 0));

      const isStudentActivated = (s) => {
        if (!s) return false;
        if (s.is_activated === true) return true;
        if (s.email && !s.email.endsWith('@campus.edu') && !s.email.startsWith('student.')) return true;
        return false;
      };

      const divAActiveCount = divAStudents.filter(isStudentActivated).length;
      const divBActiveCount = divBStudents.filter(isStudentActivated).length;

      const renderStudentRow = (s) => {
        const safeName = (s.name || s.email || 'Student').replace(/'/g, "\\'");
        const safePrn = (s.prn_no || '').replace(/'/g, "\\'");
        const safeEmail = (s.email || '').replace(/'/g, "\\'");
        const isPending = s.status === 'PENDING_APPROVAL' || s.status === 'PENDING';
        const activated = isStudentActivated(s);

        const loginStatusBadge = activated ?
          `<span class="badge-status status-APPROVED" style="background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 800; font-size: 0.76rem; padding: 0.3rem 0.65rem; display: inline-flex; align-items: center; gap: 0.35rem; border-radius: var(--radius-full);">
            <i class="fa-solid fa-circle-check"></i> Activated & Logged In
           </span>` :
          `<span class="badge-status" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; font-weight: 700; font-size: 0.76rem; padding: 0.3rem 0.65rem; display: inline-flex; align-items: center; gap: 0.35rem; border-radius: var(--radius-full);">
            <i class="fa-solid fa-clock"></i> Not Logged In Yet (Dummy)
           </span>`;

        return `
          <tr style="${isPending ? 'background: #fffbeb;' : (activated ? 'background: #f0fdf4;' : '')}">
            <td><span style="font-family: monospace; font-weight: 800; font-size: 1rem; color: var(--primary);">${s.roll_no || 'N/A'}</span></td>
            <td><strong style="color: var(--text-main); font-size: 0.92rem;">${s.name || s.email || 'Student'}</strong></td>
            <td><span class="badge-role role-STUDENT" style="font-weight: 800;">${s.division_name || 'SE(ECE)'} (${s.batch_name || 'A1'})</span></td>
            <td><span style="font-family: monospace; font-weight: 800; color: ${activated ? '#15803d' : '#2563eb'}; font-size: 0.92rem;">${s.prn_no || 'N/A'}</span></td>
            <td>
              ${activated && s.email && !s.email.endsWith('@campus.edu') ? 
                `<span style="font-size: 0.85rem; color: var(--text-main); font-weight: 600;">${s.email}</span>` : 
                `<span style="font-size: 0.78rem; color: #94a3b8; font-style: italic;"><i class="fa-regular fa-clock"></i> Not set yet (Awaiting First Login)</span>`
              }
            </td>
            <td>${loginStatusBadge}</td>
            <td>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                <button class="btn btn-secondary btn-sm" onclick="HodView.directResetPassword('${s.id}', '${safeName}')" title="Reset Student Password">
                  <i class="fa-solid fa-key"></i> Reset
                </button>
                <button class="btn btn-danger btn-sm" onclick="HodView.deleteStudent('${s.id}', '${safeName}')" title="Delete Student Record">
                  <i class="fa-solid fa-trash-can"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      };

      const rowsDivA = divAStudents.map(renderStudentRow).join('') || 
        `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No students registered in Division A yet.</td></tr>`;

      const rowsDivB = divBStudents.map(renderStudentRow).join('') || 
        `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No students registered in Division B yet.</td></tr>`;

      const pendingStudents = students.filter(s => !s.status || s.status === 'PENDING_APPROVAL' || s.status === 'PENDING' || s.status.toUpperCase().includes('PENDING'));

      const pendingSectionHtml = pendingStudents.length > 0 ? `
        <!-- TOP HIGHLIGHTED PENDING STUDENT REGISTRATIONS PANEL -->
        <div class="glass-panel" style="border: 2px solid #f59e0b; background: #fffbeb; margin-bottom: 1.75rem;">
          <div class="panel-header" style="border-bottom: 1px solid #fcd34d; padding-bottom: 0.75rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <h3 style="color: #b45309; margin: 0;">
              <i class="fa-solid fa-user-clock" style="color: #d97706;"></i> 
              New Student Registration Signups Awaiting HOD Acceptance 
              <span class="badge-whatsapp-top" style="position: relative; top: 0; right: 0; margin-left: 0.5rem;">${pendingStudents.length}</span>
            </h3>
            <button class="btn btn-success" onclick="HodView.approveAllPendingRegistrations()" style="background: linear-gradient(135deg, #16a34a, #15803d); font-weight: 800; border-radius: var(--radius-full); padding: 0.5rem 1.25rem; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);">
              <i class="fa-solid fa-check-double"></i> Approve ALL ${pendingStudents.length} Pending Signups (1-Click)
            </button>
          </div>
          <div class="table-responsive">
            <table class="custom-table" style="background: #ffffff; border-radius: var(--radius-md);">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>PRN Number</th>
                  <th>Division & Batch</th>
                  <th>Email Address</th>
                  <th>Login Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${pendingStudents.map(s => {
                  const safeName = (s.name || s.email || 'Student').replace(/'/g, "\\'");
                  const safePrn = (s.prn_no || '').replace(/'/g, "\\'");
                  const safeEmail = (s.email || '').replace(/'/g, "\\'");
                  return `
                    <tr style="background: #fffbeb;">
                      <td><span style="font-family: monospace; font-weight: 800; color: var(--primary);">${s.roll_no || 'N/A'}</span></td>
                      <td><strong style="font-size: 0.95rem; color: var(--text-main);">${s.name || s.email || 'Student'}</strong></td>
                      <td><span style="font-family: monospace; font-weight: 700;">${s.prn_no || 'N/A'}</span></td>
                      <td><span class="badge-role role-STUDENT" style="background: #eff6ff; color: var(--primary); font-weight: 800;">${s.division_name || 'SE(ECE)'} (${s.batch_name || 'A1'})</span></td>
                      <td>${s.email || 'N/A'}</td>
                      <td><span class="badge-status status-PENDING" style="background: #fef3c7; color: #d97706; border: 1px solid #fde68a; font-weight: 800;">AWAITING HOD APPROVAL</span></td>
                      <td>
                        <div style="display: flex; gap: 0.4rem;">
                          <button class="btn btn-success btn-sm" onclick="HodView.approveStudentRegistration('${s.id}', '${safeName}', '${safePrn}', '${safeEmail}')" style="background: #16a34a; border-color: #16a34a; font-weight: 800; padding: 0.45rem 0.85rem;">
                            <i class="fa-solid fa-user-check"></i> Approve Registration
                          </button>
                          <button class="btn btn-danger btn-sm" onclick="HodView.deleteStudent('${s.id}', '${safeName}')">
                            <i class="fa-solid fa-trash-can"></i> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : '';

      return `
        <div class="dashboard-container">
          ${pendingSectionHtml}

          <!-- Live Student Activation Stats Summary -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
            <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: var(--radius-md); padding: 0.85rem 1.25rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.78rem; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">Division SE(ECE)-A Activation</div>
                <div style="font-size: 1.35rem; font-weight: 900; color: #1e3a8a; margin-top: 0.2rem;">${divAActiveCount} / ${divAStudents.length} <span style="font-size: 0.85rem; font-weight: 600; color: #3b82f6;">Logged In</span></div>
              </div>
              <span class="badge-role role-STUDENT" style="font-size: 0.95rem; font-weight: 800; padding: 0.45rem 0.85rem; background: #dbeafe; color: #1e40af;">${Math.round((divAActiveCount / (divAStudents.length || 1)) * 100)}% Active</span>
            </div>

            <div style="background: #fefce8; border: 1.5px solid #fef08a; border-radius: var(--radius-md); padding: 0.85rem 1.25rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 0.78rem; font-weight: 700; color: #854d0e; text-transform: uppercase; letter-spacing: 0.5px;">Division SE(ECE)-B Activation</div>
                <div style="font-size: 1.35rem; font-weight: 900; color: #713f12; margin-top: 0.2rem;">${divBActiveCount} / ${divBStudents.length} <span style="font-size: 0.85rem; font-weight: 600; color: #eab308;">Logged In</span></div>
              </div>
              <span class="badge-role role-STUDENT" style="font-size: 0.95rem; font-weight: 800; padding: 0.45rem 0.85rem; background: #fef08a; color: #854d0e;">${Math.round((divBActiveCount / (divBStudents.length || 1)) * 100)}% Active</span>
            </div>
          </div>

          <!-- Top Division Pill Navigation & Search -->
          <div style="background: #ffffff; padding: 0.85rem 1rem; border-radius: var(--radius-lg); border: 1.5px solid var(--border-color); box-shadow: var(--shadow-sm); margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <!-- Row 1: Division Selector & Search Bar -->
            <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                <button type="button" class="btn ${this.currentStudentDivFilter === 'SE(ECE)-A' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-roster-div-a" onclick="HodView.switchStudentRosterDiv('SE(ECE)-A')" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.4rem 0.9rem;">
                  <i class="fa-solid fa-users-rectangle"></i> Div A Roster (${divAStudents.length})
                </button>

                <button type="button" class="btn ${this.currentStudentDivFilter === 'SE(ECE)-B' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-roster-div-b" onclick="HodView.switchStudentRosterDiv('SE(ECE)-B')" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.4rem 0.9rem;">
                  <i class="fa-solid fa-users-rectangle"></i> Div B Roster (${divBStudents.length})
                </button>

                <button type="button" class="btn ${this.currentStudentDivFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-roster-div-all" onclick="HodView.switchStudentRosterDiv('ALL')" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.4rem 0.9rem;">
                  <i class="fa-solid fa-layer-group"></i> Both Divisions (${students.length})
                </button>
              </div>

              <div style="flex: 1; min-width: 220px; max-width: 380px;">
                <input type="text" id="hod-student-search-input" class="form-control form-control-sm" placeholder="🔍 Search name, roll no, PRN..." onkeyup="HodView.filterStudentRosterTable()" style="border-radius: var(--radius-full); padding: 0.45rem 1rem; width: 100%;">
              </div>
            </div>

            <!-- Row 2: Action Buttons Bar -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.6rem;">
              <button class="btn btn-warning btn-sm" onclick="HodView.openRecoveryModal()" style="font-weight: 800; background: #d97706; border-color: #d97706; color: #ffffff; border-radius: var(--radius-full); padding: 0.4rem 0.9rem;" title="Search student by Name and re-upload/restore certificate data">
                <i class="fa-solid fa-file-shield"></i> Recover Data
              </button>
              <button class="btn btn-success btn-sm" onclick="HodView.forceCloudSync()" style="font-weight: 800; background: #16a34a; border-color: #16a34a; border-radius: var(--radius-full); padding: 0.4rem 0.9rem;" title="Fetch latest live student activations across all devices">
                <i class="fa-solid fa-arrows-rotate"></i> Live Sync
              </button>
              <button class="btn btn-danger btn-sm" onclick="HodView.resetAllStudentData()" style="font-weight: 800; border-radius: var(--radius-full); padding: 0.4rem 0.9rem;" title="Wipe ALL student records from the system">
                <i class="fa-solid fa-trash-can"></i> Reset All Data
              </button>
              <button class="btn btn-primary btn-sm" onclick="HodView.openAddStudentModal()" style="font-weight: 800; margin-left: auto; border-radius: var(--radius-full); padding: 0.4rem 1rem;">
                <i class="fa-solid fa-user-plus"></i> Register Student
              </button>
            </div>
          </div>

          <!-- SECTION 1: DIVISION SE(ECE)-A PANEL -->
          <div class="glass-panel" id="section-div-a" style="${(this.currentStudentDivFilter === 'SE(ECE)-B') ? 'display: none;' : ''}">
            <div class="panel-header" style="border-bottom: 2px solid var(--primary); padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
              <h3><i class="fa-solid fa-users-rectangle" style="color: var(--primary);"></i> Division SE(ECE)-A Official Student Roster</h3>
              <button class="btn btn-secondary btn-sm" onclick="HodView.openAddStudentModal('1')">
                <i class="fa-solid fa-plus"></i> Add Div A Student
              </button>
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
              Official enrolled students in <strong>Division SE(ECE)-A</strong> (${divAStudents.length} total):
            </p>

            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Full Name</th>
                    <th>Division & Batch</th>
                    <th>PRN Number</th>
                    <th>Email Address</th>
                    <th>Login Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsDivA}
                </tbody>
              </table>
            </div>
          </div>

          <!-- SECTION 2: DIVISION SE(ECE)-B PANEL -->
          <div class="glass-panel" id="section-div-b" style="${(this.currentStudentDivFilter === 'SE(ECE)-A') ? 'display: none;' : ''}">
            <div class="panel-header" style="border-bottom: 2px solid var(--accent-gold); padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
              <h3><i class="fa-solid fa-users-rectangle" style="color: var(--accent-gold);"></i> Division SE(ECE)-B Official Student Roster</h3>
              <button class="btn btn-secondary btn-sm" onclick="HodView.openAddStudentModal('2')">
                <i class="fa-solid fa-plus"></i> Add Div B Student
              </button>
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
              Official enrolled students in <strong>Division SE(ECE)-B</strong> (${divBStudents.length} total):
            </p>

            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Full Name</th>
                    <th>Division & Batch</th>
                    <th>PRN Number</th>
                    <th>Email Address</th>
                    <th>Login Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsDivB}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Add Student Modal -->
        <div class="modal-overlay" id="modal-add-student">
          <div class="modal-content" style="max-width: 580px;">
            <div class="modal-header">
              <h3><i class="fa-solid fa-user-plus" style="color: var(--primary);"></i> Register New Student</h3>
              <button class="modal-close" onclick="closeModal('modal-add-student')">&times;</button>
            </div>
            <form id="form-add-student" onsubmit="HodView.handleAddStudent(event)">
              <div class="form-group">
                <label>Student Full Name <span style="color: var(--accent-rose);">*</span></label>
                <input type="text" id="add-student-name" class="form-control" placeholder="e.g. Aniket Patil" required>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label>Roll Number <span style="color: var(--accent-rose);">*</span></label>
                  <input type="text" id="add-student-roll" class="form-control" placeholder="e.g. 35" required>
                </div>

                <div class="form-group">
                  <label>PRN Number <span style="color: var(--accent-rose);">*</span></label>
                  <input type="text" id="add-student-prn" class="form-control" placeholder="e.g. 20240135" required>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label>Division <span style="color: var(--accent-rose);">*</span></label>
                  <select id="add-student-div" class="form-control" required onchange="HodView.updateBatchDropdown(this.value)">
                    <option value="1">SE(ECE)-A</option>
                    <option value="2">SE(ECE)-B</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Lab Batch <span style="color: var(--accent-rose);">*</span></label>
                  <select id="add-student-batch" class="form-control" required>
                    <option value="1">Batch A1</option>
                    <option value="2">Batch A2</option>
                    <option value="3">Batch A3</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Student Email Address <span style="color: var(--accent-rose);">*</span></label>
                <input type="email" id="add-student-email" class="form-control" placeholder="e.g. aniket@campus.edu" required>
              </div>

              <div class="form-group">
                <label>Password <span style="color: var(--accent-rose);">*</span></label>
                <div class="password-toggle-group">
                  <input type="password" id="add-student-password" class="form-control" placeholder="Enter Password" required>
                  <button type="button" class="password-toggle-btn" onclick="togglePasswordVisibility('add-student-password', this)" title="Show/Hide Password">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="closeModal('modal-add-student')">Cancel</button>
                <button type="submit" id="btn-submit-student" class="btn btn-primary">Enroll Student</button>
              </div>
            </form>
          </div>
        </div>
      `;
    } catch (err) {
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load students.</p></div>`;
    }
  },

  switchStudentRosterDiv(divName) {
    this.currentStudentDivFilter = divName;

    const btnA = document.getElementById('btn-roster-div-a');
    const btnB = document.getElementById('btn-roster-div-b');
    const btnAll = document.getElementById('btn-roster-div-all');

    if (btnA) btnA.className = `btn ${divName === 'SE(ECE)-A' ? 'btn-primary' : 'btn-secondary'} btn-sm`;
    if (btnB) btnB.className = `btn ${divName === 'SE(ECE)-B' ? 'btn-primary' : 'btn-secondary'} btn-sm`;
    if (btnAll) btnAll.className = `btn ${divName === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`;

    const secA = document.getElementById('section-div-a');
    const secB = document.getElementById('section-div-b');

    if (secA) secA.style.display = (divName === 'ALL' || divName === 'SE(ECE)-A') ? '' : 'none';
    if (secB) secB.style.display = (divName === 'ALL' || divName === 'SE(ECE)-B') ? '' : 'none';
  },

  openAddStudentModal(defaultDivId = "1") {
    const divSelect = document.getElementById('add-student-div');
    if (divSelect) {
      divSelect.value = defaultDivId;
    }
    this.updateBatchDropdown(defaultDivId);
    openModal('modal-add-student');
  },

  updateBatchDropdown(divId) {
    const batchSelect = document.getElementById('add-student-batch');
    if (!batchSelect) return;

    if (divId == "1") { // Div A
      batchSelect.innerHTML = `
        <option value="1">Batch A1</option>
        <option value="2">Batch A2</option>
        <option value="3">Batch A3</option>
      `;
    } else { // Div B
      batchSelect.innerHTML = `
        <option value="4">Batch B1</option>
        <option value="5">Batch B2</option>
        <option value="6">Batch B3</option>
      `;
    }
  },

  async handleAddStudent(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-student');
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Enrolling...';
    btnSubmit.disabled = true;

    const payload = {
      name: document.getElementById('add-student-name').value,
      roll_no: document.getElementById('add-student-roll').value,
      prn_no: document.getElementById('add-student-prn').value,
      division_id: document.getElementById('add-student-div').value,
      batch_id: document.getElementById('add-student-batch').value,
      email: document.getElementById('add-student-email').value,
      password: document.getElementById('add-student-password').value
    };

    try {
      const res = await API.post('/api/hod/students', payload);
      Toast.success(res.message || 'Student enrolled.');
      closeModal('modal-add-student');
      const container = document.getElementById('view-container');
      container.innerHTML = await HodView.renderStudents();
    } catch (err) {
      Toast.error(err.message || 'Failed to enroll student.');
      btnSubmit.innerHTML = 'Enroll Student';
      btnSubmit.disabled = false;
    }
  },

  async approveStudentRegistration(studentId, name, prn_no, email) {
    try {
      const res = await API.post(`/api/hod/students/${studentId}/approve`, { prn_no, email });
      Toast.success(res.message || `Approved student registration for ${name}!`);
      
      const db = typeof getLocalDB === 'function' ? getLocalDB() : null;
      if (db) {
        if (db.students) {
          db.students.forEach(s => {
            if (s.id == studentId || (email && s.email && s.email.trim().toLowerCase() === email.trim().toLowerCase())) {
              s.status = 'APPROVED';
              s.approved_by = (window.App && App.currentUser) ? App.currentUser.id : 1;
              s.approved_at = new Date().toISOString();
            }
          });
        }
        if (db.users) {
          db.users.forEach(u => {
            if (u.id == studentId || (email && u.email && u.email.trim().toLowerCase() === email.trim().toLowerCase())) {
              u.status = 'APPROVED';
            }
          });
        }
        if (typeof saveLocalDB === 'function') saveLocalDB(db);
      }

      if (window.App && App.updateBadges) await App.updateBadges();
      const container = document.getElementById('view-container');
      if (container) {
        container.innerHTML = await HodView.renderStudents();
      }
    } catch (err) {
      Toast.error(err.message || 'Failed to approve student registration.');
    }
  },

  async approveAllPendingRegistrations() {
    await fetchCloudDB(true);
    const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], users: [] };

    const pendingMap = new Map();
    (db.students || []).forEach(s => {
      if (!s.status || s.status === 'PENDING_APPROVAL' || s.status === 'PENDING') {
        const k = (s.email || '').trim().toLowerCase() || String(s.id);
        if (k) pendingMap.set(k, { id: s.id, email: s.email, prn_no: s.prn_no, name: s.name });
      }
    });

    (db.users || []).forEach(u => {
      if (u.role === 'STUDENT' && (!u.status || u.status === 'PENDING_APPROVAL' || u.status === 'PENDING')) {
        const k = (u.email || '').trim().toLowerCase() || String(u.id);
        if (k) pendingMap.set(k, { id: 'u_' + u.id, email: u.email, prn_no: u.prn_no, name: u.name });
      }
    });

    const pendingList = Array.from(pendingMap.values());
    if (pendingList.length === 0) {
      Toast.info('No pending student signups to approve right now.');
      return;
    }

    try {
      for (const s of pendingList) {
        await API.post(`/api/hod/students/${s.id}/approve`, { email: s.email, prn_no: s.prn_no }).catch(() => {});
      }

      (db.students || []).forEach(s => s.status = 'APPROVED');
      (db.users || []).forEach(u => { if (u.role === 'STUDENT') u.status = 'APPROVED'; });
      if (typeof saveLocalDB === 'function') saveLocalDB(db);

      Toast.success(`🎉 Successfully approved all ${pendingList.length} student registrations!`);
      if (window.App && App.updateBadges) await App.updateBadges();
      const container = document.getElementById('view-container');
      if (container) {
        if (window.location.hash.includes('students')) {
          container.innerHTML = await HodView.renderStudents();
        } else {
          container.innerHTML = await TeacherView.renderDashboard();
        }
      }
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to approve all student registrations.');
    }
  },

  async deleteStudent(id, name) {
    try {
      if (!confirm(`Are you sure you want to delete student ${name}? This will permanently remove ALL their data, certificates, and login account.`)) return;
    } catch (e) { return; }

    try {
      Toast.info('Deleting student and all associated records...');
      const res = await API.del(`/api/hod/students/${id}`);
      Toast.success(res.message || 'Student deleted.');
      // Sync deletion to cloud immediately
      if (typeof pushToCloud === 'function') { try { await pushToCloud(); } catch(e) {} }
      const container = document.getElementById('view-container');
      container.innerHTML = await HodView.renderStudents();
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to delete student.');
    }
  },

  async resetAllStudentData() {
    const first = confirm('⚠️ WARNING: This will permanently delete ALL students, certificates, and activity records.\n\nHOD and Teacher accounts will be preserved.\n\nAre you absolutely sure?');
    if (!first) return;
    const second = prompt('Type RESET to confirm complete data wipe:', '');
    if ((second || '').trim().toUpperCase() !== 'RESET') {
      Toast.error('Reset cancelled. You must type RESET to confirm.');
      return;
    }
    try {
      Toast.info('Wiping all student data...');
      const res = await API.post('/api/hod/reset-all-students', { confirmed: true });
      Toast.success(res.message || 'All student data has been wiped!');
      const container = document.getElementById('view-container');
      container.innerHTML = await HodView.renderStudents();
    } catch (err) {
      Toast.error((err && err.message) || 'Reset failed.');
    }
  },

  async directResetPassword(studentId, name) {
    const newPassword = prompt(`Enter new password for student ${name}:`, 'Student@123');
    if (!newPassword) return;

    try {
      const res = await API.post(`/api/hod/students/${studentId}/reset-password`, { new_password: newPassword });
      Toast.success(res.message);
    } catch (err) {
      Toast.error(err.message || 'Failed to reset student password.');
    }
  },

  async forceCloudSync() {
    Toast.info('Synchronizing live student accounts with cloud...');
    const localDb = typeof getLocalDB === 'function' ? getLocalDB() : null;
    if (typeof pushLocalActivationsToCloud === 'function') {
      await pushLocalActivationsToCloud(localDb);
    }
    await fetchCloudDB(true);
    const container = document.getElementById('view-container');
    if (container) {
      container.innerHTML = await HodView.renderStudents();
    }
    Toast.success('Cloud synchronization complete! All active student accounts updated.');
  },

  openAccountSettingsModal() {
    const emailInput = document.getElementById('hod-email-input');
    if (emailInput && window.App && App.currentUser) {
      emailInput.value = App.currentUser.email || '';
    }
    openModal('modal-hod-change-password');
  },

  async handleChangePassword(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-hod-change-pass');
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating Settings...';
    btnSubmit.disabled = true;

    const new_email = document.getElementById('hod-email-input').value;
    const current_password = document.getElementById('hod-current-password').value;
    const new_password = document.getElementById('hod-new-password').value;
    const confirm_password = document.getElementById('hod-confirm-password').value;
    const new_pin = document.getElementById('hod-new-pin') ? document.getElementById('hod-new-pin').value : '1234';

    if (new_password !== confirm_password) {
      Toast.error('New password and confirm password do not match.');
      btnSubmit.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Save Account Settings';
      btnSubmit.disabled = false;
      return;
    }

    try {
      const res = await API.post('/api/hod/change-password', { new_email, current_password, new_password, new_pin });
      Toast.success(res.message || 'Account email, password & Security PIN updated!');
      if (res.user && window.App) {
        App.currentUser.email = res.user.email;
      }
      closeModal('modal-hod-change-password');
      document.getElementById('form-hod-change-password').reset();
    } catch (err) {
      Toast.error(err.message || 'Failed to update account settings.');
    } finally {
      btnSubmit.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Save Account Settings';
      btnSubmit.disabled = false;
    }
  },


  // ==========================================
  // HOD / ADMIN STUDENT DATA RECOVERY WORKFLOW
  // ==========================================

  openRecoveryModal() {
    // Reset modal state
    const searchInput = document.getElementById('recovery-search-name-input');
    if (searchInput) searchInput.value = '';
    
    const resultsContainer = document.getElementById('recovery-search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
      resultsContainer.style.display = 'none';
    }

    const uploadPanel = document.getElementById('recovery-upload-panel');
    if (uploadPanel) uploadPanel.style.display = 'none';

    const searchStep = document.getElementById('recovery-step-search');
    if (searchStep) searchStep.style.display = 'block';

    const form = document.getElementById('form-hod-recovery-upload');
    if (form) form.reset();

    const todayStr = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('recovery-cert-date');
    if (dateInput) dateInput.value = todayStr;

    if (typeof openModal === 'function') {
      openModal('modal-hod-recovery');
    }
  },

  async searchStudentForRecovery() {
    const input = document.getElementById('recovery-search-name-input');
    const query = (input ? input.value : '').trim();
    if (!query) {
      Toast.error('Please enter a student name to search.');
      return;
    }

    const resultsContainer = document.getElementById('recovery-search-results');
    if (!resultsContainer) return;

    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
        <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; color: var(--primary);"></i>
        <div style="margin-top: 0.5rem; font-weight: 600;">Searching student records...</div>
      </div>
    `;

    try {
      const res = await API.post('/api/hod/recovery/search-students', { name_query: query });
      const students = res.students || [];

      if (students.length === 0) {
        resultsContainer.innerHTML = `
          <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: var(--radius-md); padding: 1.25rem; text-align: center;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.5rem; color: #e11d48; margin-bottom: 0.5rem;"></i>
            <h4 style="color: #9f1239; margin: 0 0 0.25rem 0;">No Matching Students Found</h4>
            <p style="font-size: 0.85rem; color: #be123c; margin: 0;">
              No student found matching "<strong>${query}</strong>". Please verify the spelling or try searching with first/last name.
            </p>
          </div>
        `;
        return;
      }

      // Check if multiple students have matching name
      const isMultiple = students.length > 1;

      let html = `
        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-sm);">
          <div style="background: ${isMultiple ? '#fef3c7' : '#f0fdf4'}; border-bottom: 1px solid #e2e8f0; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: ${isMultiple ? '#92400e' : '#166534'}; font-size: 0.9rem;">
              <i class="fa-solid ${isMultiple ? 'fa-users' : 'fa-user-check'}"></i> 
              ${isMultiple ? `Multiple Students Found (${students.length} matches) — Please Select:` : 'Matching Student Found:'}
            </strong>
            <span style="font-size: 0.78rem; color: var(--text-muted);">
              ${isMultiple ? 'Disambiguation required' : 'Ready for recovery'}
            </span>
          </div>

          <div class="table-responsive" style="max-height: 250px; overflow-y: auto;">
            <table class="custom-table" style="margin: 0; font-size: 0.88rem;">
              <thead>
                <tr>
                  <th>Student Full Name</th>
                  <th>Division & Batch</th>
                  <th>Roll No</th>
                  <th>Current Submissions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
      `;

      students.forEach(s => {
        const safeName = (s.name || '').replace(/'/g, "\'");
        html += `
          <tr>
            <td>
              <strong style="color: var(--text-main);">${s.name}</strong>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${s.email || ''}</div>
            </td>
            <td>
              <span class="badge-role role-STUDENT" style="font-weight: 700;">
                ${s.division_name || 'SE(ECE)'} (${s.batch_name || 'A1'})
              </span>
            </td>
            <td><strong style="color: var(--primary); font-family: monospace;">${s.roll_no || 'N/A'}</strong></td>
            <td>
              ${s.has_submissions 
                ? `<span class="badge-status status-APPROVED" style="font-size: 0.75rem;"><i class="fa-solid fa-file-circle-check"></i> ${s.submissions_count} Record(s)</span>`
                : `<span class="badge-status status-PENDING" style="font-size: 0.75rem; background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;"><i class="fa-solid fa-file-circle-question"></i> No Submissions</span>`
              }
            </td>
            <td>
              <button type="button" class="btn btn-primary btn-sm" onclick="HodView.selectStudentForRecovery(${s.id})" style="font-weight: 800; padding: 0.35rem 0.85rem;">
                <i class="fa-solid fa-check"></i> Select Student
              </button>
            </td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;

      resultsContainer.innerHTML = html;
    } catch(err) {
      resultsContainer.innerHTML = `
        <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: var(--radius-md); padding: 1rem; color: #9f1239;">
          Failed to search students: ${(err && err.message) || 'Unknown server error'}
        </div>
      `;
    }
  },

  async selectStudentForRecovery(studentId) {
    try {
      Toast.info('Fetching student backend records...');
      const res = await API.post('/api/hod/recovery/student-details', { student_id: studentId });
      const student = res.student;
      const certs = res.certificates || [];

      // Hide Search Step & Show Upload Panel
      const searchStep = document.getElementById('recovery-step-search');
      if (searchStep) searchStep.style.display = 'none';

      const resultsContainer = document.getElementById('recovery-search-results');
      if (resultsContainer) resultsContainer.style.display = 'none';

      const uploadPanel = document.getElementById('recovery-upload-panel');
      if (uploadPanel) uploadPanel.style.display = 'block';

      // Set target student id in form
      document.getElementById('recovery-target-student-id').value = student.id;
      document.getElementById('recovery-replace-cert-id').value = certs.length > 0 ? certs[0].id : '';

      // Populate Banner
      const banner = document.getElementById('recovery-selected-student-banner');
      if (banner) {
        banner.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">SELECTED RECOVERY CANDIDATE</span>
              <h4 style="font-size: 1.15rem; font-weight: 800; color: #1e3a8a; margin: 0.15rem 0 0 0;">${student.name}</h4>
              <div style="font-size: 0.82rem; color: #3b82f6; margin-top: 0.2rem;">
                Roll No: <strong>${student.roll_no || 'N/A'}</strong> | Division: <strong>${student.division_name || 'SE(ECE)-A'} (${student.batch_name || 'A1'})</strong> | Email: <strong>${student.email || 'N/A'}</strong>
              </div>
            </div>
            <span class="badge-role role-STUDENT" style="font-size: 0.85rem; font-weight: 800; padding: 0.4rem 0.85rem; background: #dbeafe; color: #1e40af;">
              ${certs.length} Submission(s) in Backend
            </span>
          </div>
        `;
      }

      // Populate Existing Submission Alert
      const alertBox = document.getElementById('recovery-existing-submission-alert');
      if (alertBox) {
        if (certs.length > 0) {
          const existingCert = certs[0];
          alertBox.style.display = 'block';
          alertBox.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
              <i class="fa-solid fa-circle-info" style="color: #d97706; font-size: 1.25rem; margin-top: 0.2rem;"></i>
              <div style="flex: 1;">
                <strong style="color: #92400e; font-size: 0.9rem;">Existing Submission Detected for this Student</strong>
                <p style="font-size: 0.82rem; color: #b45309; margin: 0.25rem 0 0.5rem 0; line-height: 1.4;">
                  Found submission: "<strong>${existingCert.title || 'Certificate'}</strong>" for event <em>${existingCert.event_name || 'Event'}</em> (Status: <strong>${existingCert.status}</strong>).
                </p>
                <div style="font-size: 0.78rem; color: #78350f;">
                  Uploading below will restore and update this certificate document while preserving data integrity.
                </div>
              </div>
            </div>
          `;

          // Pre-populate fields
          const titleInput = document.getElementById('recovery-cert-title');
          if (titleInput) titleInput.value = existingCert.title || '';

          const eventInput = document.getElementById('recovery-cert-event');
          if (eventInput) eventInput.value = existingCert.event_name || '';

          const catInput = document.getElementById('recovery-cert-category');
          if (catInput && existingCert.category) catInput.value = existingCert.category;

          const dateInput = document.getElementById('recovery-cert-date');
          if (dateInput && existingCert.certificate_date) dateInput.value = existingCert.certificate_date;

          const descInput = document.getElementById('recovery-cert-desc');
          if (descInput) descInput.value = existingCert.description || '';
        } else {
          alertBox.style.display = 'block';
          alertBox.style.background = '#f0fdf4';
          alertBox.style.borderColor = '#86efac';
          alertBox.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.6rem; color: #166534; font-size: 0.85rem;">
              <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i>
              <span><strong>Clean State:</strong> No previous submission found for this student. A fresh valid submission record will be created.</span>
            </div>
          `;
        }
      }
    } catch(err) {
      Toast.error((err && err.message) || 'Failed to load student details.');
    }
  },

  cancelRecoverySelection() {
    const searchStep = document.getElementById('recovery-step-search');
    if (searchStep) searchStep.style.display = 'block';

    const resultsContainer = document.getElementById('recovery-search-results');
    if (resultsContainer) resultsContainer.style.display = 'block';

    const uploadPanel = document.getElementById('recovery-upload-panel');
    if (uploadPanel) uploadPanel.style.display = 'none';

    const form = document.getElementById('form-hod-recovery-upload');
    if (form) form.reset();
  },

  onRecoveryFileSelected(input) {
    const statusMsg = document.getElementById('recovery-file-status');
    if (!statusMsg) return;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      statusMsg.style.color = '#15803d';
      statusMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Selected: <strong>${file.name}</strong> (${sizeMb} MB) — Ready for recovery.`;
    }
  },

  async handleRecoveryUpload(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-recovery-upload');
    const studentId = document.getElementById('recovery-target-student-id').value;
    const replaceCertId = document.getElementById('recovery-replace-cert-id').value;

    const title = (document.getElementById('recovery-cert-title')?.value || '').trim();
    const event_name = (document.getElementById('recovery-cert-event')?.value || '').trim();
    const category = (document.getElementById('recovery-cert-category')?.value || 'Hackathon').trim();
    const certificate_date = document.getElementById('recovery-cert-date')?.value || new Date().toISOString().split('T')[0];
    const description = (document.getElementById('recovery-cert-desc')?.value || '').trim();
    const auto_approve = document.getElementById('recovery-auto-approve-checkbox')?.checked ?? true;

    const fileInput = document.getElementById('recovery-cert-file');
    const selectedFile = (fileInput && fileInput.files && fileInput.files.length > 0) ? fileInput.files[0] : null;

    if (!selectedFile && !replaceCertId) {
      Toast.error('Please select a certificate document file (PDF, PNG, or JPG) to upload.');
      return;
    }

    if (replaceCertId) {
      const proceed = confirm(`A certificate already exists for this student.\n\nDo you want to confirm replacing/updating the submission data?`);
      if (!proceed) return;
    }

    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Restoring Document...';
    btnSubmit.disabled = true;

    const sendPayload = (fileUrl) => {
      const payload = {
        student_id: parseInt(studentId),
        title,
        event_name,
        category,
        certificate_date,
        description,
        file_url: fileUrl || '',
        file_name: selectedFile ? selectedFile.name : 'restored_certificate.jpg',
        replace_existing_cert_id: replaceCertId ? parseInt(replaceCertId) : null,
        auto_approve: auto_approve
      };

      API.post('/api/hod/recovery/restore-certificate', payload).then(async (res) => {
        Toast.success(res.message || '🎉 Student certificate recovered and restored successfully!');
        closeModal('modal-hod-recovery');

        // Instant Roster and Approvals View Refresh
        if (window.App && App.updateBadges) await App.updateBadges();
        const container = document.getElementById('view-container');
        if (container) {
          if (window.location.hash.includes('students')) {
            container.innerHTML = await HodView.renderStudents();
          } else if (window.location.hash.includes('approvals')) {
            if (typeof TeacherView !== 'undefined') container.innerHTML = await TeacherView.renderApprovals();
          }
        }
      }).catch(err => {
        Toast.error((err && err.message) || 'Failed to restore student certificate.');
      }).finally(() => {
        btnSubmit.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Restore & Upload Certificate';
        btnSubmit.disabled = false;
      });
    };

    if (selectedFile && typeof StudentView !== 'undefined' && StudentView.compressImageFile) {
      StudentView.compressImageFile(selectedFile, sendPayload);
    } else {
      sendPayload('');
    }
  },

  filterStudentRosterTable() {
    const q = (document.getElementById('hod-student-search-input')?.value || '').toLowerCase().trim();
    document.querySelectorAll('.custom-table tbody tr').forEach(tr => {
      const text = tr.innerText.toLowerCase();
      tr.style.display = text.includes(q) ? '' : 'none';
    });
  }
};
