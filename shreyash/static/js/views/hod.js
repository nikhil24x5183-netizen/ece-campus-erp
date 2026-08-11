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
                <input type="password" id="add-teacher-password" class="form-control" placeholder="••••••••" required>
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
      const res = await API.delete(`/api/hod/teachers/${id}`);
      Toast.success(res.message || 'Faculty member deleted.');
      const container = document.getElementById('view-container');
      container.innerHTML = await HodView.renderTeachers();
    } catch (err) {
      Toast.error(err.message || 'Failed to delete faculty member.');
    }
  },

  async renderStudents() {
    try {
      const data = await API.get('/api/hod/students');
      const students = data.students || [];

      const divAStudents = students.filter(s => s.division_name === 'SE(ECE)-A');
      const divBStudents = students.filter(s => s.division_name === 'SE(ECE)-B');

      const renderStudentRow = (s) => `
        <tr>
          <td><strong style="color: var(--text-main); font-size: 0.95rem;">${s.name}</strong></td>
          <td><span style="font-family: monospace; font-weight: 700;">${s.roll_no}</span></td>
          <td><span style="font-family: monospace; font-weight: 700; color: var(--primary);">${s.prn_no}</span></td>
          <td><span class="badge-role role-STUDENT">${s.division_name} (${s.batch_name})</span></td>
          <td>${s.email}</td>
          <td><span class="badge-status status-APPROVED">ENROLLED</span></td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="HodView.directResetPassword(${s.id}, '${s.name.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-key"></i> Reset Pass
              </button>
              <button class="btn btn-danger btn-sm" onclick="HodView.deleteStudent(${s.id}, '${s.name.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-trash-can"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      `;

      const rowsDivA = divAStudents.map(renderStudentRow).join('') || 
        `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No students registered in Division A yet.</td></tr>`;

      const rowsDivB = divBStudents.map(renderStudentRow).join('') || 
        `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No students registered in Division B yet.</td></tr>`;

      return `
        <div class="dashboard-container">
          <!-- Top Division Pill Navigation -->
          <div style="display: flex; gap: 0.75rem; background: #f8fafc; padding: 0.6rem; border-radius: var(--radius-full); border: 1px solid var(--border-color); flex-wrap: wrap;">
            <button type="button" class="btn ${this.currentStudentDivFilter === 'SE(ECE)-A' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-roster-div-a" onclick="HodView.switchStudentRosterDiv('SE(ECE)-A')" style="border-radius: var(--radius-full); font-weight: 800;">
              <i class="fa-solid fa-users-rectangle"></i> SE(ECE) Division A Roster (${divAStudents.length})
            </button>

            <button type="button" class="btn ${this.currentStudentDivFilter === 'SE(ECE)-B' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-roster-div-b" onclick="HodView.switchStudentRosterDiv('SE(ECE)-B')" style="border-radius: var(--radius-full); font-weight: 800;">
              <i class="fa-solid fa-users-rectangle"></i> SE(ECE) Division B Roster (${divBStudents.length})
            </button>

            <button type="button" class="btn ${this.currentStudentDivFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm" id="btn-roster-div-all" onclick="HodView.switchStudentRosterDiv('ALL')" style="border-radius: var(--radius-full); font-weight: 800;">
              <i class="fa-solid fa-layer-group"></i> View Both Divisions
            </button>

            <button class="btn btn-primary btn-sm" style="margin-left: auto;" onclick="HodView.openAddStudentModal()">
              <i class="fa-solid fa-plus"></i> Register New Student
            </button>
          </div>

          <!-- SECTION 1: DIVISION SE(ECE)-A PANEL -->
          <div class="glass-panel" id="section-div-a" style="${(this.currentStudentDivFilter === 'SE(ECE)-B') ? 'display: none;' : ''}">
            <div class="panel-header" style="border-bottom: 2px solid var(--primary); padding-bottom: 0.75rem; margin-bottom: 1.25rem;">
              <h3><i class="fa-solid fa-users-rectangle" style="color: var(--primary);"></i> Division SE(ECE)-A Student Registration Roster</h3>
              <button class="btn btn-secondary btn-sm" onclick="HodView.openAddStudentModal('1')">
                <i class="fa-solid fa-plus"></i> Add Div A Student
              </button>
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
              Enrolled students in <strong>Division SE(ECE)-A</strong> (Batches A1, A2, A3):
            </p>

            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>PRN Number</th>
                    <th>Division & Batch</th>
                    <th>Email Address</th>
                    <th>Status</th>
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
              <h3><i class="fa-solid fa-users-rectangle" style="color: var(--accent-gold);"></i> Division SE(ECE)-B Student Registration Roster</h3>
              <button class="btn btn-secondary btn-sm" onclick="HodView.openAddStudentModal('2')">
                <i class="fa-solid fa-plus"></i> Add Div B Student
              </button>
            </div>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
              Enrolled students in <strong>Division SE(ECE)-B</strong> (Batches B1, B2, B3):
            </p>

            <div class="table-responsive">
              <table class="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>PRN Number</th>
                    <th>Division & Batch</th>
                    <th>Email Address</th>
                    <th>Status</th>
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
                <input type="password" id="add-student-password" class="form-control" placeholder="••••••••" required>
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

  async deleteStudent(id, name) {
    if (!confirm(`Are you sure you want to delete student ${name}?`)) return;

    try {
      const res = await API.delete(`/api/hod/students/${id}`);
      Toast.success(res.message || 'Student deleted.');
      const container = document.getElementById('view-container');
      container.innerHTML = await HodView.renderStudents();
    } catch (err) {
      Toast.error(err.message || 'Failed to delete student.');
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
  }
};
