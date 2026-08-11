/* AuthView Controller - Login, Student Self-Registration, Reset & HOD Password Request */
const AuthView = {
  activeTab: 'login',

  render() {
    if (this.activeTab === 'register') {
      return this.renderRegisterForm();
    } else if (this.activeTab === 'forgot') {
      return this.renderForgotPasswordForm();
    }
    return this.renderLoginForm();
  },

  renderLoginForm() {
    return `
      <div class="login-wrapper">
        <div class="login-card">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div class="vibe-badge">
              <span class="vibe-badge-dot"></span>
              <span>ECE MANAGEMENT SYSTEM</span>
            </div>

            <div class="brand-icon" style="margin: 0.5rem auto 1rem; width: 56px; height: 56px; font-size: 1.7rem;">
              <i class="fa-solid fa-microchip"></i>
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.75rem; font-weight: 800;">ECE Management</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.3rem;">Student Activity, Certificate & Timetable Portal</p>
          </div>

          <!-- Auth Mode Toggle Tabs -->
          <div style="display: flex; background: #f1f5f9; padding: 0.25rem; border-radius: var(--radius-full); margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
            <button type="button" class="btn btn-primary btn-sm" style="flex: 1; justify-content: center; font-size: 0.8rem;" onclick="AuthView.switchTab('login')">
              <i class="fa-solid fa-right-to-bracket"></i> Sign In
            </button>
            <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; justify-content: center; font-size: 0.8rem; border: none; background: transparent; color: var(--text-muted);" onclick="AuthView.switchTab('register')">
              <i class="fa-solid fa-user-plus"></i> New Student Sign Up
            </button>
          </div>

          <!-- Quick Demo Buttons -->
          <div style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.4rem;">
            <label style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-muted); font-weight: 700;">Quick Demo Login:</label>
            <div style="display: flex; gap: 0.4rem;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillDemo('student@campus.edu', 'Student@123')" style="flex: 1; padding: 0.5rem; font-size: 0.7rem;">
                <i class="fa-solid fa-user-graduate" style="color: var(--primary);"></i> Student (Div A)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillDemo('student2@campus.edu', 'Student@123')" style="flex: 1; padding: 0.5rem; font-size: 0.7rem;">
                <i class="fa-solid fa-user-graduate" style="color: var(--accent-gold);"></i> Student (Div B)
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AuthView.fillDemo('teacher@campus.edu', 'Teacher@123')" style="flex: 1; padding: 0.5rem; font-size: 0.7rem;">
                <i class="fa-solid fa-chalkboard-user" style="color: var(--accent-green);"></i> HOD Portal
              </button>
            </div>
          </div>

          <form id="form-login" onsubmit="AuthView.handleLogin(event)">
            <div class="form-group">
              <label><i class="fa-solid fa-envelope" style="color: var(--primary);"></i> Email Address / Username</label>
              <input type="email" id="login-email" class="form-control" placeholder="e.g. student@campus.edu" required>
            </div>

            <div class="form-group">
              <label><i class="fa-solid fa-lock" style="color: var(--primary);"></i> Password</label>
              <input type="password" id="login-password" class="form-control" placeholder="••••••••" required>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-muted);">
                <input type="checkbox" checked> Remember Me
              </label>
              <a href="javascript:void(0)" style="font-weight: 700; color: var(--primary);" onclick="AuthView.switchTab('forgot')">Forgot Password?</a>
            </div>

            <button type="submit" id="btn-login-submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.85rem;">
              Sign In to Portal <i class="fa-solid fa-arrow-right"></i>
            </button>
          </form>
        </div>
      </div>
    `;
  },

  renderRegisterForm() {
    return `
      <div class="login-wrapper">
        <div class="login-card" style="max-width: 520px;">
          <div style="text-align: center; margin-bottom: 1.25rem;">
            <div class="vibe-badge">
              <span class="vibe-badge-dot"></span>
              <span>STUDENT REGISTRATION</span>
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800;">Create Student Account</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.2rem;">Enroll into ECE Department Division A or B</p>
          </div>

          <!-- Auth Mode Toggle Tabs -->
          <div style="display: flex; background: #f1f5f9; padding: 0.25rem; border-radius: var(--radius-full); margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
            <button type="button" class="btn btn-secondary btn-sm" style="flex: 1; justify-content: center; font-size: 0.8rem; border: none; background: transparent; color: var(--text-muted);" onclick="AuthView.switchTab('login')">
              <i class="fa-solid fa-right-to-bracket"></i> Sign In
            </button>
            <button type="button" class="btn btn-primary btn-sm" style="flex: 1; justify-content: center; font-size: 0.8rem;" onclick="AuthView.switchTab('register')">
              <i class="fa-solid fa-user-plus"></i> New Student Sign Up
            </button>
          </div>

          <form id="form-self-register" onsubmit="AuthView.handleSelfRegister(event)">
            <div class="form-group">
              <label>Full Name <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="reg-name" class="form-control" placeholder="e.g. Sonal Deshmukh" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
              <div class="form-group">
                <label>Roll No <span style="color: var(--accent-rose);">*</span></label>
                <input type="text" id="reg-roll" class="form-control" placeholder="e.g. 42" required>
              </div>

              <div class="form-group">
                <label>PRN Number <span style="color: var(--accent-rose);">*</span></label>
                <input type="text" id="reg-prn" class="form-control" placeholder="e.g. 20240142" required>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
              <div class="form-group">
                <label>Division <span style="color: var(--accent-rose);">*</span></label>
                <select id="reg-div" class="form-control" required onchange="AuthView.updateRegisterBatch(this.value)">
                  <option value="1">SE(ECE)-A</option>
                  <option value="2">SE(ECE)-B</option>
                </select>
              </div>

              <div class="form-group">
                <label>Lab Batch <span style="color: var(--accent-rose);">*</span></label>
                <select id="reg-batch" class="form-control" required>
                  <option value="1">Batch A1</option>
                  <option value="2">Batch A2</option>
                  <option value="3">Batch A3</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Email Address <span style="color: var(--accent-rose);">*</span></label>
              <input type="email" id="reg-email" class="form-control" placeholder="e.g. sonal@campus.edu" required>
            </div>

            <div class="form-group">
              <label>Password <span style="color: var(--accent-rose);">*</span></label>
              <input type="password" id="reg-password" class="form-control" placeholder="••••••••" required>
            </div>

            <button type="submit" id="btn-reg-submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 0.85rem; margin-top: 0.5rem;">
              Complete Registration <i class="fa-solid fa-check"></i>
            </button>
          </form>
        </div>
      </div>
    `;
  },

  renderForgotPasswordForm() {
    return `
      <div class="login-wrapper">
        <div class="login-card" style="max-width: 480px;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div class="vibe-badge">
              <span class="vibe-badge-dot"></span>
              <span>STRICT HOD APPROVAL REQUIRED</span>
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800;">Request Password Change</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.2rem;">Submit a password reset request for HOD review & approval</p>
          </div>

          <form id="form-forgot-password" onsubmit="AuthView.handleRequestPasswordReset(event)">
            <div class="form-group">
              <label><i class="fa-solid fa-envelope" style="color: var(--primary);"></i> Account Email Address <span style="color: var(--accent-rose);">*</span></label>
              <input type="email" id="reset-email" class="form-control" placeholder="e.g. student@campus.edu" required>
            </div>

            <div class="form-group">
              <label><i class="fa-solid fa-id-card" style="color: var(--primary);"></i> Student PRN Number <span style="color: var(--accent-rose);">*</span></label>
              <input type="text" id="reset-prn" class="form-control" placeholder="e.g. 20240123" required>
            </div>

            <div class="form-group">
              <label><i class="fa-solid fa-key" style="color: var(--primary);"></i> Requested New Password <span style="color: var(--accent-rose);">*</span></label>
              <input type="password" id="reset-new-password" class="form-control" placeholder="••••••••" required>
            </div>

            <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
              <button type="button" class="btn btn-secondary" style="flex: 1; justify-content: center;" onclick="AuthView.switchTab('login')">
                Cancel
              </button>
              <button type="submit" id="btn-request-reset-submit" class="btn btn-primary" style="flex: 1.8; justify-content: center;">
                Submit Request to HOD <i class="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.getElementById('view-container').innerHTML = this.render();
  },

  updateRegisterBatch(divId) {
    const batchSelect = document.getElementById('reg-batch');
    if (!batchSelect) return;
    if (divId == "1") {
      batchSelect.innerHTML = `<option value="1">Batch A1</option><option value="2">Batch A2</option><option value="3">Batch A3</option>`;
    } else {
      batchSelect.innerHTML = `<option value="4">Batch B1</option><option value="5">Batch B2</option><option value="6">Batch B3</option>`;
    }
  },

  fillDemo(email, password) {
    this.switchTab('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btnSubmit = document.getElementById('btn-login-submit');

    if (btnSubmit) {
      btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Signing In...`;
      btnSubmit.disabled = true;
    }

    try {
      const res = await API.post('/api/auth/login', { email, password });
      Toast.success('Login successful!');
      
      App.currentUser = res.user;
      window.currentUser = res.user;
      
      const meData = await API.get('/api/auth/me').catch(() => ({ profile: null }));
      App.currentProfile = meData.profile;

      App.setupNavigation();
      window.location.hash = res.redirect;
      await App.handleRoute();
    } catch (err) {
      Toast.error(err.message || 'Login failed.');
      if (btnSubmit) {
        btnSubmit.innerHTML = `Sign In to Portal <i class="fa-solid fa-arrow-right"></i>`;
        btnSubmit.disabled = false;
      }
    }
  },

  async handleSelfRegister(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-reg-submit');
    btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Registering...`;
    btnSubmit.disabled = true;

    const payload = {
      name: document.getElementById('reg-name').value,
      roll_no: document.getElementById('reg-roll').value,
      prn_no: document.getElementById('reg-prn').value,
      division_id: document.getElementById('reg-div').value,
      batch_id: document.getElementById('reg-batch').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value
    };

    try {
      const res = await API.post('/api/auth/register-student', payload);
      Toast.success(res.message || 'Registration successful!');

      App.currentUser = res.user;
      window.currentUser = res.user;

      const meData = await API.get('/api/auth/me').catch(() => ({ profile: null }));
      App.currentProfile = meData.profile;

      App.setupNavigation();
      window.location.hash = res.redirect;
      await App.handleRoute();
    } catch (err) {
      Toast.error(err.message || 'Registration failed.');
      btnSubmit.innerHTML = `Complete Registration <i class="fa-solid fa-check"></i>`;
      btnSubmit.disabled = false;
    }
  },

  async handleRequestPasswordReset(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-request-reset-submit');
    btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting to HOD...`;
    btnSubmit.disabled = true;

    const payload = {
      email: document.getElementById('reset-email').value,
      prn_no: document.getElementById('reset-prn').value,
      new_password: document.getElementById('reset-new-password').value
    };

    try {
      const res = await API.post('/api/auth/request-password-reset', payload);
      Toast.success(res.message || 'Password reset request submitted to HOD!');
      this.switchTab('login');
    } catch (err) {
      Toast.error(err.message || 'Failed to submit password reset request.');
      btnSubmit.innerHTML = `Submit Request to HOD <i class="fa-solid fa-paper-plane"></i>`;
      btnSubmit.disabled = false;
    }
  }
};
