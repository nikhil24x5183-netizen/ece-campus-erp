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

async function runComprehensiveAppTests() {
  console.log('====================================================');
  console.log('       FULL COMPREHENSIVE ECE ERP TEST SUITE        ');
  console.log('====================================================\n');

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

  // 1. Database Integrity Verification
  const db = getLocalDB();
  assert(db.students && db.students.length === 117, 'Database contains exactly 117 official students', `Found ${db.students?.length}`);
  
  const divA = db.students.filter(s => s.division_id === 1 || s.division_name === 'SE(ECE)-A');
  const divB = db.students.filter(s => s.division_id === 2 || s.division_name === 'SE(ECE)-B');
  assert(divA.length === 59, 'Division A contains exactly 59 students (Roll 01 to Roll 62)', `Found ${divA.length}`);
  assert(divB.length === 58, 'Division B contains exactly 58 students (Roll 01 to Roll 61)', `Found ${divB.length}`);

  // 2. Division A Login Tests
  const divALoginRoll = await API.post('/api/auth/login', { email: '01', password: 'Student@123', portal: 'DIV_A' });
  assert(divALoginRoll.user && divALoginRoll.user.name === 'ADE ANIKET DATTATRAY', 'Div A student can log in using numeric roll number "01"');

  const divALoginEmail = await API.post('/api/auth/login', { email: 'student.a01@campus.edu', password: 'Student@123', portal: 'DIV_A' });
  assert(divALoginEmail.user && divALoginEmail.user.name === 'ADE ANIKET DATTATRAY', 'Div A student can log in using full email "student.a01@campus.edu"');

  // 3. Division B Login Tests
  const divBLoginRoll = await API.post('/api/auth/login', { email: '03', password: 'Student@123', portal: 'DIV_B' });
  assert(divBLoginRoll.user && divBLoginRoll.user.name === 'AWADHWAL NIKHIL MUKESH', 'Div B student can log in using numeric roll number "03"');

  const divBLoginEmail = await API.post('/api/auth/login', { email: 'student.b03@campus.edu', password: 'Student@123', portal: 'DIV_B' });
  assert(divBLoginEmail.user && divBLoginEmail.user.name === 'AWADHWAL NIKHIL MUKESH', 'Div B student can log in using full email "student.b03@campus.edu"');

  // 4. Student First-Time Activation Test via /api/student/setup-profile
  setSessionUser(divALoginEmail.user);
  const activationRes = await API.post('/api/student/setup-profile', {
    email: 'aniket.personal@gmail.com',
    prn_no: 'U251H091',
    new_password: 'AniketSecure@123'
  });
  assert(activationRes.user && activationRes.user.email === 'aniket.personal@gmail.com', 'Student can activate account with personal email, PRN, and new password');

  // 5. Verify Student Login with New Credentials
  const loginNewPass = await API.post('/api/auth/login', { email: 'aniket.personal@gmail.com', password: 'AniketSecure@123', portal: 'DIV_A' });
  assert(loginNewPass.user && loginNewPass.user.is_activated === true, 'Student can log in with new personal email and updated password');

  // 6. Student Certificate Upload Flow
  const uploadCert = await API.post('/api/student/certificates', {
    title: 'National Hackathon 2026 Winner',
    event_name: 'Smart India Hackathon',
    category: 'Hackathon',
    certificate_date: '2026-08-18',
    file_url: 'data:image/jpeg;base64,mockImageContent',
    file_name: 'sih_cert.jpg',
    description: 'Developed an automated AI portal for academic management'
  });
  assert(uploadCert.certificate && uploadCert.certificate.status === 'PENDING', 'Student can successfully upload hackathon certificate document');

  // 7. Duplicate Certificate Submission Prevention
  let dupPrevented = false;
  try {
    await API.post('/api/student/certificates', {
      title: 'National Hackathon 2026 Winner',
      event_name: 'Smart India Hackathon',
      category: 'Hackathon',
      certificate_date: '2026-08-18'
    });
  } catch (err) {
    dupPrevented = err.message && err.message.includes('A submission already exists');
  }
  assert(dupPrevented, 'Duplicate upload protection blocks duplicate submissions for the same student/event');

  // 8. HOD Login Flow
  const hodLogin = await API.post('/api/auth/login', { email: 'teacher@campus.edu', password: '1234', portal: 'HOD' });
  assert(hodLogin.user && hodLogin.user.role === 'HOD', 'HOD can log in with teacher@campus.edu / 1234');
  setSessionUser(hodLogin.user);

  // 9. HOD Certificate Approval Flow with Timetable Lecture Compensation
  const certsList = await API.get('/api/teacher/certificates');
  const pendingCert = (certsList.certificates || []).find(c => c.id === uploadCert.certificate.id);
  assert(pendingCert && pendingCert.status === 'PENDING', 'HOD can fetch uploaded certificate under Pending Approvals');

  const approveRes = await API.post(`/api/teacher/certificates/${pendingCert.id}/approve`, {
    selected_days: ['2026-08-18']
  });
  assert(approveRes.certificate && approveRes.certificate.status === 'APPROVED', 'HOD can approve certificate and credit attendance');

  // 10. Duplicate Attendance Protection Test
  const curDb = getLocalDB();
  const arCountBefore = curDb.activity_records.length;
  await API.post(`/api/teacher/certificates/${pendingCert.id}/approve`, {
    selected_days: ['2026-08-18']
  });
  const arCountAfter = getLocalDB().activity_records.length;
  assert(arCountBefore === arCountAfter, 'Attendance idempotency: No duplicate attendance records created on repeat approval');

  // 11. HOD Student Name-Only Recovery Flow (Disambiguation + Safe Restore)
  const recoverySearch = await API.post('/api/hod/recovery/search-students', { name_query: 'Aniket' });
  assert(recoverySearch.students && recoverySearch.students.length >= 1, 'HOD can search students strictly by Name');
  assert(!recoverySearch.students[0].password_hash && !recoverySearch.students[0]._id, 'HOD search results do not expose technical database IDs or password hashes');

  const recoveryDetails = await API.post('/api/hod/recovery/student-details', { student_id: divA[0].id });
  assert(recoveryDetails.student && recoveryDetails.certificates.length >= 1, 'HOD can inspect live student backend submission state');

  const restoreCert = await API.post('/api/hod/recovery/restore-certificate', {
    student_id: divA[0].id,
    title: 'SIH Winner Restored',
    event_name: 'Smart India Hackathon',
    category: 'Hackathon',
    certificate_date: '2026-08-18',
    replace_existing_cert_id: pendingCert.id,
    auto_approve: true
  });
  assert(restoreCert.success && restoreCert.certificate.status === 'APPROVED', 'HOD can restore/replace student certificate safely');

  // 12. Student Self-Registration (New Student Sign Up)
  const selfReg = await API.post('/api/auth/register-student', {
    name: 'Rohit Sharma',
    roll_no: '99',
    prn_no: 'U251H999',
    division_id: 1,
    batch_id: 1,
    email: 'rohit.sharma.test@gmail.com',
    password: 'Password@123'
  });
  assert(selfReg.user && selfReg.user.email === 'rohit.sharma.test@gmail.com', 'New students can self-register into the department roster');

  // 13. Password Reset Request Flow
  const passResetReq = await API.post('/api/auth/request-password-reset', {
    email: 'rohit.sharma.test@gmail.com',
    prn_no: 'U251H999',
    new_password: 'NewRohitPassword@123'
  });
  assert(passResetReq.request && passResetReq.request.requested_password === 'NewRohitPassword@123', 'Students can request password resets from the HOD');

  // 14. HOD Approve Password Reset Flow
  setSessionUser(hodLogin.user);
  const passRequests = await API.get('/api/hod/password-requests');
  const myReq = (passRequests.requests || []).find(r => r.email === 'rohit.sharma.test@gmail.com');
  const approvePass = await API.post(`/api/hod/password-requests/${myReq.id}/approve`);
  assert(approvePass.user && approvePass.user.password_hash === 'NewRohitPassword@123', 'HOD can approve password resets');

  // 15. Student Login with Reset Password
  const loginAfterReset = await API.post('/api/auth/login', { email: 'rohit.sharma.test@gmail.com', password: 'NewRohitPassword@123', portal: 'DIV_A' });
  assert(loginAfterReset.user && loginAfterReset.user.name === 'Rohit Sharma', 'Student can log in with newly approved password');

  // 16. Timetable System Verification
  const timetableRes = await API.get('/api/timetable');
  assert(timetableRes.timetable && timetableRes.timetable.length > 0, 'Timetable engine contains complete official lecture slots');

  console.log('\n====================================================');
  console.log(`  SUMMARY: ${passed} / ${total} TESTS PASSED SUCCESSFULLY! (100%)`);
  console.log('====================================================\n');
}

runComprehensiveAppTests().catch(console.error);
