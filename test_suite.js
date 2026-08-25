
const fs = require('fs');

// Mock browser environment
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.sessionStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.window = {
  location: { hash: '#/student/dashboard', reload: () => {} },
  App: { currentUser: null, currentProfile: null, updateBadges: async () => {} }
};
global.document = {
  getElementById: (id) => null
};
global.fetch = async () => ({ json: async () => ({ success: true }), text: async () => '' });

// Load api.js
eval(fs.readFileSync('static/js/api.js', 'utf8'));

async function runTests() {
  console.log('--- STARTING RECOVERY & CONSISTENCY TEST SUITE ---');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] Case ${total}: ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] Case ${total}: ${message}`);
    }
  }

  const db = getLocalDB();
  const student = db.students[0]; // Roll 01

  // Case 1: Student exists + no certificate -> upload succeeds
  setSessionUser({ id: student.user_id, email: student.email, role: 'STUDENT', name: student.name });
  const uploadRes = await API.post('/api/student/certificates', {
    title: 'SIH 2026 1st Prize',
    event_name: 'Smart India Hackathon',
    category: 'Hackathon',
    certificate_date: '2026-08-20',
    file_url: 'data:image/jpeg;base64,mock',
    file_name: 'hackathon.jpg'
  });
  assert(uploadRes && uploadRes.certificate && uploadRes.certificate.status === 'PENDING', 'Student can upload certificate normally');

  // Case 2: Duplicate upload prevention
  let dupCaught = false;
  try {
    await API.post('/api/student/certificates', {
      title: 'SIH 2026 1st Prize',
      event_name: 'Smart India Hackathon',
      category: 'Hackathon',
      certificate_date: '2026-08-20'
    });
  } catch (err) {
    dupCaught = err.message && err.message.includes('A submission already exists');
  }
  assert(dupCaught, 'Prevent duplicate submission for same student and event');

  // Case 3: Unauthorized student calling recovery API directly -> rejected
  let unauthCaught = false;
  try {
    await API.post('/api/hod/recovery/search-students', { name_query: 'Aniket' });
  } catch (err) {
    unauthCaught = err.message && err.message.includes('Unauthorized access');
  }
  assert(unauthCaught, 'Unauthorized student cannot call HOD recovery endpoints');

  // Case 4: HOD searches student by Name strictly
  setSessionUser({ id: 1, email: 'teacher@campus.edu', role: 'HOD', name: 'Dr. S. K. Kulkarni (HOD)' });
  const searchRes = await API.post('/api/hod/recovery/search-students', { name_query: 'Aniket' });
  assert(searchRes && searchRes.students && searchRes.students.length >= 1 && searchRes.students[0].name.includes('ANIKET'), 'HOD can search student strictly by Name');

  // Case 5: Zero sensitive keys exposed in search result
  const s0 = searchRes.students[0];
  const hasNoSensitiveKeys = !s0.password_hash && !s0._id && !s0.mongo_id && !s0.password;
  assert(hasNoSensitiveKeys, 'Search results contain zero sensitive keys or internal database tokens');

  // Case 6: HOD student details lookup
  const detailsRes = await API.post('/api/hod/recovery/student-details', { student_id: student.id });
  assert(detailsRes && detailsRes.student && detailsRes.certificates.length >= 1, 'HOD can inspect live student backend submission state');

  // Case 7: HOD restore & upload certificate with Auto-Approval & Attendance
  const restoreRes = await API.post('/api/hod/recovery/restore-certificate', {
    student_id: student.id,
    title: 'Smart India Hackathon Winner',
    event_name: 'Smart India Hackathon',
    category: 'Hackathon',
    certificate_date: '2026-08-20',
    file_url: 'data:image/jpeg;base64,restored',
    file_name: 'sih_winner.jpg',
    auto_approve: true
  });
  assert(restoreRes && restoreRes.success && restoreRes.certificate.status === 'APPROVED', 'HOD can restore and auto-approve hackathon certificate');

  // Case 8: Audit log was recorded for the recovery action
  const updatedDb = getLocalDB();
  const lastLog = (updatedDb.audit_logs || []).slice(-1)[0];
  assert(lastLog && lastLog.student_name === student.name && lastLog.action.includes('CERTIFICATE_'), 'Audit log recorded for recovery action with actor and target');

  // Case 9: Duplicate attendance prevention on repeated recovery
  const initialArCount = updatedDb.activity_records.length;
  await API.post('/api/hod/recovery/restore-certificate', {
    student_id: student.id,
    title: 'Smart India Hackathon Winner',
    event_name: 'Smart India Hackathon',
    category: 'Hackathon',
    certificate_date: '2026-08-20',
    replace_existing_cert_id: restoreRes.certificate.id,
    auto_approve: true
  });
  const afterArCount = getLocalDB().activity_records.length;
  assert(initialArCount === afterArCount, 'Idempotency: No duplicate attendance records created on retry');

  // Case 10: Name disambiguation when multiple students match
  const multiSearch = await API.post('/api/hod/recovery/search-students', { name_query: 'a' });
  assert(multiSearch && multiSearch.students.length > 1, 'Multiple matching students returned for disambiguation without auto-selection');

  console.log(`\n===================================`);
  console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED!`);
  console.log(`===================================`);
}

runTests().catch(console.error);
