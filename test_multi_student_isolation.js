const fs = require('fs');

// Mock localStorage and sessionStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};
global.sessionStorage = {
  getItem: (k) => storage['sess_' + k] || null,
  setItem: (k, v) => { storage['sess_' + k] = String(v); },
  removeItem: (k) => { delete storage['sess_' + k]; },
  clear: () => { for (const k in storage) if (k.startsWith('sess_')) delete storage[k]; }
};

// Mock fetch
global.fetch = () => Promise.resolve({
  json: () => Promise.resolve({ status: 'ok' }),
  text: () => Promise.resolve('')
});

// Load API
eval(fs.readFileSync('static/js/api.js', 'utf8'));

async function testMultiStudentIsolation() {
  console.log('================================================================');
  console.log('   MULTI-STUDENT LOGIN & DATA ISOLATION VERIFICATION SUITE       ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, msg) {
    total++;
    if (cond) {
      console.log(`[PASS] Test ${String(total).padStart(2, '0')}: ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${String(total).padStart(2, '0')}: ${msg}`);
      process.exit(1);
    }
  }

  // 1. Student A logs in (U251H001 - ADE ANIKET)
  const loginA = await API.post('/api/auth/login', { email: 'U251H001', password: 'Student@123' });
  assert(loginA.user.prn_no === 'U251H001' && loginA.user.name === 'ADE ANIKET DATTATRAY', 'Student A logs in with PRN U251H001');

  // Student A uploads a certificate
  const certA = await API.post('/api/student/certificates', {
    title: 'Hackathon Award Div A',
    event_name: 'Smart India Hackathon',
    category: 'Hackathon',
    certificate_date: '2026-08-20'
  });
  assert(certA.certificate.prn_no === 'U251H001', 'Student A certificate is tagged with PRN U251H001');

  // Student A checks their certificates
  const certsListA = await API.get('/api/student/certificates');
  assert(certsListA.certificates.length === 1 && certsListA.certificates[0].title === 'Hackathon Award Div A', 'Student A sees exactly their 1 certificate');

  // 2. Student A logs out
  await API.post('/api/auth/logout');
  assert(getSessionUser() === null, 'Student A session is completely cleared on logout');

  // 3. Student B logs in (U251H007 - AWADHWAL NIKHIL MUKESH)
  const loginB = await API.post('/api/auth/login', { email: 'U251H007', password: 'Student@123' });
  assert(loginB.user.prn_no === 'U251H007' && loginB.user.name === 'AWADHWAL NIKHIL MUKESH', 'Student B logs in with PRN U251H007');

  // Student B checks their certificates (must be 0 - CANNOT see Student A's certificate!)
  const certsListB = await API.get('/api/student/certificates');
  assert(certsListB.certificates.length === 0, 'Student B sees 0 certificates (Student A data is strictly hidden!)');

  // Student B dashboard must have 0 certificates
  const dashB = await API.get('/api/student/dashboard');
  assert(dashB.stats.total_certificates === 0 && dashB.student.prn_no === 'U251H007', 'Student B dashboard is 100% isolated to Student B');

  // Student B uploads their own certificate
  const certB = await API.post('/api/student/certificates', {
    title: 'Robotics Workshop Div B',
    event_name: 'Techfest 2026',
    category: 'Workshop',
    certificate_date: '2026-08-22'
  });
  assert(certB.certificate.prn_no === 'U251H007', 'Student B certificate is tagged with PRN U251H007');

  // Student B now sees exactly 1 certificate
  const certsListB2 = await API.get('/api/student/certificates');
  assert(certsListB2.certificates.length === 1 && certsListB2.certificates[0].title === 'Robotics Workshop Div B', 'Student B sees only their own certificate');

  // 4. HOD logs in and reviews desk
  await API.post('/api/auth/logout');
  const loginHod = await API.post('/api/auth/login', { email: 'teacher@campus.edu', password: '1234' });
  assert(loginHod.user.role === 'HOD', 'HOD logs in');

  const hodCerts = await API.get('/api/teacher/certificates');
  assert(hodCerts.certificates.length === 2, 'HOD correctly sees all submitted certificates (2 total)');

  // HOD approves Student A's certificate
  const certAId = certA.certificate.id;
  await API.post(`/api/teacher/certificates/${certAId}/approve`);

  // 5. Switch back to Student A: Student A has 1 approved certificate, Student B still has 1 pending
  await API.post('/api/auth/logout');
  await API.post('/api/auth/login', { email: 'U251H001', password: 'Student@123' });
  const dashA = await API.get('/api/student/dashboard');
  assert(dashA.stats.approved_certificates === 1 && dashA.stats.pending_certificates === 0 && dashA.total_credited_lectures === 5, 'Student A sees 1 approved certificate and 5 credited lectures');

  // Switch back to Student B: Student B has 1 pending certificate and 0 approved lectures
  await API.post('/api/auth/logout');
  await API.post('/api/auth/login', { email: 'U251H007', password: 'Student@123' });
  const dashB2 = await API.get('/api/student/dashboard');
  assert(dashB2.stats.approved_certificates === 0 && dashB2.stats.pending_certificates === 1 && dashB2.total_credited_lectures === 0, 'Student B sees 0 approved certificates and 0 credited lectures (Strict Isolation!)');

  console.log('\n================================================================');
  console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (100% ISOLATION SUCCESS)`);
  console.log('================================================================\n');
}

testMultiStudentIsolation();
