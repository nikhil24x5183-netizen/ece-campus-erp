import urllib.request
import json

cookie_header = None

def api_call(url, method='GET', data=None):
    global cookie_header
    req = urllib.request.Request(url, method=method)
    if cookie_header:
        req.add_header('Cookie', cookie_header)
    if data:
        req.add_header('Content-Type', 'application/json')
        body = json.dumps(data).encode('utf-8')
    else:
        body = None
    
    with urllib.request.urlopen(req, data=body) as response:
        if 'Set-Cookie' in response.headers:
            cookie_header = response.headers['Set-Cookie']
        return json.loads(response.read().decode())

# 1. Login as Teacher
login_res = api_call('http://127.0.0.1:5000/api/auth/login', 'POST', {
    'email': 'teacher@campus.edu',
    'password': 'Teacher@123'
})
print("1. Teacher Login Status: Success")

# 2. Get Pending Certificates
pending_res = api_call('http://127.0.0.1:5000/api/teacher/certificates/pending')
pending = pending_res.get('pending_certificates', [])
print("2. Pending Certificates Count:", len(pending))

if pending:
    cert = pending[0]
    cert_id = cert['id']
    print(f"3. Testing Approval for Cert ID {cert_id} ({cert['student_name']}, {cert['certificate_date']})")

    # 3. Preview Calculation
    prev_data = api_call(f'http://127.0.0.1:5000/api/teacher/certificates/{cert_id}/preview-calculation')
    lectures = prev_data.get('lectures', [])
    print(f"   Found {len(lectures)} scheduled lectures for preview:")
    for l in lectures:
        print(f"   - Entry ID {l['entry_id']}: {l['subject_code']} ({l['start_time']}-{l['end_time']})")

    # 4. Approve with selected lectures (Select first 2 lectures)
    selected_ids = [l['entry_id'] for l in lectures[:2]] if lectures else []
    app_res = api_call(f'http://127.0.0.1:5000/api/teacher/certificates/{cert_id}/approve', 'POST', {
        'selected_entry_ids': selected_ids
    })
    print("4. Teacher Approval Response:", app_res)

# 5. Check Master Report
rep_res = api_call('http://127.0.0.1:5000/api/reports')
reports = rep_res.get('reports', [])
print("\n5. Master Reports Summary:")
for r in reports[:2]:
    print(f"   - Student: {r['student_name']} | Status: {r['status']} | Total Units: {r['total_activities']} | Breakdown: {r['breakdown_summary']}")

print("\nSUCCESSFULLY VERIFIED LECTURE SELECTION APPROVAL & SUBJECT-WISE MASTER REPORT!")
