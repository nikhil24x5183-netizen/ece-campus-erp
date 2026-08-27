/* Global Password Visibility Eye Toggle Helper */
function togglePasswordVisibility(inputId, btnEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btnEl ? btnEl.querySelector('i') : null;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.className = 'fa-solid fa-eye-slash';
      icon.style.color = 'var(--primary)';
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.className = 'fa-solid fa-eye';
      icon.style.color = '';
    }
  }
}

/* Global HOD Security PIN Unlock Helper */
async function verifyHodPin(e) {
  if (e) e.preventDefault();
  const btn = document.getElementById('btn-verify-hod-pin');
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...';
    btn.disabled = true;
  }

  const pin = document.getElementById('input-hod-security-pin').value;
  try {
    const res = await API.post('/api/hod/verify-pin', { pin });
    Toast.success(res.message || 'HOD Security PIN Verified!');
    sessionStorage.setItem('hod_pin_unlocked', 'true');
    closeModal('modal-hod-pin-lock');
    if (window.App) App.handleRoute();
  } catch (err) {
    Toast.error(err.message || 'Invalid HOD Security PIN!');
    document.getElementById('input-hod-security-pin').value = '';
    document.getElementById('input-hod-security-pin').focus();
  } finally {
    if (btn) {
      btn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Unlock HOD Desk';
      btn.disabled = false;
    }
  }
}

