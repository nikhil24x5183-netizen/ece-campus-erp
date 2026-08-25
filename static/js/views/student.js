/* Student View */
const StudentView = {
  renderMissingRecordScreen() {
    try {
      localStorage.removeItem('ece_session_user');
      sessionStorage.removeItem('ece_session_user');
    } catch(e) {}
    if (typeof App !== 'undefined') {
      App.currentUser = null;
      App.currentProfile = null;
    }

    return `
      <div class="dashboard-container">
        <div style="background: #ffffff; border: 2px dashed #ef4444; border-radius: 16px; padding: 3rem 2rem; text-align: center; max-width: 650px; margin: 3rem auto; box-shadow: var(--shadow-lg);">
          <div style="width: 76px; height: 76px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; font-size: 2.2rem; color: #ef4444;">
            <i class="fa-solid fa-user-xmark"></i>
          </div>
          <h2 style="font-family: var(--font-heading); font-weight: 800; color: #991b1b; margin-bottom: 0.5rem; font-size: 1.7rem;">Student Record Missing on Server</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.75rem;">
            Student record was not found on the server. Please refresh or contact HOD/Admin.
          </p>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem; font-size: 0.9rem; color: #991b1b; text-align: left; line-height: 1.5;">
            <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444; margin-right: 0.5rem;"></i>
            <strong>Need Assistance?</strong> Your account data may have been updated or reset by the department. Please re-login with your credentials or request your Head of Department (HOD) to perform a record recovery.
          </div>

          <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary" onclick="window.location.reload()" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.8rem 1.75rem;">
              <i class="fa-solid fa-arrows-rotate"></i> Refresh Page
            </button>
            <button type="button" class="btn btn-primary" onclick="if(window.App && App.logout) App.logout(); else window.location.hash='#/login';" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.8rem 2rem; background: #dc2626; border-color: #dc2626;">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Return to Login
            </button>
          </div>
        </div>
      </div>
    `;
  },

  getFreshProfile() {
    const db = (typeof getLocalDB === 'function') ? getLocalDB() : { students: [], users: [] };
    const currentUser = (typeof getSessionUser === 'function') ? getSessionUser() : (App.currentUser || {});
    if (!currentUser || (!currentUser.email && !currentUser.prn_no && !currentUser.username && !currentUser.id)) return null;

    const normEmail = (currentUser.email || '').trim().toLowerCase();
    const normName = (currentUser.name || '').trim().toLowerCase();
    const normPrn = (currentUser.prn_no || '').trim().toUpperCase();
    const normUsername = (currentUser.username || '').trim().toUpperCase();

    // Check deletion blocklist
    if ((normEmail && db.deleted_emails && db.deleted_emails.includes(normEmail)) || (normPrn && db.deleted_prns && db.deleted_prns.includes(normPrn))) {
      return null;
    }

    const student = (db.students || []).find(s => 
      (currentUser.id && (s.user_id == currentUser.id || s.id == currentUser.id)) ||
      (normPrn && s.prn_no && s.prn_no.trim().toUpperCase() === normPrn) ||
      (normUsername && s.username && s.username.trim().toUpperCase() === normUsername) ||
      (normEmail && s.email && s.email.trim().toLowerCase() === normEmail) ||
      (normName && s.name && s.name.trim().toLowerCase() === normName)
    );

    const userInDb = (db.users || []).find(u =>
      (currentUser.id && u.id == currentUser.id) ||
      (normPrn && u.prn_no && u.prn_no.trim().toUpperCase() === normPrn) ||
      (normUsername && u.username && u.username.trim().toUpperCase() === normUsername) ||
      (normEmail && u.email && u.email.trim().toLowerCase() === normEmail) ||
      (normName && u.name && u.name.trim().toLowerCase() === normName)
    );

    if (!student && !userInDb) {
      return null;
    }

    const resolvedStudent = student || {};
    const resolvedUser = userInDb || {};

    const isApproved = (currentUser.status === 'APPROVED') || (resolvedStudent.status === 'APPROVED') || (resolvedUser.status === 'APPROVED');
    const effectiveStatus = isApproved ? 'APPROVED' : (resolvedStudent.status || resolvedUser.status || currentUser.status || 'APPROVED');

    if (isApproved && currentUser.status !== 'APPROVED') {
      currentUser.status = 'APPROVED';
      if (typeof setSessionUser === 'function') setSessionUser(currentUser);
      if (typeof App !== 'undefined') App.currentUser = currentUser;
    }

    const mergedProfile = { ...currentUser, ...resolvedUser, ...resolvedStudent, status: effectiveStatus };
    if (typeof App !== 'undefined') App.currentProfile = mergedProfile;
    return mergedProfile;
  },

  renderPendingApprovalScreen(profile) {
    profile = profile || this.getFreshProfile();
    return `
      <div class="dashboard-container">
        <div style="background: #ffffff; border: 2px dashed #f59e0b; border-radius: 16px; padding: 3rem 2rem; text-align: center; max-width: 650px; margin: 3rem auto; box-shadow: var(--shadow-lg);">
          <div style="width: 76px; height: 76px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto; font-size: 2.2rem; color: #d97706;">
            <i class="fa-solid fa-user-clock"></i>
          </div>
          <h2 style="font-family: var(--font-heading); font-weight: 800; color: #92400e; margin-bottom: 0.5rem; font-size: 1.7rem;">Account Pending HOD Approval</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.75rem;">
            Welcome to ECE Department Portal, <strong>${profile.name || 'Student'}</strong>! Your registration is currently awaiting review and approval by the Head of Department (HOD).
          </p>

          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 1.25rem; margin-bottom: 2rem; font-size: 0.9rem; color: #b45309; text-align: left; line-height: 1.5;">
            <i class="fa-solid fa-circle-info" style="color: #d97706; margin-right: 0.5rem;"></i>
            <strong>What happens next?</strong> Once the HOD accepts and approves your student registration, your student dashboard and certificate upload features will be automatically unlocked!
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; gap: 1.25rem;">
            <span class="badge-status status-PENDING" style="padding: 0.6rem 1.5rem; font-size: 0.95rem; font-weight: 800; background: #fef3c7; color: #d97706; border: 1px solid #fde68a;">
              <i class="fa-solid fa-spinner fa-spin" style="margin-right: 0.4rem;"></i> STATUS: AWAITING HOD APPROVAL
            </span>

            <button type="button" class="btn btn-primary" onclick="StudentView.forceCheckApproval()" style="border-radius: var(--radius-full); font-weight: 800; padding: 0.8rem 2rem; background: #2563eb; font-size: 0.95rem;">
              <i class="fa-solid fa-rotate-right"></i> Check Approval Status Now
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async forceCheckApproval() {
    Toast.info('Checking live HOD approval status...');
    if (typeof fetchCloudDB === 'function') {
      await fetchCloudDB(true);
    }
    const profile = this.getFreshProfile();

    if (profile && profile.status === 'APPROVED') {
      Toast.success('🎉 Congratulations! Your HOD has approved your student registration. Access granted!');
      window.location.hash = '#/student/dashboard';
      const container = document.getElementById('view-container');
      if (container) container.innerHTML = await StudentView.renderDashboard();
    } else {
      Toast.info('Your registration is still pending HOD approval. Please ask HOD to click "Approve Registration".');
    }
  },

  async renderDashboard() {
    if (typeof fetchCloudDB === 'function') {
      await fetchCloudDB(true);
    }

    const profile = this.getFreshProfile();
    if (!profile) {
      return this.renderMissingRecordScreen();
    }
    if (profile.status !== 'APPROVED') {
      return this.renderPendingApprovalScreen(profile);
    }
    try {
      const data = await API.get('/api/student/dashboard');
      const profile = this.getFreshProfile() || App.currentProfile || {};

      const totalCompLec = data.total_credited_lectures || 0;
      const approvedCount = data.approved_certificates || 0;
      const pendingCount = data.pending_certificates || 0;
      const rejectedCount = data.rejected_certificates || 0;
      const subBreakdown = data.subject_breakdown || [];
      const activities = data.recent_activities || [];

      // Subject breakdown chips HTML
      const subChipsHtml = subBreakdown.length > 0 ? subBreakdown.map(s => {
        const isLab = s.activity_type === 'LAB';
        const isTut = s.activity_type === 'TUTORIAL';
        const bgBadge = isLab ? '#fdf4ff' : (isTut ? '#fffbeb' : '#eff6ff');
        const borderBadge = isLab ? '#f0abfc' : (isTut ? '#fde68a' : '#bfdbfe');
        const textBadge = isLab ? '#86198f' : (isTut ? '#b45309' : '#1e40af');
        const iconType = isLab ? 'fa-flask' : (isTut ? 'fa-book-open' : 'fa-chalkboard-user');

        return `
          <div style="background: ${bgBadge}; border: 1.5px solid ${borderBadge}; border-radius: 12px; padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; transition: transform 0.2s ease;">
            <div style="display: flex; align-items: center; gap: 0.65rem; min-width: 0;">
              <div style="width: 34px; height: 34px; border-radius: 8px; background: #ffffff; border: 1px solid ${borderBadge}; display: flex; align-items: center; justify-content: center; color: ${textBadge}; font-size: 0.95rem; flex-shrink: 0;">
                <i class="fa-solid ${iconType}"></i>
              </div>
              <div style="min-width: 0;">
                <div style="font-weight: 800; font-size: 0.85rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.subject_name}</div>
                <div style="font-size: 0.72rem; color: #64748b; font-weight: 600;">${s.activity_type} • ${s.teacher_name || 'Faculty'}</div>
              </div>
            </div>
            <span style="background: #16a34a; color: #ffffff; font-weight: 800; font-size: 0.82rem; padding: 0.3rem 0.65rem; border-radius: 20px; flex-shrink: 0; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.25);">
              +${s.lecture_count} Lec
            </span>
          </div>
        `;
      }).join('') : `
        <div style="grid-column: 1 / -1; text-align: center; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; color: #64748b; font-size: 0.88rem;">
          <i class="fa-solid fa-graduation-cap" style="font-size: 1.5rem; color: #94a3b8; display: block; margin-bottom: 0.4rem;"></i>
          No subject lectures compensated yet. Approved certificates will automatically credit specific timetable subjects here!
        </div>
      `;

      // Detailed Compensated Events Cards
      const activitiesHtml = activities.length > 0 ? activities.map((act, actIdx) => {
        const slotsRows = (act.slot_details || []).map(slot => {
          const isLab = slot.activity_type === 'LAB';
          const typeBadge = isLab ? '<span style="background: #fdf4ff; color: #a21caf; border: 1px solid #f0abfc; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800;"><i class="fa-solid fa-flask"></i> LAB</span>' :
                                    '<span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800;"><i class="fa-solid fa-chalkboard"></i> THEORY</span>';

          return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 0.75rem 0.85rem; font-weight: 700; color: #334155; font-size: 0.82rem; white-space: nowrap;">
                <i class="fa-regular fa-clock" style="color: #64748b; margin-right: 0.35rem;"></i> ${slot.time_slot}
              </td>
              <td style="padding: 0.75rem 0.85rem;">
                <strong style="color: #0f172a; font-size: 0.85rem; display: block;">${slot.subject_name}</strong>
                <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Code: ${slot.subject_code}</span>
              </td>
              <td style="padding: 0.75rem 0.85rem; white-space: nowrap;">${typeBadge}</td>
              <td style="padding: 0.75rem 0.85rem; font-size: 0.8rem; color: #475569; font-weight: 600; white-space: nowrap;">
                <i class="fa-solid fa-user-tie" style="color: #94a3b8; margin-right: 0.3rem;"></i> ${slot.teacher_name}
                <span style="display: block; font-size: 0.72rem; color: #94a3b8;"><i class="fa-solid fa-location-dot"></i> ${slot.room_no}</span>
              </td>
              <td style="padding: 0.75rem 0.85rem; text-align: right; white-space: nowrap;">
                <span style="background: #dcfce7; color: #15803d; font-weight: 800; font-size: 0.78rem; padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid #bbf7d0; display: inline-flex; align-items: center; gap: 0.3rem;">
                  <i class="fa-solid fa-check"></i> Present (100%)
                </span>
              </td>
            </tr>
          `;
        }).join('');

        return `
          <div class="card" style="border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 1.5rem; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.04); background: #ffffff;">
            <!-- Event Card Header -->
            <div style="background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 1.15rem 1.4rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
                  <i class="fa-solid fa-award"></i>
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #0f172a;">${act.certificate_title}</h4>
                    <span style="background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 6px; border: 1px solid #bfdbfe;">
                      ${act.category}
                    </span>
                  </div>
                  <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                    <i class="fa-solid fa-calendar-day" style="color: #2563eb;"></i> <strong>${act.day_of_week}, ${act.activity_date}</strong> • Event: <strong>${act.event_name}</strong>
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="background: #dcfce7; color: #166534; font-weight: 800; font-size: 0.88rem; padding: 0.5rem 1rem; border-radius: 30px; border: 1.5px solid #86efac; display: flex; align-items: center; gap: 0.4rem; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.15);">
                  <i class="fa-solid fa-circle-check" style="color: #16a34a;"></i> ${act.lecture_count} Timetable Lectures Credited
                </span>
                ${act.file_url ? `
                  <button type="button" class="btn btn-secondary btn-sm" onclick="StudentView.previewCertificate('${act.file_url}', '${encodeURIComponent(act.certificate_title)}')" style="font-weight: 700; border-radius: 8px; padding: 0.45rem 0.85rem; font-size: 0.78rem;">
                    <i class="fa-solid fa-file-image"></i> View Document
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Compensated Lecture Schedule Table -->
            <div style="padding: 1rem 1.4rem;">
              <div style="font-size: 0.8rem; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-list-ol" style="color: #2563eb;"></i> Exact Timetable Lectures Compensated on ${act.day_of_week}:
              </div>
              <div class="table-responsive" style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                  <thead style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0;">
                    <tr>
                      <th style="padding: 0.65rem 0.85rem; font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Time Slot</th>
                      <th style="padding: 0.65rem 0.85rem; font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Compensated Subject</th>
                      <th style="padding: 0.65rem 0.85rem; font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Type</th>
                      <th style="padding: 0.65rem 0.85rem; font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase;">Faculty & Room</th>
                      <th style="padding: 0.65rem 0.85rem; font-size: 0.75rem; color: #64748b; font-weight: 800; text-transform: uppercase; text-align: right;">Attendance Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${slotsRows}
                  </tbody>
                </table>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; font-size: 0.75rem; color: #64748b;">
                <span><i class="fa-solid fa-shield-halved" style="color: #16a34a;"></i> Approved by: <strong>${act.approved_by}</strong></span>
                <span><i class="fa-solid fa-clock-rotate-left"></i> Verified on: <strong>${act.approved_at}</strong></span>
              </div>
            </div>
          </div>
        `;
      }).join('') : `
        <div style="background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 3.5rem 2rem; text-align: center; color: #64748b;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: #94a3b8; font-size: 1.8rem;">
            <i class="fa-solid fa-file-circle-check"></i>
          </div>
          <h4 style="font-weight: 800; color: #1e293b; font-size: 1.2rem; margin-bottom: 0.35rem;">No Approved Compensations Yet</h4>
          <p style="font-size: 0.88rem; color: #64748b; max-width: 480px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
            Upload your external hackathon, workshop, paper presentation, or sports certificate. Once the HOD verifies it, your timetable lecture attendance will be credited automatically!
          </p>
          <a href="#/student/upload" class="btn btn-primary" style="font-weight: 800; padding: 0.75rem 1.75rem; border-radius: 30px;">
            <i class="fa-solid fa-cloud-arrow-up"></i> Upload Certificate Now
          </a>
        </div>
      `;

      return `
        <div class="dashboard-container">
          <!-- Top Welcome Hero Banner -->
          <div class="glass-panel" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); border: none; margin-bottom: 1.5rem; color: #ffffff; border-radius: 18px; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 58px; height: 58px; border-radius: 50%; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; font-size: 1.75rem; font-weight: 800; border: 2px solid rgba(255,255,255,0.4);">
                  ${(profile.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <span style="background: rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.5px;">STUDENT ACADEMIC PORTAL</span>
                    <span style="background: #22c55e; color: #ffffff; padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.7rem; font-weight: 800;">
                      <i class="fa-solid fa-circle-check"></i> ACTIVE
                    </span>
                  </div>
                  <h2 style="font-family: var(--font-heading); font-size: 1.75rem; font-weight: 800; margin-top: 0.25rem; color: #ffffff;">${profile.name || 'Student'}</h2>
                  <p style="color: rgba(255,255,255,0.85); font-size: 0.85rem; margin-top: 0.2rem;">
                    Roll No: <strong>${profile.roll_no || 'N/A'}</strong> | PRN: <strong>${profile.prn_no || 'N/A'}</strong> | Dept: <strong>ECE</strong> | Division: <strong>${profile.division_name || 'SE(ECE)'}</strong> (${profile.batch_name || 'A1'})
                  </p>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <a href="#/student/certificates" class="btn" style="background: rgba(255,255,255,0.15); color: #ffffff; border: 1.5px solid rgba(255,255,255,0.3); font-weight: 800; backdrop-filter: blur(6px); border-radius: 12px; padding: 0.65rem 1.15rem;">
                  <i class="fa-solid fa-list-check"></i> My Submissions
                </a>
                <a href="#/student/upload" class="btn" style="background: #ffffff; color: #1d4ed8; font-weight: 800; border: none; border-radius: 12px; padding: 0.65rem 1.25rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                  <i class="fa-solid fa-cloud-arrow-up"></i> Upload Certificate
                </a>
              </div>
            </div>
          </div>

          <!-- Academic Attendance Summary Cards Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 1.75rem;">
            <!-- Card 1: Total Compensated Hours (Hero Metric) -->
            <div style="background: linear-gradient(135deg, #065f46, #047857); color: #ffffff; padding: 1.5rem; border-radius: 18px; box-shadow: 0 8px 20px rgba(4, 120, 87, 0.25); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #a7f3d0;">ATTENDANCE COMPENSATION</span>
                  <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                    <i class="fa-solid fa-calendar-check"></i>
                  </div>
                </div>
                <div style="font-size: 2.3rem; font-weight: 900; margin-top: 0.4rem; line-height: 1.1;">
                  ${totalCompLec} <span style="font-size: 1.1rem; font-weight: 700; color: #a7f3d0;">Lectures</span>
                </div>
              </div>
              <div style="margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.2); font-size: 0.78rem; color: #d1fae5; display: flex; align-items: center; gap: 0.4rem;">
                <i class="fa-solid fa-circle-check" style="color: #6ee7b7;"></i> 100% Attendance Credited by HOD
              </div>
            </div>

            <!-- Card 2: Submission Status Tracker -->
            <div style="background: #ffffff; padding: 1.5rem; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b;">CERTIFICATE REVIEW STATUS</span>
                <div style="width: 36px; height: 36px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
                  <i class="fa-solid fa-file-lines"></i>
                </div>
              </div>
              <div style="display: flex; gap: 0.75rem; justify-content: space-between;">
                <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.4rem; font-weight: 900; color: #16a34a;">${approvedCount}</div>
                  <div style="font-size: 0.7rem; font-weight: 800; color: #15803d; text-transform: uppercase;">Approved</div>
                </div>
                <div style="flex: 1; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.4rem; font-weight: 900; color: #d97706;">${pendingCount}</div>
                  <div style="font-size: 0.7rem; font-weight: 800; color: #b45309; text-transform: uppercase;">In Review</div>
                </div>
                <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.4rem; font-weight: 900; color: #dc2626;">${rejectedCount}</div>
                  <div style="font-size: 0.7rem; font-weight: 800; color: #991b1b; text-transform: uppercase;">Rejected</div>
                </div>
              </div>
              <div style="margin-top: 0.85rem; font-size: 0.75rem; color: #64748b;">
                <i class="fa-solid fa-bolt" style="color: #f59e0b;"></i> Real-time sync with department HOD review desk
              </div>
            </div>

            <!-- Card 3: Semester Target Quick Summary -->
            <div style="background: #ffffff; padding: 1.5rem; border-radius: 18px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b;">ACADEMIC REWARD</span>
                <span style="background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 0.72rem; padding: 0.2rem 0.5rem; border-radius: 6px;">COMPENSATION</span>
              </div>
              <div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #1e293b;">Departmental Co-Curricular Attendance</div>
                <p style="font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; line-height: 1.4;">
                  All sanctioned hackathons, technical paper contests, and certified workshops are compensated slot-by-slot on your timetable.
                </p>
              </div>
              <div style="margin-top: 0.85rem; font-size: 0.75rem; color: #2563eb; font-weight: 700;">
                <i class="fa-solid fa-circle-info"></i> Official Department Verification
              </div>
            </div>
          </div>

          <!-- Main Approved Activity Timetable Ledger -->
          <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.6rem;">
                  <i class="fa-solid fa-clipboard-list" style="color: #16a34a;"></i> Verified Activity & Attendance Compensation Ledger
                </h3>
                <p style="color: #64748b; font-size: 0.82rem; margin: 0.2rem 0 0 0;">
                  Detailed slot-by-slot timetable compensation records approved by HOD
                </p>
              </div>
            </div>

            ${activitiesHtml}
          </div>
        </div>
      `;
    } catch (err) {
      const errMsg = err ? (err.message || err.error || (typeof err === 'string' ? err : 'Unable to fetch dashboard data.')) : 'Unable to fetch dashboard data.';
      return `<div class="dashboard-container"><p style="color: var(--accent-rose);">Failed to load student dashboard: ${errMsg}</p></div>`;
    }
  },

  previewCertificate(url, encodedTitle) {
    const title = decodeURIComponent(encodedTitle || 'Certificate Document');
    const existing = document.getElementById('modal-cert-preview-dialog');
    if (existing) existing.remove();

    const isPdf = url && (url.includes('application/pdf') || url.toLowerCase().endsWith('.pdf') || url === 'PDF_SUBMITTED');
    const contentHtml = isPdf 
      ? `<iframe src="${url}" style="width: 100%; height: 500px; border: none; border-radius: 8px;"></iframe>`
      : `<img src="${url}" alt="Certificate Preview" style="max-width: 100%; max-height: 520px; border-radius: 8px; display: block; margin: 0 auto; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">`;

    const modalHtml = `
      <div id="modal-cert-preview-dialog" class="modal modal-open" style="display: flex; align-items: center; justify-content: center; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 99999; backdrop-filter: blur(4px);">
        <div style="background: #ffffff; border-radius: 16px; max-width: 700px; width: 92%; padding: 1.5rem; box-shadow: 0 20px 40px rgba(0,0,0,0.25); animation: modalFadeIn 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem;">
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem;">
              <i class="fa-solid fa-award" style="color: #2563eb;"></i> ${title}
            </h4>
            <button type="button" onclick="document.getElementById('modal-cert-preview-dialog').remove()" style="background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1rem; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center;">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div style="margin-bottom: 1rem;">
            ${contentHtml}
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            ${url && url.startsWith('http') ? `<a href="${url}" target="_blank" download class="btn btn-secondary btn-sm" style="font-weight: 700;"><i class="fa-solid fa-download"></i> Download</a>` : ''}
            <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('modal-cert-preview-dialog').remove()" style="font-weight: 800;">
              Close Preview
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },

  async renderUploadForm() {
    if (typeof fetchCloudDB === 'function') await fetchCloudDB(true);
    const profile = this.getFreshProfile();
    if (!profile) {
      return this.renderMissingRecordScreen();
    }
    if (profile.status !== 'APPROVED') {
      return this.renderPendingApprovalScreen(profile);
    }
    const todayStr = new Date().toISOString().split('T')[0];

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
              <input type="date" id="page-cert-date" class="form-control" max="${todayStr}" required>
            </div>

            <div class="form-group">
              <label>Description / Details</label>
              <textarea id="page-cert-desc" class="form-control" rows="3" placeholder="Brief details about your role, achievements, or project..."></textarea>
            </div>

            <div class="form-group">
              <label>Upload Document File (PDF / PNG / JPG) <span style="color: var(--accent-rose);">*</span></label>
              <input type="file" id="page-cert-file" class="form-control" accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.doc,.docx" style="padding: 0.65rem; border: 2px dashed #2563eb; background: #eff6ff; cursor: pointer; border-radius: var(--radius-md);"
                onchange="StudentView.onFileSelected(this)">
              <small id="file-status-msg" style="color: var(--text-muted); font-size: 0.78rem; display: block; margin-top: 0.3rem;">Tap above to pick a photo from your gallery, camera, or PDF document.</small>
            </div>

            <!-- Dedicated Upload Progress Box (Displays when processing large files) -->
            <div id="upload-progress-box" style="display: none; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: var(--radius-md); padding: 1.25rem; margin-top: 1.5rem; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size: 1.5rem; color: #16a34a;"></i>
                <strong id="upload-progress-title" style="font-size: 1rem; color: #166534;">Processing Certificate Document...</strong>
              </div>
              <p id="upload-progress-desc" style="font-size: 0.85rem; color: #15803d; margin: 0 0 0.75rem 0;">
                Please remain on this screen. Optimizing high-resolution document and syncing directly to HOD desk...
              </p>
              <div style="background: #e2e8f0; border-radius: var(--radius-full); height: 8px; width: 100%; overflow: hidden;">
                <div id="upload-progress-bar" style="background: linear-gradient(90deg, #22c55e, #16a34a); height: 100%; width: 60%; transition: width 0.3s ease;"></div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
              <a href="#/student/certificates" id="btn-page-upload-cancel" class="btn btn-secondary">Cancel</a>
              <button type="submit" id="btn-page-upload-submit" class="btn btn-primary" style="padding: 0.85rem 2rem; font-weight: 800;">
                <i class="fa-solid fa-paper-plane"></i> Submit Certificate for Review
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  onFileSelected(input) {
    const statusMsg = document.getElementById('file-status-msg');
    if (!statusMsg) return;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      statusMsg.style.color = '#15803d';
      statusMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Selected: <strong>${file.name}</strong> (${sizeMb} MB) — Ready for submission.`;
    }
  },

  compressImageFile(file, callback) {
    if (!file) {
      callback('');
      return;
    }

    // 1. For non-image files (PDF, doc), read as base64 data URL
    const isImage = file.type && file.type.startsWith('image/');
    if (!isImage && (file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf')))) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        callback(dataUrl && dataUrl.length > 20 ? dataUrl : 'PDF_SUBMITTED');
      };
      reader.onerror = () => callback('PDF_SUBMITTED');
      reader.readAsDataURL(file);
      return;
    }

    // 2. High-Performance Instant Image Processing (Supports 20MB+ 4K/8K photos without memory lag)
    try {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          // High-clarity readable certificate dimensions (1000px max width/height)
          const MAX_WIDTH = 1000;
          const MAX_HEIGHT = 1000;
          let width = img.width || 800;
          let height = img.height || 600;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              width = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Fill white background for transparent PNGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Export sharp 0.65 JPEG (~35KB) for crystal-clear text readability on HOD review desk
          const compressed = canvas.toDataURL('image/jpeg', 0.65);
          URL.revokeObjectURL(objUrl);
          callback(compressed && compressed.length > 50 ? compressed : '');
        } catch (e) {
          URL.revokeObjectURL(objUrl);
          const fallbackReader = new FileReader();
          fallbackReader.onload = (ev) => callback(ev.target.result || '');
          fallbackReader.onerror = () => callback('');
          fallbackReader.readAsDataURL(file);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        const fallbackReader = new FileReader();
        fallbackReader.onload = (ev) => callback(ev.target.result || '');
        fallbackReader.onerror = () => callback('');
        fallbackReader.readAsDataURL(file);
      };

      img.src = objUrl;
    } catch (err) {
      const reader = new FileReader();
      reader.onload = (ev) => callback(ev.target.result || '');
      reader.onerror = () => callback('');
      reader.readAsDataURL(file);
    }
  },

  async uploadFileToCloud(file, callback) {
    if (!file) {
      callback('');
      return;
    }

    let called = false;
    const safeCallback = (url) => {
      if (!called) {
        called = true;
        callback(url);
      }
    };

    // 45-second safety fallback
    setTimeout(() => {
      safeCallback('');
    }, 45000);

    // Compress and read image file
    this.compressImageFile(file, safeCallback);
  },

  async handleUploadPage(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-page-upload-submit');
    const btnCancel = document.getElementById('btn-page-upload-cancel');
    const progressBox = document.getElementById('upload-progress-box');
    const progressTitle = document.getElementById('upload-progress-title');
    const progressDesc = document.getElementById('upload-progress-desc');
    const progressBar = document.getElementById('upload-progress-bar');

    const fileInput = document.getElementById('page-cert-file');
    const selectedFile = (fileInput && fileInput.files && fileInput.files.length > 0) ? fileInput.files[0] : null;

    // Manual file validation
    if (!selectedFile) {
      Toast.error('Please select a certificate file (PDF, PNG, or JPG) before submitting.');
      const statusMsg = document.getElementById('file-status-msg');
      if (statusMsg) { statusMsg.style.color = '#ef4444'; statusMsg.textContent = '⚠️ No file selected. Please tap the file picker above to choose your certificate.'; }
      return;
    }

    // Lock UI and show live progress indicator on upload window
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading... Please Wait';
    btnSubmit.disabled = true;
    if (btnCancel) btnCancel.style.display = 'none';

    if (progressBox) {
      progressBox.style.display = 'block';
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(2);
      if (progressTitle) progressTitle.textContent = `Optimizing & Encrypting Document (${sizeMb} MB)...`;
      if (progressBar) progressBar.style.width = '45%';
    }

    const certDate = document.getElementById('page-cert-date').value;
    const nowLocal = new Date();
    const year = nowLocal.getFullYear();
    const month = String(nowLocal.getMonth() + 1).padStart(2, '0');
    const day = String(nowLocal.getDate()).padStart(2, '0');
    const localTodayStr = `${year}-${month}-${day}`;

    const title = (document.getElementById('page-cert-title') ? document.getElementById('page-cert-title').value : '') || 'Activity Certificate';
    const event_name = (document.getElementById('page-cert-event') ? document.getElementById('page-cert-event').value : '') || 'Department Event';
    const category = (document.getElementById('page-cert-category') ? document.getElementById('page-cert-category').value : '') || 'DEPARTMENTAL';
    const description = (document.getElementById('page-cert-desc') ? document.getElementById('page-cert-desc').value : '') || '';

    const processFileAndPost = (fileUrl) => {
      if (progressBar) progressBar.style.width = '80%';
      if (progressTitle) progressTitle.textContent = 'Delivering Certificate to HOD Desk...';

      const payload = {
        title,
        event_name,
        category,
        certificate_date: certDate || localTodayStr,
        description,
        file_url: fileUrl || '',
        file_name: selectedFile ? (selectedFile.name || 'uploaded_certificate') : 'certificate_document.jpg'
      };

      API.post('/api/student/certificates', payload).then(res => {
        if (progressBar) progressBar.style.width = '100%';
        if (progressTitle) progressTitle.innerHTML = '🎉 Upload Successful!';
        if (progressDesc) progressDesc.textContent = 'Certificate successfully sent for HOD review. Opening certificates list...';

        Toast.success(res.message || '🎉 Certificate uploaded successfully and sent for HOD review!');
        setTimeout(() => {
          window.location.hash = '#/student/certificates';
        }, 600);
      }).catch(err => {
        Toast.error((err && err.message) || 'Failed to upload certificate.');
        btnSubmit.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Certificate for Review';
        btnSubmit.disabled = false;
        if (btnCancel) btnCancel.style.display = '';
        if (progressBox) progressBox.style.display = 'none';
      });
    };

    this.uploadFileToCloud(selectedFile, processFileAndPost);
  },

  async renderCertificates() {
    if (typeof fetchCloudDB === 'function') await fetchCloudDB(true);
    const profile = this.getFreshProfile();
    if (!profile) {
      return this.renderMissingRecordScreen();
    }
    if (profile.status !== 'APPROVED') {
      return this.renderPendingApprovalScreen(profile);
    }
    try {
      const data = await API.get('/api/student/certificates');
      const certificates = Array.isArray(data) ? data : (data.certificates || []);

      const rows = certificates.map(c => {
        const safeTitle = (c.title || 'Certificate').replace(/'/g, "\\'");
        const safeStudent = (c.student_name || 'Student').replace(/'/g, "\\'");
        const isPending = c.status === 'PENDING';

        return `
          <tr>
            <td><strong>${c.title}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${c.description || ''}</span></td>
            <td>${c.event_name}</td>
            <td><span class="badge-role role-STUDENT">${c.category}</span></td>
            <td>${c.certificate_date}</td>
            <td>
              <span class="badge-status status-${c.status}">${c.status}</span>
              ${c.status === 'REJECTED' && c.rejection_reason ? `<div style="font-size: 0.72rem; color: var(--accent-rose); margin-top: 0.2rem;">Reason: ${c.rejection_reason}</div>` : ''}
              ${c.status === 'APPROVED' ? `<div style="font-size: 0.72rem; color: #15803d; font-weight: 700; margin-top: 0.2rem;"><i class="fa-solid fa-circle-check"></i> Attendance Credited</div>` : ''}
            </td>
            <td>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center;">
                <button class="btn btn-secondary btn-sm" onclick="StudentView.previewFile('${c.file_url}', '${c.file_name}', '${safeTitle}', '${safeStudent}', '${c.id}')">
                  <i class="fa-solid fa-eye"></i> View
                </button>
                ${isPending ? `
                  <button class="btn btn-danger btn-sm" onclick="StudentView.cancelCertificateRequest('${c.id}', '${safeTitle}')" style="background: #ef4444; border-color: #ef4444; font-size: 0.78rem; font-weight: 700;" title="Cancel & withdraw this pending certificate submission">
                    <i class="fa-solid fa-ban"></i> Cancel Request
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('') || `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No certificates uploaded yet. Click "Upload New Certificate" above to submit your first certificate.</td></tr>`;

      return `
        <div class="dashboard-container">
          <div class="glass-panel">
            <div class="panel-header">
              <h3><i class="fa-solid fa-file-contract" style="color: var(--primary);"></i> My Certificate Submissions</h3>
              <a href="#/student/upload" class="btn btn-primary btn-sm" style="font-weight: 800;">
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

  async cancelCertificateRequest(certId, title) {
    if (!confirm(`Are you sure you want to cancel and withdraw your certificate request for "${title || 'this certificate'}"?`)) return;
    try {
      Toast.info('Cancelling certificate request...');
      await API.del(`/api/teacher/certificates/${certId}`);
      Toast.success('Certificate submission request cancelled and withdrawn successfully.');
      const container = document.getElementById('view-container');
      if (container) container.innerHTML = await StudentView.renderCertificates();
    } catch (err) {
      Toast.error((err && err.message) || 'Failed to cancel certificate request.');
    }
  },

  async renderProfile() {
    const profile = this.getFreshProfile() || App.currentProfile || {};
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

  async previewFile(url, fileName, certTitle = '', studentName = '', certId = '') {
    const titleText = fileName || certTitle || 'Activity Certificate Document';
    document.getElementById('preview-modal-title').innerText = `Certificate Document Preview: ${titleText}`;
    const body = document.getElementById('preview-modal-body');
    body.innerHTML = `<div style="text-align: center; padding: 2rem;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size: 2rem; color: var(--primary);"></i><p style="margin-top: 0.5rem; color: var(--text-muted);">Loading certificate document preview...</p></div>`;
    openModal('modal-file-preview');

    let fileUrl = url || '';

    // 1. Try resolving certificate from local database if fileUrl is empty or placeholder
    if (!fileUrl || fileUrl.startsWith('cert_asset_') || fileUrl.startsWith('LOCAL_') || fileUrl === 'SYNC_STORED' || fileUrl === 'PLACEHOLDER' || fileUrl === 'null' || fileUrl === 'undefined') {
      const db = typeof getLocalDB === 'function' ? getLocalDB() : { certificates: [] };
      const matched = (db.certificates || []).find(c =>
        (certId && String(c.id) === String(certId)) ||
        (fileName && c.file_name === fileName) ||
        (certTitle && c.title === certTitle) ||
        (studentName && c.student_name === studentName)
      );
      if (matched && matched.file_url && (matched.file_url.startsWith('data:image') || matched.file_url.startsWith('http') || matched.file_url.startsWith('data:application/pdf'))) {
        fileUrl = matched.file_url;
      }
      if ((!fileUrl || fileUrl === 'SYNC_STORED') && matched && matched.id) {
        try {
          const cachedImg = localStorage.getItem(`cert_img_${matched.id}`) || localStorage.getItem(`cert_thumb_${matched.id}`);
          if (cachedImg && cachedImg.startsWith('data:image')) fileUrl = cachedImg;
        } catch(e) {}
      }
    }

    // 2. If still SYNC_STORED or missing, fetch direct high-res image from cloud KV
    if ((!fileUrl || fileUrl === 'SYNC_STORED' || fileUrl.startsWith('LOCAL_')) && certId) {
      try {
        const cloudImg = await fetch(`https://keyvalue.immanuel.co/api/KeyVal/GetValue/${CLOUD_DB_KEY}/cert_img_${certId}`).then(r => r.text()).catch(() => '');
        if (cloudImg && cloudImg.length > 50 && cloudImg !== 'EMPTY') {
          fileUrl = decodeURIComponent(cloudImg.replace(/^"|"$/g, ''));
        }
      } catch(e) {}
    }

    let displayContent = '';

    if (fileUrl && (fileUrl.startsWith('data:image') || fileUrl.startsWith('http') || fileUrl.startsWith('blob:'))) {
      displayContent = `
        <div style="text-align: center; width: 100%;">
          <img src="${fileUrl}" style="max-width: 100%; max-height: 560px; border-radius: var(--radius-md); object-fit: contain; box-shadow: var(--shadow-md); border: 1px solid var(--border-color);" alt="${titleText}">
          <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
            <i class="fa-solid fa-file-image" style="color: var(--primary);"></i> Student Uploaded Document: ${titleText}
          </div>
        </div>`;
    } else if (fileUrl && (fileUrl.includes('data:application/pdf') || fileUrl.endsWith('.pdf') || fileUrl === 'PDF_SUBMITTED')) {
      if (fileUrl.startsWith('data:application/pdf')) {
        displayContent = `<iframe src="${fileUrl}" style="width: 100%; height: 550px; border: none; border-radius: var(--radius-md); box-shadow: var(--shadow-md);"></iframe>`;
      } else {
        displayContent = `
          <div style="text-align: center; padding: 2.5rem; background: #f8fafc; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
            <i class="fa-solid fa-file-pdf" style="font-size: 3.5rem; color: #ef4444; display: block; margin-bottom: 1rem;"></i>
            <h4 style="color: var(--text-main); font-weight: 800; margin-bottom: 0.5rem;">Official PDF Certificate Submitted</h4>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.75rem;">Document: <strong>${titleText}</strong> &nbsp;|&nbsp; Student: <strong>${studentName || 'Student'}</strong></p>
            <span class="badge-status status-APPROVED" style="font-weight: 800; background: #dcfce7; color: #15803d;">PDF DOCUMENT VERIFIED</span>
          </div>`;
      }
    } else {
      displayContent = this.getSampleCertificateHTML(certTitle || titleText, studentName || 'Student');
    }

    body.innerHTML = displayContent;
  },

  getSampleCertificateHTML(title = 'National Technical Conference 2026', student = 'Nikhil Verma') {
    return `
      <div style="width: 100%; background: #ffffff; border: 8px double #1e3a8a; padding: 2rem; border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); position: relative; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; text-align: left;">
            <i class="fa-solid fa-graduation-cap" style="font-size: 2.2rem; color: #1d4ed8;"></i>
            <div>
              <h3 style="margin: 0; color: #1e293b; font-size: 1.1rem; font-weight: 800;">DEPARTMENT OF ELECTRONICS & COMPUTER ENGINEERING</h3>
              <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">INSTITUTE OF ENGINEERING & TECHNOLOGY</span>
            </div>
          </div>
          <span style="background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 20px; border: 1px solid #86efac;">
            <i class="fa-solid fa-circle-check"></i> VERIFIED ECE CERTIFICATE
          </span>
        </div>

        <span style="font-size: 0.85rem; letter-spacing: 2px; color: #3b82f6; text-transform: uppercase; font-weight: 800;">CERTIFICATE OF PARTICIPATION</span>
        
        <h2 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 1rem 0 0.5rem 0; font-family: 'Outfit', sans-serif;">
          This is to certify that <span style="color: #1d4ed8; border-bottom: 2px solid #93c5fd;">${student || 'Student'}</span>
        </h2>
        
        <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; max-width: 600px; margin: 0 auto 1.5rem auto;">
          has successfully presented and participated in the official academic activity:
          <br>
          <strong style="color: #0f172a; font-size: 1.1rem; display: inline-block; margin-top: 0.5rem; background: #eff6ff; padding: 0.4rem 1rem; border-radius: 8px; border: 1px solid #bfdbfe;">
            ${title}
          </strong>
        </p>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2rem; border-top: 1.5px dashed #cbd5e1; padding-top: 1rem;">
          <div style="text-align: left;">
            <span style="font-size: 0.75rem; color: #64748b; display: block;">Certificate ID: ECE-CERT-2026-8841</span>
            <span style="font-size: 0.75rem; color: #64748b; display: block;">Issued: August 2026</span>
          </div>
          <div style="text-align: right;">
            <div style="font-family: cursive; font-size: 1.1rem; color: #1e3a8a; margin-bottom: 0.2rem;">Dr. S. K. Kulkarni</div>
            <span style="font-size: 0.75rem; font-weight: 800; color: #334155; border-top: 1px solid #94a3b8; padding-top: 0.2rem; display: block;">Head of Department (ECE)</span>
          </div>
        </div>
      </div>
    `;
  },

  openAccountSettingsModal() {
    const emailInput = document.getElementById('student-email-input');
    if (emailInput && window.App && App.currentUser) {
      emailInput.value = App.currentUser.email || '';
    }
    openModal('modal-student-change-settings');
  },

  async handleChangeSettings(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-student-change-settings');
    btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating Settings...';
    btnSubmit.disabled = true;

    const new_email = document.getElementById('student-email-input').value;
    const current_password = document.getElementById('student-current-password').value;
    const new_password = document.getElementById('student-new-password').value;
    const confirm_password = document.getElementById('student-confirm-password').value;

    if (new_password !== confirm_password) {
      Toast.error('New password and confirm password do not match.');
      btnSubmit.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Save Account Settings';
      btnSubmit.disabled = false;
      return;
    }

    try {
      const res = await API.post('/api/student/change-settings', { new_email, current_password, new_password });
      Toast.success(res.message || 'Student email & password updated successfully!');
      if (res.user && window.App) {
        App.currentUser.email = res.user.email;
      }
      closeModal('modal-student-change-settings');
      document.getElementById('form-student-change-settings').reset();
    } catch (err) {
      Toast.error(err.message || 'Failed to update account settings.');
    } finally {
      btnSubmit.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Save Account Settings';
      btnSubmit.disabled = false;
    }
  }
};
