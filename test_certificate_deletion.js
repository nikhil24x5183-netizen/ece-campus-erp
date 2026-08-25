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

async function testCertificateDeletion() {
  console.log('================================================================');
  console.log('      CERTIFICATE PERMANENT DELETION VERIFICATION SUITE         ');
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

  // 1. Student logs in and uploads a certificate
  await API.post('/api/auth/login', { email: 'U251H007', password: 'Student@123' });
  const certRes = await API.post('/api/student/certificates', {
    title: 'Hackculture Fest',
    event_name: 'Hackathon',
    category: 'Hackathon',
    certificate_date: '2026-08-25'
  });
  const certId = certRes.certificate.id;
  assert(certId !== undefined, 'Certificate created with ID ' + certId);

  // 2. HOD logs in and views certificates
  await API.post('/api/auth/logout');
  await API.post('/api/auth/login', { email: 'teacher@campus.edu', password: '1234' });
  
  const hodCertsBefore = await API.get('/api/teacher/certificates');
  assert(hodCertsBefore.certificates.some(c => String(c.id) === String(certId)), 'HOD sees the newly uploaded certificate');

  // 3. HOD rejects the certificate
  await API.post(`/api/teacher/certificates/${certId}/reject`, { reason: 'Incomplete / Invalid Document' });
  
  // 4. HOD deletes the rejected certificate
  const deleteRes = await API.delete(`/api/teacher/certificates/${certId}`);
  assert(deleteRes.success === true, 'Delete API returned success');

  // 5. Verify certificate is gone from local DB and API.get
  const hodCertsAfter = await API.get('/api/teacher/certificates');
  assert(!hodCertsAfter.certificates.some(c => String(c.id) === String(certId)), 'Certificate is removed from HOD certificates list');

  // 6. Test fetchCloudDB sync simulation: Even if cloud DB returns the deleted cert, mergeDBs tombstoning MUST drop it!
  const mockCloudDb = {
    certificates: [
      { id: certId, title: 'Hackculture Fest', status: 'REJECTED' }
    ],
    deleted_cert_ids: []
  };
  
  const localDb = getLocalDB();
  const merged = mergeDBs(localDb, mockCloudDb);
  assert(!merged.certificates.some(c => String(c.id) === String(certId)), 'Tombstoned mergeDBs prevents deleted certificate from returning!');

  console.log('\n================================================================');
  console.log(`  RESULT: ${passed} / ${total} TESTS PASSED (100% DELETION SUCCESS)`);
  console.log('================================================================\n');
}

testCertificateDeletion();
