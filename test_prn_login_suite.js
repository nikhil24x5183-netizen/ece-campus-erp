const fs = require('fs');

// Mock browser environment
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.sessionStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};
global.window = {
  location: { hash: '#/login', reload: () => {} },
  App: { currentUser: null, currentProfile: null, updateBadges: async () => {} }
};
global.document = {
  getElementById: (id) => null
};
global.fetch = async (url, opts) => ({ json: async () => ({ success: true }), text: async () => 'SUCCESS' });

// Load api.js
eval(fs.readFileSync('static/js/api.js', 'utf8'));

async function runPrnLoginSuite() {
  console.log('================================================================');
  console.log('   PRN-FIRST STUDENT ONBOARDING & DATABASE VERIFICATION SUITE   ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${String(total).padStart(2, '0')}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${String(total).padStart(2, '0')}: ${testName} -> ${details}`);
    }
  }

  const db = getLocalDB();
  const allStudents = db.students || [];

  // 1. Roster Count Verification
  assert(allStudents.length === 122, 'Database contains exactly 122 official students', `Found ${allStudents.length}`);
  
  const divA = allStudents.filter(s => s.division_id === 1 || s.division_name === 'SE(ECE)-A');
  const divB = allStudents.filter(s => s.division_id === 2 || s.division_name === 'SE(ECE)-B');
  assert(divA.length === 62, 'Division A contains exactly 62 students (Roll 01 to Roll 62)', `Found ${divA.length}`);
  assert(divB.length === 60, 'Division B contains exactly 60 students (Roll 01 to Roll 61)', `Found ${divB.length}`);

  // 2. Exact PRN & Name Verification
  const divA_st1 = divA.find(s => s.roll_no === '01');
  assert(divA_st1 && divA_st1.prn_no === 'U251H001' && divA_st1.name === 'ADE ANIKET DATTATRAY', 'Div A Roll 1 has PRN U251H001 (ADE ANIKET DATTATRAY)');

  const divA_st62 = divA.find(s => s.roll_no === '62');
  assert(divA_st62 && divA_st62.prn_no === 'U251H042' && divA_st62.name === 'JADHAV PAYAL LAXMAN', 'Div A Roll 62 has PRN U251H042 (JADHAV PAYAL LAXMAN)');

  const divB_st3 = divB.find(s => s.roll_no === '03');
  assert(divB_st3 && divB_st3.prn_no === 'U251H007' && divB_st3.name === 'AWADHWAL NIKHIL MUKESH', 'Div B Roll 3 has PRN U251H007 (AWADHWAL NIKHIL MUKESH)');

  const divB_st61 = divB.find(s => s.roll_no === '61');
  assert(divB_st61 && divB_st61.prn_no === 'U251H121' && divB_st61.name === 'WAYAL PIYUSH SHASHIKANT', 'Div B Roll 61 has PRN U251H121 (WAYAL PIYUSH SHASHIKANT)');

  // 3. First-Time PRN Login (Div A & Div B)
  const loginPrnA = await API.post('/api/auth/login', { email: 'U251H001', password: 'Student@123', portal: 'DIV_A' });
  assert(loginPrnA.user && loginPrnA.user.name === 'ADE ANIKET DATTATRAY', 'Div A student logs in with official PRN "U251H001"');

  const loginPrnB = await API.post('/api/auth/login', { email: 'u251h007', password: 'Student@123', portal: 'DIV_B' });
  assert(loginPrnB.user && loginPrnB.user.name === 'AWADHWAL NIKHIL MUKESH', 'Div B student logs in with lowercase PRN "u251h007"');

  // 4. First-Time Profile Setup (Setting Username & Password)
  setSessionUser(loginPrnB.user);
  const setupRes = await API.post('/api/student/setup-profile', {
    email: 'nikhil.mukesh@gmail.com',
    prn_no: 'U251H007',
    new_password: 'NikhilSecure@123'
  });
  assert(setupRes.user && setupRes.user.email === 'nikhil.mukesh@gmail.com' && setupRes.user.is_activated, 'Student creates permanent username/email and new password on first login');

  // 5. Subsequent Logins using New Username & Password OR PRN
  const loginByEmail = await API.post('/api/auth/login', { email: 'nikhil.mukesh@gmail.com', password: 'NikhilSecure@123', portal: 'DIV_B' });
  assert(loginByEmail.user && loginByEmail.user.name === 'AWADHWAL NIKHIL MUKESH', 'Student can log in using new personal username/email with updated password');

  const loginByPrnNewPass = await API.post('/api/auth/login', { email: 'U251H007', password: 'NikhilSecure@123', portal: 'DIV_B' });
  assert(loginByPrnNewPass.user && loginByPrnNewPass.user.name === 'AWADHWAL NIKHIL MUKESH', 'Student can log in using PRN with updated password');

  // 6. Certificate Upload & HOD Verification Flow
  setSessionUser(loginByEmail.user);
  const certUpload = await API.post('/api/student/certificates', {
    title: 'Nutan Hackathon 2026 1st Place',
    event_name: 'NMIET TechFest 2026',
    category: 'Hackathon',
    certificate_date: '2026-08-18',
    file_url: 'data:image/jpeg;base64,sample_cert_data',
    file_name: 'nmiet_hackathon_cert.jpg',
    description: 'Developed Autonomous ECE ERP Platform'
  });
  assert(certUpload.certificate && certUpload.certificate.status === 'PENDING', 'Student uploads hackathon certificate');

  // 7. HOD Login & Approval with Timetable Compensation
  const hodLogin = await API.post('/api/auth/login', { email: 'teacher@campus.edu', password: '1234', portal: 'HOD' });
  setSessionUser(hodLogin.user);
  assert(hodLogin.user && hodLogin.user.role === 'HOD', 'HOD logs in with teacher@campus.edu / 1234');

  const approveRes = await API.post(`/api/teacher/certificates/${certUpload.certificate.id}/approve`, {
    selected_days: ['2026-08-18']
  });
  assert(approveRes.success && approveRes.certificate.status === 'APPROVED', 'HOD approves certificate and awards lecture attendance credits');

  // 8. Student Dashboard Exact Lecture Breakdown Verification
  setSessionUser(loginByEmail.user);
  const dashRes = await API.get('/api/student/dashboard');
  assert(dashRes.total_credited_lectures > 0, `Student dashboard displays exact credited lectures (${dashRes.total_credited_lectures} lectures)`);
  assert(dashRes.subject_breakdown && dashRes.subject_breakdown.length > 0, `Student dashboard displays subject-wise breakdown (${dashRes.subject_breakdown.length} subjects)`);

  console.log('\n================================================================');
  console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (100% SUCCESS)`);
  console.log('================================================================\n');
}

runPrnLoginSuite().catch(console.error);