/* ECE Management — Main SPA Router & Controller */
const App = {
  currentUser: null,
  currentProfile: null,

  async init() {
    window.addEventListener('hashchange', () => {
      this.closeMobileMenu();
      this.handleRoute();
    });
    await this.checkAuthAndRoute();
  },

  pollingTimer: null,

  startLivePolling() {
    this.stopLivePolling();
    this.lastPendingStudentCount = -1;
    this.lastPendingCertCount = -1;
    this.lastPendingPassCount = -1;

    this.pollingTimer = setInterval(async () => {
      if (typeof fetchCloudDB === 'function') {
        // Continuous live background sync
        await fetchCloudDB(false);
      }

      if (this.currentUser && (this.currentUser.role === 'HOD' || this.currentUser.role === 'TEACHER')) {
        const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], certificates: [], password_requests: [] };
        
        const pendingStudents = (db.students || []).filter(s => 
          !s.status || s.status === 'PENDING_APPROVAL' || s.status === 'PENDING' || s.status.toUpperCase().includes('PENDING')
        );
        const currentStudentCount = pendingStudents.length;

        const pendingCerts = (db.certificates || []).filter(c => c.status === 'PENDING');
        const currentCertCount = pendingCerts.length;

        const pendingPass = (db.password_requests || []).filter(r => r.status === 'PENDING');
        const currentPassCount = pendingPass.length;

        // 1. Live Notification Pop-Up for New Student Registration
        if ((this.lastPendingStudentCount !== -1 && currentStudentCount !== this.lastPendingStudentCount) || (this.lastPendingStudentCount === -1 && currentStudentCount > 0)) {
          if (this.lastPendingStudentCount !== -1 && currentStudentCount > this.lastPendingStudentCount) {
            Toast.info(`🎓 New Student Registration received! (${currentStudentCount} pending HOD approval)`);
          }

          const currentHash = window.location.hash;
          const container = document.getElementById('view-container');
          if (container) {
            if (currentHash === '#/hod/students' && typeof HodView !== 'undefined' && HodView.renderStudents) {
              container.innerHTML = await HodView.renderStudents();
            } else if ((currentHash === '#/hod/approvals' || currentHash === '#/teacher/approvals') && typeof TeacherView !== 'undefined' && TeacherView.renderApprovals) {
              container.innerHTML = await TeacherView.renderApprovals();
            } else if ((currentHash === '#/hod/dashboard' || !currentHash) && typeof TeacherView !== 'undefined' && TeacherView.renderDashboard) {
              container.innerHTML = await TeacherView.renderDashboard();
            }
          }
        }

        // 2. Live Notification Pop-Up for New Certificate Submission
        if (this.lastPendingCertCount !== -1 && currentCertCount !== this.lastPendingCertCount) {
          if (currentCertCount > this.lastPendingCertCount) {
            Toast.info(`📜 New Certificate Submission received! (${currentCertCount} pending HOD review)`);
          }

          const currentHash = window.location.hash;
          const container = document.getElementById('view-container');
          if ((currentHash === '#/hod/approvals' || currentHash === '#/teacher/approvals') && container && typeof TeacherView !== 'undefined' && TeacherView.renderApprovals) {
            container.innerHTML = await TeacherView.renderApprovals();
          }
        }

        // 3. Live Notification Pop-Up for New Password Request
        if (this.lastPendingPassCount !== -1 && currentPassCount !== this.lastPendingPassCount) {
          if (currentPassCount > this.lastPendingPassCount) {
            Toast.info(`🔑 New Password Reset Request received! (${currentPassCount} pending HOD approval)`);
          }

          const currentHash = window.location.hash;
          const container = document.getElementById('view-container');
          if (currentHash === '#/hod/password-approvals' && container && typeof TeacherView !== 'undefined' && TeacherView.renderPasswordApprovals) {
            container.innerHTML = await TeacherView.renderPasswordApprovals();
          }
        }

        this.lastPendingStudentCount = currentStudentCount;
        this.lastPendingCertCount = currentCertCount;
        this.lastPendingPassCount = currentPassCount;

        await this.updateBadges();
      }

      // 4. If logged in as STUDENT: check for live status changes without reload
      if (this.currentUser && this.currentUser.role === 'STUDENT') {
        const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], users: [], certificates: [] };
        const cEmail = (this.currentUser.email || '').toLowerCase().trim();
        const cPrn = (this.currentUser.prn_no || '').toUpperCase().trim();
        const cUser = (this.currentUser.username || '').toUpperCase().trim();
        const cId = this.currentUser.id;

        // 4a. Check Registration Status (Pending -> Approved)
        if (this.currentUser.status !== 'APPROVED') {
          const student = (db.students || []).find(s =>
            (s.user_id && s.user_id == cId) || (s.id && s.id == cId) ||
            (cPrn && s.prn_no && s.prn_no.toUpperCase().trim() === cPrn) ||
            (cUser && s.username && s.username.toUpperCase().trim() === cUser) ||
            (cEmail && s.email && s.email.toLowerCase().trim() === cEmail)
          );
          const userInDb = (db.users || []).find(u =>
            (u.id && u.id == cId) ||
            (cPrn && u.prn_no && u.prn_no.toUpperCase().trim() === cPrn) ||
            (cUser && u.username && u.username.toUpperCase().trim() === cUser) ||
            (cEmail && u.email && u.email.toLowerCase().trim() === cEmail)
          );

          let isApproved = (student && student.status === 'APPROVED') || (userInDb && userInDb.status === 'APPROVED');

          if (isApproved) {
            this.currentUser.status = 'APPROVED';
            if (typeof setSessionUser === 'function') setSessionUser(this.currentUser);
            if (typeof App !== 'undefined') App.currentUser = this.currentUser;
            Toast.success('🎉 Your HOD has approved your registration. Access granted!');
            window.location.hash = '#/student/dashboard';
            await this.handleRoute();
          }
        }

        // 4b. Check if student account was deleted by HOD
        const existsInUsers = (db.users || []).some(u => 
          (u.id && u.id == cId) || 
          (cPrn && u.prn_no && u.prn_no.toUpperCase().trim() === cPrn) ||
          (cUser && u.username && u.username.toUpperCase().trim() === cUser) ||
          (cEmail && u.email && u.email.toLowerCase().trim() === cEmail)
        );
        const existsInStudents = (db.students || []).some(s =>
          (s.user_id && s.user_id == cId) || (s.id && s.id == cId) ||
          (cPrn && s.prn_no && s.prn_no.toUpperCase().trim() === cPrn) ||
          (cUser && s.username && s.username.toUpperCase().trim() === cUser) ||
          (cEmail && s.email && s.email.toLowerCase().trim() === cEmail)
        );
        if (!existsInUsers && !existsInStudents) {
          Toast.info('Your student record was deleted by HOD. Please sign up again.');
          this.logout();
          window.location.hash = '#/login';
          return;
        }

        // 4c. Live Certificate Status Updates for Student (Pending -> Approved / Rejected)
        const normStudentName = (this.currentUser.name || '').trim().toLowerCase();
        const myCerts = (db.certificates || []).filter(c => 
          (c.student_email && c.student_email.toLowerCase().trim() === cEmail) ||
          (c.student_id && (c.student_id == cId || (this.currentProfile && c.student_id == this.currentProfile.id))) ||
          (normStudentName && c.student_name && c.student_name.trim().toLowerCase() === normStudentName)
        );

        const currentApprovedCertCount = myCerts.filter(c => c.status === 'APPROVED').length;
        const currentRejectedCertCount = myCerts.filter(c => c.status === 'REJECTED').length;
        const currentCertFingerprint = myCerts.map(c => `${c.id}:${c.status}`).sort().join(';');

        if (this.lastStudentCertFingerprint && currentCertFingerprint !== this.lastStudentCertFingerprint) {
          if (currentApprovedCertCount > (this.lastStudentApprovedCount || 0)) {
            Toast.success('🎉 Great news! HOD has approved your certificate submission and awarded attendance credits!');
          } else if (currentRejectedCertCount > (this.lastStudentRejectedCount || 0)) {
            Toast.error('⚠️ A certificate submission was rejected by HOD. Check certificates page for details.');
          }

          const currentHash = window.location.hash;
          const container = document.getElementById('view-container');
          if (currentHash === '#/student/certificates' && container && typeof StudentView !== 'undefined') {
            container.innerHTML = await StudentView.renderCertificates();
          } else if (currentHash === '#/student/dashboard' && container && typeof StudentView !== 'undefined') {
            container.innerHTML = await StudentView.renderDashboard();
          }
        }

        this.lastStudentCertFingerprint = currentCertFingerprint;
        this.lastStudentApprovedCount = currentApprovedCertCount;
        this.lastStudentRejectedCount = currentRejectedCertCount;
      }
    }, 2500);
  },

  stopLivePolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  },

  logout() {
    this.stopLivePolling();
    try {
      localStorage.removeItem('ece_session_user');
      sessionStorage.clear();
    } catch(e) {}
    this.currentUser = null;
    this.currentProfile = null;
    window.currentUser = null;
    API.post('/api/auth/logout').catch(() => {});
    this.hideShell();
    window.location.hash = '#/login';
    const container = document.getElementById('view-container');
    if (container && typeof AuthView !== 'undefined') {
      container.innerHTML = AuthView.render();
    }
  },

  async checkAuthAndRoute() {
    try {
      const data = await API.get('/api/auth/me');
      this.currentUser = data.user;
      this.currentProfile = data.profile;
      window.currentUser = data.user;

      // Preserve current hash route on refresh for both Students and HOD
      const currentHash = window.location.hash;
      if (!currentHash || currentHash === '#/' || currentHash === '#/login') {
        if (this.currentUser.role === 'STUDENT') {
          window.location.hash = '#/student/dashboard';
        } else if (this.currentUser.role === 'TEACHER') {
          window.location.hash = '#/hod/approvals';
        } else {
          window.location.hash = '#/hod/dashboard';
        }
      }

      this.setupNavigation();
      this.startLivePolling();
      await this.handleRoute();
    } catch (err) {
      this.stopLivePolling();
      this.currentUser = null;
      this.currentProfile = null;
      window.currentUser = null;
      this.hideShell();
      const container = document.getElementById('view-container');
      container.innerHTML = AuthView.render();
    }
  },

  setupNavigation() {
    const sidebar = document.getElementById('app-sidebar');
    const navbar = document.getElementById('app-navbar');
    const navContainer = document.getElementById('sidebar-nav');
    const roleBadge = document.getElementById('navbar-role-badge');

    sidebar.style.display = 'flex';
    navbar.style.display = 'flex';

    const role = this.currentUser.role;
    roleBadge.className = `badge-role role-${role}`;
    roleBadge.innerText = role;

    document.getElementById('user-display-name').innerText = this.currentProfile?.name || this.currentUser.email;
    document.getElementById('user-display-role').innerText = role === 'HOD' ? 'Head of Department' : (role === 'TEACHER' ? 'Faculty Member' : 'Student');
    document.getElementById('user-avatar-initials').innerText = (this.currentProfile?.name || 'U').charAt(0).toUpperCase();

    let navItems = [];

    if (role === 'STUDENT') {
      navItems = [
        { hash: '#/student/dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
        { hash: '#/student/upload', icon: 'fa-cloud-arrow-up', label: 'Upload Certificate' },
        { hash: '#/student/certificates', icon: 'fa-file-contract', label: 'My Certificates' },
        { hash: '#/student/timetable', icon: 'fa-calendar-week', label: 'My Timetable' },
        { hash: '#/student/profile', icon: 'fa-id-card', label: 'My Profile' }
      ];
    } else if (role === 'TEACHER') {
      navItems = [
        { hash: '#/hod/approvals', icon: 'fa-file-signature', label: 'Certificate Approvals' }
      ];
    } else if (role === 'HOD') {
      navItems = [
        { hash: '#/hod/dashboard', icon: 'fa-chart-pie', label: 'HOD Dashboard' },
        { hash: '#/hod/teachers', icon: 'fa-user-plus', label: 'Add / Manage Faculty' },
        { hash: '#/hod/students', icon: 'fa-user-graduate', label: 'Student Registration' },
        { hash: '#/hod/approvals', icon: 'fa-file-signature', label: 'HOD Certificate Approvals' },
        { hash: '#/hod/password-approvals', icon: 'fa-key', label: 'HOD Password Approvals' },
        { hash: '#/hod/timetable', icon: 'fa-calendar-days', label: 'Manage Timetable' },
        { hash: '#/hod/search', icon: 'fa-users', label: 'Student Activity Search' },
        { hash: '#/reports', icon: 'fa-chart-bar', label: 'Master Reports' }
      ];
    }

    navContainer.innerHTML = navItems.map(item => `
      <a href="${item.hash}" class="nav-link" id="nav-${item.hash.replace('#/', '').replace('/', '-')}">
        <i class="fa-solid ${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `).join('');

    const btnHodPass = document.getElementById('btn-hod-change-pass-nav');
    if (btnHodPass) {
      btnHodPass.style.display = (role === 'HOD' || role === 'TEACHER') ? 'inline-flex' : 'none';
    }

    const btnStudentPass = document.getElementById('btn-student-change-pass-nav');
    if (btnStudentPass) {
      btnStudentPass.style.display = (role === 'STUDENT') ? 'inline-flex' : 'none';
    }

    // Update notification counter badges
    this.updateBadges();

    document.getElementById('btn-logout').onclick = () => {
      this.logout();
    };

    const btnMobileMenu = document.getElementById('btn-mobile-menu-toggle');
    if (btnMobileMenu) {
      btnMobileMenu.onclick = () => this.toggleMobileMenu();
    }

    const backdrop = document.getElementById('mobile-backdrop');
    if (backdrop) {
      backdrop.onclick = () => this.closeMobileMenu();
    }

    document.getElementById('btn-notifications-toggle').onclick = async () => {
      const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], certificates: [], password_requests: [] };
      const role = (this.currentUser || {}).role;

      let html = '';

      if (role === 'HOD' || role === 'TEACHER') {
        const pendingStudents = (db.students || []).filter(s => !s.status || s.status === 'PENDING_APPROVAL' || s.status === 'PENDING');
        const pendingCerts = (db.certificates || []).filter(c => c.status === 'PENDING');
        const pendingPass = (db.password_requests || []).filter(r => r.status === 'PENDING');

        let itemsHtml = '';

        if (pendingStudents.length > 0) {
          itemsHtml += pendingStudents.map(s => `
            <div style="padding: 0.85rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #fffbeb; border-radius: var(--radius-md); margin-bottom: 0.5rem;">
              <div>
                <strong style="color: #b45309;"><i class="fa-solid fa-user-clock" style="color: #d97706;"></i> New Student Registration Signup</strong>
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 0.25rem;">${s.name} (${s.division_name || 'ECE'} — Roll: ${s.roll_no || 'N/A'}, PRN: ${s.prn_no || 'N/A'})</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${s.email}</div>
              </div>
              <button class="btn btn-success btn-sm" onclick="closeModal('modal-file-preview'); window.location.hash='#/hod/students';" style="white-space: nowrap; font-weight: 700; background: #16a34a; border-color: #16a34a;">
                Review Signup <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          `).join('');
        }

        if (pendingCerts.length > 0) {
          itemsHtml += pendingCerts.map(c => `
            <div style="padding: 0.85rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #eff6ff; border-radius: var(--radius-md); margin-bottom: 0.5rem;">
              <div>
                <strong style="color: #1d4ed8;"><i class="fa-solid fa-file-contract" style="color: #2563eb;"></i> Certificate Submitted for Review</strong>
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 0.25rem;">${c.title} — ${c.student_name || 'Student'}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Submitted on ${c.created_at || c.certificate_date}</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="closeModal('modal-file-preview'); window.location.hash='#/hod/approvals';" style="white-space: nowrap; font-weight: 700;">
                Review Certificate <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          `).join('');
        }

        if (pendingPass.length > 0) {
          itemsHtml += pendingPass.map(r => `
            <div style="padding: 0.85rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #fef2f2; border-radius: var(--radius-md); margin-bottom: 0.5rem;">
              <div>
                <strong style="color: #b91c1c;"><i class="fa-solid fa-key" style="color: #dc2626;"></i> Password Reset Request</strong>
                <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-main); margin-top: 0.25rem;">${r.student_name || 'Student'} (${r.email})</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Requested: ${r.created_at || 'Recently'}</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="closeModal('modal-file-preview'); window.location.hash='#/hod/password-approvals';" style="white-space: nowrap; font-weight: 700;">
                Review Request <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          `).join('');
        }

        html = itemsHtml || `<div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);"><i class="fa-solid fa-circle-check" style="font-size: 3rem; color: #16a34a; margin-bottom: 0.85rem; display: block;"></i><h4 style="color: var(--text-main); font-weight: 800; margin-bottom: 0.35rem;">All Clear!</h4>All student registration signups, certificate reviews, and password reset requests are up to date.</div>`;
      } else {
        const student = (db.students || []).find(s => s.email && this.currentUser && s.email.toLowerCase() === this.currentUser.email.toLowerCase());
        const userCerts = (db.certificates || []).filter(c => student && (c.student_id == student.id || (c.student_name && student.name && c.student_name.toLowerCase() === student.name.toLowerCase())));

        const regStatus = (student && student.status === 'APPROVED') ? 
          `<div style="padding: 0.85rem; background: #f0fdf4; border-radius: var(--radius-md); margin-bottom: 0.75rem; border: 1px solid #bbf7d0;"><strong style="color: #15803d;"><i class="fa-solid fa-circle-check"></i> Account Status: APPROVED</strong><p style="margin-top: 0.2rem; font-size: 0.85rem; color: var(--text-main);">Your student account has been approved by HOD. Full portal access is active!</p></div>` :
          `<div style="padding: 0.85rem; background: #fffbeb; border-radius: var(--radius-md); margin-bottom: 0.75rem; border: 1px solid #fde68a;"><strong style="color: #b45309;"><i class="fa-solid fa-clock"></i> Account Status: AWAITING HOD APPROVAL</strong><p style="margin-top: 0.2rem; font-size: 0.85rem; color: var(--text-main);">Your registration is submitted to HOD for approval.</p></div>`;

        const certsHtml = userCerts.map(c => `
          <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
            <strong style="color: var(--primary);">${c.title}</strong> — <span class="badge-status status-${c.status}">${c.status}</span>
            <p style="color: var(--text-muted); margin-top: 0.2rem;">Submitted on ${c.certificate_date || 'Date'}</p>
          </div>
        `).join('') || '<p style="color: var(--text-muted); font-size: 0.85rem;">No certificate submissions yet.</p>';

        html = `${regStatus}<h5 style="margin-top: 1rem; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 700;">Certificate Submissions</h5>${certsHtml}`;
      }

      document.getElementById('preview-modal-title').innerText = '🔔 Notifications & Alerts Center';
      document.getElementById('preview-modal-body').innerHTML = `<div style="width: 100%; max-height: 500px; overflow-y: auto;">${html}</div>`;
      openModal('modal-file-preview');
    };
  },

  toggleMobileMenu() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('mobile-backdrop');
    sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('active');
  },

  toggleSidebarCollapsed() {
    const shell = document.getElementById('app-shell');
    const icon = document.getElementById('icon-sidebar-collapse');
    if (!shell) return;
    shell.classList.toggle('sidebar-collapsed');
    const isCollapsed = shell.classList.contains('sidebar-collapsed');
    if (icon) {
      icon.className = isCollapsed ? 'fa-solid fa-indent' : 'fa-solid fa-ellipsis-vertical';
      icon.style.color = isCollapsed ? '#16a34a' : 'var(--primary)';
    }
    if (typeof Toast !== 'undefined') {
      Toast.info(isCollapsed ? 'Sidebar collapsed (Full-width table view active)' : 'Sidebar expanded');
    }
  },

  closeMobileMenu() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('mobile-backdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  },

  hideShell() {
    document.getElementById('app-sidebar').style.display = 'none';
    document.getElementById('app-navbar').style.display = 'none';
  },

  async handleRoute() {
    let hash = window.location.hash || '';

    if (!this.currentUser) {
      this.hideShell();
      document.getElementById('view-container').innerHTML = AuthView.render();
      return;
    }

    if (!this.currentProfile) {
      try {
        const meRes = await API.get('/api/auth/me');
        this.currentProfile = meRes.profile;
      } catch (e) {}
    }

    if (!hash || hash === '#/' || hash === '#/login') {
      if (this.currentUser.role === 'STUDENT') {
        hash = '#/student/dashboard';
      } else if (this.currentUser.role === 'TEACHER') {
        hash = '#/hod/approvals';
      } else {
        // HOD always lands on dashboard on fresh load / refresh with no specific page
        hash = '#/hod/dashboard';
      }
      window.location.hash = hash;
    }

    const container = document.getElementById('view-container');
    const role = this.currentUser.role;
    const pageTitle = document.getElementById('page-title');

    // Strict HOD Approval Guard: Authenticated + Approved + Authorized = ERP Access
    if (role === 'STUDENT') {
      const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], users: [] };
      const normEmail = (this.currentUser.email || '').trim().toLowerCase();
      const normName = (this.currentUser.name || '').trim().toLowerCase();
      const normPrn = (this.currentUser.prn_no || '').trim();

      const student = (db.students || []).find(s =>
        (s.user_id && (s.user_id == this.currentUser.id || s.id == this.currentUser.id)) ||
        (normEmail && s.email && s.email.trim().toLowerCase() === normEmail) ||
        (normPrn && s.prn_no && s.prn_no.trim() === normPrn) ||
        (normName && s.name && s.name.trim().toLowerCase() === normName)
      );
      const userInDb = (db.users || []).find(u =>
        (u.id == this.currentUser.id) ||
        (normEmail && u.email && u.email.trim().toLowerCase() === normEmail) ||
        (normPrn && u.prn_no && u.prn_no.trim() === normPrn) ||
        (normName && u.name && u.name.trim().toLowerCase() === normName)
      );

      const isApproved = (this.currentUser.status === 'APPROVED') ||
                         (student && student.status === 'APPROVED') ||
                         (userInDb && userInDb.status === 'APPROVED');

      if (isApproved) {
        this.currentUser.status = 'APPROVED';
        if (typeof setSessionUser === 'function') setSessionUser(this.currentUser);
      } else {
        this.currentUser.status = 'PENDING_APPROVAL';
        if (typeof setSessionUser === 'function') setSessionUser(this.currentUser);
        if (pageTitle) pageTitle.innerText = 'Pending HOD Approval';
        container.innerHTML = AuthView.renderPendingApprovalView(this.currentUser, student || userInDb);
        return;
      }
    }

    // Strict Role Guards
    if (hash.startsWith('#/student') && role !== 'STUDENT') {
      Toast.error('403 ACCESS DENIED: Students only area');
      window.location.hash = role === 'TEACHER' ? '#/hod/approvals' : '#/hod/dashboard';
      return;
    }

    if ((hash.startsWith('#/teacher') || hash.startsWith('#/hod')) && (role !== 'HOD' && role !== 'TEACHER')) {
      Toast.error('403 ACCESS DENIED: Faculty & HOD area only');
      window.location.hash = '#/student/dashboard';
      return;
    }

    // Faculty (TEACHER) Restricted Access Guard: Faculty ONLY has access to Certificate Approvals
    if (role === 'TEACHER') {
      const allowedTeacherHashes = ['#/hod/approvals', '#/teacher/approvals'];
      if (!allowedTeacherHashes.includes(hash)) {
        Toast.info('Faculty accounts have access exclusively to Certificate Approvals.');
        window.location.hash = '#/hod/approvals';
        return;
      }
    }

    if (role === 'HOD' && sessionStorage.getItem('hod_pin_unlocked') !== 'true') {
      const pinInput = document.getElementById('input-hod-security-pin');
      if (pinInput) pinInput.value = '';
      openModal('modal-hod-pin-lock');
      if (pinInput) setTimeout(() => pinInput.focus(), 100);
    }

    // Active Nav Highlight
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    const activeNavId = `nav-${hash.replace('#/', '').replace('/', '-')}`;
    const activeNavEl = document.getElementById(activeNavId);
    if (activeNavEl) activeNavEl.classList.add('active');

    if (hash === '#/student/dashboard') {
      pageTitle.innerText = 'Student Dashboard';
      container.innerHTML = await StudentView.renderDashboard();
    } else if (hash === '#/student/upload') {
      pageTitle.innerText = 'Upload New Certificate';
      container.innerHTML = await StudentView.renderUploadForm();
    } else if (hash === '#/student/certificates') {
      pageTitle.innerText = 'My Certificate Submissions';
      container.innerHTML = await StudentView.renderCertificates();
    } else if (hash === '#/student/timetable') {
      pageTitle.innerText = 'My Class Timetable';
      container.innerHTML = await Timetable.render(true);
    } else if (hash === '#/student/profile') {
      pageTitle.innerText = 'Student Academic Profile';
      container.innerHTML = await StudentView.renderProfile();
    } else if (hash === '#/hod/dashboard' || hash === '#/teacher/dashboard') {
      pageTitle.innerText = 'HOD & Faculty Dashboard';
      container.innerHTML = await TeacherView.renderDashboard();
    } else if (hash === '#/hod/teachers') {
      pageTitle.innerText = 'Faculty / Add Teachers Panel';
      container.innerHTML = await HodView.renderTeachers();
    } else if (hash === '#/hod/students') {
      pageTitle.innerText = 'Student Registration & Division Panel';
      container.innerHTML = await HodView.renderStudents();
    } else if (hash === '#/hod/approvals' || hash === '#/teacher/approvals') {
      pageTitle.innerText = 'HOD Certificate Approvals Desk';
      container.innerHTML = await TeacherView.renderApprovals();
    } else if (hash === '#/hod/password-approvals') {
      pageTitle.innerText = 'HOD Student Password Reset Approvals';
      container.innerHTML = await TeacherView.renderPasswordApprovals();
    } else if (hash === '#/hod/timetable' || hash === '#/teacher/timetable') {
      pageTitle.innerText = 'Manage Official Timetable';
      container.innerHTML = await Timetable.render(false);
    } else if (hash === '#/hod/search' || hash === '#/teacher/students') {
      pageTitle.innerText = 'Student Activity Search';
      container.innerHTML = await TeacherView.renderStudentSearch();
    } else if (hash === '#/reports') {
      pageTitle.innerText = 'Master System Reports';
      container.innerHTML = await ReportsView.render();
    } else if (hash === '#/pending-approval') {
      pageTitle.innerText = 'Pending HOD Approval';
      const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], users: [] };
      const student = (db.students || []).find(s => (s.user_id == this.currentUser.id || s.id == this.currentUser.id) || (s.email && this.currentUser.email && s.email.toLowerCase() === this.currentUser.email.toLowerCase()));
      const userInDb = (db.users || []).find(u => u.id == this.currentUser.id || (u.email && this.currentUser.email && u.email.toLowerCase() === this.currentUser.email.toLowerCase()));
      container.innerHTML = AuthView.renderPendingApprovalView(this.currentUser, student || userInDb);
    } else {
      if (role === 'STUDENT') {
        window.location.hash = '#/student/dashboard';
      } else {
        window.location.hash = '#/hod/dashboard';
      }
      return;
    }

    // Mandatory First-Login Credentials Setup Modal Trigger for Students
    if (role === 'STUDENT' && this.currentUser) {
      this.setupFirstLoginForm();
      const isDummy = (this.currentUser.must_change_credentials === true) ||
                      (!this.currentUser.is_activated) ||
                      (this.currentUser.email && this.currentUser.email.startsWith('student.') && this.currentUser.email.endsWith('@campus.edu')) ||
                      (this.currentUser.prn_no && this.currentUser.prn_no.startsWith('PRN-'));

      if (isDummy) {
        setTimeout(() => {
          this.promptFirstLoginSetup();
        }, 150);
      }
    }

    // Refresh notification badges on every route change
    this.updateBadges();
  },

  async updateBadges() {
    const role = (this.currentUser || {}).role;
    if (role !== 'HOD' && role !== 'TEACHER') return;

    // Clear existing DOM badge elements
    document.querySelectorAll('.badge-whatsapp-nav, .badge-whatsapp-top-bell').forEach(el => el.remove());

    try {
      const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [], certificates: [], password_requests: [] };

      // 1. Student Registration Approvals Badge (Section: Student Registration Panel)
      const pendingStudents = (db.students || []).filter(s => s.status === 'PENDING_APPROVAL' || s.status === 'PENDING');
      const studentCount = pendingStudents.length;

      if (studentCount > 0) {
        const navStudent = document.getElementById('nav-hod-students');
        if (navStudent) {
          navStudent.style.position = 'relative';
          navStudent.insertAdjacentHTML('beforeend', `<span class="badge-whatsapp-nav">${studentCount}</span>`);
        }
      }

      // 2. Certificate Approvals Badge (Section: Certificate Approvals)
      const pendingCerts = (db.certificates || []).filter(c => c.status === 'PENDING');
      const certCount = pendingCerts.length;

      if (certCount > 0) {
        const navCert = document.getElementById('nav-hod-approvals');
        if (navCert) {
          navCert.style.position = 'relative';
          navCert.insertAdjacentHTML('beforeend', `<span class="badge-whatsapp-nav">${certCount}</span>`);
        }
      }

      // 3. Password Reset Approvals Badge (Section: Password Reset Approvals)
      const pendingPass = (db.password_requests || []).filter(r => r.status === 'PENDING');
      const passCount = pendingPass.length;

      if (passCount > 0) {
        const navPass = document.getElementById('nav-hod-password-approvals');
        if (navPass) {
          navPass.style.position = 'relative';
          navPass.insertAdjacentHTML('beforeend', `<span class="badge-whatsapp-nav">${passCount}</span>`);
        }
      }

      // 4. Top Navbar Bell Badge (Total Pending Requests across all sections)
      const totalBell = studentCount + certCount + passCount;
      const bellBtn = document.getElementById('btn-notifications-toggle');
      if (bellBtn) {
        bellBtn.style.position = 'relative';
        if (totalBell > 0) {
          bellBtn.insertAdjacentHTML('beforeend', `<span class="badge-whatsapp-top badge-whatsapp-top-bell">${totalBell}</span>`);
        }
      }
    } catch (e) {
      console.error('Badge update error:', e);
    }
  },

  openEditProfileModal() {
    const user = this.currentUser || (typeof getSessionUser === 'function' ? getSessionUser() : null);
    if (!user) {
      if (typeof Toast !== 'undefined') Toast.error('Please log in first.');
      return;
    }

    const isStudent = (user.role === 'STUDENT');
    const db = typeof getLocalDB === 'function' ? getLocalDB() : { students: [] };
    const student = typeof findCurrentStudent === 'function' ? findCurrentStudent(db, user) : null;

    const elName = document.getElementById('edit-profile-name');
    const elEmail = document.getElementById('edit-profile-email');
    const elPass = document.getElementById('edit-profile-new-password');

    if (elName) {
      elName.value = (isStudent && student ? student.name : user.name) || '';
      elName.readOnly = isStudent;
      elName.style.background = isStudent ? '#f1f5f9' : '';
      elName.style.cursor = isStudent ? 'not-allowed' : '';
    }
    if (elEmail) elEmail.value = user.email || '';
    if (elPass) elPass.value = '';

    const studentFields = document.getElementById('edit-profile-student-fields');
    if (studentFields) {
      if (isStudent) {
        studentFields.style.display = 'block';
        const elRoll = document.getElementById('edit-profile-roll');
        const elPrn = document.getElementById('edit-profile-prn');
        const elDiv = document.getElementById('edit-profile-div');
        const elBatch = document.getElementById('edit-profile-batch');

        if (elRoll) {
          elRoll.value = student ? (student.roll_no || '') : '';
          elRoll.readOnly = true;
          elRoll.style.background = '#f1f5f9';
          elRoll.style.cursor = 'not-allowed';
        }
        if (elPrn) {
          elPrn.value = student ? (student.prn_no || '') : '';
          elPrn.readOnly = true;
          elPrn.style.background = '#f1f5f9';
          elPrn.style.cursor = 'not-allowed';
        }
        if (elDiv) {
          elDiv.value = student ? (student.division_id || 1) : 1;
          elDiv.disabled = true;
          elDiv.style.background = '#f1f5f9';
          elDiv.style.cursor = 'not-allowed';
        }
        if (elBatch) {
          elBatch.value = student ? (student.batch_id || 1) : 1;
          elBatch.disabled = true;
          elBatch.style.background = '#f1f5f9';
          elBatch.style.cursor = 'not-allowed';
        }
      } else {
        studentFields.style.display = 'none';
      }
    }

    const lockNotice = document.getElementById('edit-profile-student-lock-notice');
    if (lockNotice) {
      lockNotice.style.display = isStudent ? 'block' : 'none';
    }

    const isHod = (user.role === 'HOD');
    const hodPinGroup = document.getElementById('edit-profile-hod-pin-group');
    const elHodPin = document.getElementById('edit-profile-hod-pin');
    if (hodPinGroup) {
      hodPinGroup.style.display = isHod ? 'block' : 'none';
      if (elHodPin) {
        elHodPin.value = db.hod_pin || '1234';
      }
    }

    if (typeof openModal === 'function') openModal('modal-universal-edit-profile');
  },

  async handleSaveEditProfile(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit-edit-profile');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...`;
    }

    try {
      const user = this.currentUser || (typeof getSessionUser === 'function' ? getSessionUser() : null);
      if (!user) throw new Error('Session expired. Please log in again.');

      const isStudent = (user.role === 'STUDENT');
      const isHod = (user.role === 'HOD');
      const newEmail = document.getElementById('edit-profile-email').value.trim();
      const newPassword = document.getElementById('edit-profile-new-password').value;

      if (!newEmail) throw new Error('Email address is required.');

      const db = typeof getLocalDB === 'function' ? getLocalDB() : { users: [], students: [] };
      const student = typeof findCurrentStudent === 'function' ? findCurrentStudent(db, user) : null;
      const newName = isStudent ? (user.name || (student ? student.name : '')) : document.getElementById('edit-profile-name').value.trim();

      if (isHod) {
        const elHodPin = document.getElementById('edit-profile-hod-pin');
        if (elHodPin && elHodPin.value.trim()) {
          db.hod_pin = elHodPin.value.trim();
        }
        // Also update teacher email
        (db.teachers || []).forEach(t => {
          if (t.user_id == user.id || t.teacher_id_code === 'HOD101') {
            if (newEmail) t.email = newEmail;
          }
        });
      }

      const dbUser = (db.users || []).find(u => (u.id && user.id && u.id == user.id) || (u.email && u.email.trim().toLowerCase() === user.email.trim().toLowerCase()) || (user.prn_no && u.prn_no && u.prn_no.toUpperCase() === user.prn_no.toUpperCase()));

      if (dbUser) {
        if (!isStudent && newName) dbUser.name = newName;
        dbUser.email = newEmail;
        if (newPassword && newPassword.trim()) dbUser.password_hash = newPassword.trim();
      }

      if (!isStudent && newName) user.name = newName;
      user.email = newEmail;
      if (newPassword && newPassword.trim()) user.password_hash = newPassword.trim();

      if (student) {
        if (!isStudent && newName) student.name = newName;
        student.email = newEmail;
        if (newPassword && newPassword.trim()) student.password_hash = newPassword.trim();

        if (!isStudent) {
          const newRoll = document.getElementById('edit-profile-roll').value.trim();
          const newPrn = document.getElementById('edit-profile-prn').value.trim();
          const newDivId = parseInt(document.getElementById('edit-profile-div').value) || 1;
          const newBatchId = parseInt(document.getElementById('edit-profile-batch').value) || 1;

          if (newRoll) student.roll_no = newRoll;
          if (newPrn) student.prn_no = newPrn;
          student.division_id = newDivId;
          student.division_name = newDivId === 2 ? 'SE(ECE)-B' : 'SE(ECE)-A';
          student.batch_id = newBatchId;
          student.batch_name = newBatchId == 1 ? 'A1' : newBatchId == 2 ? 'A2' : newBatchId == 3 ? 'A3' : newBatchId == 4 ? 'B1' : newBatchId == 5 ? 'B2' : 'B3';
        }
      }

      if (typeof saveLocalDB === 'function') saveLocalDB(db);
      if (typeof setSessionUser === 'function') setSessionUser(user);
      this.currentUser = user;
      window.currentUser = user;

      // Update Supabase Auth metadata if connected
      if (typeof supabaseClient !== 'undefined' && supabaseClient && supabaseClient.auth) {
        try {
          await supabaseClient.auth.updateUser({
            email: newEmail,
            password: newPassword && newPassword.trim() ? newPassword.trim() : undefined,
            data: { display_name: newName }
          });
        } catch(err) {}
      }

      if (typeof Toast !== 'undefined') Toast.success('Profile updated successfully!');
      if (typeof closeModal === 'function') closeModal('modal-universal-edit-profile');
      this.setupNavigation();
      await this.handleRoute();
    } catch(err) {
      if (typeof Toast !== 'undefined') Toast.error(err.message || 'Failed to update profile.');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Profile Changes`;
      }
    }
  },

  promptFirstLoginSetup() {
    if (!this.currentUser || this.currentUser.role !== 'STUDENT') {
      if (typeof closeModal === 'function') closeModal('modal-first-login-setup');
      return;
    }
    const infoEl = document.getElementById('first-login-roster-info');
    if (infoEl) {
      infoEl.innerText = `${this.currentUser.name || 'Student'} — Roll No: ${this.currentUser.roll_no || 'N/A'} [${this.currentUser.division_name || 'SE(ECE)'}]`;
    }
    const prnInput = document.getElementById('first-login-prn');
    if (prnInput) {
      if (this.currentUser.prn_no && !this.currentUser.prn_no.startsWith('PRN-') && this.currentUser.prn_no.startsWith('U251')) {
        prnInput.value = this.currentUser.prn_no;
      } else if (!prnInput.value || prnInput.value.startsWith('PRN-')) {
        prnInput.value = '';
      }
    }
    const emailInput = document.getElementById('first-login-email');
    if (emailInput && (!emailInput.value || emailInput.value.startsWith('student.'))) {
      emailInput.value = '';
    }
    if (typeof openModal === 'function') openModal('modal-first-login-setup');
  },

  setupFirstLoginForm() {
    const form = document.getElementById('form-first-login-setup');
    if (!form || form.__bound) return;
    form.__bound = true;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('first-login-email').value.trim();
      const prn = document.getElementById('first-login-prn').value.trim();
      const pass = document.getElementById('first-login-password').value;
      const confirmPass = document.getElementById('first-login-confirm-password').value;
      const btn = document.getElementById('btn-submit-first-login');

      if (!email || !email.includes('@')) {
        Toast.error('Please enter a valid personal email address.');
        return;
      }
      if (!prn) {
        Toast.error('Please enter your official PRN number.');
        return;
      }
      if (!pass || pass.length < 6) {
        Toast.error('Password must be at least 6 characters long.');
        return;
      }
      if (pass !== confirmPass) {
        Toast.error('Passwords do not match. Please re-enter.');
        return;
      }

      try {
        if (btn) {
          btn.disabled = true;
          btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Activating Account...';
        }
        const res = await API.post('/api/student/setup-profile', {
          email,
          prn_no: prn,
          new_password: pass
        });

        Toast.success(res.message || 'Account activated successfully!');
        if (res.user) {
          this.currentUser = res.user;
          this.currentProfile = res.user;
          if (typeof setSessionUser === 'function') setSessionUser(res.user);
        }
        if (typeof closeModal === 'function') closeModal('modal-first-login-setup');
        this.setupNavigation();
        await this.handleRoute();
      } catch (err) {
        Toast.error((err && err.message) || 'Failed to activate profile. Please try again.');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-rocket"></i> Activate My Account & Open Dashboard';
        }
      }
    };
  }
};

// Reliable Initialization Guard (handles instant execution if DOM is already ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try { App.init(); } catch(e) {
      console.error('App init error:', e);
      const container = document.getElementById('view-container');
      if (container && typeof AuthView !== 'undefined') container.innerHTML = AuthView.render();
    }
  });
} else {
  try { App.init(); } catch(e) {
    console.error('App init error:', e);
    const container = document.getElementById('view-container');
    if (container && typeof AuthView !== 'undefined') container.innerHTML = AuthView.render();
  }
}
