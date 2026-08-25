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

async function testReportsViewFix() {
  console.log('================================================================');
  console.log('         REPORTS VIEW & RECORD ACCUMULATION SUITE               ');
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

  // 1. Fetch /api/reports as HOD
  await API.post('/api/auth/login', { email: 'teacher@campus.edu', password: '1234' });
  const reportsDataBefore = await API.get('/api/reports');
  
  assert(reportsDataBefore.cumulative_student_summary !== undefined, 'cumulative_student_summary property exists');
  assert(reportsDataBefore.cumulative_student_summary.length === 122, `cumulative_student_summary contains all 122 students (Found: ${reportsDataBefore.cumulative_student_summary.length})`);
  
  const divAStudents = reportsDataBefore.cumulative_student_summary.filter(s => s.division_name === 'SE(ECE)-A' || s.division_id == 1);
  const divBStudents = reportsDataBefore.cumulative_student_summary.filter(s => s.division_name === 'SE(ECE)-B' || s.division_id == 2);
  assert(divAStudents.length === 62, `Division A contains exactly 62 students (Found: ${divAStudents.length})`);
  assert(divBStudents.length === 60, `Division B contains exactly 60 students (Found: ${divBStudents.length})`);

  // 2. Student uploads certificate and HOD approves it
  await API.post('/api/auth/logout');
  await API.post('/api/auth/login', { email: 'U251H007', password: 'Student@123' }); // Nikhil Awadhwal in Div B
  const certRes = await API.post('/api/student/certificates', {
    title: 'Smart India Hackathon 2026',
    event_name: 'Hackathon',
    category: 'Hackathon',
    certificate_date: '2026-08-25'
  });
  const certId = certRes.certificate.id;

  await API.post('/api/auth/logout');
  await API.post('/api/auth/login', { email: 'teacher@campus.edu', password: '1234' });
  await API.post(`/api/teacher/certificates/${certId}/approve`);

  // 3. Re-check /api/reports after HOD approval
  const reportsDataAfter = await API.get('/api/reports');
  const nikhilRecord = reportsDataAfter.cumulative_student_summary.find(s => s.prn_no === 'U251H007');
  
  assert(nikhilRecord !== undefined, 'Nikhil Awadhwal found in cumulative_student_summary');
  assert(nikhilRecord.total_accumulated_activities === 5, `Nikhil Awadhwal total accumulated lectures = 5 (Found: ${nikhilRecord.total_accumulated_activities})`);
  assert(reportsDataAfter.reports.length === 1, `Certificate logs table has 1 record (Found: ${reportsDataAfter.reports.length})`);
  assert(reportsDataAfter.reports[0].status === 'APPROVED', `Certificate log status is APPROVED`);

  console.log('\n================================================================');
  console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (100% REPORTS SUCCESS)`);
  console.log('================================================================\n');
}

testReportsViewFix();
