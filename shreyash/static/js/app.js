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

  async checkAuthAndRoute() {
    try {
      const data = await API.get('/api/auth/me');
      this.currentUser = data.user;
      this.currentProfile = data.profile;
      window.currentUser = data.user;

      this.setupNavigation();
      await this.handleRoute();
    } catch (err) {
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
    } else if (role === 'HOD' || role === 'TEACHER') {
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

    // Fetch and display WhatsApp-style pending counter badges
    if (role === 'HOD' || role === 'TEACHER') {
      API.get('/api/teacher/certificates?status=PENDING').then(res => {
        const pendingCount = (res.certificates || []).length;
        if (pendingCount > 0) {
          const approvalNavEl = document.getElementById('nav-hod-approvals');
          if (approvalNavEl) {
            approvalNavEl.style.position = 'relative';
            approvalNavEl.innerHTML += `<span class="badge-whatsapp-nav">${pendingCount}</span>`;
          }
          const bellBtn = document.getElementById('btn-notifications-toggle');
          if (bellBtn) {
            bellBtn.style.position = 'relative';
            bellBtn.innerHTML += `<span class="badge-whatsapp-top">${pendingCount}</span>`;
          }
        }
      }).catch(() => {});

      API.get('/api/hod/password-requests').then(res => {
        const reqs = res.requests || [];
        const pendingPassCount = reqs.filter(r => r.status === 'PENDING').length;
        if (pendingPassCount > 0) {
          const passNavEl = document.getElementById('nav-hod-password-approvals');
          if (passNavEl) {
            passNavEl.style.position = 'relative';
            passNavEl.innerHTML += `<span class="badge-whatsapp-nav">${pendingPassCount}</span>`;
          }
        }
      }).catch(() => {});
    }

    document.getElementById('btn-logout').onclick = async () => {
      await API.post('/api/auth/logout');
      Toast.info('Logged out.');
      window.location.hash = '#/login';
      this.checkAuthAndRoute();
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
      try {
        const res = await API.get('/api/student/notifications');
        const notifs = res.notifications || [];
        const html = notifs.map(n => `
          <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
            <strong style="color: var(--primary);">${n.title}</strong>
            <p style="color: var(--text-main); margin-top: 0.2rem;">${n.message}</p>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${n.created_at}</span>
          </div>
        `).join('') || '<p style="padding: 1rem; color: var(--text-muted);">No notifications.</p>';

        document.getElementById('preview-modal-title').innerText = 'Notifications';
        document.getElementById('preview-modal-body').innerHTML = `<div style="width: 100%;">${html}</div>`;
        openModal('modal-file-preview');
        await API.post('/api/student/notifications');
      } catch (err) {
        Toast.error('Failed to fetch notifications.');
      }
    };
  },

  toggleMobileMenu() {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('mobile-backdrop');
    sidebar.classList.toggle('mobile-open');
    if (backdrop) backdrop.classList.toggle('active');
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

    if (!hash || hash === '#/' || hash === '#/login') {
      hash = this.currentUser.role === 'STUDENT' ? '#/student/dashboard' : '#/hod/dashboard';
      window.location.hash = hash;
      return;
    }

    const container = document.getElementById('view-container');
    const role = this.currentUser.role;
    const pageTitle = document.getElementById('page-title');

    // Strict Role Guards
    if (hash.startsWith('#/student') && role !== 'STUDENT') {
      Toast.error('403 ACCESS DENIED: Students only area');
      window.location.hash = '#/hod/dashboard';
      return;
    }

    if ((hash.startsWith('#/teacher') || hash.startsWith('#/hod')) && (role !== 'HOD' && role !== 'TEACHER')) {
      Toast.error('403 ACCESS DENIED: Faculty & HOD area only');
      window.location.hash = '#/student/dashboard';
      return;
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
    } else {
      container.innerHTML = `<div class="dashboard-container"><h2>404 Page Not Found</h2></div>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
